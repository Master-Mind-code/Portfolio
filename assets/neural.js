/* ============================================================
   Neural network ambient background
   Drifting nodes + proximity links, subtle mouse interaction.
   Tuned for performance: capped nodes, distance-gated links,
   pauses when tab hidden, respects reduced-motion.
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  const mouse = { x: -9999, y: -9999, active: false };
  const LINK_DIST = 150;
  const MOUSE_DIST = 200;

  const COL_VIOLET = '124, 109, 255';
  const COL_CYAN = '0, 229, 192';

  function nodeCount() {
    const area = w * h;
    // ~ 1 node per 16k px², capped
    return Math.max(26, Math.min(90, Math.round(area / 16000)));
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initNodes();
  }

  function initNodes() {
    const count = nodeCount();
    nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 1,
        hue: Math.random() > 0.5 ? COL_VIOLET : COL_CYAN,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      // wrap softly
      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;

      // mouse influence
      if (mouse.active) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_DIST && d > 0.1) {
          const f = (1 - d / MOUSE_DIST) * 0.6;
          n.x += (dx / d) * f;
          n.y += (dy / d) * f;
        }
      }
    }

    // links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.22;
          ctx.strokeStyle = `rgba(${a.hue}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // mouse links (brighter)
      if (mouse.active) {
        const dx = a.x - mouse.x, dy = a.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_DIST) {
          const alpha = (1 - d / MOUSE_DIST) * 0.4;
          ctx.strokeStyle = `rgba(${COL_CYAN}, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    const t = performance.now() * 0.002;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const tw = 0.6 + Math.sin(t + n.pulse) * 0.4;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${n.hue}, ${0.55 * tw})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  let raf = null;
  function start() { if (!raf && !reduce) raf = requestAnimationFrame(step); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
  window.addEventListener('mouseout', () => { mouse.active = false; });
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  resize();
  if (reduce) {
    // draw a single static frame
    step();
    stop();
  } else {
    start();
  }
})();
