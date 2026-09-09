/*
 * Portfolio entries rendered on work.html.
 * ---------------------------------------------------------------
 * Add a new object to the array to add a project card.
 *   id          unique string (used for the lightbox URL hash)
 *   title       event name
 *   city        city, country
 *   year        number
 *   type        "mega" | "corporate" | "expo"   (drives the filter tabs)
 *   guests      guest / visitor count (number, formatted automatically) or null
 *   image       path to a JPG/PNG (ideally 4:3, 1200×900)
 *   alt         short image description for screen readers
 *   description one or two sentences
 *
 * The first entry is a real event pictured in the company profile. The rest are
 * SAMPLE placeholders that use the profile's nautical photography — replace them
 * with real events and photos.
 */
window.SAILORS_PROJECTS = [
  {
    id: "das-alumni-council-launch",
    title: "DAS Alumni+ Council — honored by HRH the Deputy Governor",
    city: "Eastern Province, KSA",
    year: 2024,
    type: "corporate",
    guests: null,
    image: "images/photos/event-honoring.jpg",
    alt: "HRH Prince Ahmed bin Fahd bin Salman with The Sailors leadership on stage at the DAS Alumni+ Council event",
    description: "Launch of the DAS Alumni+ Council platform, supported and honored by HRH Prince Ahmed bin Fahd bin Salman bin Abdulaziz, Deputy Governor of the Eastern Province. (Details to be confirmed — photo from the company profile.)"
  },
  {
    id: "eastern-lights-festival",
    title: "Eastern Lights Festival (sample)",
    city: "Dammam, KSA",
    year: 2023,
    type: "mega",
    guests: 120000,
    image: "images/photos/sailing-sunset.jpg",
    alt: "Sailing boat at sunset",
    description: "Sample entry. A multi-zone public festival with live concerts, a family zone, food village and a nightly show — full crowd management, ticketing and media coverage."
  },
  {
    id: "corniche-regatta-week",
    title: "Corniche Regatta Week (sample)",
    city: "Al Khobar, KSA",
    year: 2022,
    type: "mega",
    guests: 85000,
    image: "images/photos/sailboat-sunset.jpg",
    alt: "Sailboat on the open sea at dusk",
    description: "Sample entry. Waterfront celebration combining a sailing exhibition, floating stage performances and a coastal market across five themed zones."
  },
  {
    id: "gulf-innovation-expo",
    title: "Gulf Innovation Expo (sample)",
    city: "Dhahran, KSA",
    year: 2023,
    type: "expo",
    guests: 18000,
    image: "images/photos/rope-rigging.jpg",
    alt: "Ship rigging and ropes",
    description: "Sample entry. Three-day exhibition with custom-fabricated booths, a conference hall build and logistics for exhibitors from four countries."
  },
  {
    id: "lighthouse-leadership-summit",
    title: "Lighthouse Leadership Summit (sample)",
    city: "Riyadh, KSA",
    year: 2024,
    type: "corporate",
    guests: 1200,
    image: "images/photos/lighthouse.jpg",
    alt: "White lighthouse against a pale sky",
    description: "Sample entry. Invitation-only executive summit: creative concept, stage design, speaker management, delegate registration and post-event reporting."
  },
  {
    id: "national-day-carnival",
    title: "National Day Carnival (sample)",
    city: "Al Jubail, KSA",
    year: 2022,
    type: "mega",
    guests: 60000,
    image: "images/photos/sail-splash.jpg",
    alt: "Sail cutting through a wave",
    description: "Sample entry. Four-day public carnival with parades, fireworks and a heritage village — coordinated by a 360-member taskforce, our single-event record."
  },
  {
    id: "harbour-gala-dinner",
    title: "Harbour Gala Dinner (sample)",
    city: "Manama, Bahrain",
    year: 2023,
    type: "corporate",
    guests: 650,
    image: "images/photos/helm.jpg",
    alt: "Ship's helm on a yacht",
    description: "Sample entry. Cross-border awards gala: venue transformation, live entertainment, awards production and VIP protocol."
  },
  {
    id: "coastal-living-expo",
    title: "Coastal Living Expo (sample)",
    city: "Al Khobar, KSA",
    year: 2024,
    type: "expo",
    guests: 25000,
    image: "images/photos/rope-knot.jpg",
    alt: "Thick rope tied in a knot",
    description: "Sample entry. Home and outdoor-living exhibition with in-house wood and steel fabrication of the show pavilions, furniture and lighting."
  },
  {
    id: "young-sailors-showcase",
    title: "The Young Sailors Showcase (sample)",
    city: "Al Ahsa, KSA",
    year: 2023,
    type: "corporate",
    guests: 900,
    image: "images/photos/sextant-compass.jpg",
    alt: "Sextant and compass on a wooden table",
    description: "Sample entry. Talent Hub showcase where young artists, performers and entrepreneurs presented to industry partners and incubator mentors."
  },
  {
    id: "desert-to-sea-music-nights",
    title: "Desert to Sea Music Nights (sample)",
    city: "Jeddah, KSA",
    year: 2024,
    type: "mega",
    guests: 45000,
    image: "images/photos/rope-teal.jpg",
    alt: "Teal rope coiled on a bollard at sunset",
    description: "Sample entry. Three-weekend concert series with regional and international artists, ticketing platform integration and live-streamed coverage."
  },
  {
    id: "smart-city-conference",
    title: "Smart City Conference & Exhibition (sample)",
    city: "Al Qatif, KSA",
    year: 2024,
    type: "expo",
    guests: 9500,
    image: "images/photos/rope-pulley.jpg",
    alt: "Rope threaded through a wooden pulley",
    description: "Sample entry. Conference and exhibition for municipal and private-sector partners: booth fabrication, lighting fixtures, wayfinding and logistics."
  },
  {
    id: "winter-wonder-park",
    title: "Winter Wonder Park (sample)",
    city: "Hail, KSA",
    year: 2023,
    type: "mega",
    guests: 38000,
    image: "images/photos/map-telescope.jpg",
    alt: "Antique telescope on a nautical map",
    description: "Sample entry. Seasonal family park with rides, themed installations and daily shows, operated across three weeks with full crowd and safety management."
  }
];
