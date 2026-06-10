/* Injects shared masthead + footer. NAV grows as sections ship (Plans 2-6). */
(function () {
  const root = document.body.dataset.root || "";
  const active = document.body.dataset.nav || "";

  // Add entries here as sections ship: ["tools","Tools","tools/"], ["photos","Photos","photos/"], ["icons","Icons","icons/"]
  const NAV = [
    ["home", "Home", ""],
    ["projects", "Projects", "projects/casa-avenida/"],
  ];

  const navLinks = NAV.map(([id, label, href]) =>
    `<a href="${root}${href || "."}" ${id === active ? 'aria-current="page"' : ""}>${label}</a>`
  ).join("");

  const mast = document.createElement("header");
  mast.className = "masthead";
  mast.innerHTML = `
    <a class="mast-lockup" href="${root}.">
      <span class="monogram" id="mast-monogram"></span>
      <span class="names">
        <span class="who">Matt Bloomfield</span>
        <span class="for">for The GVC Team</span>
      </span>
    </a>
    <nav class="mast-nav">${navLinks}</nav>`;
  document.body.prepend(mast);

  // Inline the monogram SVG so motion.js can animate its paths.
  fetch(root + "assets/logos/monogram.svg")
    .then(r => r.text())
    .then(svg => {
      const slot = document.getElementById("mast-monogram");
      if (slot) { slot.innerHTML = svg; document.dispatchEvent(new Event("monogram-ready")); }
    })
    .catch(() => {}); // masthead works without the mark

  const foot = document.createElement("footer");
  foot.className = "site-foot";
  foot.innerHTML = `
    <span class="left">Matt Bloomfield — The GVC Team, Douglas Elliman</span>
    <span class="right">
      <a href="mailto:matthew@gvcrealestateteam.com">matthew@gvcrealestateteam.com</a>
      <a href="https://github.com/mattbloom1" target="_blank" rel="noopener">github/mattbloom1</a>
      <a href="https://github.com/matthewGVC" target="_blank" rel="noopener">github/matthewGVC</a>
      <a href="https://gvcrealestateteam.com" target="_blank" rel="noopener">gvcrealestateteam.com</a>
    </span>`;
  document.body.append(foot);
})();
