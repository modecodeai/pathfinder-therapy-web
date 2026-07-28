/**
 * Pathfinder Adaptive Immersive Trauma Therapy Pilot — publication gates.
 * Safe defaults only. Do not mark stages complete or open recruitment
 * until confirmed by Brent Kelly.
 *
 * Phantom limb embodiment: if PsyTechVR does not provide dedicated virtual
 * limb embodiment, a separate approved platform or future development may
 * be required. Do not misrepresent generic relaxation/EMDR modules as PLP treatment.
 */
window.PATHFINDER_AITT = Object.freeze({
  programmeName: "Pathfinder Adaptive Immersive Trauma Therapy Pilot",
  abbreviation: "AITT",
  pilotStatus: "In development",
  statusBadge: "Pilot launching in 2026",
  pilotLaunchDate: null,
  participantRecruitmentOpen: false,
  remoteDeliveryEnabled: false,
  phantomLimbPathwayEnabled: true,
  phantomLimbPathwayStatus: "Planned",
  professionalPartnershipsOpen: true,
  feesConfirmed: false,
  fundedPlacesConfirmed: false,
  psytechNameApproved: true,
  metaNameApproved: true,
  blesmaPartnershipConfirmed: false,
  rehabilitationPartnershipConfirmed: false,
  researchPartnerConfirmed: false,
  emdrTrainingCompleted: false,
  contactEmail: "hello@pathfindertherapy.org.uk",
  clinicalLocation: null,
  lastReviewedDate: "2026-07-28",
  statusTracker: Object.freeze([
    { id: "clinical-framework", label: "Clinical framework", status: "In progress" },
    { id: "practitioner-training", label: "Practitioner training", status: "Planned" },
    { id: "technology-evaluation", label: "Technology evaluation", status: "In progress" },
    { id: "governance", label: "Governance", status: "In progress" },
    { id: "professional-partnerships", label: "Professional partnerships", status: "In progress" },
    { id: "participant-recruitment", label: "Participant recruitment", status: "Planned" },
    { id: "initial-delivery", label: "Initial delivery", status: "Planned" },
    { id: "service-evaluation", label: "Service evaluation", status: "Planned" },
    { id: "findings", label: "Findings and next steps", status: "Planned" }
  ]),
  vision:
    "To become Europe’s leading clinical centre for adaptive immersive trauma therapy, advancing the safe, ethical and evidence-informed use of immersive technologies for military veterans and adults with complex trauma.",
  pages: Object.freeze({
    pilot: "/immersive-trauma-therapy.html",
    participantForm: "/immersive-trauma-therapy.html#register-interest",
    professionalForm: "/immersive-trauma-therapy.html#professional-partnerships",
    news: "/news/adaptive-immersive-trauma-therapy-pilot.html"
  })
});
