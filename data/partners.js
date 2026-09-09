/*
 * Client & partner logos rendered on partners.html (and the logo strip on index.html).
 * ---------------------------------------------------------------
 * Each group is an array of objects:
 *   name     displayed under the logo and used as alt text
 *   logo     path to an image (SVG/PNG/JPG). Leave "" to show an auto-generated monogram.
 *   url      optional website link
 *   note     optional short caption (sector, country, role)
 *
 * Logos were taken from the December 2025 company profile. Names marked
 * "(confirm)" could not be read reliably from the logo — please correct them.
 */
window.SAILORS_PARTNERS = {
  clients: [
    { name: "Saudi Aramco", logo: "images/logos/institutional/saudi-aramco.jpg", note: "Energy" },
    { name: "SABIC", logo: "images/logos/institutional/sabic.jpg", note: "Petrochemicals" },
    { name: "stc", logo: "images/logos/clients/stc.png", note: "Telecom" },
    { name: "Mobily", logo: "images/logos/clients/mobily.png", note: "Telecom" },
    { name: "Ma'aden", logo: "images/logos/clients/maaden.png", note: "Mining" },
    { name: "Saudi Electricity Company", logo: "images/logos/clients/saudi-electricity-company.png", note: "Utilities" },
    { name: "Marafiq", logo: "images/logos/clients/marafiq.png", note: "Utilities" },
    { name: "National Water Company", logo: "images/logos/clients/national-water-company.png", note: "Utilities" },
    { name: "Saline Water Conversion Corporation", logo: "images/logos/clients/swcc.png", note: "Utilities" },
    { name: "Sipchem", logo: "images/logos/clients/sipchem.png", note: "Petrochemicals" },
    { name: "Tasnee", logo: "images/logos/clients/tasnee.png", note: "Petrochemicals" },
    { name: "Rawabi Holding", logo: "images/logos/clients/rawabi-holding.jpg", note: "Industrial group" },
    { name: "Tamimi Power & Industrial Group", logo: "images/logos/clients/tamimi.jpg", note: "Industrial group" },
    { name: "General Entertainment Authority", logo: "images/logos/clients/general-entertainment-authority.jpg", note: "Government" },
    { name: "Saudi Data & AI Authority (SDAIA)", logo: "images/logos/clients/sdaia.png", note: "Government" },
    { name: "Saudi Electricity Regulatory Authority", logo: "images/logos/clients/sera.png", note: "Government" },
    { name: "Economic Cities Authority", logo: "images/logos/clients/economic-cities-authority.png", note: "Government" },
    { name: "Saudi Green Initiative", logo: "images/logos/clients/saudi-green-initiative.png", note: "Sustainability" },
    { name: "Saudi Energy Efficiency Center (Kafaah)", logo: "images/logos/clients/kafaah.png", note: "Energy" },
    { name: "King Salman Energy Park (SPARK)", logo: "images/logos/clients/spark.png", note: "Energy" },
    { name: "Saudi Aramco Employees Association", logo: "images/logos/clients/aramco-employees-association.jpg", note: "Community" },
    { name: "Saudi Association for Energy Economics (confirm)", logo: "images/logos/clients/saudi-energy-association.png", note: "Association" },
    { name: "Client (confirm name)", logo: "images/logos/clients/client-113.png", note: "Culture & heritage" },
    { name: "Microsoft", logo: "images/logos/clients/microsoft.png", note: "Technology" },
    { name: "Google", logo: "images/logos/clients/google.png", note: "Technology" },
    { name: "Amazon Web Services", logo: "images/logos/clients/aws.png", note: "Technology" },
    { name: "Hexagon", logo: "images/logos/clients/hexagon.png", note: "Technology" },
    { name: "ABB", logo: "images/logos/clients/abb.png", note: "Automation" },
    { name: "Emerson", logo: "images/logos/clients/emerson.png", note: "Automation" },
    { name: "Honeywell", logo: "images/logos/clients/honeywell.png", note: "Automation" },
    { name: "Schneider Electric", logo: "images/logos/clients/schneider-electric.png", note: "Energy management" }
  ],
  institutional: [
    { name: "Eastern Province Governorate", logo: "images/logos/institutional/eastern-province-emirate.jpg", note: "Recognition" },
    { name: "General Entertainment Authority", logo: "images/logos/clients/general-entertainment-authority.jpg", note: "Recognition & permits" },
    { name: "Eastern Province Municipality (confirm)", logo: "images/logos/institutional/eastern-province-amana.jpg", note: "Municipal" },
    { name: "Sharqia Development Authority", logo: "images/logos/institutional/sharqia-development-authority.png", note: "Regional development" },
    { name: "Ministry of Culture", logo: "images/logos/institutional/ministry-of-culture.jpg", note: "Government" },
    { name: "Ministry of Energy", logo: "images/logos/institutional/ministry-of-energy.jpg", note: "Government" },
    { name: "Ministry of Communications & Information Technology", logo: "images/logos/institutional/ministry-mcit.jpg", note: "Government" },
    { name: "Ministry of Commerce & Investment", logo: "images/logos/institutional/ministry-of-commerce.jpg", note: "Government" },
    { name: "Ministry of Education", logo: "images/logos/institutional/ministry-of-education.jpg", note: "Government" },
    { name: "Ministry of Health", logo: "images/logos/institutional/ministry-of-health.jpg", note: "Government" },
    { name: "Ministry of Finance", logo: "images/logos/institutional/ministry-of-finance.png", note: "Government" },
    { name: "Ministry of Human Resources & Social Development", logo: "images/logos/institutional/ministry-hrsd.jpg", note: "Government" },
    { name: "Government ministry (confirm)", logo: "images/logos/institutional/ministry-133.png", note: "Government" },
    { name: "Kingdom of Saudi Arabia", logo: "images/logos/institutional/kingdom-of-saudi-arabia.jpg", note: "National" },
    { name: "Communications, Space & Technology Commission", logo: "images/logos/institutional/cst.png", note: "Regulator" },
    { name: "Saudi Data & AI Authority (SDAIA)", logo: "images/logos/institutional/sdaia.png", note: "Government" },
    { name: "King Fahd University of Petroleum & Minerals", logo: "images/logos/institutional/kfupm.jpg", note: "Academia" },
    { name: "Imam Abdulrahman Bin Faisal University", logo: "images/logos/institutional/iau.jpg", note: "Academia" },
    { name: "Dhahran Techno Valley Company", logo: "images/logos/institutional/dtvc.png", note: "Innovation" },
    { name: "Dammam Valley / arcensus", logo: "images/logos/institutional/dammam-valley.png", note: "Innovation" },
    { name: "Saudi Aramco", logo: "images/logos/institutional/saudi-aramco.jpg", note: "Industry" },
    { name: "SABIC", logo: "images/logos/institutional/sabic.jpg", note: "Industry" },
    { name: "Ma'aden", logo: "images/logos/institutional/maaden.png", note: "Industry" }
  ],
  alliances: [
    { name: "Microsoft", logo: "images/logos/alliances/microsoft.png", note: "Technology" },
    { name: "Amazon Web Services", logo: "images/logos/alliances/aws.png", note: "Technology" },
    { name: "NVIDIA", logo: "images/logos/alliances/nvidia.jpg", note: "Technology" },
    { name: "Intel", logo: "images/logos/alliances/intel.jpg", note: "Technology" },
    { name: "Oracle", logo: "images/logos/alliances/oracle.jpg", note: "Technology" },
    { name: "SAP", logo: "images/logos/alliances/sap.jpg", note: "Technology" },
    { name: "Cisco", logo: "images/logos/alliances/cisco.png", note: "Technology" },
    { name: "Nokia", logo: "images/logos/alliances/nokia.jpg", note: "Technology" },
    { name: "Hewlett Packard Enterprise", logo: "images/logos/alliances/hpe.png", note: "Technology" },
    { name: "Citrix", logo: "images/logos/alliances/citrix.png", note: "Technology" },
    { name: "UiPath", logo: "images/logos/alliances/uipath.jpg", note: "Automation" },
    { name: "AspenTech", logo: "images/logos/alliances/aspentech.jpg", note: "Industrial software" },
    { name: "Hexagon", logo: "images/logos/alliances/hexagon.png", note: "Industrial software" },
    { name: "Bentley Systems", logo: "images/logos/alliances/bentley.png", note: "Industrial software" },
    { name: "Seeq", logo: "images/logos/alliances/seeq.jpg", note: "Industrial software" },
    { name: "Sphera", logo: "images/logos/alliances/sphera.jpg", note: "Sustainability software" },
    { name: "Esri", logo: "images/logos/alliances/esri.png", note: "GIS" },
    { name: "Blue Yonder", logo: "images/logos/alliances/blue-yonder.png", note: "Supply chain" },
    { name: "Symphony AzimaAI", logo: "images/logos/alliances/symphony-azima-ai.png", note: "Industrial AI" },
    { name: "Emerson", logo: "images/logos/alliances/emerson.png", note: "Automation" },
    { name: "ABB", logo: "images/logos/alliances/abb.png", note: "Automation" },
    { name: "Siemens Healthineers", logo: "images/logos/alliances/siemens-healthineers.png", note: "Healthcare" },
    { name: "GE Healthcare", logo: "images/logos/alliances/ge-healthcare.png", note: "Healthcare" },
    { name: "DNV", logo: "images/logos/alliances/dnv.jpg", note: "Assurance" },
    { name: "Synergy", logo: "images/logos/alliances/synergy.png", note: "Technology" },
    { name: "equity-i", logo: "images/logos/alliances/equity-i.png", note: "Technology" },
    { name: "NEOM", logo: "images/logos/alliances/neom.jpg", note: "Development" },
    { name: "Womble Bond Dickinson", logo: "images/logos/alliances/womble-bond-dickinson.png", note: "Legal partner" },
    { name: "Tavis Capital", logo: "images/logos/alliances/tavis-capital.png", note: "Investment partner — Geneva" },
    { name: "Quadrian", logo: "images/logos/alliances/quadrian.png", note: "AI partnership — KSA & Bahrain" },
    { name: "Emeritus Alumni Platform", logo: "images/logos/alliances/emeritus-alumni-platform.png", note: "Group IP" },
    { name: "Raden", logo: "images/logos/alliances/raden.jpg", note: "Partner" }
  ]
};
