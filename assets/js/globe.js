/* =========================================================
   GRIMZ — globe.js
   Dotted globe ("we ship everywhere"), drawn on a plain 2D canvas:
   no WebGL, no external library, no third-party request.
   · continents = a 20,000-point Fibonacci sphere filtered by a land mask (3 KB, below)
   · light from top-left, dots bucketed by brightness → ~12 fills per frame
   · shipping arcs leave the studio (Italy) for the cities
   · runs only while on screen; drag to spin
   ========================================================= */
(function () {
  'use strict';
  var canvas = document.querySelector('[data-globe]');
  if (!canvas || !canvas.getContext) return;
  var G = window.GRIMZ || { CONFIG: { hq: { lat: 42.5, lng: 12.5 } }, reduce: false };
  var reduce = !!G.reduce || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var wrap = canvas.parentElement;
  var ctx = canvas.getContext('2d', { alpha: true });

  var N = 20000;
  var MASK = 'AAAAAAAAAAAgACQEhISQEBASQmhCSAgoCSElICQE1IAQEJATAmBCKgjACSEwABYG4IAQGAATI3AgTozEiRkwEndG4kicGYkzs2Ykz46e0V472mdf72grPf27r/W3p/7+3d56+1N//29v/f29/fe3tv7/3t56+3P7/25P/f2pvX235v7+3N76e1N7e25P/e2pvX+3pvb21N6+W1N7f25Ozf2ptX03pvb+lJqam1Nydk5Mzd0pOTlnpuTMnJqYu9NyZs5Nyd0pPTFnpuXsnJ+Qs/NyYs5NyZk5PyFn5uXsnJ+RM/N2Qs7Oy5k5OyFn5+TMnJ+Xs/N2Ss7Oy9k5Oydn5+ysnJ+Xs/N2Ts7Oy1k5Oy9n5+y8nJ2Xs3N2Xs7OyVk5Oydn5+SsnJ2zs3JyXs7OyVk5OW9n5eSsnJ2zs3J2Xs7KyXk5O29n5eSsnJ2Ts3J23M7KyVk5Oydn5eysnJWTs3J2TMzK2Vk5OyZn5eyomJWT82J2TMzKyVkxMyfnxeSomJWTs2JiXMzJyVkxKy/nxMSomJGTs2JiVs6IyVExIy/nxMSomJWTs3JyVs6IiVE5Iyfn5OSsnJGTo3JCVszIiFE5KydnZMSsnJERo3JCXszJyFk5IydGZISsmJERo3JCTs7JSFkxIyNG5ISsmJETs3JSRszJCRkxKyNmxIScmBURMmJWRsyLCRkxKyPmxKScmBcRsmJWRsyLCRkxKyPkxaSMmBUTsmJWRsiKSRkxKyNkxaSMmBUTsmJWRsiKSRkxKybkxaSMkBWTsnJWTsiKSRkpKyZl5aSMkBWTMnJWTsrKSRkpKydlpaSclJWTMlJWTsrKSRkpKSdl5ayclJWTMlJSTkpKSRkpKCclpayclJSTMlJQTkrKWRkpKSclpaSclJSSMlJQTkpKSTEpKSVlpaCclJSzMlJSTkpKQTkpKSVlpaCclJSSIlJSSkpKQTkpKQVlpKQclJSCMlBSDspKSTkoKSXFpKQUlJSSMlBSSspKSSkoKSXloKQUlJSSMlBSyopKSQkoKWVloKSUhZWSElBSSsJCSQkoKSVloKSEBZWyElBSQsJAWQkKCiUloKSEhIWyElRSQsJASQkICiUloKSEhIGyEhBUSkJQSQkIC2UloKyEhKGyEhAUSkJAWQkIB2UlIKiUhICyEhAWSkJAWQkIAWUlICiUhICyEhAaSkJAUCkIAWUlICSUhICQEhAaykJAQCgIAWUlICSUhYCAUhACykpASCgKASElIDSUhYCAUBQCSkpASCgKAQGlIAQUhICQUBQCQkpASCgIASGhIAQUlICQUBQCAkpBSAgIASGhKAQFlIDQUBICQkJBCAoIAaGhKAQFlIAQEBICQlJRCCopAaEpIASFpIAQFBICQlNRCAopASEoJASFpKAQVBICQlJACApJQSEoJASFpIAQVBKCQlBACApJASGopASFooAQFJICQlBACApJASEoJAWEooAQFJICQlBJCwpFAaEoJAWEoIAUFIICQFBICghBAaAoJAWAoAIUFIICQFAICghBAagoBAWAoAAUBIICUFEJCgBBBagIBAWAoAAUAIICUFEICgBBAagIBAWgoAIUAIIKUFEICgBBBagIBAWgohBUAIICUBEICkBBBagIFAWgohAUAIIKUBEICkBBAagIFAWgohAUgIICUBEICkBFAagAFBWgIhAUgIICUBEIKkRFASgAFQWiIhAUiIICUBEKKkRFASgQFQWiIhRUiIoCUCAqCkRFCKgQBQWgIBRUiIoQUCAqCkBBKKgQBSWgYBQUiIIQUCAKSkDBKKgABSGgQBSUgIIRUCEKSkDBKCgABSGgQBSUgIJRUAAKQkCBKCgBBSOgQhSUgIpRUAAKQkCFKCgBFSOgABSEgApRUAIqRkCBKCgBFaOgABSEgAJRUAIKRkQBKAgBBaKgABSMgAJQUAIKRkUBKBgBBaCgBBSMgAJQUAIKQEEBKAgBBaCgBBSEggJQEAIKREEBKAgBBaCgBBSAggJQEAIKQEGBKAgBBaCgRBSAggJREAIKQEGBKAAFBaAgBBSIgkJREAIKQEGJKAAFBaAgBBSAgkJRACoKQEGJKBAFhaIARBSAggJRIAoKQEGIKBAFhaIARBSAghJRIAoKRAGIKBAFhaJARBSIAlJRIAoKRQGIKAAFhaJARBSIAhBRIAoKRYGIKBAFpKJARBSIAhBRIAoKRYGIKBAFoKJARBSIAhFRIAoIRYGIKBAFIKJARBSKAhFRICoARYGIKBAFIqJAVBCKAhFRICoERYGIKBAFIqJAVACKAhFRICpERIGoKBQFIqJAVAiKAhFRICoERIGoABQFIqJAVAiIAhFRIAoERIGoEBQFIqJAVAiIAhExIAoERIGoEBAFIqJAVAiIAhEhIAoERIGoEBAFIuJAFAiIAlEhIAoERIGoEBAFIkJAFAiIAlEhIApERIEoEBAFIkJAFAiIAlEhIApExIAoEBAFIkJAFAiIAFEgIApExIAoEBAFIkJAFAiIAVEgIApEhIAoEBAFokBAFAiIAVEgIApEhIAoEBABokBAFAiIAVAgIApEhAAoEBABoEAAFAgIAVAgIAJAgAAoEBABIEAAFAgIARAgAAJAgAAIABADIEAABAAAARAgAAIAgAAIAAACIEAABAAAARAAAAJAgAAIAAACIEAABIAAARAAAAJAgBAIAAACIAAABIAAIRAAAAJAAAAIAAAAIAAABAAAIBAAAABAAAAIAAAAIAAABAAAABAAAABAAAAIAAAAIAAAAAAAIBAAAARAAAAIAAAAIAAACAAAIBAAAABAAAAIAAAAIAAAAAAAIBAAAABAABAAAAAAIAAAAAAAIBAAAABAABAAAAAAIAAAAAAAIBAAAABAAAAAAAAAIAAAAIAAABAAAABAAAAAAAAAIAAAAIAAAAAAAABAAAAAAAAAIAAAAIAAAAAAAABAAAAAAAAAAAAAAIAAAAAAAABAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAgAAAAAAAAEAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAgAAAAAApJeWlpJSUlpJSUlJKyktJKSktJeWkpJSUl5JSUlJ6/s/P+/k9P+/n5/z8n5/383N+/s/P+fk/P+/n5/z8n5/39//+/v///////////////////////////////////w==';
  var HQ = [G.CONFIG.hq.lat, G.CONFIG.hq.lng];
  var CITIES = [
    [40.71, -74.0], [34.05, -118.24], [43.65, -79.38], [19.43, -99.13], [-23.55, -46.63],
    [51.51, -0.13], [48.86, 2.35], [52.37, 4.9], [52.52, 13.4], [40.42, -3.7], [59.33, 18.07],
    [25.2, 55.27], [19.08, 72.88], [1.35, 103.82], [22.32, 114.17], [37.57, 126.98], [35.68, 139.69],
    [-33.87, 151.21], [6.52, 3.38], [-33.92, 18.42]
  ];

  function ll(lat, lng) {
    var la = lat * Math.PI / 180, lo = lng * Math.PI / 180;
    return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
  }

  /* ---------- points (built once, lazily) ---------- */
  var P = null, n = 0, sx, sy, ss, sl;
  function build() {
    var bin = atob(MASK), golden = Math.PI * (3 - Math.sqrt(5)), xs = [];
    for (var i = 0; i < N; i++) {
      if (!(bin.charCodeAt(i >> 3) & (1 << (i & 7)))) continue;
      var y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), a = golden * i;
      xs.push(Math.cos(a) * r, y, Math.sin(a) * r);
    }
    P = new Float32Array(xs); n = xs.length / 3;
    sx = new Float32Array(n); sy = new Float32Array(n); ss = new Float32Array(n); sl = new Uint8Array(n);
  }
  var hqV = ll(HQ[0], HQ[1]);
  var cityV = CITIES.map(function (c) { return ll(c[0], c[1]); });

  /* ---------- view ---------- */
  var phi = -0.5, theta = 0.28, velocity = 0, dragging = null;
  var SPEED = reduce ? 0 : 0.00019;            // rad per ms ≈ one turn every 33 s, same on 60 and 120 Hz screens
  var LX = -0.36, LY = 0.46, LZ = 0.81;        // light direction (normalised)
  var LEVELS = 12;
  var W = 0, R = 0, C = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var css = wrap.clientWidth || 500;
    var w = Math.round(css * dpr);
    if (w > 1400) w = 1400;                    // pixel budget: never more than ~2 MP
    if (w === W) return;
    W = w; canvas.width = w; canvas.height = w;
    C = w / 2; R = w * 0.42;
  }

  function rot(v, out) {
    var cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(theta), st = Math.sin(theta);
    var x = v[0] * cp + v[2] * sp, z = -v[0] * sp + v[2] * cp, y = v[1];
    out[0] = x; out[1] = y * ct - z * st; out[2] = y * st + z * ct;
    return out;
  }

  /* ---------- shipping arcs ---------- */
  var arcs = [], nextArc = 0, tmp = [0, 0, 0];
  function slerp(a, b, t, om, so) {
    var k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }
  function spawn(now) {
    var b = cityV[(Math.random() * cityV.length) | 0];
    var om = Math.acos(Math.max(-1, Math.min(1, hqV[0] * b[0] + hqV[1] * b[1] + hqV[2] * b[2])));
    var so = Math.sin(om) || 1, h = 0.05 + 0.2 * (om / Math.PI), pts = [];
    for (var i = 0; i <= 40; i++) {
      var t = i / 40, p = slerp(hqV, b, t, om, so), lift = 1 + h * Math.sin(Math.PI * t);
      pts.push([p[0] * lift, p[1] * lift, p[2] * lift]);
    }
    arcs.push({ pts: pts, end: b, t0: now, dur: 1300 + om * 700 });
  }

  /* ---------- draw ---------- */
  var q = [0, 0, 0];
  function draw(now) {
    if (!P) build();
    ctx.clearRect(0, 0, W, W);
    var cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(theta), st = Math.sin(theta);
    var base = Math.max(1.1, R * 0.0074), m = 0, i, k;

    for (i = 0, k = 0; i < n; i++, k += 3) {
      var px = P[k], py = P[k + 1], pz = P[k + 2];
      var x = px * cp + pz * sp, z = -px * sp + pz * cp;
      var z2 = py * st + z * ct;
      if (z2 < 0.02) continue;
      var y2 = py * ct - z * st;
      var d = x * LX + y2 * LY + z2 * LZ;
      if (d < 0) d = 0;
      var lv = (Math.pow(d, 1.25) * (LEVELS - 1) + 0.5) | 0;
      sx[m] = C + x * R; sy[m] = C - y2 * R; ss[m] = base * (0.6 + 0.4 * z2); sl[m] = lv; m++;
    }
    for (var L = 0; L < LEVELS; L++) {
      ctx.beginPath();
      var any = false;
      for (i = 0; i < m; i++) {
        if (sl[i] !== L) continue;
        var s = ss[i];
        ctx.rect(sx[i] - s / 2, sy[i] - s / 2, s, s); any = true;
      }
      if (any) { ctx.fillStyle = 'rgba(236,236,240,' + (0.1 + 0.8 * L / (LEVELS - 1)).toFixed(3) + ')'; ctx.fill(); }
    }

    // cities
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (i = 0; i < cityV.length; i++) {
      rot(cityV[i], q);
      if (q[2] < 0.05) continue;
      ctx.beginPath(); ctx.arc(C + q[0] * R, C - q[1] * R, base * 0.95 * (0.5 + q[2] * 0.5), 0, 6.2832); ctx.fill();
    }

    // arcs
    if (!reduce) {
      if (now > nextArc && arcs.length < 3) { spawn(now); nextArc = now + 900 + Math.random() * 900; }
      ctx.lineWidth = Math.max(1, dpr * 1.1); ctx.lineCap = 'round';
      for (var a = arcs.length - 1; a >= 0; a--) {
        var A = arcs[a], pr = (now - A.t0) / A.dur;
        if (pr > 2.2) { arcs.splice(a, 1); continue; }
        var head = Math.min(1, pr), tail = Math.max(0, Math.min(1, pr - 0.55)) * 1;
        var pts = A.pts, i0 = Math.floor(tail * 40), i1 = Math.ceil(head * 40);
        for (i = i0; i < i1; i++) {
          rot(pts[i], q); var ax = q[0], ay = q[1], az = q[2];
          if (az < 0 && ax * ax + ay * ay < 1) continue;           // hidden behind the globe
          rot(pts[i + 1], tmp);
          var f = (i - i0) / Math.max(1, i1 - i0);                  // brighter towards the head
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.12 + 0.7 * f).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(C + ax * R, C - ay * R); ctx.lineTo(C + tmp[0] * R, C - tmp[1] * R); ctx.stroke();
        }
        if (pr >= 1 && pr < 1.9) {                                   // landing ping
          rot(A.end, q);
          if (q[2] > 0.05) {
            var e = (pr - 1) / 0.9;
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - e)).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(C + q[0] * R, C - q[1] * R, (3 + e * 12) * dpr, 0, 6.2832); ctx.stroke();
          }
        }
      }
    }

    // the studio
    rot(hqV, q);
    if (q[2] > 0) {
      var hx = C + q[0] * R, hy = C - q[1] * R, pulse = reduce ? 0.4 : ((now / 1600) % 1);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(hx, hy, 3.4 * dpr, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 * (1 - pulse)).toFixed(3) + ')';
      ctx.lineWidth = dpr;
      ctx.beginPath(); ctx.arc(hx, hy, (5 + pulse * 14) * dpr, 0, 6.2832); ctx.stroke();
    }
  }

  /* ---------- loop: only while visible ---------- */
  /* while the page is being scrolled the globe drops to ~30 fps: the eye follows the page,
     the main thread goes to the scroll; at rest it is back to full frame rate */
  var visible = false, running = false, last = 0, scrollingUntil = 0;
  window.addEventListener('scroll', function () { scrollingUntil = performance.now() + 200; }, { passive: true });
  function frame(now) {
    if (!visible) { running = false; return; }
    if (now < scrollingUntil && last && now - last < 30 && !dragging) { requestAnimationFrame(frame); return; }
    var dt = last ? Math.min(50, now - last) : 16; last = now;
    if (!dragging) { phi += SPEED * dt + velocity; velocity *= Math.pow(0.94, dt / 16.7); }
    draw(now);
    if (reduce && !dragging && Math.abs(velocity) < 1e-4) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function wake() { if (visible && !running) { running = true; last = 0; requestAnimationFrame(frame); } }

  function start() {
    resize();
    draw(performance.now());                   // first frame now, while idle: the canvas is ready before anyone scrolls to it
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; wake(); }, { rootMargin: '60px' }).observe(wrap);
    } else { visible = true; wake(); }
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); if (!running && P) draw(performance.now()); }).observe(wrap);
    else window.addEventListener('resize', resize);
  }
  // nothing to download or compile: build the points when the browser is idle
  if ('requestIdleCallback' in window) requestIdleCallback(function () { build(); start(); }, { timeout: 2500 });
  else setTimeout(function () { build(); start(); }, 300);

  /* ---------- drag to spin ---------- */
  wrap.addEventListener('pointerdown', function (e) {
    dragging = { x: e.clientX, phi: phi, w: wrap.clientWidth || 500 };
    try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    wake();
  });
  wrap.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var np = dragging.phi + (e.clientX - dragging.x) / dragging.w * 3.2;
    velocity = (np - phi) * 0.25;
    phi = np;
    wake();
  });
  function release() { dragging = null; wake(); }
  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);
})();
