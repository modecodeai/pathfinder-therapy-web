const CLINIC = {
  name: "Pathfinder Therapy",
  street: "R. Rodrigues Sampaio 76 1º Andar",
  locality: "Lisboa",
  postalCode: "1150-281",
  country: "Portugal",
  latitude: 38.7324,
  longitude: -9.1458,
  mapsUrl: "https://maps.google.com/?q=R.+Rodrigues+Sampaio+76,+1150-281+Lisboa,+Portugal",
  embedUrl:
    "https://maps.google.com/maps?q=R.+Rodrigues+Sampaio+76,+1150-281+Lisboa,+Portugal&z=16&output=embed"
};

export const LOCATION_CSS = `<style id="pathfinder-location">
.lpLocationBlock { display: grid; gap: 20px; margin-top: 24px; }
.lpLocationDetails { display: grid; gap: 14px; font-size: 15px; line-height: 1.65; color: rgba(246,242,234,.76); }
.lpLocationDetails p { margin: 0; }
.lpLocationDetails strong { color: #f6f2ea; }
.lpLocationList { margin: 0; padding-left: 1.1rem; display: grid; gap: 6px; }
.lpLocationMap { width: 100%; min-height: 240px; border: 1px solid rgba(246,242,234,.12); border-radius: 16px; overflow: hidden; background: rgba(8,16,15,.45); }
.lpLocationMap iframe { display: block; width: 100%; height: 240px; border: 0; }
.lpLocationMapLink { font-size: 13px; font-weight: 600; color: #d9b777; text-decoration: none; }
.lpLocationMapLink:hover { text-decoration: underline; }
@media (min-width: 768px) {
  .lpLocationBlock { grid-template-columns: minmax(0, 1fr) minmax(240px, 320px); align-items: start; }
  .lpLocationMap iframe { height: 260px; }
}
</style>`;

export function getClinicGeo() {
  return {
    latitude: CLINIC.latitude,
    longitude: CLINIC.longitude,
    mapsUrl: CLINIC.mapsUrl
  };
}

export function buildLocationBlock({ headingId = "clinic-location", compact = false } = {}) {
  const title = compact ? "Find the Lisbon clinic" : "Pathfinder Therapy — Lisbon clinic";
  return `<section class="lpLocalSection lpLocationSection" aria-labelledby="${headingId}">
  <div class="lpLocalSectionInner">
    <p class="lpKicker">Location</p>
    <h2 class="lpSectionTitle" id="${headingId}">${title}</h2>
    <div class="lpLocationBlock">
      <div class="lpLocationDetails">
        <p><strong>${CLINIC.name}</strong><br>${CLINIC.street}<br>${CLINIC.postalCode} ${CLINIC.locality}, ${CLINIC.country}</p>
        <p>In the <strong>Avenidas Novas</strong> area of central Lisbon — close to Marquês de Pombal, Picoas, and Príncipe Real.</p>
        <p><strong>Getting here</strong></p>
        <ul class="lpLocationList">
          <li><strong>Metro:</strong> Marquês de Pombal (blue &amp; yellow lines) or Picoas — about 8–10 minutes on foot</li>
          <li><strong>Bus:</strong> Avenida da República and nearby stops on the main north–south routes</li>
          <li><strong>Online:</strong> Secure sessions across Portugal if travel or schedule makes in-person sessions difficult</li>
        </ul>
        <p><a class="lpLocationMapLink" href="${CLINIC.mapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps →</a></p>
      </div>
      <div class="lpLocationMap" aria-label="Map showing Pathfinder Therapy clinic in Lisbon">
        <iframe
          title="Pathfinder Therapy clinic location — R. Rodrigues Sampaio 76, Lisboa"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          src="${CLINIC.embedUrl}"
        ></iframe>
      </div>
    </div>
  </div>
</section>`;
}

export function injectLocationStyles(html) {
  if (html.includes("pathfinder-location")) {
    return html;
  }
  return html.replace("</head>", `${LOCATION_CSS}\n</head>`);
}

export function enhanceTherapyLocationSection(mainInner) {
  if (mainInner.includes("lpLocationSection")) {
    return mainInner;
  }

  const locationSection =
    /<section class="approachEssay" aria-labelledby="therapy-location">[\s\S]*?<\/section>/;
  if (locationSection.test(mainInner)) {
    return mainInner.replace(locationSection, buildLocationBlock({ headingId: "therapy-location" }));
  }

  return mainInner.replace("</article>", `${buildLocationBlock({ headingId: "therapy-location" })}</article>`);
}
