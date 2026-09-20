import { getClinicGeo } from "./site-location.mjs";

const SITE = "https://www.pathfindertherapy.com";
const BOOKING_SITE = "https://booking.pathfindertherapy.com/book";
const geo = getClinicGeo();
const LISBON_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "R. Rodrigues Sampaio 76 1º Andar",
  addressLocality: "Lisboa",
  postalCode: "1150-281",
  addressCountry: "PT"
};

export const GLOBAL_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#organization`,
    name: "Pathfinder Therapy",
    legalName: "Pathfinder Therapy CIC",
    logo: `${SITE}/assets/images/pathfinder-path-icon-hq.png`,
    slogan: "Navigating Life's Difficult Terrain",
    url: SITE,
    email: "hi@pathfindertherapy.com",
    telephone: "+351 914 775 365",
    identifier: {
      "@type": "PropertyValue",
      name: "Company Number",
      value: "17248842",
      description: "Registered in England and Wales"
    },
    award: "NCPS Recognised Counselling Service, Membership No. RCS6035",
    sameAs: [
      "https://www.instagram.com/pathfinder.therapy/",
      "https://share.google/9avIEL6pz3bn4kETg"
    ],
    address: LISBON_ADDRESS,
    areaServed: [
      { "@type": "City", name: "Lisboa" },
      { "@type": "Country", name: "Portugal" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    name: "Pathfinder Therapy",
    url: SITE,
    inLanguage: "en-GB",
    publisher: { "@id": `${SITE}/#organization` }
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE}/about/#brent-kelly`,
    name: "Brent Kelly",
    jobTitle: "Therapist",
    description: "English-speaking therapist offering trauma-informed psychotherapy, EMDR and Transactional Analysis for adults in Lisbon and online across Portugal.",
    knowsLanguage: "English",
    worksFor: { "@id": `${SITE}/#organization` },
    url: `${SITE}/about/`,
    image: `${SITE}/assets/images/about-brent-pathfinder-logo.webp`,
    knowsAbout: [
      "Trauma",
      "EMDR",
      "Transactional Analysis",
      "Military veterans",
      "Attachment",
      "Anxiety",
      "Relationship therapy"
    ],
    memberOf: [
      {
        "@type": "Organization",
        name: "European Association for Transactional Analysis (EATA)",
        url: "https://eatanews.org/"
      },
      {
        "@type": "Organization",
        name: "International Transactional Analysis Association (ITAA)",
        url: "https://itaaworld.com/"
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${SITE}/#medical-business`,
    name: "Pathfinder Therapy",
    legalName: "Pathfinder Therapy CIC",
    url: SITE,
    image: `${SITE}/assets/images/hero-01.webp`,
    email: "hi@pathfindertherapy.com",
    telephone: "+351 914 775 365",
    priceRange: "EUR75",
    employee: { "@id": `${SITE}/about/#brent-kelly` },
    medicalSpecialty: ["Psychotherapy", "Trauma therapy", "EMDR", "Relationship therapy"],
    address: LISBON_ADDRESS,
    geo: {
      "@type": "GeoCoordinates",
      latitude: geo.latitude,
      longitude: geo.longitude
    },
    hasMap: geo.mapsUrl,
    areaServed: [
      { "@type": "City", name: "Lisboa" },
      { "@type": "Country", name: "Portugal" }
    ]
  }
];

export function buildGlobalSchemaScript() {
  return `<script id="pathfinder-global-schema" type="application/ld+json">${JSON.stringify(GLOBAL_SCHEMA)}</script>`;
}

export function patchGlobalSchema(html) {
  if (!html.includes('id="pathfinder-global-schema"')) {
    return html.replace("</head>", `${buildGlobalSchemaScript()}\n</head>`);
  }
  return html.replace(
    /<script id="pathfinder-global-schema" type="application\/ld\+json">[\s\S]*?<\/script>/,
    buildGlobalSchemaScript()
  );
}

export function buildServiceSchema({ name, description, url, serviceType }) {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    serviceType,
    provider: { "@id": `${SITE}/#medical-business` },
    areaServed: { "@type": "City", name: "Lisboa" },
    availableChannel: {
      "@type": "ServiceChannel",
      availableLanguage: "English",
      serviceUrl: BOOKING_SITE,
      servicePhone: "+351914775365"
    }
  })}</script>`;
}

export function buildBreadcrumbSchema(items) {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  })}</script>`;
}
