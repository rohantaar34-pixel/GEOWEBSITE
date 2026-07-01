/* ─────────────────────────────────────────────
   GEOCORP — script.js
   - Sticky header scroll behavior
   - Mobile nav toggle
   - Canvas GIS animation
   - Scroll reveal
   ───────────────────────────────────────────── */

(function () {
  "use strict";

  /* ── SCROLL HEADER ───────────────────────── */
  const header = document.querySelector("[data-header]");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── MOBILE NAV ─────────────────────────── */
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav    = document.querySelector("[data-nav]");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", false);
      }
    });

    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", false);
      })
    );
  }

  /* ── SCROLL REVEAL ──────────────────────── */
  const revealEls = document.querySelectorAll(
    ".metric-item, .service-card, .project-item, .value-card, .award-item, .tag-cloud span, .mission-half"
  );

  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  /* ── LEAFLET MAP INITIALIZATION ───────────────── */
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  // Initialize Leaflet Map centered on Philippines
  const map = L.map("map", {
    center: [12.8797, 121.7740],
    zoom: 6,
    zoomControl: false, // We'll reposition it
    attributionControl: false
  });

  // Add repositioned controls
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.attribution({ position: 'bottomright' }).addTo(map);

  // CartoDB Dark Matter Base Map
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // GIS Data Points
  const locations = [
    { lat: 14.5995, lng: 120.9842, label: "Metro Manila", active: true },
    { lat: 14.3142, lng: 121.1114, label: "Santa Rosa",   active: true },
    { lat: 13.7565, lng: 121.0583, label: "Batangas",     active: true },
    { lat: 14.2750, lng: 121.4111, label: "Laguna",       active: false },
    { lat: 14.2456, lng: 120.9366, label: "Cavite",       active: false },
    { lat: 14.2415, lng: 121.5038, label: "Cavinti",      active: true },
    { lat: 10.8716, lng: 124.8193, label: "Leyte",        active: false },
    { lat: 7.1907,  lng: 125.4553, label: "Davao",        active: false },
    { lat: 17.6133, lng: 121.7270, label: "Cagayan",      active: false },
    { lat: 10.3157, lng: 123.8854, label: "Cebu",         active: true },
    { lat: 17.1472, lng: 121.8906, label: "Ilagan",       active: true },
  ];

  locations.forEach(loc => {
    // Custom DivIcon for glowing dots
    const activeClass = loc.active ? "active" : "inactive";
    const labelHTML = loc.active ? `<div class="gis-marker-label">${loc.label}</div>` : '';
    
    const icon = L.divIcon({
      className: `gis-marker ${activeClass}`,
      html: labelHTML,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([loc.lat, loc.lng], { icon: icon }).addTo(map);
  });
})();

