(() => {
  "use strict";

  const CONSENT_COOKIE = "nds_analytics_consent";
  const VISITOR_COOKIE = "nds_analytics_visitor";
  const SESSION_KEY = "nds_analytics_session";
  const ENDPOINT = "/api/analytics/events";
  const CONSENT_MAX_AGE = 180 * 24 * 60 * 60;
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const ENGAGEMENT_FLUSH_MS = 30 * 1000;
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  let trackingEnabled = false;
  let trackingStarted = false;
  let engagementTimer = null;
  let activeSince = null;
  let pendingActiveMs = 0;

  const cookieDomain = location.hostname.endsWith("netzldatasolutions.at")
    ? "; Domain=.netzldatasolutions.at"
    : "";
  const secureCookie = location.protocol === "https:" ? "; Secure" : "";

  const readCookie = (name) => {
    const prefix = `${encodeURIComponent(name)}=`;
    const entry = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : "";
  };

  const writeCookie = (name, value, maxAge) => {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureCookie}${cookieDomain}`;
  };

  const deleteCookie = (name) => writeCookie(name, "", 0);

  const createId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const value = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
  };

  const getConsent = () => readCookie(CONSENT_COOKIE);

  const sanitizeText = (value, maxLength = 100) =>
    String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/\?/g, "")
      .trim()
      .slice(0, maxLength);

  const referrerHost = () => {
    if (!document.referrer) return "";
    try {
      return sanitizeText(new URL(document.referrer).hostname.toLowerCase(), 255);
    } catch {
      return "";
    }
  };

  const sourceFromReferrer = (host) => {
    if (!host) return "direct";
    if (host === location.hostname.toLowerCase()) return "internal";
    if (host.endsWith("netzldatasolutions.at")) return "internal";
    if (/(^|\.)(google|bing|duckduckgo|ecosia|yahoo)\./i.test(host)) return "organic";
    return "referral";
  };

  const currentAcquisition = () => {
    const parameters = new URLSearchParams(location.search);
    const utmSource = sanitizeText(parameters.get("utm_source"), 100);
    const host = referrerHost();
    return {
      referrer_host: host,
      source: utmSource ? "campaign" : sourceFromReferrer(host),
      campaign: sanitizeText(parameters.get("utm_campaign"), 100),
      campaign_source: utmSource,
    };
  };

  const getSession = () => {
    const now = Date.now();
    let stored = null;
    try {
      stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      stored = null;
    }

    if (
      !stored ||
      !validId.test(stored.id || "") ||
      !Number.isFinite(stored.lastActive) ||
      now - stored.lastActive > SESSION_TIMEOUT_MS
    ) {
      stored = { id: createId(), lastActive: now, acquisition: currentAcquisition() };
    } else {
      stored.lastActive = now;
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    return stored;
  };

  const getVisitorId = () => {
    const existing = readCookie(VISITOR_COOKIE);
    if (validId.test(existing)) return existing;
    const visitorId = createId();
    writeCookie(VISITOR_COOKIE, visitorId, CONSENT_MAX_AGE);
    return visitorId;
  };

  const deviceType = () => {
    if (matchMedia("(max-width: 767px)").matches) return "mobile";
    if (matchMedia("(max-width: 1100px)").matches) return "tablet";
    return "desktop";
  };

  const sendEvent = (eventType, details = {}, preferBeacon = false) => {
    if (!trackingEnabled || getConsent() !== "granted") return;

    const session = getSession();
    const acquisition = session.acquisition || currentAcquisition();
    const payload = {
      event_id: createId(),
      visitor_id: getVisitorId(),
      session_id: session.id,
      event_type: eventType,
      path: location.pathname || "/",
      referrer_host: acquisition.referrer_host || null,
      source: acquisition.source || "direct",
      campaign: acquisition.campaign || null,
      campaign_source: acquisition.campaign_source || null,
      device_type: deviceType(),
      target: details.target || null,
      value: Number.isFinite(details.value) ? details.value : null,
    };
    const body = JSON.stringify(payload);

    if (preferBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {});
  };

  const clickTarget = (link) => {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("javascript:")) return "";
    if (href.startsWith("mailto:")) return "E-Mail";
    if (href.startsWith("tel:")) return "Telefon";

    try {
      const url = new URL(href, location.href);
      if (url.origin === location.origin) return `${url.pathname}${url.hash}`.slice(0, 512);
      return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`.slice(0, 512);
    } catch {
      return sanitizeText(href.split("?")[0], 512);
    }
  };

  const flushEngagement = (preferBeacon = false) => {
    if (!trackingEnabled) return;
    if (activeSince !== null) {
      pendingActiveMs += performance.now() - activeSince;
      activeSince = performance.now();
    }
    const activeSeconds = Math.floor(pendingActiveMs / 1000);
    if (activeSeconds < 1) return;
    pendingActiveMs -= activeSeconds * 1000;
    sendEvent("engagement", { value: Math.min(activeSeconds, 3600) }, preferBeacon);
  };

  const startTracking = () => {
    if (trackingEnabled || getConsent() !== "granted") return;
    trackingEnabled = true;
    getVisitorId();
    getSession();
    sendEvent("page_view");

    if (document.visibilityState === "visible") activeSince = performance.now();
    engagementTimer = window.setInterval(() => flushEngagement(), ENGAGEMENT_FLUSH_MS);

    if (!trackingStarted) {
      trackingStarted = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          flushEngagement(true);
          activeSince = null;
        } else if (trackingEnabled) {
          activeSince = performance.now();
        }
      });
      window.addEventListener("pagehide", () => flushEngagement(true));
      document.addEventListener("click", (event) => {
        const link = event.target.closest?.("a[href]");
        if (!link || link.closest("[data-no-analytics]")) return;
        const target = clickTarget(link);
        if (target) sendEvent("link_click", { target }, true);
      });
    }
  };

  const stopTracking = () => {
    trackingEnabled = false;
    activeSince = null;
    pendingActiveMs = 0;
    if (engagementTimer !== null) window.clearInterval(engagementTimer);
    engagementTimer = null;
    sessionStorage.removeItem(SESSION_KEY);
    deleteCookie(VISITOR_COOKIE);
  };

  const privacyUrl = location.hostname === "tickets.netzldatasolutions.at"
    ? "https://www.netzldatasolutions.at/datenschutz#webanalyse"
    : "/datenschutz#webanalyse";

  const ensureConsentDialog = () => {
    let dialog = document.querySelector("#nds-consent-dialog");
    if (dialog) return dialog;

    dialog = document.createElement("section");
    dialog.id = "nds-consent-dialog";
    dialog.className = "nds-consent-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-labelledby", "nds-consent-title");
    dialog.setAttribute("aria-describedby", "nds-consent-copy");
    dialog.setAttribute("data-no-analytics", "");
    dialog.hidden = true;
    dialog.innerHTML = `
      <div class="nds-consent-inner">
        <div class="nds-consent-copy">
          <p class="nds-consent-kicker">Optionale Website-Statistik</p>
          <h2 id="nds-consent-title">Helfen Sie uns, die Website zu verbessern?</h2>
          <p id="nds-consent-copy">Mit Ihrer Zustimmung erhalten wir eine datensparsame Nutzungsstatistik. Damit können wir Inhalte und Bedienung gezielt verbessern.</p>
          <p class="nds-consent-status" aria-live="polite"></p>
          <a href="${privacyUrl}">Mehr zum Datenschutz</a>
        </div>
        <div class="nds-consent-actions">
          <button class="nds-consent-choice" type="button" data-consent="denied">Ablehnen</button>
          <button class="nds-consent-choice" type="button" data-consent="granted">Zustimmen</button>
          <button class="nds-consent-close" type="button" data-consent-close>Schließen</button>
        </div>
      </div>`;
    document.body.append(dialog);

    dialog.querySelectorAll("[data-consent]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.dataset.consent;
        writeCookie(CONSENT_COOKIE, choice, CONSENT_MAX_AGE);
        if (choice === "granted") startTracking();
        else stopTracking();
        dialog.hidden = true;
        dialog.classList.remove("is-required");
      });
    });
    dialog.querySelector("[data-consent-close]").addEventListener("click", () => {
      dialog.hidden = true;
    });
    return dialog;
  };

  const showPreferences = (required = false) => {
    const dialog = ensureConsentDialog();
    const consent = getConsent();
    const status = dialog.querySelector(".nds-consent-status");
    status.textContent = consent === "granted"
      ? "Aktueller Status: Statistik ist erlaubt."
      : consent === "denied"
        ? "Aktueller Status: Statistik ist abgelehnt."
        : "";
    dialog.classList.toggle("is-required", required);
    dialog.hidden = false;
    dialog.querySelector("[data-consent='denied']").focus({ preventScroll: true });
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-analytics-settings]");
    if (!button) return;
    event.preventDefault();
    showPreferences(false);
  });

  window.netzlAnalytics = {
    showPreferences,
    trackFormSubmission: () => sendEvent("form_submit_success", { target: "Kontaktformular" }, true),
  };

  if (getConsent() === "granted") startTracking();
  else if (!getConsent()) showPreferences(true);
})();
