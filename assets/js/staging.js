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
    const headingFade = Math.min(Math.max(progress / 0.16, 0), 1);
    const easedHeadingFade = headingFade * headingFade * (3 - 2 * headingFade);
    const headingVisibility = 1 - easedHeadingFade;
    const headingSpace = heading ? (heading.offsetHeight + 26) * headingVisibility : 0;

    section.style.setProperty("--sequence-progress", String(progress));
    section.style.setProperty("--heading-opacity", headingVisibility.toFixed(3));
    section.style.setProperty("--heading-shift", `${(-16 * easedHeadingFade).toFixed(2)}px`);
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
