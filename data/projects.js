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
 *   partner     id of a partner in data/partners.js (or "" if none) — links the card to the partner carousel
 *   role        what The Sailors ART delivered (shown in the detail view)
 *   gallery     extra photos for the detail view (array of paths; the cover image is added automatically)
 *   sample      true = placeholder entry (shown with a "Sample" badge; remove the flag once real data is in)
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
    description: "Launch of the DAS Alumni+ Council platform, supported and honored by HRH Prince Ahmed bin Fahd bin Salman bin Abdulaziz, Deputy Governor of the Eastern Province. (Details to be confirmed — photo from the company profile.)",
    partner: "inst-das-alumni-council",
    role: "Event organization, stage and ceremony production (details to be confirmed).",
    gallery: []
  },
  {
    id: "eastern-lights-festival",
    title: "Eastern Lights Festival",
    sample: true,
    city: "Dammam, KSA",
    year: 2023,
    type: "mega",
    guests: 120000,
    image: "images/photos/sailing-sunset.jpg",
    alt: "Sailing boat at sunset",
    description: "Sample entry. A multi-zone public festival with live concerts, a family zone, food village and a nightly show — full crowd management, ticketing and media coverage.",
    partner: "",
    role: "Sample: concept, zoning, crowd management, ticketing and media coverage.",
    gallery: ["images/photos/rope-teal.jpg", "images/photos/lighthouse.jpg"]
  },
  {
    id: "corniche-regatta-week",
    title: "Corniche Regatta Week",
    sample: true,
    city: "Al Khobar, KSA",
    year: 2022,
    type: "mega",
    guests: 85000,
    image: "images/photos/sailboat-sunset.jpg",
    alt: "Sailboat on the open sea at dusk",
    description: "Sample entry. Waterfront celebration combining a sailing exhibition, floating stage performances and a coastal market across five themed zones.",
    partner: "",
    role: "Sample: design, approvals and operation of five themed zones.",
    gallery: ["images/photos/sail-splash.jpg", "images/photos/helm.jpg"]
  },
  {
    id: "gulf-innovation-expo",
    title: "Gulf Innovation Expo",
    sample: true,
    city: "Dhahran, KSA",
    year: 2023,
    type: "expo",
    guests: 18000,
    image: "images/photos/rope-rigging.jpg",
    alt: "Ship rigging and ropes",
    description: "Sample entry. Three-day exhibition with custom-fabricated booths, a conference hall build and logistics for exhibitors from four countries.",
    partner: "",
    role: "Sample: booth fabrication, conference hall build and logistics.",
    gallery: ["images/photos/rope-pulley.jpg", "images/photos/rope-knot.jpg"]
  },
  {
    id: "lighthouse-leadership-summit",
    title: "Lighthouse Leadership Summit",
    sample: true,
    city: "Riyadh, KSA",
    year: 2024,
    type: "corporate",
    guests: 1200,
    image: "images/photos/lighthouse.jpg",
    alt: "White lighthouse against a pale sky",
    description: "Sample entry. Invitation-only executive summit: creative concept, stage design, speaker management, delegate registration and post-event reporting.",
    partner: "",
    role: "Sample: creative concept, stage design, speaker and delegate management.",
    gallery: ["images/photos/sextant-compass.jpg"]
  },
  {
    id: "coastal-living-expo",
    title: "Coastal Living Expo",
    sample: true,
    city: "Al Khobar, KSA",
    year: 2024,
    type: "expo",
    guests: 25000,
    image: "images/photos/rope-knot.jpg",
    alt: "Thick rope tied in a knot",
    description: "Sample entry. Home and outdoor-living exhibition with in-house wood and steel fabrication of the show pavilions, furniture and lighting.",
    partner: "",
    role: "Sample: in-house wood and steel fabrication of pavilions, furniture and lighting.",
    gallery: ["images/photos/rope-rigging.jpg"]
  }
];
