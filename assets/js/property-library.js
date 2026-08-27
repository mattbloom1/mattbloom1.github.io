/* ============================================================
   PROPERTY LIBRARY — one saved property, shared by the four builders.

   A property is three things:
     core       the facts every builder wants — address, price, beds, baths…
     documents  one saved document per tool, stored verbatim and handed back
                untouched. A property may have none.
     photos     the shelf: files in a private bucket, deduped by content hash
                and downscaled on the way in.

   Whichever tool an agent opens first creates the property. Nothing here
   knows what a showsheet is — each tool maps its own fields with a small
   adapter (fromCore / toCore) and hands the rest over as an opaque blob.

   Talks to Supabase over plain fetch: eight endpoints do not need an SDK.
   Everything needs the team session, and there is exactly one place that
   attaches it — call().
   ============================================================ */
(function (global) {
  'use strict';

  var CFG = global.GVC_SUPABASE;
  var SESSION_KEY = 'gvc.props.session';
  var TOOLS = ['showsheet', 'brochure', 'seller', 'buyer'];
  var STATUSES = ['active', 'coming-soon', 'sold', 'archived'];

  var session = null;      // { access_token, refresh_token, expires_at }

  /* ---------------- session ---------------- */

  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      session = raw ? JSON.parse(raw) : null;
    } catch (e) { session = null; }
    return session;
  }

  function keepSession(s) {
    session = s && s.access_token ? {
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      // a minute of slack, so a token never expires mid-request
      expires_at: Date.now() + Math.max(0, (s.expires_in || 3600) - 60) * 1000
    } : null;
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* private window — the session just won't outlive the tab */ }
    return session;
  }

  function auth(path, body) {
    return fetch(CFG.url + '/auth/v1/' + path, {
      method: 'POST',
      headers: { apikey: CFG.publishableKey, 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); });
  }

  /* The shared team password. One account for the whole team — see
     supabase/README.md for what that buys and what it costs. */
  function signIn(password) {
    return auth('token?grant_type=password', { email: CFG.teamEmail, password: password })
      .then(function (r) {
        if (!r.ok || !r.body.access_token) {
          throw new Error(r.body.error_description || r.body.msg || 'That password was not accepted.');
        }
        keepSession(r.body);
        return true;
      });
  }

  function signOut() { keepSession(null); }

  function signedIn() { return !!(session || loadSession()); }

  /* Refresh rather than ask for the password again. A refresh that fails
     means the session is genuinely gone, so say so plainly. */
  function fresh() {
    if (!session) loadSession();
    if (!session) return Promise.reject(new Error('Sign in to use the property library.'));
    if (Date.now() < session.expires_at) return Promise.resolve(session);
    return auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
      .then(function (r) {
        if (!r.ok || !r.body.access_token) {
          keepSession(null);
          throw new Error('The library signed you out. Enter the team password again.');
        }
        return keepSession(r.body);
      });
  }

  /* ---------------- one place that talks to the API ---------------- */

  function call(path, opts) {
    opts = opts || {};
    return fresh().then(function (s) {
      var headers = {
        apikey: CFG.publishableKey,
        authorization: 'Bearer ' + s.access_token
      };
      if (opts.json !== false) headers['content-type'] = 'application/json';
      if (opts.prefer) headers.prefer = opts.prefer;
      if (opts.contentType) headers['content-type'] = opts.contentType;

      return fetch(CFG.url + path, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body
      });
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (!r.ok) throw apiError(r.status, data);
        return data;
      });
    }, function (e) {
      if (!navigator.onLine) throw new Error('You are offline — the library needs a connection.');
      throw e;
    });
  }

  /* Postgres speaks in constraint names; agents should not have to. */
  function apiError(status, data) {
    var msg = (data && (data.message || data.msg || data.error)) || ('Request failed (' + status + ')');
    if (status === 409) msg = 'A property already exists at that address.';
    if (/violates check constraint/.test(msg)) msg = 'That value is not one the library accepts.';
    var e = new Error(msg);
    e.status = status;
    return e;
  }

  var rest = function (path, opts) { return call('/rest/v1' + path, opts); };

  /* ---------------- properties ---------------- */

  /* One address is one property, so the address is the identity. Unit
     numbers are part of the address line by design — "45 Crosby St, PH". */
  function slugOf(address) {
    return String(address || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'untitled';
  }

  function labelOf(core) {
    core = core || {};
    var where = [core.city, core.state].filter(Boolean).join(', ');
    return [core.address, where].filter(Boolean).join(', ') || 'Untitled property';
  }

  /* The dropdown: active first, sold last, archived left out unless asked
     for, and within a status the most recently touched at the top. */
  function list(opts) {
    opts = opts || {};
    var q = '/properties?select=id,slug,label,status,updated_at,documents(tool)' +
            '&order=updated_at.desc';
    if (!opts.includeArchived) q += '&status=neq.archived';
    return rest(q).then(function (rows) {
      return (rows || []).map(function (r) {
        var has = {};
        (r.documents || []).forEach(function (d) { has[d.tool] = true; });
        return { id: r.id, slug: r.slug, label: r.label, status: r.status,
                 updated: r.updated_at, has: has };
      }).sort(function (a, b) {
        return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      });
    });
  }

  /* Everything a tool needs to open a property: the shared facts, its own
     saved document (or null, which is normal), and the photo shelf. */
  function load(id, tool) {
    return rest('/properties?id=eq.' + id +
                '&select=id,slug,label,status,core,updated_at,documents(tool,state,saved_at),' +
                'photos(id,hash,name,path,width,height)')
      .then(function (rows) {
        var r = rows && rows[0];
        if (!r) throw new Error('That property is no longer in the library.');
        var mine = (r.documents || []).filter(function (d) { return d.tool === tool; })[0];
        return {
          id: r.id, slug: r.slug, label: r.label, status: r.status,
          core: r.core || {}, updated: r.updated_at,
          doc: mine ? mine.state : null,
          docSavedAt: mine ? mine.saved_at : null,
          has: (r.documents || []).reduce(function (m, d) { m[d.tool] = true; return m; }, {}),
          photos: r.photos || []
        };
      });
  }

  /* The address is the identity, so this is how a tool asks "is this
     listing already in the library?" */
  function findByAddress(address) {
    return rest('/properties?slug=eq.' + encodeURIComponent(slugOf(address)) +
                '&select=id,label,status,core')
      .then(function (rows) { return (rows && rows[0]) || null; });
  }

  function create(core) {
    core = core || {};
    if (!String(core.address || '').trim()) {
      return Promise.reject(new Error('A property needs an address before it can be saved.'));
    }
    return rest('/properties', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify({ slug: slugOf(core.address), label: labelOf(core), core: core })
    }).then(function (rows) { return rows[0]; });
  }

  /* Facts only, and only the ones worth writing: an empty value never
     overwrites something a colleague typed. The caller decides about
     genuine conflicts — see changesAgainst(). */
  function saveCore(id, core) {
    return rest('/properties?id=eq.' + id + '&select=core').then(function (rows) {
      var current = (rows[0] && rows[0].core) || {};
      var merged = Object.assign({}, current);
      Object.keys(core || {}).forEach(function (k) {
        if (!isEmpty(core[k])) merged[k] = core[k];
      });
      return rest('/properties?id=eq.' + id, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: JSON.stringify({ core: merged, label: labelOf(merged) })
      }).then(function (out) { return out[0]; });
    });
  }

  /* Postgres stores jsonb with its own key order, so a comps array that
     made the round trip is not character-for-character what went in. Sort
     the keys before comparing, or every save claims the comps changed. */
  function canonical(v) {
    if (Array.isArray(v)) return v.map(canonical);
    if (v && typeof v === 'object') {
      return Object.keys(v).sort().reduce(function (o, k) { o[k] = canonical(v[k]); return o; }, {});
    }
    return v;
  }

  function same(a, b) { return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)); }

  /* What saving would change about the shared facts. The tool shows this
     before it writes, so a price never quietly changes in three other
     documents. */
  function changesAgainst(core, incoming) {
    var out = [];
    Object.keys(incoming || {}).forEach(function (k) {
      if (isEmpty(incoming[k])) return;
      var was = core ? core[k] : undefined;
      if (isEmpty(was)) return;                       // filling a gap is not a change
      if (same(was, incoming[k])) return;
      out.push({ field: k, was: was, now: incoming[k] });
    });
    return out;
  }

  function isEmpty(v) {
    if (v == null || v === '') return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  }

  function setStatus(id, status) {
    if (STATUSES.indexOf(status) === -1) return Promise.reject(new Error('Unknown status: ' + status));
    return rest('/properties?id=eq.' + id, {
      method: 'PATCH', body: JSON.stringify({ status: status })
    });
  }

  /* ---------------- documents ---------------- */

  function saveDoc(id, tool, state) {
    if (TOOLS.indexOf(tool) === -1) return Promise.reject(new Error('Unknown tool: ' + tool));
    return rest('/documents?on_conflict=property_id,tool', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify({ property_id: id, tool: tool, state: state, saved_at: new Date().toISOString() })
    }).then(function (rows) { return rows[0]; });
  }

  /* Who saved this document last, and when — so a second agent is warned
     before overwriting an afternoon of someone else's work. */
  function docSavedAt(id, tool) {
    return rest('/documents?property_id=eq.' + id + '&tool=eq.' + tool + '&select=saved_at')
      .then(function (rows) { return rows[0] ? rows[0].saved_at : null; });
  }

  /* ---------------- photos ---------------- */

  /* Downscaled before it ever leaves the browser: the long edge is capped,
     which is past what a Letter page prints at 300dpi and keeps a property
     near 7 MB rather than 120. */
  function shrink(file) {
    return createImageBitmap(file).then(function (bmp) {
      var max = CFG.photoMaxEdge || 2000;
      var scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      var w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
      bmp.close && bmp.close();
      return new Promise(function (res) {
        canvas.toBlob(function (blob) { res({ blob: blob, width: w, height: h }); }, 'image/jpeg', 0.86);
      });
    });
  }

  function hashOf(blob) {
    return blob.arrayBuffer()
      .then(function (buf) { return crypto.subtle.digest('SHA-256', buf); })
      .then(function (digest) {
        return Array.from(new Uint8Array(digest))
          .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 40);
      });
  }

  /* The same shot dropped into three tools is one file: the hash is the
     identity, so a re-drop returns the photo already on the shelf. */
  function putPhoto(id, file) {
    var shrunk;
    return shrink(file)
      .then(function (s) { shrunk = s; return hashOf(s.blob); })
      .then(function (hash) {
        return rest('/photos?property_id=eq.' + id + '&hash=eq.' + hash +
                    '&select=id,hash,name,path,width,height')
          .then(function (rows) {
            if (rows && rows[0]) return rows[0];           // already shelved
            var path = id + '/' + hash + '.jpg';
            return call('/storage/v1/object/' + CFG.photoBucket + '/' + path, {
              method: 'POST', contentType: 'image/jpeg', body: shrunk.blob
            }).then(function () {
              return rest('/photos', {
                method: 'POST', prefer: 'return=representation',
                body: JSON.stringify({
                  property_id: id, hash: hash, name: file.name || '', path: path,
                  width: shrunk.width, height: shrunk.height, bytes: shrunk.blob.size
                })
              }).then(function (rows2) { return rows2[0]; });
            });
          });
      });
  }

  /* The bucket is private, so a page renders photos through short-lived
     signed URLs rather than public links. One round trip for the lot. */
  function photoUrls(photos) {
    var paths = (photos || []).map(function (p) { return p.path; });
    if (!paths.length) return Promise.resolve({});
    return call('/storage/v1/object/sign/' + CFG.photoBucket, {
      method: 'POST',
      body: JSON.stringify({ paths: paths, expiresIn: 60 * 60 * 8 })
    }).then(function (rows) {
      var byPath = {};
      (rows || []).forEach(function (r) {
        // the API returns the path it signed plus a root-relative URL
        if (r.signedURL) byPath[r.path] = CFG.url + '/storage/v1' + r.signedURL;
      });
      var byId = {};
      (photos || []).forEach(function (p) { if (byPath[p.path]) byId[p.id] = byPath[p.path]; });
      return byId;
    });
  }

  function removePhoto(photo) {
    return call('/storage/v1/object/' + CFG.photoBucket, {
      method: 'DELETE', body: JSON.stringify({ prefixes: [photo.path] })
    }).then(function () {
      return rest('/photos?id=eq.' + photo.id, { method: 'DELETE' });
    });
  }

  /* ---------------- photos inside a saved document ----------------

     Every tool keeps its photos as base64 data URLs somewhere inside its
     own state — images[].url in the Brochure, photos[].src in the
     Showsheet, a bare string for a floor plan. Saving that verbatim would
     push megabytes of base64 into Postgres.

     So the document is walked on the way out: every data URL is shelved as
     a real file and replaced with a token, and on the way back in the token
     becomes a signed URL. Neither function knows anything about a
     particular tool's shape, which is why this works for all four. */

  var TOKEN = 'gvc:photo:';

  /* A photo reaches a tool either as a data URL (dropped by the agent) or
     as a path on this site (the sample listings, a floor plan shipped with
     the repo). Both have to be shelved: a path that works in one tool is a
     broken image in another, and neither is in the library until it is a
     file of its own. Anything already shelved is left alone. */
  function isShelvable(v) {
    if (typeof v !== 'string') return false;
    if (v.indexOf(TOKEN) === 0) return false;
    if (v.indexOf('data:image/') === 0) return true;
    if (/^(https?:)?\/\//i.test(v)) return false;            // somebody else's server
    // a path, not a bare file name: every tool also stores photo names, and
    // "front.jpg" is a label, not something to go and fetch
    if (v.indexOf('/') === -1) return false;
    return /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(v);
  }

  function walk(value, swap) {
    if (Array.isArray(value)) return value.map(function (v) { return walk(v, swap); });
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (k) { out[k] = walk(value[k], swap); });
      return out;
    }
    return swap(value);
  }

  function toFile(url, name) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Could not read a photo the document points at.');
      return r.blob();
    }).then(function (b) { return new File([b], name || 'photo.jpg', { type: b.type }); });
  }

  /* Save a tool's document, shelving its photos on the way. The tool's own
     state is never touched — the walk builds a copy. */
  function saveDocument(id, tool, state, onProgress) {
    var urls = [];
    walk(state, function (v) { if (isShelvable(v) && urls.indexOf(v) === -1) urls.push(v); return v; });

    // one at a time: a listing is a handful of photos, and a queue of
    // parallel uploads on a listing-day connection helps nobody
    var byUrl = {}, skipped = [];
    var chain = urls.reduce(function (p, url, i) {
      return p.then(function () {
        // uploading a listing's photos takes real seconds — say where it is
        if (onProgress) onProgress(i + 1, urls.length);
        return toFile(url, 'photo-' + (i + 1) + '.jpg')
          .then(function (f) { return putPhoto(id, f); })
          .then(function (photo) { byUrl[url] = TOKEN + photo.id; })
          // a photo that cannot be read keeps its old value and the save
          // carries on: losing the whole document over one image is worse
          .catch(function () { skipped.push(url); });
      });
    }, Promise.resolve());

    return chain.then(function () {
      var shelved = walk(state, function (v) { return byUrl[v] || v; });
      return saveDoc(id, tool, shelved).then(function (row) {
        row.skipped = skipped;
        return row;
      });
    });
  }

  /* Put the signed URLs back, so the tool sees a document shaped exactly
     the way it saved one. A photo that has since been deleted resolves to
     an empty string rather than a broken token. */
  function hydrate(state, urlsById) {
    return walk(state, function (v) {
      if (typeof v !== 'string' || v.indexOf(TOKEN) !== 0) return v;
      return urlsById[v.slice(TOKEN.length)] || '';
    });
  }

  global.GVC_PROPS = {
    TOOLS: TOOLS, STATUSES: STATUSES,
    signIn: signIn, signOut: signOut, signedIn: signedIn,
    list: list, load: load, create: create, findByAddress: findByAddress,
    saveCore: saveCore, saveDoc: saveDoc, saveDocument: saveDocument,
    hydrate: hydrate, docSavedAt: docSavedAt,
    setStatus: setStatus, changesAgainst: changesAgainst,
    putPhoto: putPhoto, photoUrls: photoUrls, removePhoto: removePhoto,
    slugOf: slugOf, labelOf: labelOf
  };
})(window);
