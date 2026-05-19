/* ─────────────────────────────────────────────
   GEOCORP — script.js
   - Sticky header scroll behavior
   - Mobile nav toggle
   - Canvas GIS animation
   - Scroll reveal
   ───────────────────────────────────────────── */

(function () {
  "use strict";

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

  /* ── CANVAS GIS ANIMATION ───────────────── */
  const canvas = document.getElementById("mapCanvas");
  if (!canvas) return;

  const ctx  = canvas.getContext("2d");
  const W    = canvas.width;
  const H    = canvas.height;
  let   tick = 0;

  /* Color palette */
  const C = {
    bg:       "#061023",
    grid:     "rgba(98,185,255,0.07)",
    road:     "rgba(255,255,255,0.10)",
    roadHi:   "rgba(255,255,255,0.18)",
    water:    "rgba(35,107,228,0.24)",
    waterHi:  "rgba(98,185,255,0.42)",
    land:     "rgba(23,71,180,0.34)",
    landHi:   "rgba(35,107,228,0.62)",
    dot:      "#13ed6d",
    dotDim:   "rgba(19,237,109,0.36)",
    line:     "rgba(19,237,109,0.52)",
    lineDim:  "rgba(98,185,255,0.22)",
    pulse:    "rgba(19,237,109,0.16)",
    accent:   "#62b9ff",
    accentDim:"rgba(98,185,255,0.36)",
    text:     "rgba(255,255,255,0.55)",
    textHi:   "rgba(255,255,255,0.85)",
  };

  /* ── Land polygons ───────────────────────── */
  const lands = [
    { pts: [[80,60],[200,40],[300,70],[340,130],[290,180],[200,200],[100,170],[60,120]], water: false },
    { pts: [[380,50],[500,30],[580,80],[560,150],[480,180],[390,150],[350,90]],          water: false },
    { pts: [[600,100],[720,80],[760,140],[740,220],[650,240],[590,190]],                 water: false },
    { pts: [[50,260],[180,240],[260,280],[280,360],[200,400],[80,380],[40,320]],         water: true  },
    { pts: [[320,220],[460,200],[540,260],[530,340],[440,380],[330,350],[290,280]],      water: false },
    { pts: [[580,250],[700,230],[760,290],[760,380],[680,410],[570,380],[540,310]],      water: false },
    { pts: [[100,420],[220,400],[320,440],[310,510],[220,540],[100,530],[60,480]],       water: false },
    { pts: [[360,430],[500,410],[580,460],[560,530],[460,540],[360,510]],                water: true  },
    { pts: [[620,420],[740,400],[760,460],[760,540],[660,540],[600,500]],                water: false },
  ];

  /* ── Road network ────────────────────────── */
  const roads = [
    [[0,130],[760,120]], [[0,300],[760,310]], [[0,480],[760,490]],
    [[130,0],[140,540]], [[340,0],[350,540]], [[560,0],[570,540]],
    [[0,200],[760,210]], [[0,380],[760,395]],
    [[240,0],[245,540]], [[480,0],[490,540]],
    [[60,0],[55,540]],   [[700,0],[705,540]],
  ];

  /* ── Data points ────────────────────────── */
  const pts = [
    { x:140, y:100, r:6,   label:"Santa Rosa",   active:true  },
    { x:350, y:80,  r:5,   label:"Laguna",       active:false },
    { x:660, y:140, r:7,   label:"Batangas",     active:true  },
    { x:90,  y:320, r:5,   label:"LGU Node",     active:false },
    { x:400, y:285, r:8,   label:"GEOCORP HQ",   active:true  },
    { x:640, y:320, r:5,   label:"Quezon",       active:false },
    { x:180, y:465, r:6,   label:"Cavinti",      active:true  },
    { x:450, y:470, r:5,   label:"Isabela",      active:false },
    { x:690, y:460, r:6,   label:"Ilagan",       active:true  },
    { x:270, y:165, r:4.5, label:"Node",         active:false },
    { x:520, y:195, r:4.5, label:"Node",         active:false },
    { x:290, y:440, r:4.5, label:"Node",         active:false },
  ];

  /* ── Connection network ─────────────────── */
  const connections = [
    [0,4],[1,4],[2,4],[3,4],[5,4],[6,4],[7,4],[8,4],
    [0,1],[1,2],[3,6],[5,8],[7,6],[9,4],[10,4],[11,4],
  ];

  /* ── Pulse rings ─────────────────────────── */
  const pulses = pts
    .filter((p) => p.active)
    .map((p) => ({ x: p.x, y: p.y, t: Math.random() * Math.PI * 2 }));

  /* ── Scan line ───────────────────────────── */
  let scanY = 0;

  function draw() {
    tick++;
    scanY = (scanY + 1.2) % H;

    /* Background */
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = C.grid;
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    /* Land polygons */
    lands.forEach((land) => {
      ctx.beginPath();
      land.pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = land.water ? C.waterHi : C.landHi;
      ctx.fill();
      ctx.strokeStyle = land.water ? C.waterHi : "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    /* Roads */
    roads.forEach(([[x1, y1], [x2, y2]], i) => {
      const hi = i < 3 || (i >= 3 && i < 6);
      ctx.strokeStyle = hi ? C.roadHi : C.road;
      ctx.lineWidth   = hi ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    /* Connections */
    const connT = tick * 0.015;
    connections.forEach(([a, b]) => {
      const pa = pts[a], pb = pts[b];
      const alpha = 0.2 + 0.15 * Math.sin(connT + a * 0.7);
      ctx.strokeStyle = `rgba(98,185,255,${alpha})`;
      ctx.lineWidth   = 0.8;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -(tick * 0.4);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    /* Pulse rings */
    pulses.forEach((p) => {
      p.t += 0.02;
      const scale = (p.t % (Math.PI * 2)) / (Math.PI * 2);
      const r     = 10 + scale * 40;
      const alpha = 0.5 * (1 - scale);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(19,237,109,${alpha})`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });

    /* Data points */
    pts.forEach((p) => {
      const bright = p.active;

      /* Outer halo */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
      ctx.fillStyle = bright ? C.pulse : "transparent";
      ctx.fill();

      /* Core dot */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = bright ? C.dot : C.dotDim;
      ctx.fill();

      /* Inner highlight */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fill();

      /* Label for active points */
      if (bright && p.label !== "Node") {
        ctx.fillStyle   = C.textHi;
        ctx.font        = "bold 11px 'DM Sans', Arial, sans-serif";
        ctx.textAlign   = "left";
        ctx.fillText(p.label, p.x + p.r + 6, p.y + 4);
      }
    });

    /* Scan line sweep */
    const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 20);
    grad.addColorStop(0,   "rgba(98,185,255,0)");
    grad.addColorStop(0.7, "rgba(35,107,228,0.08)");
    grad.addColorStop(1,   "rgba(19,237,109,0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 60, W, 80);

    /* Coordinate overlay */
    const cx  = 380, cy = 270;
    const ang = tick * 0.008;
    ctx.strokeStyle = "rgba(98,185,255,0.34)";
    ctx.lineWidth   = 1;
    for (let i = 0; i < 4; i++) {
      const a = ang + (i * Math.PI) / 2;
      const ex = cx + Math.cos(a) * 55;
      const ey = cy + Math.sin(a) * 55;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(98,185,255,0.14)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(19,237,109,0.2)";
    ctx.stroke();

    /* Corner HUD text */
    ctx.fillStyle = "rgba(19,237,109,0.5)";
    ctx.font      = "10px monospace";
    ctx.textAlign = "left";
    const lat = (14.1407 + Math.sin(tick * 0.003) * 0.001).toFixed(4);
    const lng = (121.2139 + Math.cos(tick * 0.003) * 0.001).toFixed(4);
    ctx.fillText(`LAT ${lat}° N`, 12, H - 30);
    ctx.fillText(`LNG ${lng}° E`, 12, H - 16);
    ctx.textAlign = "right";
    ctx.fillText(`SCALE 1:50000`, W - 12, H - 30);
    ctx.fillText(`EPSG:4326 WGS84`, W - 12, H - 16);

    requestAnimationFrame(draw);
  }

  draw();
})();
