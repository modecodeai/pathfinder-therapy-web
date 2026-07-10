export const site = {
  name: "Pathfinder Therapy",
  title: "Pathfinder Therapy | Trauma-Informed Psychotherapy in Lisbon",
  description:
    "Trauma-informed psychotherapy with Brent Kelly at Pathfinder Therapy, online and in Lisbon.",
  url: "https://www.pathfindertherapy.com",
  email: "hi@pathfindertherapy.com",
  phoneDisplay: "+351 914 775 365",
  phoneE164: "+351914775365",
  whatsappUrl: "https://wa.me/351914775365",
  addressDisplay: "R. Rodrigues Sampaio 76 1º Andar, 1150-281 Lisboa, Portugal",
  ogImage: "/pathfinder-therapy-room.png",
  ogImageAlt: "Pathfinder Therapy room"
};

export const enquiryTypes = [
  "Individual therapy",
  "Couples therapy",
  "EMDR",
  "Online therapy",
  "Clinical enquiry",
  "Other"
];

export const navItems = [
  { label: "Begin", href: "/" },
  { label: "Approach", href: "/approach" },
  { label: "Therapy", href: "/therapy" },
  { label: "Retreats", href: "/retreats" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export const sitemapRoutes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/approach/", priority: 0.7 },
  { path: "/therapy/", priority: 0.7 },
  { path: "/retreats/", priority: 0.6 },
  { path: "/journal/", priority: 0.6 },
  { path: "/about/", priority: 0.7 },
  { path: "/contact/", priority: 0.8 },
  { path: "/privacy/", priority: 0.3 },
  { path: "/terms/", priority: 0.3 },
  { path: "/faq/", priority: 0.5 },
  { path: "/crisis-support/", priority: 0.4 }
];

export const chapters = [
  {
    number: "01",
    title: "Understanding",
    text: "What if your patterns make sense?",
    href: "/approach",
    tone: "Coastline"
  },
  {
    number: "02",
    title: "Working Together",
    text: "Therapy shaped around your life, not a formula.",
    href: "/therapy",
    tone: "Forest path"
  },
  {
    number: "03",
    title: "Retreat",
    text: "Space away from the noise to pause and reorient.",
    href: "/retreats",
    tone: "Morning mist"
  },
  {
    number: "04",
    title: "Journal",
    text: "Essays for understanding ourselves more deeply.",
    href: "/journal",
    tone: "Quiet pages"
  }
];

export const leadFunnel = {
  landingPath: "/start/",
  thankYouPath: "/thank-you/",
  defaultCtaPath: "/book/"
};
