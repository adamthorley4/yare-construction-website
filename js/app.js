/* ═══════════════════════════════════════════════════════════════════
   YARE CONSTRUCTION — app.js
   Vanilla JS only: no scroll-jacking, no heavy per-frame canvas work —
   keeps things light and smooth on mobile.
═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const navToggle   = document.getElementById("nav-toggle");
  const siteNav     = document.querySelector(".site-nav");
  const navBackdrop = document.getElementById("nav-backdrop");
  const quoteForm   = document.getElementById("quote-form");
  const formSuccess = document.getElementById("form-success");

  function openNav() {
    siteNav.classList.add("nav-open");
    navToggle.classList.add("open");
    navBackdrop.classList.add("show");
  }
  function closeNav() {
    siteNav.classList.remove("nav-open");
    navToggle.classList.remove("open");
    navBackdrop.classList.remove("show");
  }

  function initNavToggle() {
    navToggle.addEventListener("click", function () {
      if (siteNav.classList.contains("nav-open")) closeNav(); else openNav();
    });
    navBackdrop.addEventListener("click", closeNav);
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
  }

  function initQuoteForm() {
    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      quoteForm.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = true; });
      formSuccess.hidden = false;
    });
  }

  // ─── Reveal-on-scroll (lightweight, one-shot) ─────────────────────
  function initRevealItems() {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("revealed"); observer.unobserve(e.target); }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal-item").forEach(function (el) { observer.observe(el); });
  }

  // ─── Stat counters (vanilla count-up, no animation library) ───────
  function initCounters() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function animateCount(el) {
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const target = parseFloat(el.textContent);
      if (prefersReducedMotion || isNaN(target)) return;

      const duration = 1400;
      const start = performance.now();

      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); observer.unobserve(e.target); }
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll(".stat-number").forEach(function (el) { observer.observe(el); });
  }

  // ─── Pause hero video for reduced-motion users ────────────────────
  function initHeroVideo() {
    const video = document.querySelector(".hero-video");
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      video.removeAttribute("autoplay");
    }
  }

  function bootstrap() {
    initNavToggle();
    initQuoteForm();
    initRevealItems();
    initCounters();
    initHeroVideo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

})();
