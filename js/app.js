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

  // ─── Testimonial carousel (circular, vanilla — no animation library) ──
  function initTestimonialCarousel() {
    const images = Array.from(document.querySelectorAll(".testimonial-image"));
    if (!images.length) return;

    const content  = document.querySelector(".testimonial-content");
    const quoteEl  = document.getElementById("testimonial-quote");
    const citeEl   = document.getElementById("testimonial-cite");
    const projectEl = document.getElementById("testimonial-project");
    const prevBtn  = document.getElementById("testimonial-prev");
    const nextBtn  = document.getElementById("testimonial-next");
    const total    = images.length;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let active = 0;
    let autoplayTimer = null;

    function applyText() {
      const data = images[active].dataset;
      quoteEl.textContent = data.quote;
      citeEl.textContent = data.cite;
      projectEl.textContent = data.project;
    }

    function render(immediate) {
      images.forEach(function (img, i) {
        img.classList.remove("is-active", "is-prev", "is-next");
        if (i === active) img.classList.add("is-active");
        else if (i === (active - 1 + total) % total) img.classList.add("is-prev");
        else if (i === (active + 1) % total) img.classList.add("is-next");
      });

      if (immediate || prefersReducedMotion) {
        applyText();
        return;
      }
      content.classList.add("is-fading");
      setTimeout(function () {
        applyText();
        content.classList.remove("is-fading");
      }, 220);
    }

    function goTo(index) {
      active = (index + total) % total;
      render();
    }
    function next() { goTo(active + 1); stopAutoplay(); }
    function prev() { goTo(active - 1); stopAutoplay(); }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      autoplayTimer = setInterval(function () { goTo(active + 1); }, 5000);
    }
    function stopAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
    }

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    // ─ Swipe (touch/pointer drag left-right, in addition to the arrows) ─
    const imagesWrap = document.getElementById("testimonial-images");
    if (imagesWrap) {
      let swiping = false;
      let swipeStartX = 0;
      imagesWrap.addEventListener("pointerdown", function (e) {
        swiping = true;
        swipeStartX = e.clientX;
        imagesWrap.setPointerCapture(e.pointerId);
      });
      imagesWrap.addEventListener("pointerup", function (e) {
        if (!swiping) return;
        swiping = false;
        const deltaX = e.clientX - swipeStartX;
        if (Math.abs(deltaX) > 40) {
          if (deltaX < 0) next(); else prev();
        }
      });
      imagesWrap.addEventListener("pointercancel", function () { swiping = false; });
    }

    render(true);
    startAutoplay();
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
    initTestimonialCarousel();
    initHeroVideo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

})();
