document.documentElement.classList.add("js");

(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const header = document.querySelector("#site-header");
    const navToggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("#site-nav");

    const updateHeader = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    const closeNavigation = () => {
      document.body.classList.remove("nav-open");
      navToggle?.setAttribute("aria-expanded", "false");
      navToggle?.setAttribute("aria-label", "Menü öffnen");
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

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
        threshold: 0.1,
        rootMargin: "0px 0px -42px"
      });

      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    const tabs = [...document.querySelectorAll("[data-tour-tab]")];
    const panels = [...document.querySelectorAll("[data-tour-panel]")];
    const tourScroll = document.querySelector("[data-tour-scroll]");
    const tourSticky = tourScroll?.querySelector(".tour-sticky");
    const stackedTourQuery = window.matchMedia("(max-width: 860px)");
    let activeTourIndex = -1;
    let tourFrame = 0;

    const selectTourStep = (nextIndex, moveFocus = false) => {
      if (!tabs[nextIndex] || activeTourIndex === nextIndex) {
        if (moveFocus) tabs[nextIndex]?.focus();
        return;
      }

      activeTourIndex = nextIndex;

      tabs.forEach((tab, index) => {
        const active = index === nextIndex;
        tab.classList.toggle("is-active", active);
        if (active) tab.setAttribute("aria-current", "step");
        else tab.removeAttribute("aria-current");
      });

      panels.forEach((panel, index) => {
        panel.classList.toggle("is-active", index === nextIndex);
      });

      if (moveFocus) tabs[nextIndex].focus();
    };

    const scrollToTourStep = (index) => {
      const panel = panels[index];
      if (!panel || !tourScroll || !tourSticky) return;

      if (stackedTourQuery.matches || reduceMotion) {
        panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        return;
      }

      const scrollTop = window.scrollY + tourScroll.getBoundingClientRect().top;
      const stickyTop = Number.parseFloat(getComputedStyle(tourSticky).top) || 0;
      const travel = Math.max(0, tourScroll.offsetHeight - tourSticky.offsetHeight);
      const progress = tabs.length > 1 ? index / (tabs.length - 1) : 0;

      window.scrollTo({
        top: scrollTop - stickyTop + (travel * progress),
        behavior: "smooth"
      });
    };

    const updateTourFromScroll = () => {
      tourFrame = 0;
      if (!tourScroll || !tourSticky || !tabs.length || reduceMotion) return;

      if (stackedTourQuery.matches) {
        return;
      }

      const sectionRect = tourScroll.getBoundingClientRect();
      const stickyTop = Number.parseFloat(getComputedStyle(tourSticky).top) || 0;
      const travel = Math.max(1, sectionRect.height - tourSticky.offsetHeight);
      const progress = Math.min(1, Math.max(0, (stickyTop - sectionRect.top) / travel));
      const nextIndex = Math.min(tabs.length - 1, Math.floor(progress * tabs.length));
      selectTourStep(nextIndex);
    };

    const requestTourUpdate = () => {
      if (tourFrame) return;
      tourFrame = window.requestAnimationFrame(updateTourFromScroll);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        selectTourStep(index);
        scrollToTourStep(index);
      });

      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();

        let nextIndex = index;
        if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (index + 1) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        selectTourStep(nextIndex, true);
        scrollToTourStep(nextIndex);
      });
    });

    selectTourStep(0);
    window.addEventListener("scroll", requestTourUpdate, { passive: true });
    window.addEventListener("resize", requestTourUpdate);
    stackedTourQuery.addEventListener?.("change", requestTourUpdate);
    requestTourUpdate();

    const chartCanvases = [...document.querySelectorAll(".sales-chart .chart-line")];

    const drawSalesChart = (canvas) => {
      const chart = canvas.closest(".sales-chart");
      const bars = [...chart?.querySelectorAll(".chart-bars i") || []];
      const canvasRect = canvas.getBoundingClientRect();
      if (!chart || bars.length < 2 || canvasRect.width === 0 || canvasRect.height === 0) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvasRect.width * pixelRatio);
      canvas.height = Math.round(canvasRect.height * pixelRatio);

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const points = bars.map((bar) => {
        const barRect = bar.getBoundingClientRect();
        return {
          x: (barRect.left - canvasRect.left) + (barRect.width / 2),
          y: barRect.top - canvasRect.top
        };
      });

      const brandColor = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#70b646";
      const areaGradient = context.createLinearGradient(0, Math.min(...points.map((point) => point.y)), 0, canvasRect.height);
      areaGradient.addColorStop(0, "rgba(112, 182, 70, 0.15)");
      areaGradient.addColorStop(1, "rgba(112, 182, 70, 0)");

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.lineTo(points[points.length - 1].x, canvasRect.height);
      context.lineTo(points[0].x, canvasRect.height);
      context.closePath();
      context.fillStyle = areaGradient;
      context.fill();

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = brandColor;
      context.stroke();

      points.forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
        context.fillStyle = "#ffffff";
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = brandColor;
        context.stroke();
      });
    };

    const drawAllSalesCharts = () => chartCanvases.forEach(drawSalesChart);
    drawAllSalesCharts();

    if ("ResizeObserver" in window) {
      const chartObserver = new ResizeObserver(drawAllSalesCharts);
      chartCanvases.forEach((canvas) => chartObserver.observe(canvas));
    } else {
      window.addEventListener("resize", drawAllSalesCharts);
    }

    const currentYear = document.querySelector("#current-year");
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());
  });
})();
