export type TherapistProfile = {
  name: string;
  role: string;
  availability: string;
  image: string;
  imageAlt: string;
  summary: string;
  detail: string;
  credentials: string[];
};

export const therapistProfiles: TherapistProfile[] = [
  {
    name: "Brent Kelly",
    role: "Trauma-informed psychotherapist · EMDR Practitioner",
    availability: "Lisbon clinic and online",
    image: "/images/team/brent-kelly.jpeg",
    imageAlt: "Brent Kelly, therapist at Pathfinder Therapy Lisbon",
    summary:
      "Brent leads Pathfinder Therapy in Lisbon and holds the face-to-face clinical space for clients who want to meet in person.",
    detail:
      "His work is relational, trauma-informed and grounded in Transactional Analysis, EMDR and careful attention to attachment, identity, anxiety and life transitions.",
    credentials: ["EATA registered", "ITAA member", "EMDR Practitioner", "Transactional Analysis"]
  },
  {
    name: "Tim Felton",
    role: "Online therapist · EMDR Practitioner",
    availability: "Online sessions only",
    image: "/images/team/tim-felton.jpeg",
    imageAlt: "Tim Felton, online therapist with Pathfinder Therapy",
    summary:
      "Tim supports Pathfinder clients online, offering a steady therapeutic space for people navigating stress, change and the impact of difficult life experiences.",
    detail:
      "His background brings together clinical training, lived experience and a calm, practical approach to helping clients make sense of what they are carrying.",
    credentials: ["Therapist", "EMDR Practitioner", "Veteran", "Online therapy"]
  },
  {
    name: "Sophie Gidley",
    role: "Online couples therapist",
    availability: "Online couples therapy",
    image: "/images/team/sophie-gidley.webp",
    imageAlt: "Sophie Gidley, online couples therapist with Pathfinder Therapy",
    summary:
      "Sophie is a psychotherapeutic counsellor who works with couples and individuals, with a particular focus on relationship patterns, communication and repair.",
    detail:
      "Her practice is grounded in Transactional Analysis and a down-to-earth, non-judgemental therapeutic style. Through Pathfinder Therapy, Sophie offers online couples sessions only.",
    credentials: ["BACP member", "UKATA member", "TA diploma", "Couples counselling"]
  }
];
