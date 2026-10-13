/*
 * Partners rendered on partners.html (carousel + logo grids) and the strip on index.html.
 * ---------------------------------------------------------------
 *   id       unique, URL-safe — projects in data/projects.js point at it via "partner"
 *   name     displayed under the logo and used as alt text
 *   logo     path to an image (SVG/PNG/JPG, about 400x200). Leave "" to show a monogram placeholder.
 *   url      optional website link (shown in the project detail view)
 *   note     optional short caption (sector, country, role)
 *
 * PLACEHOLDERS: logo files and the final partner list have not been supplied yet.
 * Replace name/logo once available (drop logos into images/logos/). Only partners
 * with a matching project in data/projects.js show projects when clicked.
 */
window.SAILORS_PARTNERS = {
  clients: [
    { id: "client-01", name: "Client 01", logo: "", url: "", note: "Placeholder" },
    { id: "client-02", name: "Client 02", logo: "", url: "", note: "Placeholder" },
    { id: "client-03", name: "Client 03", logo: "", url: "", note: "Placeholder" },
    { id: "client-04", name: "Client 04", logo: "", url: "", note: "Placeholder" },
    { id: "client-05", name: "Client 05", logo: "", url: "", note: "Placeholder" },
    { id: "client-06", name: "Client 06", logo: "", url: "", note: "Placeholder" },
    { id: "client-07", name: "Client 07", logo: "", url: "", note: "Placeholder" },
    { id: "client-08", name: "Client 08", logo: "", url: "", note: "Placeholder" }
  ],
  institutional: [
    { id: "das-alumni-council", name: "DAS Alumni+ Council", logo: "", url: "https://www.das-alumni.com", note: "Alumni platform" },
    { id: "institution-01", name: "Institutional Partner 01", logo: "", url: "", note: "Placeholder" },
    { id: "institution-02", name: "Institutional Partner 02", logo: "", url: "", note: "Placeholder" },
    { id: "institution-03", name: "Institutional Partner 03", logo: "", url: "", note: "Placeholder" },
    { id: "institution-04", name: "Institutional Partner 04", logo: "", url: "", note: "Placeholder" }
  ],
  alliances: [
    { id: "alliance-01", name: "Global Alliance 01", logo: "", url: "", note: "Placeholder" },
    { id: "alliance-02", name: "Global Alliance 02", logo: "", url: "", note: "Placeholder" },
    { id: "alliance-03", name: "Global Alliance 03", logo: "", url: "", note: "Placeholder" },
    { id: "alliance-04", name: "Global Alliance 04", logo: "", url: "", note: "Placeholder" }
  ]
};
