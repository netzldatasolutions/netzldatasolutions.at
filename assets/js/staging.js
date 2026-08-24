(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("#site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const closeNavigation = () => {
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Menü öffnen");
  };

  navToggle?.addEventListener("click", () => {
    const willOpen = !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open", willOpen);
    navToggle.setAttribute("aria-expanded", String(willOpen));
    navToggle.setAttribute("aria-label", willOpen ? "Menü schließen" : "Menü öffnen");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeNavigation();
  });

  const revealItems = document.querySelectorAll(".reveal");

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -45px"
    });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const sequences = [...document.querySelectorAll("[data-scroll-sequence]")];

  const setSequenceState = (section, position, progress) => {
    const slides = [...section.querySelectorAll("[data-sequence-slide]")];
    const current = section.querySelector("[data-sequence-current]");
    const counter = current?.closest(".sequence-counter");
    const safePosition = Math.min(Math.max(position, 0), slides.length - 1);
    const activeIndex = Math.round(safePosition);

    slides.forEach((slide, slideIndex) => {
      const distance = Math.abs(slideIndex - safePosition);
      const fadeStart = 0.3;
      const fadeEnd = 0.48;
      const fadeProgress = Math.min(Math.max((distance - fadeStart) / (fadeEnd - fadeStart), 0), 1);
      const easedFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
      const opacity = 1 - easedFade;
      const offset = (slideIndex - safePosition) * 24;
      const active = slideIndex === activeIndex;

      slide.style.setProperty("--slide-opacity", opacity.toFixed(3));
      slide.style.setProperty("--slide-offset", `${offset.toFixed(2)}px`);
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    if (current) current.textContent = String(activeIndex + 1).padStart(2, "0");
    if (counter) counter.setAttribute("aria-label", `Schritt ${activeIndex + 1} von ${slides.length}`);

    const heading = section.querySelector(".sequence-heading");
    const keepHeadingVisible = section.classList.contains("combined-story");
    const headingFade = Math.min(Math.max(progress / 0.16, 0), 1);
    const easedHeadingFade = headingFade * headingFade * (3 - 2 * headingFade);
    const headingVisibility = keepHeadingVisible ? 1 : 1 - easedHeadingFade;
    const headingShift = keepHeadingVisible ? 0 : -16 * easedHeadingFade;
    const headingSpace = heading ? (heading.offsetHeight + 26) * headingVisibility : 0;

    section.style.setProperty("--sequence-progress", String(progress));
    section.style.setProperty("--heading-opacity", headingVisibility.toFixed(3));
    section.style.setProperty("--heading-shift", `${headingShift.toFixed(2)}px`);
    section.style.setProperty("--heading-space", `${headingSpace.toFixed(2)}px`);
  };

  if (sequences.length && !reduceMotion) {
    let sequenceFrame = 0;

    const updateSequences = () => {
      if (sequenceFrame) return;

      sequenceFrame = window.requestAnimationFrame(() => {
        const stickyOffset = window.innerWidth <= 860 ? 72 : 80;

        sequences.forEach((section) => {
          const slides = [...section.querySelectorAll("[data-sequence-slide]")];
          if (!slides.length) return;

          const rect = section.getBoundingClientRect();
          const distance = Math.max(rect.height - window.innerHeight, 1);
          const rawProgress = Math.min(Math.max((stickyOffset - rect.top) / distance, 0), 1);
          const storyProgress = Math.min(Math.max((rawProgress - 0.06) / 0.76, 0), 1);
          const position = storyProgress * (slides.length - 1);
          setSequenceState(section, position, storyProgress);
        });

        sequenceFrame = 0;
      });
    };

    updateSequences();
    window.addEventListener("scroll", updateSequences, { passive: true });
    window.addEventListener("resize", updateSequences);
  } else {
    sequences.forEach((section) => {
      section.querySelectorAll("[data-sequence-slide]").forEach((slide) => {
        slide.classList.add("is-active");
        slide.setAttribute("aria-hidden", "false");
        slide.style.removeProperty("--slide-opacity");
        slide.style.removeProperty("--slide-offset");
      });
    });
  }

  const dashboardCanvases = [...document.querySelectorAll(".dashboard-canvas")];

  const drawDashboard = (canvas) => {
    const width = Math.max(canvas.clientWidth, 240);
    const height = Math.max(canvas.clientHeight, 110);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const left = 12;
    const right = width - 10;
    const top = 10;
    const bottom = height - 18;
    const chartHeight = bottom - top;
    const chartWidth = right - left;
    const bars = [0.34, 0.52, 0.44, 0.68, 0.6, 0.78, 0.7, 0.9];
    const revenue = [0.28, 0.36, 0.33, 0.51, 0.55, 0.68, 0.73, 0.86];
    const orders = [0.2, 0.3, 0.26, 0.4, 0.37, 0.52, 0.62, 0.67];

    context.strokeStyle = "rgba(255, 255, 255, 0.09)";
    context.lineWidth = 1;
    for (let grid = 0; grid <= 4; grid += 1) {
      const y = top + (chartHeight / 4) * grid;
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(right, y);
      context.stroke();
    }

    const slot = chartWidth / bars.length;
    const barWidth = Math.max(slot * 0.42, 5);
    bars.forEach((value, index) => {
      const barHeight = chartHeight * value;
      const x = left + slot * index + (slot - barWidth) / 2;
      context.fillStyle = index === bars.length - 1 ? "rgba(167, 223, 97, 0.24)" : "rgba(150, 175, 165, 0.15)";
      context.fillRect(x, bottom - barHeight, barWidth, barHeight);
    });

    const drawLine = (values, color) => {
      context.beginPath();
      values.forEach((value, index) => {
        const x = left + slot * index + slot / 2;
        const y = bottom - chartHeight * value;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.strokeStyle = color;
      context.lineWidth = 2.4;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();

      values.forEach((value, index) => {
        const x = left + slot * index + slot / 2;
        const y = bottom - chartHeight * value;
        context.beginPath();
        context.arc(x, y, index === values.length - 1 ? 3.4 : 2, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
      });
    };

    drawLine(revenue, "#a7df61");
    drawLine(orders, "#f2c66d");
  };

  dashboardCanvases.forEach(drawDashboard);

  if ("ResizeObserver" in window) {
    const dashboardObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => drawDashboard(entry.target));
    });
    dashboardCanvases.forEach((canvas) => dashboardObserver.observe(canvas));
  } else {
    window.addEventListener("resize", () => dashboardCanvases.forEach(drawDashboard));
  }

  const rangeInputs = [...document.querySelectorAll('.effort-calculator input[type="range"]')];
  const people = document.querySelector("#people");
  const frequency = document.querySelector("#frequency");
  const minutes = document.querySelector("#minutes");
  const annualHours = document.querySelector("#annual-hours");
  const numberFormat = new Intl.NumberFormat("de-AT");

  const updateCalculator = () => {
    rangeInputs.forEach((input) => {
      const min = Number(input.min);
      const max = Number(input.max);
      const value = Number(input.value);
      const progress = ((value - min) / (max - min)) * 100;
      input.style.setProperty("--range-progress", `${progress}%`);

      const output = document.querySelector(`#${input.id}-output`);
      if (output) output.textContent = numberFormat.format(value);
    });

    if (!people || !frequency || !minutes || !annualHours) return;
    const hours = Math.round((Number(people.value) * Number(frequency.value) * Number(minutes.value) * 12) / 60);
    annualHours.textContent = numberFormat.format(hours);
  };

  rangeInputs.forEach((input) => input.addEventListener("input", updateCalculator));
  updateCalculator();

  const contactForm = document.querySelector("#contact-form");
  const contactStatus = document.querySelector("#contact-form-status");

  if (contactForm && contactStatus) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton?.querySelector(".button-label");
    const defaultSubmitLabel = submitLabel?.textContent || "Anfrage senden";
    let formStartedAt = Date.now();

    const showContactStatus = (message, type) => {
      contactStatus.textContent = message;
      contactStatus.classList.remove("is-success", "is-error");
      contactStatus.classList.add(`is-${type}`);
      contactStatus.hidden = false;
    };

    const setContactLoading = (loading) => {
      if (!submitButton) return;
      submitButton.disabled = loading;
      submitButton.classList.toggle("is-loading", loading);
      submitButton.setAttribute("aria-busy", String(loading));
      if (submitLabel) submitLabel.textContent = loading ? "Wird gesendet …" : defaultSubmitLabel;
    };

    contactForm.addEventListener("input", () => {
      if (!contactStatus.classList.contains("is-error")) return;
      contactStatus.hidden = true;
      contactStatus.textContent = "";
      contactStatus.classList.remove("is-error");
    });

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      setContactLoading(true);
      contactStatus.hidden = true;
      contactStatus.textContent = "";
      contactStatus.classList.remove("is-success", "is-error");

      try {
        const formData = new FormData(contactForm);
        const submission = {
          name: String(formData.get("name") || ""),
          company: String(formData.get("company") || ""),
          email: String(formData.get("email") || ""),
          message: String(formData.get("message") || ""),
          website: String(formData.get("_gotcha") || ""),
          privacyConsent: formData.get("privacy-consent") === "on",
          startedAt: formStartedAt
        };

        const response = await fetch(contactForm.action, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(submission)
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const error = new Error(payload.message || "Die Anfrage konnte nicht versendet werden.");
          error.statusCode = response.status;
          throw error;
        }

        contactForm.reset();
        formStartedAt = Date.now();
        window.netzlAnalytics?.trackFormSubmission();
        showContactStatus("Danke! Ihre Anfrage wurde gesendet. Wir melden uns persönlich bei Ihnen.", "success");
      } catch (error) {
        const message =
          error?.statusCode === 429
            ? "Bitte warten Sie kurz, bevor Sie eine weitere Anfrage senden."
            : error?.statusCode
              ? error.message
              : "Das hat leider nicht funktioniert. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt per E-Mail.";
        showContactStatus(message, "error");
      } finally {
        setContactLoading(false);
      }
    });
  }

  const fundingChatHosts = new Set([
    "staging.netzldatasolutions.at",
    "netzldatasolutions.at",
    "www.netzldatasolutions.at"
  ]);
  const shouldShowFundingChat = fundingChatHosts.has(window.location.hostname);

  if (shouldShowFundingChat) {
    const fundingStorageKey = "nds_funding_chat_history";
    const maxFundingHistory = 8;

    const readFundingHistory = () => {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(fundingStorageKey) || "[]");
        return Array.isArray(parsed) ? parsed.slice(-maxFundingHistory) : [];
      } catch {
        return [];
      }
    };

    const writeFundingHistory = (history) => {
      try {
        window.localStorage.setItem(fundingStorageKey, JSON.stringify(history.slice(-maxFundingHistory)));
      } catch {
        // Browser storage can be unavailable in private modes. The chat still works without history.
      }
    };

    const escapeChatHtml = (value) => String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

    const markdownEscapePattern = /\\([\\`*_{}\[\]()#+\-.!>])/gu;

    const sanitizeFundingUrl = (value) => {
      try {
        const parsed = new URL(String(value || "").trim());
        if (!["http:", "https:"].includes(parsed.protocol)) return "";
        return parsed.toString();
      } catch {
        return "";
      }
    };

    const formatFundingInlineText = (value) => {
      const placeholders = [];
      const addPlaceholder = (html) => {
        const token = `__NDS_LINK_${placeholders.length}__`;
        placeholders.push(html);
        return token;
      };

      let text = String(value || "")
        .replace(markdownEscapePattern, "$1")
        .replace(/\[([^\]]+)\]\(\[?(https?:\/\/[^\]\s)]+)\]?\((https?:\/\/[^)\s]+)\)\)/gu, "[$1]($3)")
        .replace(/\[([^\]]+)\]\(\[?(https?:\/\/[^\]\s)]+)\]?\)/gu, "[$1]($2)");

      text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gu, (_match, label, url) => {
        const href = sanitizeFundingUrl(url);
        if (!href) return label;
        return addPlaceholder(`<a href="${escapeChatHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeChatHtml(label)}</a>`);
      });

      text = escapeChatHtml(text)
        .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
        .replace(/https?:\/\/[^\s<>()]+/gu, (url) => {
          const href = sanitizeFundingUrl(url.replace(/[),.;:]+$/u, ""));
          if (!href) return url;
          return `<a href="${escapeChatHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeChatHtml(href)}</a>`;
        });

      return text.replace(/__NDS_LINK_(\d+)__/gu, (_match, index) => placeholders[Number(index)] || "");
    };
    const formatFundingAnswerText = (value) => {
      const lines = String(value || "")
        .replace(/\r\n?/gu, "\n")
        .split("\n")
        .map((line) => line.trim());
      const blocks = [];
      let paragraph = [];
      let list = [];
      let listType = "ul";

      const flushParagraph = () => {
        if (!paragraph.length) return;
        blocks.push(`<p>${formatFundingInlineText(paragraph.join(" "))}</p>`);
        paragraph = [];
      };

      const flushList = () => {
        if (!list.length) return;
        blocks.push(`<${listType}>${list.map((item) => `<li>${formatFundingInlineText(item)}</li>`).join("")}</${listType}>`);
        list = [];
      };

      for (const line of lines) {
        if (!line) {
          flushParagraph();
          flushList();
          continue;
        }

        const bullet = line.match(/^(?:[-*•])\s+(.+)$/u);
        const numbered = line.match(/^\d+[.)]\s+(.+)$/u);
        const heading = line.match(/^#{2,4}\s+(.+)$/u)
          || line.match(/^\*\*(.+?)\*\*:?\s*$/u)
          || line.match(/^(Kurzzusammenfassung|Möglichkeiten|Einschränkungen|Was Netzl Data Solutions für Sie tun kann|Quellen):?$/u);
        if (heading) {
          flushParagraph();
          flushList();
          blocks.push(`<h4>${formatFundingInlineText(heading[1])}</h4>`);
          continue;
        }

        if (bullet || numbered) {
          flushParagraph();
          const nextType = numbered ? "ol" : "ul";
          if (list.length && listType !== nextType) flushList();
          listType = nextType;
          list.push((bullet || numbered)[1]);
          continue;
        }

        flushList();
        paragraph.push(line);
      }

      flushParagraph();
      flushList();
      return blocks.join("") || "<p>Ich konnte dazu gerade keine verwertbare Antwort erzeugen.</p>";
    };

    const renderFundingList = (title, items) => {
      if (!Array.isArray(items) || !items.length) return "";
      return `<h4>${escapeChatHtml(title)}</h4><ul>${items
        .map((item) => `<li>${formatFundingInlineText(item)}</li>`)
        .join("")}</ul>`;
    };

    const renderFundingMatches = (matches) => {
      if (!Array.isArray(matches) || !matches.length) return "";
      return `<h4>Passende Förderungen</h4><ol class="funding-chat-matches">${matches
        .map((match) => {
          const source = match.source_url
            ? `<a href="${escapeChatHtml(match.source_url)}" target="_blank" rel="noopener noreferrer">Quelle öffnen</a>`
            : "";
          return `<li><strong>${escapeChatHtml(match.program_name || "Förderung")}</strong><span>${escapeChatHtml(match.fit || "prüfen")}</span><p>${escapeChatHtml(match.reason || "")}</p>${match.risks ? `<small>Risiko: ${escapeChatHtml(match.risks)}</small>` : ""}${source}</li>`;
        })
        .join("")}</ol>`;
    };

    const renderFundingSources = (sources) => {
      if (!Array.isArray(sources) || !sources.length) return "";
      return `<div class="funding-chat-sources"><span>Quellen</span>${sources
        .slice(0, 6)
        .map((source) => `<a href="${escapeChatHtml(source.url || "#")}" target="_blank" rel="noopener noreferrer">${escapeChatHtml(source.title || source.url || "Quelle")}</a>`)
        .join("")}</div>`;
    };

    const fundingChecklistItems = [
      "Bundesland oder Betriebsstätte",
      "Unternehmensgröße, zum Beispiel EPU, KMU, Startup oder Mitarbeiterzahl",
      "Branche",
      "Vorhaben und Ziel",
      "Projektvolumen oder Budget",
      "Startzeitpunkt und ob schon begonnen wurde"
    ];

    const normalizeFundingText = (value) => String(value || "")
      .normalize("NFKC")
      .toLowerCase();

    const hasLabeledFundingValue = (text, labels) => labels.some((label) =>
      new RegExp(`${label}\\s*[:=-][ \\t]*[^\\n,;]{2,}`, "u").test(text)
    );

    const containsFundingTerm = (text, terms) => terms.some((term) => text.includes(term));

    const fundingFactChecks = [
      {
        question: "In welchem Bundesland liegt Ihr Unternehmenssitz oder die Betriebsstätte?",
        test: (text) => containsFundingTerm(text, [
          "burgenland", "kärnten", "kaernten", "niederösterreich", "niederoesterreich", "nö", "noe",
          "oberösterreich", "oberoesterreich", "oö", "ooe", "salzburg", "steiermark", "tirol",
          "vorarlberg", "wien", "österreichweit", "oesterreichweit"
        ]) || hasLabeledFundingValue(text, ["bundesland", "betriebsstätte", "betriebsstaette", "standort", "sitz"])
      },
      {
        question: "Wie groß ist das Unternehmen, zum Beispiel EPU, KMU, Startup oder Mitarbeiterzahl?",
        test: (text) => /(?:^|[^a-zäöüß])(?:epu|kmu|startup|verein|vereinigung|kleinstunternehmen|kleinunternehmen|mittelunternehmen|großunternehmen|grossunternehmen)(?:[^a-zäöüß]|$)/u.test(text)
          || /\d+\s*(?:ma|mitarbeiter|mitarbeiterinnen|beschäftigte|beschaeftigte|fte)/u.test(text)
          || /\d+\s*(?:mitglieder|mitgliedern|vereinsmitglieder)/u.test(text)
          || /verein\s+mit\s+(?:rund|ca\.?|circa|etwa)?\s*\d+/u.test(text)
          || hasLabeledFundingValue(text, ["größe", "groesse", "unternehmensgröße", "unternehmensgroesse", "mitarbeiter", "team", "mitglieder"])
      },
      {
        question: "In welcher Branche arbeiten Sie?",
        test: (text) => containsFundingTerm(text, [
          "handel", "gastronomie", "tourismus", "hotel", "produktion", "industrie", "handwerk",
          "bau", "dienstleistung", "beratung", "agentur", "software", "edv", "gesundheit", "ordination",
          "kultur", "verein", "landwirtschaft", "logistik", "energie", "immobilien", "bäckerei", "baeckerei"
        ]) || hasLabeledFundingValue(text, ["branche", "geschäftsfeld", "geschaeftsfeld"])
      },
      {
        question: "Was soll konkret umgesetzt werden und welches Ziel hat das Projekt?",
        test: (text) => containsFundingTerm(text, [
          "digital", "ki", "automatis", "dashboard", "software", "daten",
          "crm", "erp", "shop", "website", "prozess", "investition", "maschine", "weiterbildung",
          "energie", "monitoring", "report"
        ]) || hasLabeledFundingValue(text, ["vorhaben", "ziel", "projekt"])
      },
      {
        question: "Wie hoch ist das geschätzte Projektvolumen oder Budget?",
        test: (text) => /(?:budget|projektvolumen|volumen|kostenrahmen|kosten|investition)\s*[:=-][ 	]*(?:ca\.?\s*)?(?:\d|offen|unklar|noch nicht bekannt)/u.test(text)
          || /(?:budget|projektvolumen|volumen|kostenrahmen|kosten|investition)\D{0,24}\d{3,}/u.test(text)
          || /\d{3,}\D{0,24}(?:budget|projektvolumen|volumen|kostenrahmen|kosten|investition)/u.test(text)
          || /\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?\s*(?:€|eur|euro)/u.test(text)
          || /\d+\s*(?:k|tsd\.?|tausend)\s*(?:€|eur|euro)?/u.test(text)
      },
      {
        question: "Wann soll das Projekt starten und wurde bereits begonnen oder beauftragt?",
        test: (text) => /(?:start|beginn|projektstart|umsetzung|status)\s*[:=-][ \t]*[^,\n;]{3,}/u.test(text)
          || containsFundingTerm(text, [
            "noch nicht begonnen", "nicht begonnen", "bereits begonnen", "schon begonnen", "beauftragt",
            "angebot liegt vor", "geplant", "läuft", "laeuft", "quartal", "jänner", "jaenner", "februar",
            "märz", "maerz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"
          ])
          || /(?:20\d{2}|q[1-4]|\d+\s*(?:wochen|monate|monat))/u.test(text)
      }
    ];

    const getMissingFundingFacts = (message, history = []) => {
      const userHistory = history
        .filter((entry) => entry?.role === "user")
        .map((entry) => entry.content);
      const text = normalizeFundingText([...userHistory, message].join("\n"));
      return fundingFactChecks.filter((fact) => !fact.test(text));
    };

    const renderFundingChecklist = () => `<ul class="funding-chat-checklist">${fundingChecklistItems
      .map((item) => `<li>${escapeChatHtml(item)}</li>`)
      .join("")}</ul>`;

    const renderFundingMissingInfo = (missingFacts) => [
      "<strong>Fördercheck</strong>",
      "<p>Für eine gezielte Suche fehlen noch ein paar Eckdaten. Bitte ergänzen Sie kurz:</p>",
      renderFundingList("Bitte ergänzen", missingFacts.map((fact) => fact.question)),
      "<small>Danach starte ich die Suche in den österreichischen Förderquellen.</small>"
    ].join("");

    const widget = document.createElement("aside");
    widget.className = "funding-chat-widget";
    widget.setAttribute("aria-label", "KI-Fördercheck für Österreich");
    widget.innerHTML = `
      <button class="funding-chat-toggle" type="button" aria-expanded="false" aria-controls="funding-chat-panel">
        <span>KI-Fördercheck</span>
        <small>Österreich</small>
      </button>
      <section class="funding-chat-panel" id="funding-chat-panel" hidden>
        <header class="funding-chat-header">
          <div>
            <strong>Förderungen prüfen</strong>
            <span>Erst Eckdaten, dann aktuelle Quellen</span>
          </div>
          <button type="button" aria-label="Fördercheck schließen" data-funding-close>×</button>
        </header>
        <div class="funding-chat-feed" data-funding-feed aria-live="polite">
          <article class="funding-chat-message assistant">
            <strong>Fördercheck</strong>
            <p>Bitte nennen Sie möglichst gleich diese Eckdaten. Dann wird die Suche gezielter und die Antwort bleibt kurz.</p>
            ${renderFundingChecklist()}
            <small>Keine verbindliche Förderzusage. Bitte keine sensiblen Daten eingeben.</small>
          </article>
        </div>
        <form class="funding-chat-form" data-funding-form>
          <label for="funding-chat-input">Ihre Eckdaten und Förderfrage</label>
          <textarea id="funding-chat-input" name="message" rows="2" required placeholder="Kurz: Bundesland, Größe, Branche, Vorhaben, Budget, Start"></textarea>
          <button class="button button-lime" type="submit"><span>Förderungen prüfen</span></button>
          <p class="funding-chat-status" data-funding-status role="status" aria-live="polite" hidden></p>
        </form>
      </section>
    `;
    document.body.append(widget);

    const toggle = widget.querySelector(".funding-chat-toggle");
    const panel = widget.querySelector(".funding-chat-panel");
    const closeButton = widget.querySelector("[data-funding-close]");
    const form = widget.querySelector("[data-funding-form]");
    const input = widget.querySelector("#funding-chat-input");
    const feed = widget.querySelector("[data-funding-feed]");
    const status = widget.querySelector("[data-funding-status]");

    const shouldAutoFocusFundingInput = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const setFundingOpen = (open) => {
      panel.hidden = !open;
      widget.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    const scrollFundingFeedToBottom = () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.requestAnimationFrame(() => {
        feed.scrollTo({
          top: feed.scrollHeight,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      });
    };

    const addFundingMessage = (role, html) => {
      const message = document.createElement("article");
      message.className = `funding-chat-message ${role}`;
      message.innerHTML = html;
      feed.append(message);
      scrollFundingFeedToBottom();
      return message;
    };

    const setFundingLoading = (loading) => {
      const button = form.querySelector('button[type="submit"]');
      const buttonLabel = button?.querySelector("span");
      widget.classList.toggle("is-loading", loading);
      if (!button) return;
      button.disabled = loading;
      button.setAttribute("aria-busy", String(loading));
      if (buttonLabel) buttonLabel.textContent = loading ? "Prüfung läuft ..." : "Förderungen prüfen";
      if (status) {
        status.hidden = !loading;
        status.textContent = loading ? "Ich prüfe aktuelle Förderinformationen ..." : "";
      }
    };

    toggle.addEventListener("click", () => setFundingOpen(panel.hidden));
    closeButton.addEventListener("click", () => setFundingOpen(false));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const message = input.value.trim();
      const history = readFundingHistory();
      const missingFacts = getMissingFundingFacts(message, history);
      widget.classList.add("has-started");
      addFundingMessage("user", `<strong>Sie</strong><p>${escapeChatHtml(message)}</p>`);
      input.value = "";
      input.rows = 2;

      if (missingFacts.length) {
        addFundingMessage("assistant", renderFundingMissingInfo(missingFacts));
        input.placeholder = "Fehlende Punkte kurz ergänzen.";
        if (shouldAutoFocusFundingInput()) input.focus();
        writeFundingHistory([
          ...history,
          { role: "user", content: message },
          {
            role: "assistant",
            content: `Bitte ergänzen: ${missingFacts.map((fact) => fact.question).join(" ")}`
          }
        ]);
        return;
      }

      setFundingLoading(true);
      const pending = addFundingMessage("assistant pending", "<strong>Fördercheck</strong><p>Ich recherchiere gerade in österreichischen Förderquellen.</p>");

      try {
        const response = await fetch("/api/funding-chat/message", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message,
            history,
            page: window.location.href,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload.ok === false) {
          const message404 = "Der Fördercheck-Endpunkt ist noch nicht aktiviert.";
          throw new Error(
            response.status === 404
              ? message404
              : payload.message || "Der Fördercheck konnte gerade nicht antworten."
          );
        }

        pending.remove();
        const answerText = String(payload.answer || "");
        const answerHasSources = /(?:^|\n)\s*(?:#{2,4}\s*)?Quellen:?/iu.test(answerText);
        const answerHtml = [
          "<strong>Fördercheck</strong>",
          formatFundingAnswerText(answerText),
          payload.needsMoreInfo ? "" : renderFundingMatches(payload.matches),
          payload.needsMoreInfo ? "" : renderFundingList("Nächste Schritte", payload.recommended_actions),
          renderFundingList(payload.needsMoreInfo ? "Bitte ergänzen" : "Rückfragen", payload.follow_up_questions),
          payload.needsMoreInfo ? "<small>Danach starte ich die Suche in den österreichischen Förderquellen.</small>" : "",
          payload.needsMoreInfo || answerHasSources ? "" : renderFundingSources(payload.sources)
        ].join("");
        addFundingMessage("assistant", answerHtml);
        scrollFundingFeedToBottom();
        writeFundingHistory([
          ...history,
          { role: "user", content: message },
          { role: "assistant", content: String(payload.answer || "") }
        ]);
      } catch (error) {
        pending.remove();
        addFundingMessage(
          "assistant",
          `<strong>Fördercheck</strong><p>${escapeChatHtml(error.message)}</p>`
        );
        scrollFundingFeedToBottom();
      } finally {
        setFundingLoading(false);
      }
    });
  }

  const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      sectionLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    }, {
      threshold: [0.2, 0.45],
      rootMargin: "-20% 0px -60%"
    });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
