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

  // Keep map navigation useful without trapping normal page scrolling.
  const map = L.map("map", {
    center: [12.8797, 121.7740],
    zoom: 6,
    minZoom: 5,
    maxZoom: 19,
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    zoomSnap: 0.5,
    maxBounds: [[4.25, 115.5], [21.5, 127.5]],
    maxBoundsViscosity: 0.8
  });

  // Repositioned controls keep project labels and attribution unobstructed.
  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.scale({
    position: "bottomleft",
    imperial: false,
    maxWidth: 110
  }).addTo(map);
  L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

  // CARTO Dark Matter, sourced from OpenStreetMap data.
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
  }).addTo(map);

  /*
   * Selected contracts with city/municipal hall reference coordinates.
   * These are LGU-wide engagements, so the pins identify the government
   * center rather than claiming a parcel-level project site.
   */
  const locations = [
    {
      id: "santa-rosa",
      lat: 14.31389,
      lng: 121.11111,
      label: "Santa Rosa, Laguna",
      shortLabel: "Santa Rosa",
      year: "2025",
      category: "Planning",
      project: "Local Shelter Plan",
      reference: "Santa Rosa City Hall",
      tooltipDirection: "left"
    },
    {
      id: "calatagan",
      lat: 13.83282,
      lng: 120.63237,
      label: "Calatagan, Batangas",
      shortLabel: "Calatagan",
      year: "2023",
      category: "Planning",
      project: "CLUP Update",
      reference: "Calatagan Municipal Hall",
      tooltipDirection: "left"
    },
    {
      id: "ilagan",
      lat: 17.14316,
      lng: 121.88870,
      label: "Ilagan, Isabela",
      shortLabel: "Ilagan",
      year: "2018",
      category: "MIS",
      project: "RPTA System Installation",
      reference: "Ilagan City Hall",
      tooltipDirection: "right"
    },
    {
      id: "gumaca",
      lat: 13.92123,
      lng: 122.09839,
      label: "Gumaca, Quezon",
      shortLabel: "Gumaca",
      year: "2017",
      category: "MIS",
      project: "GReAT System Installation",
      website: "https://greatsystem.online",
      reference: "Gumaca Municipal Hall",
      tooltipDirection: "right"
    },
    {
      id: "cavinti",
      lat: 14.24528,
      lng: 121.50639,
      label: "Cavinti, Laguna",
      shortLabel: "Cavinti",
      year: "2013",
      category: "MIS",
      project: "GReAT System and capacity building",
      website: "https://greatsystem.online",
      reference: "Cavinti Municipal Hall",
      tooltipDirection: "bottom"
    }
  ];

  const projectBounds = L.latLngBounds(
    locations.map((location) => [location.lat, location.lng])
  );
  const showPermanentLabels = !window.matchMedia("(max-width: 560px)").matches;

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);

  locations.forEach((location) => {
    const icon = L.divIcon({
      className: "gis-marker",
      html: '<span class="gis-marker-core" aria-hidden="true"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const osmURL = [
      "https://www.openstreetmap.org/",
      `?mlat=${location.lat}&mlon=${location.lng}`,
      `#map=16/${location.lat}/${location.lng}`
    ].join("");

    const projectHTML = location.website
      ? `<a class="project-map-project-link" href="${location.website}" target="_blank" rel="noopener">${escapeHTML(location.project)} <span aria-hidden="true">&nearr;</span></a>`
      : `<span>${escapeHTML(location.project)}</span>`;

    const popupHTML = `
      <div class="project-map-popup">
        <span class="project-map-meta">${escapeHTML(location.year)} &middot; ${escapeHTML(location.category)}</span>
        <strong>${escapeHTML(location.label)}</strong>
        ${projectHTML}
        <small>Reference point: ${escapeHTML(location.reference)}</small>
        <small class="project-map-coordinates">${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}</small>
        <a href="${osmURL}" target="_blank" rel="noopener">Open detailed map <span aria-hidden="true">&nearr;</span></a>
      </div>
    `;

    const marker = L.marker([location.lat, location.lng], {
      icon,
      title: location.label,
      alt: `${location.label} project location`,
      riseOnHover: true
    })
      .addTo(map)
      .bindTooltip(location.shortLabel, {
        className: "gis-marker-tooltip",
        direction: location.tooltipDirection,
        offset: [0, 0],
        permanent: showPermanentLabels,
        opacity: 1
      })
      .bindPopup(popupHTML, {
        className: "project-map-popup-shell",
        maxWidth: 280,
        minWidth: 220,
        offset: [0, -4]
      });

    marker.on("click", () => {
      const targetZoom = Math.max(map.getZoom(), 14);
      map.flyTo(marker.getLatLng(), targetZoom, { duration: 0.65 });
    });

    marker.on("popupopen", () => {
      marker.getElement()?.classList.add("is-selected");
    });

    marker.on("popupclose", () => {
      marker.getElement()?.classList.remove("is-selected");
    });
  });

  const showAllLocations = (animate = true) => {
    map.closePopup();
    map.fitBounds(projectBounds, {
      animate,
      duration: 0.65,
      paddingTopLeft: [58, 82],
      paddingBottomRight: [58, 54],
      maxZoom: 7
    });
  };

  // This key explains that pins are useful reference points, not site parcels.
  const MapKeyControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const key = L.DomUtil.create("div", "map-key");
      key.innerHTML = `
        <span><i aria-hidden="true"></i> Selected projects</span>
        <small>LGU center reference points</small>
      `;
      return key;
    }
  });

  // Make the overview recoverable after inspecting a single location.
  const ResetMapControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const control = L.DomUtil.create("div", "leaflet-bar map-reset-control");
      const button = L.DomUtil.create("button", "map-reset-button", control);
      button.type = "button";
      button.setAttribute("aria-label", "Show all project locations");
      button.title = "Show all project locations";
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4v6h6M20 20v-6h-6M5.6 15a7 7 0 0 0 11.8 2.4L20 14M4 10l2.6-3.4A7 7 0 0 1 18.4 9"/>
        </svg>
        <span>All locations</span>
      `;

      L.DomEvent.disableClickPropagation(control);
      L.DomEvent.disableScrollPropagation(control);
      L.DomEvent.on(button, "click", () => showAllLocations());
      return control;
    }
  });

  new MapKeyControl().addTo(map);
  new ResetMapControl().addTo(map);

  map.whenReady(() => showAllLocations(false));
})();

