/* ═══════════════════════════════════════════════════════════════════
   YARE CONSTRUCTION — app.js
   Lenis smooth scroll + GSAP ScrollTrigger + Canvas frame scrubbing
═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ─── Config ──────────────────────────────────────────────────────
  const FRAME_DIR   = "frames/";
  const FRAME_EXT   = ".jpg";
  const FRAME_COUNT = 121;
  const FRAME_SPEED = 1; // last frame lands at the end of the scroll-container trigger range

  const MARQUEE_ENTER = 0.08;
  const MARQUEE_LEAVE = 0.92;
  const HERO_FADE_END = 0.08;

  // ─── DOM refs ────────────────────────────────────────────────────
  const loader          = document.getElementById("loader");
  const loaderBar       = document.getElementById("loader-bar");
  const loaderPercent   = document.getElementById("loader-percent");
  const heroOverlay     = document.getElementById("hero-overlay");
  const canvas          = document.getElementById("canvas");
  const ctx              = canvas.getContext("2d");
  const scrollContainer = document.getElementById("scroll-container");
  const marqueeWrap     = document.getElementById("marquee-materials");
  const marqueeText     = marqueeWrap.querySelector(".marquee-text");
  const navToggle       = document.getElementById("nav-toggle");
  const siteNav         = document.querySelector(".site-nav");
  const quoteForm       = document.getElementById("quote-form");
  const formSuccess     = document.getElementById("form-success");

  // ─── State ───────────────────────────────────────────────────────
  let frames       = new Array(FRAME_COUNT).fill(null);
  let currentFrame = 0;
  let bgColor      = "#15130f";

  // ─── Utilities ───────────────────────────────────────────────────
  function pad(n, len) { return String(n).padStart(len, "0"); }
  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  // ─── Canvas resize ───────────────────────────────────────────────
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    if (frames[currentFrame]) drawFrame(currentFrame);
  }
  window.addEventListener("resize", resizeCanvas);

  function sampleBgColor(img) {
    const oc = document.createElement("canvas");
    oc.width = oc.height = 4;
    oc.getContext("2d").drawImage(img, 0, 0, 4, 4);
    const d = oc.getContext("2d").getImageData(0, 0, 1, 1).data;
    bgColor = "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
  }

  function drawFrame(index) {
    const img = frames[index];
    if (!img) return;
    const cw = window.innerWidth, ch = window.innerHeight;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ─── Frame loader ────────────────────────────────────────────────
  function loadFrames(onProgress, onComplete) {
    let loaded = 0;
    const phase1 = Math.min(12, FRAME_COUNT);

    function markLoaded(idx, img) {
      frames[idx] = img;
      loaded++;
      onProgress(loaded / FRAME_COUNT);
      if (loaded === FRAME_COUNT) onComplete();
    }

    for (let i = 0; i < phase1; i++) {
      (function (idx) {
        const img = new Image();
        img.onload = function () {
          if (idx === 0) { sampleBgColor(img); drawFrame(0); }
          markLoaded(idx, img);
        };
        img.onerror = function () { markLoaded(idx, null); };
        img.src = FRAME_DIR + "frame_" + pad(idx + 1, 4) + FRAME_EXT;
      })(i);
    }

    setTimeout(function () {
      for (let i = phase1; i < FRAME_COUNT; i++) {
        (function (idx) {
          const img = new Image();
          img.onload = function () {
            if (idx % 20 === 0) sampleBgColor(img);
            markLoaded(idx, img);
          };
          img.onerror = function () { markLoaded(idx, null); };
          img.src = FRAME_DIR + "frame_" + pad(idx + 1, 4) + FRAME_EXT;
        })(i);
      }
    }, 100);
  }

  // ─── Hero entrance animation ──────────────────────────────────────
  function animateHero() {
    const label     = heroOverlay.querySelector(".hero-label");
    const words     = heroOverlay.querySelectorAll(".hero-word");
    const tagline   = heroOverlay.querySelector(".hero-tagline");
    const indicator = heroOverlay.querySelector(".hero-scroll-indicator");

    gsap.timeline({ delay: 0.3 })
      .to(label,     { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(words,     { opacity: 1, y: 0, duration: 1.1, stagger: 0.18, ease: "power4.out" }, "-=0.4")
      .to(tagline,   { opacity: 1, duration: 0.9, ease: "power2.out" }, "-=0.5")
      .to(indicator, { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.3");
  }

  // ─── Lenis smooth scroll ──────────────────────────────────────────
  function initLenis() {
    const lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const id = anchor.getAttribute("href");
        const target = id === "#" || id === "#top" ? document.documentElement : document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.4 });
        if (siteNav.classList.contains("nav-open")) closeNav();
      });
    });
  }

  function initHeroOverlayFade() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        const p = self.progress;
        const opacity = clamp(1 - p / HERO_FADE_END, 0, 1);
        heroOverlay.style.opacity = opacity;
        heroOverlay.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
      }
    });
  }

  function initFrameScrubbing() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(function () { drawFrame(currentFrame); });
        }
      }
    });
  }

  function initMarquee() {
    gsap.to(marqueeText, {
      xPercent: -25,
      ease: "none",
      scrollTrigger: {
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: function (self) {
        const p = self.progress;
        const fd = 0.04;
        let o = 0;
        if (p >= MARQUEE_ENTER && p <= MARQUEE_ENTER + fd) o = (p - MARQUEE_ENTER) / fd;
        else if (p > MARQUEE_ENTER + fd && p < MARQUEE_LEAVE - fd) o = 1;
        else if (p >= MARQUEE_LEAVE - fd && p <= MARQUEE_LEAVE) o = 1 - (p - (MARQUEE_LEAVE - fd)) / fd;
        marqueeWrap.style.opacity = clamp(o, 0, 1).toString();
      }
    });
  }

  function initCounters() {
    document.querySelectorAll(".stat-number").forEach(function (el) {
      const decimals = parseInt(el.dataset.decimals || "0");
      const trigger = el.closest(".stats-static") || el;
      const finalValue = parseFloat(el.textContent);
      gsap.from(el, {
        textContent: 0,
        duration: 2.2,
        ease: "power1.out",
        snap: { textContent: decimals === 0 ? 1 : Math.pow(10, -decimals) },
        scrollTrigger: {
          trigger: trigger,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        onUpdate: function () {
          el.textContent = parseFloat(el.textContent).toFixed(decimals);
        },
        onComplete: function () {
          el.textContent = finalValue.toFixed(decimals);
        }
      });
    });
  }

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

  function initNavToggle() {
    navToggle.addEventListener("click", function () {
      if (siteNav.classList.contains("nav-open")) closeNav(); else openNav();
    });
  }
  function openNav() { siteNav.classList.add("nav-open"); navToggle.classList.add("open"); }
  function closeNav() { siteNav.classList.remove("nav-open"); navToggle.classList.remove("open"); }

  function initQuoteForm() {
    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      quoteForm.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = true; });
      formSuccess.hidden = false;
    });
  }

  // ─── Bootstrap ───────────────────────────────────────────────────
  function bootstrap() {
    gsap.registerPlugin(ScrollTrigger);
    resizeCanvas();
    initNavToggle();
    initQuoteForm();

    loadFrames(
      function (ratio) {
        const pct = Math.round(ratio * 100);
        loaderBar.style.width = pct + "%";
        loaderPercent.textContent = pct + "%";
      },
      function () {
        loader.classList.add("hidden");
        requestAnimationFrame(function () { drawFrame(0); });
        animateHero();
        initLenis();
        initHeroOverlayFade();
        initFrameScrubbing();
        initMarquee();
        initCounters();
        initRevealItems();
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

})();
