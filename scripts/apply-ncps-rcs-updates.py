#!/usr/bin/env python3
"""Apply NCPS Recognised Counselling Service updates across cic-site HTML files."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("/workspace/cic-site")

NAV_INSERT = (
    '          <a href="our-journey.html" role="menuitem">Our Journey</a>\n'
    '          <a href="standards-and-accreditations.html" role="menuitem">Standards and Accreditations</a>'
)

FOOTER_ACCREDITATION = """    <section class="footer-accreditation" aria-labelledby="footer-standards-title">
      <div class="footer-accreditation-copy">
        <h2 id="footer-standards-title">Standards and Accreditations</h2>
        <p>Pathfinder Therapy CIC is an NCPS Recognised Counselling Service.</p>
        <p>NCPS Membership No: RCS6035</p>
        <p class="footer-accreditation-links">
          <a href="standards-and-accreditations.html">Standards and Accreditations</a>
          <a href="https://ncps.com/about-us/our-community/our-recognised-counselling-services" target="_blank" rel="noopener noreferrer">View NCPS Recognised Counselling Services <span class="visually-hidden">(opens in a new tab)</span></a>
        </p>
      </div>
      <a class="footer-accreditation-logo" href="standards-and-accreditations.html">
        <img
          class="ncps-logo ncps-logo--footer"
          src="assets/images/accreditations/ncps-recognised-counselling-service.png"
          alt="NCPS Recognised Counselling Service logo, Pathfinder Therapy CIC membership RCS6035"
          width="1169"
          height="484">
      </a>
    </section>
"""

HOMEPAGE_TRUST = """
  <section class="standards-trust-section" aria-labelledby="home-standards-title">
    <div class="container standards-trust-grid">
      <div class="standards-trust-logo">
        <a href="standards-and-accreditations.html" aria-label="Standards and Accreditations">
          <img
            class="ncps-logo ncps-logo--inline"
            src="assets/images/accreditations/ncps-recognised-counselling-service.png"
            alt="NCPS Recognised Counselling Service logo, Pathfinder Therapy CIC membership RCS6035"
            width="1169"
            height="484">
        </a>
      </div>
      <div>
        <p class="eyebrow">Standards and accreditations</p>
        <h2 id="home-standards-title">Professional Standards You Can Trust</h2>
        <p>Pathfinder Therapy CIC is an NCPS Recognised Counselling Service, membership number RCS6035.</p>
        <p>Our services are supported by defined standards for safeguarding, clinical governance, supervision, ethical practice and professional accountability.</p>
        <div class="standards-trust-actions">
          <a class="button button-primary" href="standards-and-accreditations.html">View Our Standards and Accreditations <span>→</span></a>
          <a class="standards-external-link" href="https://ncps.com/about-us/our-community/our-recognised-counselling-services" target="_blank" rel="noopener noreferrer">View NCPS Recognised Counselling Services <span class="visually-hidden">(opens in a new tab)</span></a>
        </div>
      </div>
    </div>
  </section>

"""

ABOUT_RECOGNITION = """
  <section class="professional-recognition-section" aria-labelledby="about-recognition-title">
    <div class="container professional-recognition-grid">
      <div class="professional-recognition-logo">
        <a href="standards-and-accreditations.html" aria-label="Standards and Accreditations">
          <img
            class="ncps-logo ncps-logo--inline"
            src="assets/images/accreditations/ncps-recognised-counselling-service.png"
            alt="NCPS Recognised Counselling Service logo, Pathfinder Therapy CIC membership RCS6035"
            width="1169"
            height="484">
        </a>
      </div>
      <div>
        <p class="eyebrow">Standards and accreditations</p>
        <h2 id="about-recognition-title">Professional Recognition</h2>
        <p>Pathfinder Therapy CIC is recognised by the National Counselling and Psychotherapy Society as an NCPS Recognised Counselling Service.</p>
        <p><strong>NCPS Membership No: RCS6035</strong></p>
        <p>This organisational recognition supports our commitment to safe, ethical and accountable counselling provision.</p>
        <p>It sits alongside our internal standards for safeguarding, clinical supervision, practitioner suitability, complaints handling, data protection and service governance.</p>
        <div class="standards-trust-actions">
          <a class="button button-primary" href="standards-and-accreditations.html">Learn About Our Standards and Accreditations <span>→</span></a>
        </div>
      </div>
    </div>
  </section>

"""

TEAM_NOTE = """
  <section class="organisational-recognition-note" aria-labelledby="team-org-recognition-title">
    <div class="container">
      <p class="eyebrow">Standards and accreditations</p>
      <h2 id="team-org-recognition-title">Organisational Recognition</h2>
      <p>Pathfinder Therapy CIC is an NCPS Recognised Counselling Service.</p>
      <p>Individual team members may hold separate professional registrations, memberships and qualifications. These are listed in their individual profiles where applicable.</p>
      <p>NCPS Recognised Counselling Service status applies to Pathfinder Therapy CIC as an organisation and should not be interpreted as confirmation that every individual practitioner holds personal NCPS membership.</p>
      <p><a href="standards-and-accreditations.html">Learn about our Standards and Accreditations</a></p>
    </div>
  </section>

"""

SERVICES_NOTE = """
        <p class="ncps-trust-note">Pathfinder Therapy CIC is an <a href="standards-and-accreditations.html">NCPS Recognised Counselling Service</a>, membership number RCS6035.</p>
"""

GET_SUPPORT_NOTE = """
  <section class="organisational-recognition-note" aria-labelledby="get-support-standards-title">
    <div class="container">
      <h2 id="get-support-standards-title" class="visually-hidden">Professional standards</h2>
      <p>Pathfinder Therapy CIC is an <a href="standards-and-accreditations.html">NCPS Recognised Counselling Service</a>, membership number RCS6035.</p>
      <p>Our assessment, safeguarding and clinical governance procedures support safe and appropriate access to therapy.</p>
    </div>
  </section>

"""

VETERANS_NOTE = """
        <p class="ncps-trust-note">Pathfinder Therapy CIC is an <a href="standards-and-accreditations.html">NCPS Recognised Counselling Service</a>, membership number RCS6035.</p>
"""

CONTACT_NOTE = """
        <div class="ncps-trust-note contact-ncps-note">
          <p>Pathfinder Therapy CIC is an NCPS Recognised Counselling Service.</p>
          <p>NCPS Membership No: RCS6035</p>
          <p><a href="standards-and-accreditations.html">Standards and Accreditations</a></p>
        </div>
"""


def update_nav(html: str, filename: str) -> str:
    if "standards-and-accreditations.html" in html and 'role="menuitem">Standards and Accreditations' in html:
        # Ensure link exists once under About
        pass
    else:
        html = html.replace(
            '          <a href="our-journey.html" role="menuitem">Our Journey</a>',
            NAV_INSERT,
            1,
        )

    # Mark active on standards page only (already set in dedicated file)
    if filename == "standards-and-accreditations.html":
        return html
    return html


def update_footer(html: str) -> str:
    if 'class="footer-accreditation"' in html:
        return html

    # Compact one-line footers
    compact = re.search(
        r'<footer class="site-legal-footer"><div class="container legal-footer-grid">(.*?)</div></footer>',
        html,
        flags=re.S,
    )
    if compact:
        inner = compact.group(1)
        # Ensure standards link in nav
        if "standards-and-accreditations.html" not in inner:
            inner = inner.replace(
                '<a href="professional-standards.html">Professional Standards</a>',
                '<a href="standards-and-accreditations.html">Standards and Accreditations</a>'
                '<a href="professional-standards.html">Professional Standards</a>',
            )
        replacement = (
            '<footer class="site-legal-footer"><div class="container">'
            + FOOTER_ACCREDITATION.replace("\n", "")
            + '<div class="legal-footer-grid">'
            + inner
            + "</div></div></footer>"
        )
        return html[: compact.start()] + replacement + html[compact.end() :]

    # Multi-line footers
    pattern = re.compile(
        r'(<footer class="site-legal-footer">\s*)'
        r'(<div class="container legal-footer-grid">)'
        r'(.*?)'
        r'(</div>\s*</footer>)',
        flags=re.S,
    )
    match = pattern.search(html)
    if not match:
        return html

    footer_inner = match.group(3)
    if "standards-and-accreditations.html\">Standards and Accreditations" not in footer_inner:
        footer_inner = footer_inner.replace(
            '      <a href="professional-standards.html">Professional Standards</a>\n',
            '      <a href="standards-and-accreditations.html">Standards and Accreditations</a>\n'
            '      <a href="professional-standards.html">Professional Standards</a>\n',
            1,
        )

    replacement = (
        f'{match.group(1)}'
        f'<div class="container">\n'
        f'{FOOTER_ACCREDITATION}'
        f'    <div class="legal-footer-grid">'
        f'{footer_inner}'
        f'    </div>\n'
        f'  </div>\n'
        f'</footer>'
    )
    return html[: match.start()] + replacement + html[match.end() :]


def update_stylesheet_version(html: str) -> str:
    return html.replace("styles.css?v=53", "styles.css?v=54")


def update_schema_award(html: str) -> str:
    if '"award": "NCPS Recognised Counselling Service, Membership No. RCS6035"' in html:
        return html
    # Insert award before closing of Organization JSON-LD description block
    return re.sub(
        r'("description": "Veteran-founded counselling and psychotherapy support for veterans and adults in the wider community\.")\n(\})',
        r'\1,\n  "award": "NCPS Recognised Counselling Service, Membership No. RCS6035"\n\2',
        html,
        count=1,
    )


def update_index(html: str) -> str:
    if 'id="home-standards-title"' in html:
        return html
    marker = '  <section class="covenant-feature-section"'
    if marker in html:
        return html.replace(marker, HOMEPAGE_TRUST + marker, 1)
    return html


def update_about(html: str) -> str:
    if 'id="about-recognition-title"' in html:
        return html
    marker = '  <section class="governance-section">'
    if marker in html:
        return html.replace(marker, ABOUT_RECOGNITION + marker, 1)
    return html


def update_team(html: str) -> str:
    if 'id="team-org-recognition-title"' in html:
        return html
    marker = '  <section class="team-section">'
    if marker in html:
        return html.replace(marker, TEAM_NOTE + marker, 1)
    return html


def update_services(html: str) -> str:
    if "ncps-trust-note" in html:
        return html
    marker = (
        '        <div class="referral-actions">\n'
        '          <a class="button button-primary" href="get-support.html">Go to Get Support <span>→</span></a>'
    )
    if marker in html:
        insert = (
            '        <p class="ncps-trust-note">Pathfinder Therapy CIC is an '
            '<a href="standards-and-accreditations.html">NCPS Recognised Counselling Service</a>, '
            "membership number RCS6035.</p>\n"
            + marker
        )
        return html.replace(marker, insert, 1)
    return html


def update_get_support(html: str) -> str:
    if 'id="get-support-standards-title"' in html:
        return html
    # Place near form / triage after hero journey - before triage section
    marker = '  <section class="triage-section">'
    if marker in html:
        return html.replace(marker, GET_SUPPORT_NOTE + marker, 1)
    return html


def update_veterans(html: str) -> str:
    if "ncps-trust-note" in html:
        return html
    marker = (
        '        <a class="button button-primary" href="get-support.html">Request Support <span>→</span></a>\n'
        "      </div>"
    )
    if marker in html:
        insert = (
            '        <a class="button button-primary" href="get-support.html">Request Support <span>→</span></a>\n'
            '        <p class="ncps-trust-note">Pathfinder Therapy CIC is an '
            '<a href="standards-and-accreditations.html">NCPS Recognised Counselling Service</a>, '
            "membership number RCS6035.</p>\n"
            "      </div>"
        )
        return html.replace(marker, insert, 1)
    return html


def update_contact(html: str) -> str:
    if "contact-ncps-note" in html:
        return html
    marker = (
        '      <p>Contact Pathfinder Therapy CIC for support enquiries, referrals, partnership conversations, funding enquiries or general information.</p>\n'
        '      <div class="hero-actions">'
    )
    if marker in html:
        insert = (
            '      <p>Contact Pathfinder Therapy CIC for support enquiries, referrals, partnership conversations, funding enquiries or general information.</p>\n'
            + CONTACT_NOTE
            + '      <div class="hero-actions">'
        )
        return html.replace(marker, insert, 1)
    return html


def update_professional_standards(html: str) -> str:
    html = html.replace(
        "<p><strong>Status:</strong><br>Working towards NCPS Recognised Counselling Service status</p>",
        "<p><strong>Status:</strong><br>NCPS Recognised Counselling Service<br>NCPS Membership No: RCS6035</p>",
    )
    old_block = (
        "      <h2>Working towards recognition</h2>\n"
        "      <p>Pathfinder Therapy CIC is working towards recognition by the National Counselling and Psychotherapy Society as a Recognised Counselling Service. We do not currently claim to hold this recognition unless and until it has been formally granted.</p>"
    )
    new_block = (
        "      <h2>NCPS Recognised Counselling Service</h2>\n"
        "      <p>Pathfinder Therapy CIC is an NCPS Recognised Counselling Service.</p>\n"
        "      <p>NCPS Membership No: RCS6035</p>\n"
        "      <p>This is organisational recognition of Pathfinder Therapy CIC as a counselling service. It is distinct from the individual professional registrations, memberships and qualifications held by therapists working within the service.</p>\n"
        '      <p>For full details of our standards, clinical governance and accountability arrangements, see <a href="standards-and-accreditations.html">Standards and Accreditations</a>.</p>'
    )
    return html.replace(old_block, new_block)


def main() -> None:
    for path in sorted(ROOT.glob("*.html")):
        original = path.read_text(encoding="utf-8")
        html = original
        html = update_stylesheet_version(html)
        html = update_nav(html, path.name)
        html = update_footer(html)
        html = update_schema_award(html)

        if path.name == "index.html":
            html = update_index(html)
        elif path.name == "about.html":
            html = update_about(html)
        elif path.name == "team.html":
            html = update_team(html)
        elif path.name == "services.html":
            html = update_services(html)
        elif path.name == "get-support.html":
            html = update_get_support(html)
        elif path.name == "veterans.html":
            html = update_veterans(html)
        elif path.name == "contact.html":
            html = update_contact(html)
        elif path.name == "professional-standards.html":
            html = update_professional_standards(html)

        if html != original:
            path.write_text(html, encoding="utf-8")
            print(f"updated: {path.name}")
        else:
            print(f"unchanged: {path.name}")


if __name__ == "__main__":
    main()
