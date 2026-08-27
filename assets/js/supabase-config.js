/* ============================================================
   SUPABASE — where the property library lives.

   Both values here are meant to be public: the publishable key is the
   browser-side key, and it grants nothing on its own. Every table in the
   library has row level security on with policies that only answer to a
   signed-in session, so an anonymous visitor to this public site reads an
   empty list and nothing else.

   The team password is NOT here and must never be: agents type it once,
   the browser holds the session. The database password and any service
   key stay out of this repo entirely — the repo is public.
   ============================================================ */
(function (global) {
  'use strict';

  global.GVC_SUPABASE = {
    url: 'https://hoszxrrlfhzbbrzenqvp.supabase.co',
    publishableKey: 'sb_publishable__ZPsjdQMlVWh3q3jbGKCEQ_UCvDnear',
    /* the single shared account the whole team signs in as */
    teamEmail: 'team@gvcrealestateteam.com',
    photoBucket: 'property-photos',
    /* photos are downscaled to this on the long edge before upload — well
       past what a Letter page prints at 300dpi, and about 7 MB per
       ten-photo property against the free tier's 1 GB */
    photoMaxEdge: 2000
  };
})(window);
