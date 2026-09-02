/* ============================================================
   NEW JERSEY TOWN TEARSHEETS — the data behind the Buyer Package's
   optional town pages.

   One record per town, in the order the towns appear in the panel.
   The list is the towns we actually sell in — it mirrors the folder
   names under
     G:\Shared drives\GVC - New Jersey\1. Residential Sales\Resale
   minus the one folder in there that is a property rather than a town.

   ------------------------------------------------------------
   THE FIGURES WERE WRITTEN BY CLAUDE, NOT LOOKED UP.

   Every number and description below was drafted by Claude from
   general knowledge on 2 September 2026. Nothing here was pulled from
   the MLS, from Zillow, from Walk Score or from a municipal tax
   record. They are the right shape and the right order of magnitude,
   and that is all they are.

   Because of that, any town not named in VERIFIED below prints with a
   CLAUDE ESTIMATE stamp across its page and a line under it saying so.
   That is deliberate: nobody should hand a client a sheet of invented
   numbers by accident.

   TO CLEAR A TOWN: check its figures against a real source, correct
   them, add its name to VERIFIED, and bump AS_OF — all in the same
   commit. When every town on a page is verified, the stamp on that
   page goes away by itself.

   To add a town: add one T(...) row. Two towns print per page, and the
   pages, the page count and the running footers all follow from the
   panel, so nothing else needs touching.

   Fields, in order:
     name     the town as a buyer would say it
     county   printed as the eyebrow above the name
     tag      one line on what the town actually is
     price    median sale price, short form
     tax      average annual property-tax bill
     walk     Walk Score, 0-100
     mins     door-to-Manhattan, the honest number
     transit  how you make that commute
     schools  district, and anything a parent needs to know
     safety   one line, plainly put
     notes    three things that decide a deal here
   ============================================================ */
(function (global) {
  'use strict';

  const AS_OF = 'Compiled September 2026';

  /* Towns whose figures a person has checked against a real source.
     Anything not in here is still a Claude estimate and prints as one —
     see the note at the top of this file. Keep the names spelled exactly
     as the T(...) rows spell them. */
  const VERIFIED = [];

  const T = (name, county, tag, price, tax, walk, mins, transit, schools, safety, notes) =>
    ({ name, county, tag, price, tax, walk, mins, transit, schools, safety, notes,
       verified: VERIFIED.indexOf(name) > -1 });

  const list = [
    T('Asbury Park', 'Monmouth County',
      'A rebuilt beach city — music, restaurants and the most walkable boardwalk on the Jersey Shore.',
      '≈ $675K', '≈ $9,400', '82', '≈ 95 min',
      'North Jersey Coast Line from Asbury Park',
      'Asbury Park School District, K-12 · many families also look at nearby charter and private options',
      'Improving year over year, but it still varies sharply block to block.',
      ['Condo and multi-family stock you will not find elsewhere at the shore.',
       'Year-round nightlife and dining, not a summer-only town.',
       'Flood zone matters near Wesley Lake and the boardwalk — check the map, not the listing.']),

    T('Atlantic Highlands', 'Monmouth County',
      'Harbor town on Sandy Hook Bay with the fastest commute into Manhattan in the county.',
      '≈ $780K', '≈ $10,200', '55', '≈ 45 min',
      'Seastreak ferry to Wall Street and Midtown',
      'Henry Hudson Regional, shared with Highlands · small, so families weigh the regional options',
      'Very low crime; a quiet borough of about 4,500 people.',
      ['Deep-water marina and a working harbor at the foot of the town.',
       'Hilltop lots look out over the bay to Sandy Hook and the city.',
       'The ferry sells this town — walk-on parking is the thing to check.']),

    T('Beach Haven', 'Ocean County',
      "Long Beach Island's town center: a summer market with a small, tight year-round core.",
      '≈ $1.6M', '≈ $9,800', '62', '≈ 2 hr',
      'Drive — this is a second-home market, not a commute',
      'Long Beach Island Consolidated K-6 · Southern Regional for middle and high school',
      'Very low crime; the population swings by a factor of ten in July.',
      ['Rental income underwrites a lot of these purchases — ask for the rental history.',
       'Flood elevation and insurance drive value more than square footage does.',
       'Bay side versus ocean side is the entire price conversation.']),

    T('Brick', 'Ocean County',
      'A big, affordable township spread along the Metedeconk River and Barnegat Bay.',
      '≈ $500K', '≈ $7,400', '25', '≈ 75 min',
      'Commuter bus from the Route 70 park-and-rides',
      'Brick Township Public Schools · two high schools, so ask which one an address feeds',
      'Consistently ranked among the safer large townships in New Jersey.',
      ['Lagoon-front homes with private docks, at a fraction of Monmouth prices.',
       'Every price point from a first house to a waterfront rebuild.',
       'Car-dependent — the retail is all on Route 70 and Route 88.']),

    T('Brielle', 'Monmouth County',
      'A quiet river borough at the mouth of the Manasquan — boats, and not much else going on.',
      '≈ $1.05M', '≈ $12,200', '38', '≈ 100 min',
      'North Jersey Coast Line from Manasquan',
      'Brielle Elementary K-8 · Manasquan High School, well regarded and close by',
      'Very low crime; about 4,700 people in under two square miles.',
      ['Deep-water dockage on the Manasquan River, minutes from the inlet.',
       'Walk or bike to the Manasquan beaches without paying Manasquan prices.',
       'Inventory is thin and tightly held — expect to move quickly.']),

    T('Colts Neck', 'Monmouth County',
      'Horse country: five-acre zoning, no downtown, and the largest lots in the county.',
      '≈ $1.4M', '≈ $16,500', '8', '≈ 75 min',
      'Drive to Red Bank, or the Route 34 and Route 9 buses',
      'Colts Neck Township K-8 · Colts Neck High School, Freehold Regional district',
      'Among the lowest crime rates in New Jersey.',
      ['Farms, orchards and equestrian properties, protected by the zoning.',
       'Well and septic on most lots — budget the inspections for both.',
       'No sidewalks anywhere. This is a driving town, and it is the point.']),

    T('Farmingdale', 'Monmouth County',
      'Half a square mile with a real Main Street and prices from another decade.',
      '≈ $520K', '≈ $8,600', '52', '≈ 85 min',
      'Drive to Belmar or the Route 34 buses',
      'Farmingdale Elementary K-8 · Howell High School',
      'Very low crime; one of the smallest boroughs in the county.',
      ['Victorian housing stock within walking distance of Main Street.',
       'Surrounded entirely by Howell, so most services are shared.',
       'The lowest entry price of any walkable town in the county.']),

    T('Freehold', 'Monmouth County',
      'The county seat — a walkable downtown borough ringed by a far larger township.',
      '≈ $650K', '≈ $9,800', '71', '≈ 75 min',
      'Commuter bus from the Route 9 park-and-ride',
      'Freehold Borough K-8 and Freehold Township K-8 · Freehold Regional High School District',
      'Low crime; the downtown is genuinely busy at night.',
      ['Two municipalities share the name: the walkable borough, and the township around it.',
       'Courthouse, theater and thirty-odd restaurants inside the borough.',
       'Walk Score is 70+ downtown and under 25 in the township — confirm the address.']),

    T('Highlands', 'Monmouth County',
      'The bargain on the bay: a ferry commute and largely rebuilt housing stock.',
      '≈ $600K', '≈ $8,400', '60', '≈ 45 min',
      'Seastreak ferry from the Highlands dock',
      'Henry Hudson Regional, shared with Atlantic Highlands',
      'Low crime; a small, close borough at the foot of the bridge.',
      ['Much of the town was raised or rebuilt after 2012 — ask what year, and how high.',
       'Flood insurance is the first question here, not the last one.',
       'Walk to Sandy Hook, the bridge and the Henry Hudson Trail.']),

    T('Hoboken', 'Hudson County',
      'A square mile across the river, and the shortest commute in New Jersey.',
      '≈ $850K', '≈ $12,000', '96', '≈ 15 min',
      'PATH to the World Trade Center · ferry to Midtown in eight minutes',
      'Hoboken Public Schools · heavy charter and private enrollment, so ask what neighbors actually do',
      'Low crime for a city this dense; the busiest nights are around Washington Street.',
      ['Almost entirely condo and co-op — read the offering plan and the reserves.',
       'Parking is a monthly cost, not something that comes with the unit.',
       'Flood history west of Washington Street is real and well documented.']),

    T('Keyport', 'Monmouth County',
      'A working waterfront on Raritan Bay with the lowest entry price on the water.',
      '≈ $480K', '≈ $8,000', '65', '≈ 70 min',
      'Aberdeen-Matawan station, or the Belford ferry',
      'Keyport Public Schools, K-12 in one small district',
      'Low crime; a compact borough of about 7,000.',
      ['Antique shops and restaurants along Front Street and the waterfront.',
       'Bayfront sunsets and dockage — there is no ocean beach here.',
       'One K-12 district, which some families like and others want to check carefully.']),

    T('Little Silver', 'Monmouth County',
      'Two train stations, top-rated elementary schools, and no through traffic.',
      '≈ $1.15M', '≈ $15,000', '42', '≈ 80 min',
      'North Jersey Coast Line from Little Silver',
      'Little Silver K-8, among the best regarded in the county · Red Bank Regional High School',
      'Among the lowest crime rates in Monmouth County.',
      ['Bought for the elementary schools, and priced accordingly.',
       'Walk to the Shrewsbury River, the train and Sickles Market.',
       'Very little turnover — when something good lists, expect company.']),

    T('Long Branch', 'Monmouth County',
      'Oceanfront redevelopment: Pier Village at one end, century-old neighborhoods at the other.',
      '≈ $650K', '≈ $9,000', '68', '≈ 85 min',
      'North Jersey Coast Line from Long Branch',
      'Long Branch Public Schools · a large, diverse district with strong specialized programs',
      'Varies by neighborhood; the beachfront and Pier Village are heavily policed.',
      ['New oceanfront condos standing next to hundred-year-old cottages.',
       'Pier Village dining, shops and beach access without a beach-club membership.',
       'The most rental-friendly beach market in the county.']),

    T('Matawan', 'Monmouth County',
      "The commuter's pick — the county's busiest train station is minutes from the middle of town.",
      '≈ $570K', '≈ $10,500', '55', '≈ 65 min',
      'Aberdeen-Matawan, the fastest train in Monmouth County',
      'Matawan-Aberdeen Regional School District, K-12',
      'Low crime; a historic borough with a walkable Main Street.',
      ['The best value per commuting minute anywhere in the county.',
       'The park-and-ride fills early — a permit is worth asking about.',
       'Older housing stock near Main Street, newer on the Aberdeen side.']),

    T('Middletown', 'Monmouth County',
      "The county's biggest township: 42 square miles and a dozen genuinely different neighborhoods.",
      '≈ $800K', '≈ $11,500', '20', '≈ 60 min',
      'Three train stations plus the Belford ferry',
      'Middletown Township Public Schools · two high schools, North and South — confirm which one',
      'Ranked for years among the safest large townships in America.',
      ['Navesink, Lincroft, Leonardo and River Plaza are all Middletown, and price very differently.',
       'The Belford ferry puts parts of the township 60 minutes from Wall Street.',
       'Ask which high school an address feeds before you fall in love with it.']),

    T('Morganville', 'Monmouth County',
      'A Marlboro address with newer construction and some of the strongest schools in the county.',
      '≈ $900K', '≈ $14,000', '12', '≈ 75 min',
      'Route 9 buses, or drive to Matawan',
      'Marlboro Township K-8 · Marlboro High School, Freehold Regional district',
      'Very low crime; suburban and quiet throughout.',
      ['Morganville is a section of Marlboro Township, not its own municipality.',
       'Mostly 1990s and 2000s colonials on half-acre-plus lots.',
       'No downtown — everything here is a short drive.']),

    T('Morristown', 'Morris County',
      'A real small city: Midtown Direct trains, a green in the middle, and restaurants on every side of it.',
      '≈ $700K', '≈ $11,000', '88', '≈ 60 min',
      'Midtown Direct to Penn Station, no change at Hoboken',
      'Morris School District, a regional district shared with Morris Township',
      'Low crime for a downtown this dense and this busy.',
      ['The most urban walkability in Morris County, by a distance.',
       'Condos and townhomes downtown; colonials the moment you leave it.',
       'A different market from the shore entirely — price it on Morris County comps.']),

    T('Point Pleasant', 'Ocean County',
      'A year-round river town next door to the boardwalk, without the boardwalk prices.',
      '≈ $650K', '≈ $8,200', '45', '≈ 105 min',
      'North Jersey Coast Line from Point Pleasant Beach',
      'Point Pleasant Borough Schools, K-12 in one district',
      'Very low crime; a strong year-round family population.',
      ['Point Pleasant Borough and Point Pleasant Beach are two towns — the Beach has the boardwalk.',
       'Manasquan River dockage, minutes from the inlet.',
       'Consistently the busiest family market in northern Ocean County.']),

    T('Red Bank', 'Monmouth County',
      "The county's cultural downtown — theater, a hundred restaurants, and a train to Manhattan.",
      '≈ $750K', '≈ $10,800', '79', '≈ 75 min',
      'North Jersey Coast Line from Red Bank',
      'Red Bank Borough K-8 · Red Bank Regional High School, known for its performing-arts academy',
      'Low crime; the downtown stays busy late, which is why people move here.',
      ['Count Basie Center, Two River Theater, and the densest restaurant strip in the county.',
       'Condos and lofts downtown; Victorians on the west side.',
       'The most walkable non-beach town in Monmouth County.']),

    T('Rumson', 'Monmouth County',
      "The county's premier address: estate lots on the peninsula between two rivers.",
      '≈ $2.1M', '≈ $23,000', '22', '≈ 80 min',
      'Little Silver station, or the Sea Bright ferry',
      'Rumson K-8 · Rumson-Fair Haven Regional, one of the best-regarded high schools in the state',
      'Among the lowest crime rates in New Jersey.',
      ['Waterfront and estate properties on the Navesink and the Shrewsbury.',
       'Zoning protects the lot sizes, so there is very little new construction.',
       'The high school is the reason a lot of these deals happen.']),

    T('Sea Bright', 'Monmouth County',
      'A barrier strip a block wide — ocean on one side, river on the other.',
      '≈ $1.2M', '≈ $12,500', '48', '≈ 45 min',
      'Seastreak ferry from Highlands, a two-minute drive north',
      'Oceanport and Sea Bright send K-8 · Shore Regional High School',
      'Very low crime; fewer than 1,500 year-round residents.',
      ['Private beach clubs line the entire ocean side of the town.',
       'Rebuilt and raised after Sandy — ask for the elevation certificate every time.',
       'One road in and one road out, which matters in a storm and at 5pm.']),

    T('Shrewsbury', 'Monmouth County',
      'Small, central and quietly expensive — the geographic middle of everything.',
      '≈ $1.0M', '≈ $14,000', '47', '≈ 80 min',
      'Little Silver or Red Bank, both a few minutes away',
      'Shrewsbury Borough K-8, a single well-regarded school · Red Bank Regional High School',
      'Very low crime; 2.2 square miles and about 4,000 people.',
      ['The Grove shopping district and the Route 35 corridor are both in town.',
       'A colonial-era center at Broad and Sycamore, and real history to go with it.',
       'The borough is tiny, so inventory is always thin.']),

    T('Tinton Falls', 'Monmouth County',
      "Central, well-priced, and the county's widest range of new construction.",
      '≈ $700K', '≈ $9,600', '22', '≈ 80 min',
      'Little Silver or Red Bank · Route 18 and the Parkway for drivers',
      'Tinton Falls K-8 · Monmouth Regional High School',
      'Low crime across a large, spread-out township.',
      ['Active-adult and new-build communities alongside much older neighborhoods.',
       'The township straddles the Parkway, so where you are inside it matters.',
       'The Grove and the Route 35 retail are minutes away.']),

    T('Wall Township', 'Monmouth County',
      'Big lots, low taxes for the county, and a mile from the Manasquan beaches.',
      '≈ $780K', '≈ $9,200', '15', '≈ 100 min',
      'North Jersey Coast Line from Manasquan or Belmar · Route 18 and I-195 for drivers',
      'Wall Township Public Schools, K-12 in one well-regarded district',
      'Very low crime across all 31 square miles.',
      ['The township runs from working farmland to a mile off the beach.',
       'One K-12 district for the whole township, which parents tend to like.',
       'Monmouth Executive Airport and the Route 34/35 corridors are both here.']),

    T('Whiting', 'Ocean County',
      'Active-adult country, and the lowest cost of ownership anywhere in the region.',
      '≈ $290K', '≈ $4,200', '18', '≈ 90 min',
      'Commuter bus — this is a retirement market, not a commuting one',
      'Manchester Township Schools · most of Whiting is age-restricted, so schools rarely come up',
      'Very low crime; quiet by design.',
      ['Almost entirely 55+ communities, each with its own monthly association fee.',
       'Single-level ranches, most of them built between 1970 and 1990.',
       'Whiting is a section of Manchester Township, not a municipality of its own.'])
  ];

  global.GVC_NJ_TOWNS = { AS_OF: AS_OF, list: list };
})(window);
