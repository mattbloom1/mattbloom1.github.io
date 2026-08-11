/* ============================================================
   GVC TEAM ROSTER — the single source of truth for agent profiles.

   Every tool on the site (showsheet, brochure, and whatever comes
   next) reads its agent list from here. Add a teammate once, in this
   file, and they turn up everywhere.

   TO ADD SOMEONE
     1. Drop a square headshot at  assets/agents/<id>.png
        512x512, transparent background. The tools draw it on white
        paper and on navy panels, so a white box will show.
     2. Add a row below. Keep `id` lowercase-hyphenated and matching
        the filename.

   `phone` may be left empty — the tools skip blank fields rather
   than leaving a gap in the layout.
   ============================================================ */
(function () {
  var PEOPLE = [
    {id:'john-gasdaska',   name:'John Gasdaska',   title:'Licensed Associate Real Estate Broker', phone:'646.345.7350', email:'john.gasdaska@elliman.com'},
    {id:'tj-verdiglione',  name:'TJ Verdiglione',  title:'Licensed Real Estate Salesperson',      phone:'732.425.7477', email:'thomas.verdiglione@elliman.com'},
    {id:'jonathan-conlon', name:'Jonathan Conlon', title:'Licensed Associate Real Estate Broker', phone:'347.564.2440', email:'jonathan.conlon@elliman.com'},
    {id:'katie-cook',      name:'Katie Cook',      title:'Licensed Real Estate Salesperson',      phone:'516.319.9732', email:'katie.cook@elliman.com'},
    {id:'nicole-melveney', name:'Nicole Melveney', title:'Licensed Real Estate Sales Associate',  phone:'732.567.5375', email:'nicole.melveney@elliman.com'},
    {id:'jessica-wolf',    name:'Jessica Wolf',    title:'Licensed Real Estate Salesperson',      phone:'847.414.7841', email:'jessica.wolf@elliman.com'},
    {id:'marli-silver',    name:'Marli Silver',    title:'Licensed Real Estate Salesperson',      phone:'732.387.3807', email:'marli.silver@elliman.com'}
  ];

  /* Resolve headshots against this file's own location rather than the
     page's, so tools at any folder depth get a working path without
     each one hard-coding its own pile of ../../ */
  var dir = document.currentScript && document.currentScript.src;
  var base = dir ? new URL('../agents/', dir).href : '/assets/agents/';

  PEOPLE.forEach(function (a) { a.photo = base + a.id + '.png'; });

  window.GVC_ROSTER = PEOPLE;
  window.GVC_AGENT = function (id) {
    return PEOPLE.filter(function (a) { return a.id === id; })[0] || null;
  };
})();
