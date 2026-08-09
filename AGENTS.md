# Netzl Data Solutions website: agent guide

## Scope

These instructions apply to the entire repository. This repository contains the public company website, browser tools, the Ticket-Hub landing page, a small contact-form service, and the server configuration required to run them.

Before changing files, run `git status --short`. The worktree may contain deliberate uncommitted user changes. Preserve unrelated edits and never reset, discard, or overwrite them.

## What this project is

Netzl Data Solutions is a local technology, IT, and data company in Lower Austria. It helps Austrian SMEs reduce manual administrative work, connect existing systems, automate repeatable processes, and make decisions from useful data.

The core message is deliberately simple:

- less Excel handwork, more reliable automation;
- less gut feeling, more useful knowledge;
- less administration, more time for what matters.

The tone must be clear, grounded, practical, local, and personal. Avoid startup jargon, inflated AI claims, abstract consulting language, and long paragraphs. Show realistic work situations and concrete outcomes.

## Current hosting model

- The active development branch is `staging`.
- `https://staging.netzldatasolutions.at/` is self-hosted from `/home/deploy/apps/netzldatasolutions.at` through Nginx.
- The current public main website is associated with the `main` branch and GitHub Pages. `CNAME` points to `www.netzldatasolutions.at`.
- `https://tickets.netzldatasolutions.at/` is a separate self-hosted static site rooted at `/home/deploy/apps/netzldatasolutions.at/tickets`.
- `https://staging.netzldatasolutions.at/tickets/` is the convenient preview path for the same Ticket-Hub files.
- Do not publish, merge, alter DNS, install Nginx configuration, reload services, or request certificates unless the user explicitly asks. Agents normally do not have sudo access. Prepare exact commands for the user and verify them with read-only checks.
- This is not an OpenAI Sites-hosted project. Preserve the user's self-hosted architecture.

## Repository map

| Area | Main files | Notes |
| --- | --- | --- |
| Main website | `index.html`, `assets/css/staging.css`, `assets/js/staging.js` | Current redesigned staging site. |
| Legal pages | `impressum.html`, `datenschutz.html` | Use the same header, footer, and design language. |
| Browser tools | `qr-code-generator.html`, `csv-konverter.html`, `assets/js/qr-code-generator.js`, `assets/js/csv-converter.js` | Styled by `staging.css` and `subpages.css`. Processing should remain client-side where intended. |
| Shared subpage design | `assets/css/subpages.css` | Legal pages and tools. |
| Ticket-Hub site | `tickets/index.html`, `tickets/ticket-hub.css`, `tickets/ticket-hub.js` | Independent landing page, but visually aligned with the main brand. |
| Ticket-Hub source material | `ticket_hub_funktionsbeschreibung.md` | Detailed product description. Read it before adding or changing feature claims. Do not publish the whole specification. |
| Contact backend | `server/contact-server.mjs` | Minimal Node HTTP service that sends through Postmark. |
| Contact tests | `tests/contact-server.test.mjs` | Uses Node's built-in test runner and a mock Postmark server. |
| Server configuration | `deploy/` | Nginx and systemd source files. These are copied into system directories by the user with sudo. |
| Brand assets | `assets/img/logo.svg`, `assets/img/favicon.svg`, favicons, OG images, `assets/img/profile.webp` | Reuse these rather than recreating the logo. |
| Process icons | `assets/icons/` | Existing sourced SVG icon assets. |
| Legacy theme files | `assets/css/main.css`, `assets/scss/`, much of `assets/vendor/`, `forms/*.php` | Not the primary implementation for the redesigned staging site. Do not edit them unless the task specifically concerns the legacy site. PHP endpoints are blocked in the self-hosted Nginx configuration. |

There is no application build step or package manager for the current site. The main frontend is plain HTML, CSS, and JavaScript.

## Page and script relationships

- `index.html` loads `assets/css/staging.css` and `assets/js/staging.js`.
- Legal pages load `assets/css/staging.css`, `assets/css/subpages.css`, and `assets/js/staging.js`.
- The QR generator additionally loads the QR library, jsPDF, and `assets/js/qr-code-generator.js`.
- The CSV converter additionally loads Pyodide and `assets/js/csv-converter.js`.
- `tickets/index.html` intentionally uses its own `tickets/ticket-hub.css` and `tickets/ticket-hub.js`.
- Nginx exposes the shared root `/assets/` path on the Ticket-Hub subdomain so the logo and favicons do not need to be duplicated.

## Design and content guardrails

- Primary font: Manrope.
- Core colors are defined as CSS custom properties. The main dark green is `#14231f`, the brand green is `#70b646`, the light accent is `#a7df61`, and the warm paper background is `#f4f3ed`.
- Prefer strong typography, whitespace, simple UI mockups, CSS shapes, existing icon assets, and useful charts. Do not make the site look like a PDF or a generic template.
- Keep copy short. A visitor should understand the subject from headings and visuals without reading every paragraph.
- Use Austrian German and formal `Sie` language consistently.
- Preserve the exact main headline wording `Mehr Zeit für's Wesentliche.` unless the user requests a change.
- Preserve the footer statement `Daten, die Sinn machen. Mehr Zeit für's Wesentliche.`
- Do not use the middle-dot separator character in visible website copy. Use commas, line breaks, arrows, borders, or separate elements instead.
- Avoid decorative symbols that look like broken artifacts. Reuse real icon assets when an icon is needed.
- Animations must remain smooth, purposeful, responsive, keyboard-safe where interactive, and compatible with `prefers-reduced-motion`.
- Sticky scroll sections must not sit inside an ancestor with `overflow: hidden` or `overflow: auto`; that breaks sticky behavior. Clip only the axis that needs clipping, preferably with `overflow-x: clip` and `overflow-y: visible`.
- Mobile layouts must not hide the bottom of scroll scenes or create excessive empty height. If a sticky desktop scene cannot fit comfortably on mobile, use sequential in-flow cards instead.
- Maintain accessible labels, focus styles, semantic headings, touch behavior, and native form validation.
- Keep the founder portrait visually compact in height, especially on phones. Do not make it merely narrower. Preserve the visible photo credit to Anna Sebjanic (ANNAagentur).
- Preserve the FAQ direction and heading style `Vielleicht fragen Sie sich gerade …`; do not add a redundant generic `Häufige Fragen` heading.
- Do not introduce inline SVG illustrations. Existing standalone SVG logo and icon files are fine.

## Main website content model

The main site should communicate that Netzl Data Solutions can simplify many parts of everyday work, not only three named products. Current examples include automated reports, useful dashboards, invoice preparation, connected systems, browser tools, and carefully bounded AI agents.

AI messaging must remain pragmatic:

- strong agents can gather information, update systems, prepare work, and monitor signals;
- use agents only when they are reliable and useful in real work;
- uncertain or critical cases must stop, ask, or remain under human control;
- do not sell AI for its own sake.

## Ticket-Hub facts and claims

The Ticket-Hub is a secondary product, not the company's only or core service. It is a customizable event, ticket, and shop solution for organizations such as associations, hospitality businesses, cultural organizers, regions, and companies.

The commercial model must be described accurately:

- a one-time setup fee;
- fixed monthly costs for hosting, maintenance, monitoring, backups, and ongoing operation;
- no fee or commission per ticket or sale charged by Netzl Data Solutions;
- Stripe payment-processing fees are separate and must not be presented as included or eliminated.

Important capabilities may be summarized as:

- own branding and public shop;
- self-service event, ticket, product, price, and quota management;
- Stripe checkout and automatic confirmations;
- browser-based QR admission, on-site sales, and invitations;
- sales, capacity, campaign, and admission reporting.

Keep the landing page selective and understandable. Do not reproduce every function from `ticket_hub_funktionsbeschreibung.md`.

The main-site Ticket-Hub teaser should stay brief and lead to `https://tickets.netzldatasolutions.at/`. Its essential points are the one-time setup, fixed monthly operating cost, and no Ticket-Hub fee per ticket.

## Contact form and Postmark

The contact form is submitted in place with `fetch` to `/api/contact`; it must not redirect to an external form page.

Architecture:

1. `assets/js/staging.js` validates and submits JSON.
2. Nginx proxies only `/api/contact` to `127.0.0.1:8787`.
3. `server/contact-server.mjs` validates origin, payload size, timing, fields, consent, honeypot, and application-level rate limits.
4. The service sends a fixed, escaped message through Postmark.

Current defaults:

- sender: `intern@netzldatasolutions.at`;
- recipient: `kontakt@netzldatasolutions.at`;
- Postmark message stream: `outbound`;
- health endpoint: `http://127.0.0.1:8787/health`;
- systemd unit source: `deploy/netzldatasolutions-contact.service`.

Secrets:

- `.env` contains the live Postmark server token and is ignored by Git.
- Never print, read into a response, commit, log, or expose `.env` or its token.
- Keep `.env.example` synchronized when adding non-secret configuration keys.
- `POSTMARK_SERVER_TOKEN` is preferred; the server also accepts the legacy `SERVER_TOKEN` name.

Security behavior that must be preserved:

- allowed-origin checks;
- same-origin JSON submission;
- honeypot and minimum fill time;
- body and field length limits;
- HTML escaping;
- reply-to set from the validated visitor email;
- server-side and Nginx rate limiting;
- no open mail relay and no client-controlled Postmark fields;
- no tracking links or open tracking.

If the service changes, run its test suite and provide the user with any required `sudo systemctl daemon-reload` and restart commands. Do not claim the service was restarted if sudo was unavailable.

## Nginx and TLS files

- `deploy/staging.netzldatasolutions.at.nginx` serves the repository root and proxies the contact endpoint.
- `deploy/tickets.netzldatasolutions.at.http.nginx` is the temporary HTTP-only bootstrap configuration used before the first certificate exists.
- `deploy/tickets.netzldatasolutions.at.nginx` is the final HTTP-to-HTTPS and TLS configuration.
- The final Ticket-Hub certificate paths are expected under `/etc/letsencrypt/live/tickets.netzldatasolutions.at/`.

Safe Ticket-Hub TLS order:

1. install the HTTP bootstrap configuration;
2. run `sudo nginx -t` and reload Nginx;
3. obtain the certificate with Certbot webroot `/home/deploy/apps/netzldatasolutions.at/tickets` and certificate name `tickets.netzldatasolutions.at`;
4. install the final TLS configuration;
5. run `sudo nginx -t` again before reloading;
6. verify HTTP redirects, HTTPS returns 200, the certificate SAN is correct, and `sudo certbot renew --dry-run` succeeds.

Never install the final TLS configuration before the certificate exists. Never delete or replace an existing enabled Nginx site without first resolving its exact target with read-only checks.

## Editing workflow

1. Read the relevant HTML, CSS, and JavaScript together before editing.
2. Check both the base rule and all later media-query overrides; this project contains refinement blocks near the end of its stylesheets.
3. Use `apply_patch` for manual file changes.
4. Preserve unrelated dirty-worktree changes.
5. Keep shared behavior in shared files, but do not force the independent Ticket-Hub page into the main site's JavaScript or stylesheet.
6. Update metadata, sitemap, robots rules, and legal disclosure if a feature changes what is published, indexed, or processed.
7. Never edit generated or vendored library files for a local feature.

## Validation checklist

Run checks in proportion to the change. Useful commands include:

```bash
node --check assets/js/staging.js
node --check assets/js/qr-code-generator.js
node --check assets/js/csv-converter.js
node --check tickets/ticket-hub.js
node --test tests/contact-server.test.mjs
git diff --check
```

Also verify:

- HTML IDs are unique and internal fragment links resolve;
- local stylesheet, script, image, and favicon paths exist;
- CSS braces are balanced;
- no legacy hidden panel logic conflicts with scroll-driven scenes;
- responsive and reduced-motion rules still expose all content;
- preview endpoints return successful HTTP responses;
- user-visible German copy has no accidental placeholders or unclear claims.

Do not perform screenshots, automated clicking, DOM inspection, or browser resizing unless the user explicitly requests browser UI testing. If requested, test both desktop and phone-sized layouts, with special attention to sticky scene boundaries and iPhone download behavior.

## Deployment handoff

Static file changes in this working directory are immediately visible through the staging Nginx root. Ticket-Hub files are likewise visible at the staging preview path and at the ticket subdomain once its Nginx configuration is enabled.

For changes that require privileged operations, give the user exact copy-paste commands and expected results. Always include `sudo nginx -t` before an Nginx reload. For service changes, include a health check and relevant journal/status command. Report what was changed locally separately from what the user still needs to activate on the server.
