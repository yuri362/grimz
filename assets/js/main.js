/* =========================================================
   GRIMZ — main.js (home page)
   Needs site.js (window.GRIMZ).
   ========================================================= */
(function () {
  'use strict';
  var G = window.GRIMZ;
  if (!G) return;
  var $ = G.$, $$ = G.$$, esc = G.esc, CONFIG = G.CONFIG, VARIANTS = G.VARIANTS, MEDIA = G.MEDIA;
  var L = function (en, it) { return G.L(en, it); };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function setText(sel, txt) { $$(sel).forEach(function (el) { if (el.textContent !== txt) el.textContent = txt; }); }

  var ICON = {
    minus: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
  };
  var VIEWS = { en: ['front', 'side', 'back'], it: ['fronte', 'lato', 'retro'] };

  var state = { variant: 'set', img: 0, size: '', guide: false, muted: true, qb: {}, chart: 'body' };

  /* =========================================================
     INTRO — one second of black: DROP 01 (once per visit)
     ========================================================= */
  var heroEl0 = $('[data-hero-video]');
  var heroStarted = false;
  function startHero() {
    if (heroStarted || !heroEl0) return;
    heroStarted = true;
    setTimeout(function () { $$('.hero-price').forEach(function (el) { if (el._odoVal) G.odo(el, el._odoVal, { fromZero: true }); }); }, 450);
    heroEl0.muted = true;
    try { if (heroEl0.currentTime > 0.05) heroEl0.currentTime = 0; } catch (e) { /* ignore */ }
    var hp0 = heroEl0.play();
    if (hp0 && hp0.catch) hp0.catch(function () {});
  }

  (function intro() {
    var el = $('[data-intro-screen]');
    if (!el) { startHero(); return; }
    if (document.documentElement.classList.contains('intro-seen')) { el.remove(); startHero(); return; }
    document.documentElement.classList.add('lock');
    var bar = $('[data-intro-bar]'), count = $('[data-intro-count]');
    // one second of black; it waits (at most 1.2s more) only for the first video frame and the fonts
    var start = performance.now(), MIN = 1000, MAX = 2200, vReady = false, fReady = false;
    if (heroEl0) {
      if (heroEl0.readyState >= 2) vReady = true;
      heroEl0.addEventListener('loadeddata', function () { vReady = true; }, { once: true });
    } else vReady = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fReady = true; }); else fReady = true;
    (function step(now) {
      var t = now - start;
      var ready = vReady && fReady;
      var p = clamp(t / MIN, 0, ready ? 1 : 0.92);
      if (t > MAX) p = 1;
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      if (count) count.textContent = String(Math.round(p * 100)).padStart(3, '0');
      if (p >= 1) {
        el.classList.add('done');
        document.documentElement.classList.remove('lock');
        startHero();
        try { sessionStorage.setItem('grimz:intro', '1'); } catch (e) { /* ignore */ }
        setTimeout(function () { el.remove(); }, 1100);
        return;
      }
      requestAnimationFrame(step);
    })(start);
  })();

  /* =========================================================
     SHOP
     ========================================================= */
  function renderFit(box, size) {
    if (!box) return;
    var f = size ? G.fitText(size) : null;
    if (!f) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML =
      '<div class="fit-h"><span>' + esc(L('Size ', 'Taglia ') + size + L(' — recommended for', ' — consigliata per')) + '</span>' +
      '<span class="mono mute">' + esc(L('Indicative', 'Indicativa')) + '</span></div>' +
      f.rows.map(function (r) { return '<div><span class="k">' + esc(r.k) + '</span><span class="v">' + esc(r.v) + '</span></div>'; }).join('') +
      '<p class="fit-note">' + esc(L('Oversized fit: if you like it closer to the body, take one size down.', 'Vestibilità oversize: se la preferisci più aderente, scegli una taglia in meno.')) + '</p>';
    box.hidden = false;
  }

  var GLABEL = {
    chest: ['Chest ½', 'Torace ½'], length: ['Length', 'Lunghezza'], sleeve: ['Sleeve', 'Manica'],
    waist: ['Waist ½', 'Vita ½'], outseam: ['Outseam', 'Lungh. esterna'], inseam: ['Inseam', 'Interno gamba'], hem: ['Hem ½', 'Fondo ½']
  };
  function garmentTable(v) {
    var g = CONFIG.garment && CONFIG.garment[v];
    if (!g) return '';
    var head = '<thead><tr><th>' + esc(L(v === 'jacket' ? 'Jacket' : 'Pants', v === 'jacket' ? 'Giacca' : 'Pantalone')) + '</th>' +
      g.cols.map(function (c) { return '<th>' + esc(L(GLABEL[c][0], GLABEL[c][1])) + '</th>'; }).join('') + '</tr></thead>';
    var body = CONFIG.sizes.map(function (s) {
      return '<tr' + (s === state.size ? ' class="on"' : '') + '><td>' + s + '</td>' + g[s].map(function (n) { return '<td>' + String(n).replace('.', L('.', ',')) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return head + '<tbody>' + body + '</tbody>';
  }
  function renderChart() {
    var t = $('[data-chart]');
    if (!t) return;
    $$('[data-chart-mode]').forEach(function (b) {
      var on = b.getAttribute('data-chart-mode') === state.chart;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var note = $('[data-chart-note]');
    if (state.chart === 'garment') {
      var vs = state.variant === 'set' ? ['jacket', 'pants'] : [state.variant];
      t.innerHTML = vs.map(garmentTable).join('');
      G.slidePill($('.seg-sm'));
      if (note) note.textContent = L('Garment laid flat, in cm · provisional values', 'Capo steso in piano, in cm · valori provvisori');
      return;
    }
    if (note) note.textContent = L('Body measurements · oversized fit · indicative values', 'Misure del corpo · vestibilità oversize · valori indicativi');
    G.slidePill($('.seg-sm'));
    var head = '<thead><tr><th>' + esc(L('Size', 'Taglia')) + '</th><th>' + esc(L('Height', 'Altezza')) + '</th><th>' + esc(L('Chest', 'Torace')) + '</th><th>' + esc(L('Waist', 'Vita')) + '</th><th>' + esc(L('Hips', 'Bacino')) + '</th></tr></thead>';
    var body = CONFIG.sizes.map(function (s) {
      var c = CONFIG.sizeChart[s];
      var r = function (a) { return a[0] + '–' + a[1]; };
      return '<tr' + (s === state.size ? ' class="on"' : '') + '><td>' + s + '</td><td>' + r(c.height) + '</td><td>' + r(c.chest) + '</td><td>' + r(c.waist) + '</td><td>' + r(c.hips) + '</td></tr>';
    }).join('');
    t.innerHTML = head + '<tbody>' + body + '</tbody>';
  }

  /* gallery: the old picture dissolves while the new one settles in from a slight zoom (or slides, when swiped) */
  function swapMain(main, src, alt, dir) {
    if (main.getAttribute('src') === src) { main.alt = alt; return; }
    if (reduce || !main.complete || !main.naturalWidth) { main.src = src; main.alt = alt; return; }
    var ghost = main.cloneNode(false);
    ['data-main-img', 'data-vt', 'data-fly-src', 'id'].forEach(function (a) { ghost.removeAttribute(a); });
    ghost.style.viewTransitionName = 'none'; ghost.className = 'mi-ghost'; ghost.alt = ''; ghost.setAttribute('aria-hidden', 'true');
    main.parentNode.insertBefore(ghost, main.nextSibling);
    var done = false, go = function () {
      if (done) return; done = true;
      main.src = src; main.alt = alt;
      main.classList.remove('mi-in', 'mi-in-l', 'mi-in-r'); void main.offsetWidth;
      main.classList.add(dir > 0 ? 'mi-in-r' : dir < 0 ? 'mi-in-l' : 'mi-in');
      ghost.classList.add(dir > 0 ? 'out-l' : dir < 0 ? 'out-r' : 'out');
      setTimeout(function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 700);
    };
    var pre = new Image(); pre.src = src;
    if (pre.decode) pre.decode().then(go, go); else pre.onload = go;
    setTimeout(go, 600);
  }
  (function () {   // swipe between views on touch screens
    var box = $('.gal .main-img'); if (!box) return;
    var s0 = null;
    box.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') s0 = { x: e.clientX, y: e.clientY, t: Date.now() }; }, { passive: true });
    box.addEventListener('pointerup', function (e) {
      if (!s0) return; var dx = e.clientX - s0.x, dy = e.clientY - s0.y; var dt = Date.now() - s0.t; s0 = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3 || dt > 700) return;
      var n = VARIANTS[state.variant].imgs.length, d = dx < 0 ? 1 : -1;
      state.img = (state.img + d + n) % n; state.imgDir = d; renderShop();
    }, { passive: true });
    box.addEventListener('pointercancel', function () { s0 = null; }, { passive: true });
  })();

  /* flash test: under a camera flash at night only the reflective panels light up.
     Pre-rendered "-flash" photos, fetched only when someone presses the button. */
  function flashSrc(src) { return src.replace(/\.webp$/, '-flash.webp'); }
  function flashFx(box) {
    if (!box || reduce) return;
    var fx = document.createElement('span'); fx.className = 'flashfx'; fx.setAttribute('aria-hidden', 'true');
    box.appendChild(fx);
    setTimeout(function () { if (fx.parentNode) fx.parentNode.removeChild(fx); }, 800);
  }
  function whenReady(srcs, cb) {
    var n = srcs.length, fired = false;
    var fire = function () { if (!fired) { fired = true; cb(); } };
    var one = function () { if (--n <= 0) fire(); };
    srcs.forEach(function (src) { var im = new Image(); im.src = src; if (im.decode) im.decode().then(one, one); else { im.onload = one; im.onerror = one; } });
    setTimeout(fire, 2500);
  }
  function setFlashBtns(btns, on) { btns.forEach(function (b) { b.classList.remove('busy'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  function shutter() { G.sfx('shutter'); if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* ignore */ } } }
  function toggleShopFlash(btn) {
    var main = $('[data-main-img]');
    if (!main || btn.classList.contains('busy')) return;
    if (state.flash) { state.flash = false; setFlashBtns([btn], false); renderShop(); return; }
    var V = VARIANTS[state.variant];
    btn.classList.add('busy');
    whenReady([MEDIA + flashSrc(V.imgs[state.img])], function () {
      state.flash = true; setFlashBtns([btn], true); shutter();
      flashFx(main.parentNode);
      setTimeout(function () { main.src = MEDIA + flashSrc(VARIANTS[state.variant].imgs[state.img]); }, reduce ? 0 : 60);
      V.imgs.forEach(function (src) { var im = new Image(); im.src = MEDIA + flashSrc(src); });   // the other views, for later
    });
  }
  function togglePsFlash(psEl) {
    var S = scrubs.filter(function (x) { return x.pshop === psEl; })[0];
    var V = VARIANTS[psEl.getAttribute('data-pshop')];
    var btns = $$('[data-ps-flash]', psEl);
    if (btns.some(function (b) { return b.classList.contains('busy'); })) return;
    var on = !psEl._flash, prods = $$('.ps-prod img', psEl);
    function apply() {
      psEl._flash = on; if (S) S.flash = on;
      setFlashBtns(btns, on);
      var view = (S && S.view) || 0;
      function swap() {
        prods.forEach(function (im, i) { if (V.imgs[i]) im.src = MEDIA + (on ? flashSrc(V.imgs[i]) : V.imgs[i]); });
        if (S && S.still) S.still.src = MEDIA + (on ? flashSrc(V.imgs[view]) : V.imgs[view]);
      }
      if (!on) { swap(); return; }
      shutter();
      if (S && S.desk) flashFx($('.dclip', S.sec)); else prods.forEach(function (im) { flashFx(im.parentNode); });
      setTimeout(swap, reduce ? 0 : 60);
    }
    if (!on) { apply(); return; }
    btns.forEach(function (b) { b.classList.add('busy'); });
    whenReady(V.imgs.map(function (src) { return MEDIA + flashSrc(src); }), apply);
  }

  function renderShop() {
    var lang = G.lang();
    var V = VARIANTS[state.variant];

    $$('[data-variant]').forEach(function (b) {
      var on = b.getAttribute('data-variant') === state.variant;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('[data-size]').forEach(function (b) {
      var on = b.getAttribute('data-size') === state.size;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    var thumbs = $('[data-thumbs]');
    if (thumbs) {
      if (thumbs._v !== state.variant + lang) {        // rebuild only when the set of pictures changes
        thumbs._v = state.variant + lang;
        thumbs.innerHTML = V.imgs.map(function (src, i) {
          return '<button type="button" class="thumb" data-thumb="' + i + '" aria-label="' +
            esc('Sanzaru ' + V.name[lang] + ' — ' + VIEWS[lang][i]) + '"><img src="' + MEDIA + src + '" alt="" width="1024" height="1536" loading="lazy" decoding="async"></button>';
        }).join('');
      }
      $$('.thumb', thumbs).forEach(function (t, i) { t.classList.toggle('on', i === state.img); t.setAttribute('aria-current', i === state.img ? 'true' : 'false'); });
    }
    var dots = $('[data-mi-dots]');
    if (dots) {
      if (dots.children.length !== V.imgs.length) dots.innerHTML = V.imgs.map(function (s2, i) { return '<button type="button" data-thumb="' + i + '" aria-label="' + esc(VIEWS[lang][i]) + '"></button>'; }).join('');
      $$('button', dots).forEach(function (d, i) { d.classList.toggle('on', i === state.img); d.setAttribute('aria-current', i === state.img ? 'true' : 'false'); });
    }
    var main = $('[data-main-img]');
    if (main) swapMain(main, MEDIA + (state.flash ? flashSrc(V.imgs[state.img]) : V.imgs[state.img]), 'GRIMZ Sanzaru ' + V.name[lang] + ' — ' + VIEWS[lang][state.img] + (state.flash ? L(', with flash', ', con il flash') : ''), state.imgDir || 0);
    state.imgDir = 0;

    setText('[data-vname]', V.name[lang]);
    setText('[data-vdesc]', V.desc[lang]);
    var pr = G.price(state.variant);
    var pl = G.money(pr);
    $$('[data-current-price]').forEach(function (el) { G.odo(el, pr); });
    G.fx($('.price-row [data-fx-chip]'), pr);
    setText('[data-add-label]', L('Add to bag', 'Aggiungi alla borsa') + ' — ' + pl);
    setText('[data-size-label]', state.size || '—');
    $$('[data-price="set"]').forEach(function (el) { if (el.closest('.btn')) { if (el.textContent !== G.money(G.price('set'))) el.textContent = G.money(G.price('set')); } else G.odo(el, G.price('set')); });
    setText('[data-pieces]', CONFIG.pieces > 0 ? String(CONFIG.pieces) : '[N]');
    var pno = G.pieceNo();
    $$('[data-piece-no]').forEach(function (el) { if (el._pv !== state.variant || el._pt !== pno) { el._pv = state.variant; el._pt = pno; if (el._seen) G.flap(el, pno); else el.textContent = pno; } });

    var ps = G.price('set'), pj = G.price('jacket'), pp = G.price('pants');
    var diff = ps && pj && pp ? pj + pp - ps : 0;
    var save = $('[data-save]');
    if (save) {
      var showSave = state.variant === 'set' && diff > 0;
      if (showSave && save.hidden) { save.classList.remove('pop'); void save.offsetWidth; save.classList.add('pop'); }
      save.hidden = !showSave;
      save.textContent = L('Save ', 'Risparmi ') + G.money(diff);
    }
    var inst = $('[data-install]');
    if (inst) {
      var n = Number(CONFIG.installments) || 0;
      inst.hidden = n < 2;
      if (pr && n >= 2) {
        var per = Math.round(pr / n * 100) / 100, pre = L('or ' + n + ' interest-free payments of ', 'oppure ' + n + ' rate senza interessi da ');
        G.countTo(inst, inst._per, per, function (x) { return pre + G.money(Math.round(x * 100) / 100); });
        inst._per = per;
      } else inst.textContent = L('or pay in ' + n + ' interest-free instalments', 'oppure paga in ' + n + ' rate senza interessi');
    }

    var bi = $('[data-bar-img]');
    if (bi) bi.src = MEDIA + V.imgs[0];
    setText('[data-bar-name]', 'Sanzaru ' + V.name[lang]);
    renderBuybar();

    var g = $('[data-guide]');
    if (g) g.hidden = !state.guide;
    var gb = $('[data-action="guide"]');
    if (gb) gb.setAttribute('aria-expanded', state.guide ? 'true' : 'false');

    renderFit($('[data-fit]'), state.size);
    renderChart();
    renderQuickBuys();

    // availability per size → "notify me" instead of a dead end
    $$('[data-size]').forEach(function (b) {
      var sz = b.getAttribute('data-size'), oos = !G.inStock(state.variant, sz);
      b.classList.toggle('oos', oos);
      b.setAttribute('aria-label', oos ? sz + L(' — sold out, notify me', ' — esaurita, avvisami') : sz);
    });
    var oosSel = !!state.size && !G.inStock(state.variant, state.size);
    var addBtn = $('[data-action="add"]'); if (addBtn) addBtn.hidden = oosSel;
    var bis = $('[data-bis]');
    if (bis) {
      var okMsg = bis.parentNode.querySelector('[data-waitlist-ok]');
      if (!oosSel) { bis.hidden = true; if (okMsg) okMsg.hidden = true; }
      else if (okMsg && okMsg.hidden) bis.hidden = false;
      setText('[data-bis-text]', oosSel ? L('Size ' + state.size + ' is sold out. Leave your email: we write once, when it is back.', 'La taglia ' + state.size + ' è esaurita. Lasciaci la mail: ti scriviamo una volta sola, quando torna.') : '');
    }
    var et = G.eta('standard');
    $$('[data-eta]').forEach(function (e) { if (e.textContent !== (et ? et.text : '')) e.textContent = et ? et.text : ''; });
    var wb = $('[data-wish-current]');
    if (wb) { var won = G.getWish().indexOf(state.variant) >= 0; wb.classList.toggle('on', won); wb.setAttribute('aria-pressed', won ? 'true' : 'false'); }
    renderMaterials();
    $$('.buy .seg:not(.seg-sm), .buy .sizes').forEach(G.slidePill);
  }

  /* materials & care (from CONFIG: empty fields show "to be completed") */
  var CARE = {
    wash30: ['Machine wash 30°C, gentle', 'Lavaggio in lavatrice a 30°C, delicato', '<path d="M3 8h18l-2 11H5L3 8Z M3 8c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><text x="12" y="17" text-anchor="middle" font-size="6" fill="currentColor" stroke="none" font-family="Geist, sans-serif">30</text>'],
    nobleach: ['Do not bleach', 'Non candeggiare', '<path d="M12 4 21 20H3L12 4Z M5 6l14 14 M19 6 5 20"/>'],
    notumble: ['Do not tumble dry', 'Non asciugare in asciugatrice', '<path d="M4 4h16v16H4z M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z M4 4l16 16 M20 4 4 20"/>'],
    ironlow: ['Iron at low temperature', 'Stirare a bassa temperatura', '<path d="M4 17h16l-2-7H9c-3 0-5 2-5 7Z M12 13.5h.01"/>'],
    nodryclean: ['Do not dry clean', 'Non lavare a secco', '<path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z M5 5l14 14 M19 5 5 19"/>']
  };
  function renderMaterials() {
    var dl = $('[data-materials]');
    if (dl) {
      var M = CONFIG.materials || {}, todo = L('to be completed', 'da completare');
      var rows = [['shell', L('Shell', 'Tessuto esterno')], ['panels', L('Reflective panels', 'Pannelli riflettenti')], ['lining', L('Lining', 'Fodera')], ['weight', L('Fabric weight', 'Peso del tessuto')], ['origin', L('Made in', 'Prodotto in')]];
      dl.innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[1]) + '</dt><dd' + (M[r[0]] ? '' : ' class="todo"') + '>' + esc(M[r[0]] || todo) + '</dd></div>'; }).join('');
    }
    var care = $('[data-care]');
    if (care) {
      var list = CONFIG.care || ['wash30', 'nobleach', 'notumble', 'ironlow', 'nodryclean'];
      care.innerHTML = '<ul class="care">' + list.map(function (k) { var c = CARE[k]; return c ? '<li><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + c[2] + '</svg><span>' + esc(L(c[0], c[1])) + '</span></li>' : ''; }).join('') + '</ul>' +
        (CONFIG.careConfirmed ? '' : '<p class="mono care-note">' + esc(L('Provisional: confirm with the label on the garment', 'Provvisorio: da confermare con l’etichetta del capo')) + '</p>');
    }
  }

  var psState = { jacket: '', pants: '' };
  function renderPShops() {
    var lang = G.lang();
    $$('[data-pshop]').forEach(function (ps) {
      var v = ps.getAttribute('data-pshop'), V = VARIANTS[v], size = psState[v] || '';
      var pr = $('[data-ps-price]', ps); if (pr) G.odo(pr, G.price(v));
      G.fx($('[data-fx-chip]', ps), G.price(v));
      var ds = $('[data-ps-desc]', ps); if (ds) ds.textContent = V.desc[lang];
      var sl = $('[data-ps-size-label]', ps); if (sl) sl.textContent = size || '—';
      $$('[data-ps-size]', ps).forEach(function (b) {
        var on = b.getAttribute('data-ps-size') === size;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var fit = $('[data-ps-fit]', ps), f = size ? G.fitText(size) : null;
      if (fit) { fit.hidden = !f; if (f) fit.textContent = L('Recommended for ', 'Consigliata per ') + f.rows.map(function (r) { return r.k + ' ' + r.v; }).join(' · '); }
      $$('.ps-sizes, .ps-views', ps).forEach(G.slidePill);
      var md = $('[data-ps-model]', ps), M = CONFIG.model || {};
      if (md) { md.hidden = !(M.height && M.size); if (!md.hidden) md.textContent = L('The model is ' + M.height + ' cm and wears ' + M.size, 'Il modello è alto ' + M.height + ' cm e indossa la ' + M.size); }
    });
  }
  function setPsView(S, i) {
    var V = VARIANTS[S.pshop.getAttribute('data-pshop')];
    var src = MEDIA + (S.flash ? flashSrc(V.imgs[i]) : V.imgs[i]);
    S.view = i;
    var im = new Image();
    im.onload = function () { if (S.still) S.still.src = src; };
    im.src = src;
    $$('[data-ps-view]', S.pshop).forEach(function (b) {
      var on = Number(b.getAttribute('data-ps-view')) === i;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    G.slidePill($('.ps-views', S.pshop));
  }

  function renderQuickBuys() {
    $$('[data-qb]').forEach(function (qb, i) {
      var size = state.qb[i] || '';
      $$('[data-qb-size]', qb).forEach(function (b) {
        var on = b.getAttribute('data-qb-size') === size;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var fit = $('[data-qb-fit]', qb);
      var f = size ? G.fitText(size) : null;
      if (fit) {
        fit.hidden = !f;
        if (f) fit.textContent = size + ' · ' + f.rows.map(function (r) { return r.k + ' ' + r.v; }).join(' · ');
      }
    });
  }

  /* =========================================================
     CART DRAWER
     ========================================================= */
  function renderCart() {
    var lang = G.lang();
    var cart = G.getCart();
    var tot = G.totals(cart);

    var i0 = 0;
    var rows = cart.map(function (c) {
      var V = VARIANTS[c.variant];
      var u = G.price(c.variant);
      var k = esc(c.key);
      return '<div class="dr-row" style="--i:' + (i0++) + '"><span class="dr-del" aria-hidden="true">' + esc(L('Remove', 'Rimuovi')) + '</span><div class="dr-item" data-swipe-key="' + k + '">' +
        '<img src="' + MEDIA + V.imgs[0] + '" alt="" width="1024" height="1536">' +
        '<div><p class="dr-name">' + esc(V.cart[lang]) + '</p>' +
        '<p class="mono mute">' + esc(L('Size ', 'Taglia ') + c.size) + '</p>' +
        '<div class="qty">' +
        '<button type="button" data-qty="-1" data-key="' + k + '" aria-label="' + esc(L('Decrease quantity', 'Diminuisci quantità')) + '">' + ICON.minus + '</button>' +
        '<span>' + c.qty + '</span>' +
        '<button type="button" data-qty="1" data-key="' + k + '" aria-label="' + esc(L('Increase quantity', 'Aumenta quantità')) + '">' + ICON.plus + '</button>' +
        '</div></div>' +
        '<div class="dr-r"><p class="buy-price">' + esc(G.money(u * c.qty)) + '</p>' +
        '<button type="button" class="rm" data-remove="' + k + '">' + esc(L('Remove', 'Rimuovi')) + '</button></div>' +
        '</div></div>';
    });
    var items = $('[data-items]');
    if (items) items.innerHTML = rows.join('');

    var hasJ = cart.some(function (c) { return c.variant === 'jacket'; });
    var hasP = cart.some(function (c) { return c.variant === 'pants'; });
    var hasS = cart.some(function (c) { return c.variant === 'set'; });
    var up = $('[data-upsell]');
    if (up) {
      if (!hasS && hasJ !== hasP) {
        var need = hasJ ? 'pants' : 'jacket';
        var from = cart.filter(function (c) { return c.variant === (hasJ ? 'jacket' : 'pants'); })[0];
        up.innerHTML = '<div class="upsell">' +
          '<img src="' + MEDIA + VARIANTS[need].imgs[0] + '" alt="" width="1024" height="1536">' +
          '<p class="ut"><strong>' + esc(L('Complete the set', 'Completa il look')) + '</strong><span>' +
          esc((hasJ ? L('Add the matching pants, size ', 'Aggiungi il pantalone abbinato, taglia ') : L('Add the matching jacket, size ', 'Aggiungi la giacca abbinata, taglia ')) + from.size) + '</span></p>' +
          '<button type="button" class="btn btn-line" data-upsell-add="' + need + '" data-upsell-size="' + esc(from.size) + '">' + esc(L('Add', 'Aggiungi')) + '</button>' +
          '</div>';
      } else up.innerHTML = '';
    }

    var has = cart.length > 0;
    var empty = $('[data-empty]'), body = $('[data-cart-body]'), foot = $('[data-cart-foot]');
    if (empty) empty.hidden = has;
    if (body) body.hidden = !has;
    if (foot) foot.hidden = !has;

    // free-shipping progress (only when a threshold and real prices exist)
    var free = $('[data-free]');
    if (free) {
      var th = Number(CONFIG.freeShippingFrom) || 0;
      var show = has && th > 0 && !tot.missing;
      free.hidden = !show;
      if (show) {
        var left = Math.max(0, th - tot.sub);
        setText('[data-free-text]', left > 0
          ? L('You are ' + G.money(left) + ' away from free shipping', 'Ti mancano ' + G.money(left) + ' per la spedizione gratuita')
          : L('Free shipping unlocked', 'Spedizione gratuita sbloccata'));
        var fb = $('[data-free-bar]');
        if (fb) fb.style.transform = 'scaleX(' + Math.min(1, tot.sub / th).toFixed(3) + ')';
      }
    }

    var gift = G.getGift(), gc = $('[data-gift]'), gm = $('[data-gift-msg]');
    if (gc) gc.checked = !!gift.on;
    if (gm) { gm.hidden = !gift.on; if (document.activeElement !== gm) gm.value = gift.msg || ''; }
    var et2 = G.eta('standard');
    $$('[data-eta]').forEach(function (e) { e.textContent = et2 ? et2.text : ''; });
    var wish = G.getWish(), sv = $('[data-saved]'), si = $('[data-saved-items]');
    if (sv && si) {
      sv.hidden = !wish.length;
      si.innerHTML = wish.map(function (v) {
        var W = VARIANTS[v];
        return W ? '<div class="sv-item"><img src="' + MEDIA + W.imgs[0] + '" alt="" width="1024" height="1536"><div><p class="dr-name">' + esc(W.cart[lang]) + '</p><p class="mono mute">' + esc(G.money(G.price(v))) + '</p></div>' +
          '<div class="sv-act"><button type="button" class="link" data-wish-view="' + v + '">' + esc(L('View', 'Vedi')) + '</button><button type="button" class="rm" data-wish-remove="' + v + '">' + esc(L('Remove', 'Rimuovi')) + '</button></div></div>' : '';
      }).join('');
    }

    var subEl = $('[data-subtotal]');
    if (subEl) { if (tot.missing) { if (subEl.textContent !== G.money(0)) subEl.textContent = G.money(0); } else G.odo(subEl, tot.sub); }
    $$('[data-cart-count]').forEach(function (b) {
      var was = Number(b.textContent) || 0;
      b.textContent = String(tot.count); b.hidden = tot.count === 0;
      if (tot.count > was) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    });
    setText('[data-cart-count-text]', String(tot.count));
  }

  /* phones: swipe an item to the left to remove it */
  (function () {
    var list = $('[data-items]'); if (!list) return;
    var it = null, x0 = 0, y0 = 0, dx = 0, lock = 0;
    list.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || e.target.closest('button')) return;
      it = e.target.closest('[data-swipe-key]'); if (!it) return;
      x0 = e.clientX; y0 = e.clientY; dx = 0; lock = 0; it.style.transition = 'none';
    }, { passive: true });
    list.addEventListener('pointermove', function (e) {
      if (!it) return;
      var mx = e.clientX - x0, my = e.clientY - y0;
      if (!lock) { if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my)) lock = 1; else if (Math.abs(my) > 8) { it = null; return; } }
      if (lock) { dx = Math.min(0, mx); it.style.transform = 'translateX(' + dx + 'px)'; it.parentNode.classList.toggle('arm', dx < -it.offsetWidth * 0.32); }
    }, { passive: true });
    function end() {
      if (!it) return;
      var el = it, w = el.offsetWidth; it = null;
      el.style.transition = '';
      if (dx < -w * 0.32) {
        el.style.transform = 'translateX(-110%)';
        el.parentNode.classList.add('gone');
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (er) { /* ignore */ } }
        setTimeout(function () { G.changeQty(el.getAttribute('data-swipe-key'), -9999); }, 280);
      } else { el.style.transform = ''; el.parentNode.classList.remove('arm'); }
    }
    list.addEventListener('pointerup', end, { passive: true });
    list.addEventListener('pointercancel', end, { passive: true });
  })();

  var lastFocus = null;
  function openCart() {
    var dr = $('[data-drawer]'), sc = $('[data-scrim]');
    lastFocus = document.activeElement;
    if (dr) {
      dr.classList.add('open', 'stag');                       // items arrive one after another, only on opening
      clearTimeout(dr._st); dr._st = setTimeout(function () { dr.classList.remove('stag'); }, 1100);
    }
    if (sc) sc.classList.add('open');
    var cb = $('[data-close-btn]');
    if (cb) setTimeout(function () { cb.focus({ preventScroll: true }); }, 60);
  }
  function closeCart() {
    var dr = $('[data-drawer]'), sc = $('[data-scrim]');
    var wasOpen = dr && dr.classList.contains('open');
    if (dr) dr.classList.remove('open');
    if (sc) sc.classList.remove('open');
    if (wasOpen && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* smart buy bar: knows the size you picked. With a size it adds straight away (and the garment flies);
     without one it opens a row of sizes right there, so nobody is sent back up the page */
  function renderBuybar() {
    var bar = $('[data-buybar]'); if (!bar) return;
    var box = $('[data-bb-sizes]', bar);
    if (box && box.children.length !== CONFIG.sizes.length) box.innerHTML = CONFIG.sizes.map(function (sz) { return '<button type="button" data-bb-size="' + sz + '">' + sz + '</button>'; }).join('');
    $$('[data-bb-size]', bar).forEach(function (b) {
      var sz = b.getAttribute('data-bb-size'), on = sz === state.size, oos = !G.inStock(state.variant, sz);
      b.classList.toggle('on', on); b.classList.toggle('oos', oos);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', oos ? sz + L(' — sold out', ' — esaurita') : sz);
    });
    var chip = $('[data-bb-sz]', bar);
    if (chip) { chip.hidden = !state.size; chip.textContent = state.size || ''; }
    var lbl = $('[data-bb-label]', bar), cta = $('[data-bb-cta]', bar);
    var txt = !state.size ? L('Choose size', 'Scegli la taglia') : (G.inStock(state.variant, state.size) ? L('Add', 'Aggiungi') + ' · ' + state.size : L('Notify me', 'Avvisami'));
    if (lbl && lbl.textContent !== txt) lbl.textContent = txt;
    if (cta) cta.setAttribute('aria-expanded', bar.classList.contains('pick') ? 'true' : 'false');
  }
  function bbPick(open) {
    var bar = $('[data-buybar]'); if (!bar) return;
    bar.classList.toggle('pick', open);
    var cta = $('[data-bb-cta]', bar); if (cta) cta.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* the product flies into the bag */
  function bump() {
    var t = $('[data-cart-target]');
    if (!t) return;
    t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump');
  }
  function flyToCart(img, done) {
    var target = $('[data-cart-target]');
    if (!img || !target || G.reduce || !img.animate) { bump(); if (done) done(); return; }
    var a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width || a.bottom < 0 || a.top > window.innerHeight) { bump(); if (done) done(); return; }
    var w = Math.min(a.width, 200), h = w * (a.height / a.width);
    var x0 = a.left + (a.width - w) / 2, y0 = a.top + (a.height - h) / 2;
    var el = document.createElement('div');
    el.className = 'fly';
    el.style.cssText = 'left:' + x0 + 'px;top:' + y0 + 'px;width:' + w + 'px;height:' + h + 'px';
    el.innerHTML = '<img src="' + esc(img.currentSrc || img.src) + '" alt="">';
    document.body.appendChild(el);
    var dx = b.left + b.width / 2 - (x0 + w / 2), dy = b.top + b.height / 2 - (y0 + h / 2);
    var anim = el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, borderRadius: '12px' },
      { transform: 'translate(' + (dx * 0.42) + 'px,' + (dy * 0.42 - 140) + 'px) scale(.5) rotate(-10deg)', opacity: 1, borderRadius: '24px', offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.06) rotate(-24deg)', opacity: 0.3, borderRadius: '50%' }
    ], { duration: 950, easing: 'cubic-bezier(.55,0,.25,1)' });
    anim.onfinish = function () { el.remove(); bump(); if (done) done(); };
  }

  /* the button itself confirms: "✓ In your bag · № 001" (the bag opens only from its icon) */
  function confirmBtn(btn) {
    if (!btn.querySelector('.b-ok')) {
      var label = document.createElement('span'); label.className = 'b-l';
      while (btn.firstChild) label.appendChild(btn.firstChild);
      btn.appendChild(label);
      var okEl = document.createElement('span'); okEl.className = 'b-ok'; btn.appendChild(okEl);
    }
    btn.querySelector('.b-ok').innerHTML = '<svg class="ic b-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>' + esc(L('In your bag', 'Nella borsa')) + ' · ' + esc(G.pieceNo()) + '</span>';
    btn.classList.remove('added'); void btn.offsetWidth; btn.classList.add('added');
    btn.setAttribute('data-added', '1');
    btn.setAttribute('aria-live', 'polite');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.classList.remove('added'); btn.removeAttribute('data-added'); }, 2800);
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* ignore */ } }
  }
  /* the garment flies into the bag; the bag itself never opens on its own */
  function addAndFly(variant, size, img, btn) {
    G.addItem(variant, size);
    G.sfx('add');
    var nav = typeof navEl !== 'undefined' ? navEl : null;
    var wasHidden = !!(nav && nav.classList.contains('is-hidden'));
    if (nav) nav.classList.remove('is-hidden');            // bring the bag into sight first
    if (btn) confirmBtn(btn);
    setTimeout(function () { flyToCart(img, function () {}); }, wasHidden ? 420 : 0);
  }

  /* =========================================================
     EVENTS
     ========================================================= */
  document.addEventListener('click', function (e) {
    var bbar = $('[data-buybar]');
    if (bbar && bbar.classList.contains('pick') && !e.target.closest('[data-buybar]')) bbPick(false);
    var fb = e.target.closest('[data-flash],[data-ps-flash]');
    if (fb) { if (fb.hasAttribute('data-flash')) toggleShopFlash(fb); else togglePsFlash(fb.closest('[data-pshop]')); return; }
    var el = e.target.closest('[data-bb-cta],[data-bb-size],[data-action],[data-variant],[data-size],[data-thumb],[data-qty],[data-remove],[data-angle],[data-upsell-add],[data-qb-size],[data-qb-add],[data-pick-size],[data-ps-size],[data-ps-add],[data-ps-view],[data-ps-jump],[data-wish-current],[data-wish-view],[data-wish-remove],[data-chart-mode],[data-lb-close],[data-lb-step]');
    if (!el) return;
    if (el.matches('[data-size],[data-ps-size],[data-bb-size],[data-qb-size],[data-pick-size],[data-variant],[data-ps-view],[data-thumb],[data-angle],[data-chart-mode]')) G.sfx('tick');

    if (el.hasAttribute('data-bb-size')) {
      state.size = el.getAttribute('data-bb-size');
      var er0 = $('[data-size-err]'); if (er0) er0.hidden = true;
      renderShop();
      setTimeout(function () { bbPick(false); }, 260);
      return;
    }
    if (el.hasAttribute('data-bb-cta')) {
      if (el.hasAttribute('data-added')) return;
      if (!state.size) { bbPick(!$('[data-buybar]').classList.contains('pick')); return; }
      if (!G.inStock(state.variant, state.size)) { var sh0 = $('#shop'); if (sh0) sh0.scrollIntoView({ behavior: G.reduce ? 'auto' : 'smooth' }); return; }
      addAndFly(state.variant, state.size, $('[data-bar-img]'), el);
      return;
    }
    if (el.hasAttribute('data-wish-current')) { G.toggleWish(state.variant); return; }
    if (el.hasAttribute('data-wish-remove')) { G.toggleWish(el.getAttribute('data-wish-remove')); return; }
    if (el.hasAttribute('data-wish-view')) {
      state.variant = el.getAttribute('data-wish-view'); state.img = 0; closeCart(); renderShop();
      var sh = $('#shop'); if (sh) sh.scrollIntoView({ behavior: G.reduce ? 'auto' : 'smooth' });
      return;
    }
    if (el.hasAttribute('data-chart-mode')) { state.chart = el.getAttribute('data-chart-mode'); renderChart(); return; }
    if (el.hasAttribute('data-lb-close')) { closeLB(); return; }
    if (el.hasAttribute('data-lb-step')) { stepLB(Number(el.getAttribute('data-lb-step'))); return; }

    /* product shop after a detail video */
    var psEl = el.closest('[data-pshop]');
    if (psEl) {
      var pv = psEl.getAttribute('data-pshop');
      var S = scrubs.filter(function (x) { return x.pshop === psEl; })[0];
      if (el.hasAttribute('data-ps-size')) {
        psState[pv] = el.getAttribute('data-ps-size');
        var pe = $('[data-ps-err]', psEl); if (pe) pe.hidden = true;
        renderPShops();
      } else if (el.hasAttribute('data-ps-add')) {
        if (!psState[pv]) { var pe2 = $('[data-ps-err]', psEl); if (pe2) pe2.hidden = false; return; }
        if (!G.inStock(pv, psState[pv])) {
          state.variant = pv; state.size = psState[pv]; state.img = 0; renderShop();
          var shp = $('#shop'); if (shp) shp.scrollIntoView({ behavior: G.reduce ? 'auto' : 'smooth' });
          return;
        }
        if (el.hasAttribute('data-added')) return;          // confirming: ignore accidental double taps
        var src = S && S.desk ? S.still : $('.ps-ph img', psEl);
        addAndFly(pv, psState[pv], src, el);
      } else if (el.hasAttribute('data-ps-view') && S) {
        setPsView(S, Number(el.getAttribute('data-ps-view')) || 0);
      } else if (el.hasAttribute('data-ps-jump') && S) {
        var dur = S.vid && isFinite(S.vid.duration) ? S.vid.duration : S.d;
        var y = S.sec.getBoundingClientRect().top + window.scrollY - NAV + (Number(el.getAttribute('data-ps-jump')) / dur) * S.stageH * 5;
        window.scrollTo({ top: y, behavior: G.reduce ? 'auto' : 'smooth' });
      }
      return;
    }

    if (el.hasAttribute('data-variant')) { state.variant = el.getAttribute('data-variant'); state.img = 0; renderShop(); return; }
    if (el.hasAttribute('data-size')) {
      state.size = el.getAttribute('data-size');
      var er = $('[data-size-err]'); if (er) er.hidden = true;
      renderShop();
      return;
    }
    if (el.hasAttribute('data-pick-size')) {
      state.size = el.getAttribute('data-pick-size');
      var er2 = $('[data-size-err]'); if (er2) er2.hidden = true;
      renderShop();
      return;
    }
    if (el.hasAttribute('data-thumb')) { state.img = Number(el.getAttribute('data-thumb')) || 0; renderShop(); return; }
    if (el.hasAttribute('data-qty')) { G.changeQty(el.getAttribute('data-key'), Number(el.getAttribute('data-qty'))); return; }
    if (el.hasAttribute('data-remove')) { G.changeQty(el.getAttribute('data-remove'), -9999); return; }
    if (el.hasAttribute('data-angle')) { setAngle(Number(el.getAttribute('data-angle'))); return; }
    if (el.hasAttribute('data-upsell-add')) { G.addItem(el.getAttribute('data-upsell-add'), el.getAttribute('data-upsell-size')); bump(); return; }

    if (el.hasAttribute('data-qb-size') || el.hasAttribute('data-qb-add')) {
      var qb = el.closest('[data-qb]');
      var idx = $$('[data-qb]').indexOf(qb);
      if (el.hasAttribute('data-qb-size')) {
        state.qb[idx] = el.getAttribute('data-qb-size');
        var qe = $('[data-qb-err]', qb); if (qe) qe.hidden = true;
        renderQuickBuys();
      } else {
        if (!state.qb[idx]) { var qe2 = $('[data-qb-err]', qb); if (qe2) qe2.hidden = false; return; }
        var card = qb.closest('.stack-card');
        addAndFly('set', state.qb[idx], card ? $('[data-fly-src]', card) : null);
      }
      return;
    }

    switch (el.getAttribute('data-action')) {
      case 'open-cart': setMenu(false); openCart(); break;
      case 'zoom': openLB(state.img); break;
      case 'menu': setMenu(!document.documentElement.classList.contains('menu-open')); break;
      case 'close-cart': closeCart(); break;
      case 'guide': state.guide = !state.guide; renderShop(); break;
      case 'sound': toggleSound(el); break;
      case 'add':
        if (el.hasAttribute('data-added')) return;          // confirming: ignore accidental double taps
        if (!state.size) { var err = $('[data-size-err]'); if (err) err.hidden = false; return; }
        addAndFly(state.variant, state.size, $('[data-main-img]'), el);
        break;
      case 'express':
        if (!state.size) { var err2 = $('[data-size-err]'); if (err2) err2.hidden = false; return; }
        G.addItem(state.variant, state.size);
        window.location.href = 'checkout.html';
        break;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeCart(); setMenu(false); closeLB(); bbPick(false); }
    if (lbOpen && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) stepLB(e.key === 'ArrowRight' ? 1 : -1);
  });
  document.addEventListener('grimz:wish', function () { renderShop(); renderCart(); });
  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-gift]')) { var g = G.getGift(); g.on = e.target.checked; G.setGift(g); renderCart(); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-gift-msg]')) { var g = G.getGift(); g.msg = e.target.value.slice(0, 200); G.setGift(g); }
  });

  /* =========================================================
     ZOOM — full-screen viewer: on desktop the image follows the pointer at 2x, on phones pinch to zoom
     ========================================================= */
  var lb = $('[data-lb]'), lbImg = $('[data-lb-img]'), lbStage = $('[data-lb-stage]'), lbOpen = false, lbIdx = 0, lbLast = null;
  function lbSet(i) {
    var imgs = VARIANTS[state.variant].imgs;
    lbIdx = (i + imgs.length) % imgs.length;
    if (lbImg) { lbImg.src = MEDIA + imgs[lbIdx]; lbImg.alt = 'GRIMZ Sanzaru ' + VARIANTS[state.variant].name[G.lang()] + ' — ' + VIEWS[G.lang()][lbIdx]; }
    if (lbStage) lbStage.classList.remove('zoomed');
  }
  function openLB(i) {
    if (!lb) return;
    lbLast = document.activeElement; lbSet(i || 0); lb.hidden = false; lbOpen = true;
    document.documentElement.classList.add('lb-open');
    requestAnimationFrame(function () { lb.classList.add('open'); var x = $('[data-lb-close]'); if (x) x.focus({ preventScroll: true }); });
  }
  function closeLB() {
    if (!lb || !lbOpen) return;
    lbOpen = false; lb.classList.remove('open'); document.documentElement.classList.remove('lb-open');
    setTimeout(function () { lb.hidden = true; }, 300);
    if (lbLast && lbLast.focus) lbLast.focus({ preventScroll: true });
  }
  function stepLB(d) { lbSet(lbIdx + d); }
  if (lbStage && G.fine) {
    lbStage.addEventListener('click', function (e) { if (e.target === lbImg) lbStage.classList.toggle('zoomed'); });
    lbStage.addEventListener('pointermove', function (e) {
      if (!lbImg) return;
      var r = lbImg.getBoundingClientRect();
      lbImg.style.transformOrigin = clamp((e.clientX - r.left) / r.width * 100, 0, 100) + '% ' + clamp((e.clientY - r.top) / r.height * 100, 0, 100) + '%';
    });
  }
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });

  /* =========================================================
     DROP STATE — live · soon (countdown + list) · sold out (→ next drop list). Real scarcity only.
     ========================================================= */
  (function applyDrop() {
    var D = CONFIG.drop || {}, st = D.status || 'live', root = document.documentElement;
    root.classList.toggle('drop-soon', st === 'soon');
    root.classList.toggle('drop-soldout', st === 'soldout');
    var notes = $$('[data-drop-note]');
    if (st === 'live' || !notes.length) return;
    function pad(n) { return String(n).padStart(2, '0'); }
    function paint() {
      var txt;
      if (st === 'soon') {
        var ms = Math.max(0, new Date(D.launch).getTime() - Date.now());
        var d = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60, ss = Math.floor(ms / 1e3) % 60;
        txt = '<span class="dn-k">' + esc(L('Drop 01 opens in', 'Il Drop 01 apre tra')) + '</span><span class="dn-t">' + d + 'd ' + pad(hh) + 'h ' + pad(mm) + 'm ' + pad(ss) + 's</span>';
      } else {
        txt = '<span class="dn-k">' + esc(L('Sold out', 'Esaurito')) + '</span><span class="dn-t">' + esc(L((D.next || 'Drop 02') + ' is coming', 'Sta arrivando il ' + (D.next || 'Drop 02'))) + '</span>';
      }
      var link = ' <a href="#join">' + esc(L('Join the list', 'Entra in lista')) + '</a>';
      notes.forEach(function (n) { n.hidden = false; n.innerHTML = txt + link; });
    }
    paint();
    if (st === 'soon') setInterval(paint, 1000);
    document.addEventListener('grimz:lang', paint);
  })();

  /* =========================================================
     HEADER — floating glass capsule
     compact after 80px · hides while you read downwards · back on the first scroll up
     a glass pill glides under the section you are in
     ========================================================= */
  var navEl = $('[data-nav]'), pill = $('[data-nav-pill]'), navLinks = $$('[data-nav-for]');
  var msheet = $('[data-msheet]'), menuBtn = $('[data-action="menu"]');
  function setMenu(open) {
    if (!msheet) return;
    document.documentElement.classList.toggle('menu-open', open);
    msheet.classList.toggle('open', open);
    msheet.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && navEl) navEl.classList.remove('is-hidden');
  }
  if (msheet) msheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 960) setMenu(false); });

  var lastY = window.scrollY, navQueued = false;
  function navUpdate() {
    navQueued = false;
    if (!navEl) return;
    var y = window.scrollY;
    navEl.classList.toggle('is-compact', y > 80);
    var dy = y - lastY;
    if (Math.abs(dy) > 6) {
      var keep = document.documentElement.classList.contains('menu-open') || !!navEl.querySelector(':focus-visible');
      navEl.classList.toggle('is-hidden', dy > 0 && y > 320 && !keep);
      lastY = y;
    }
  }
  window.addEventListener('scroll', function () { if (!navQueued) { navQueued = true; requestAnimationFrame(navUpdate); } }, { passive: true });
  navUpdate();

  var activeKey = null;
  function placePill() {
    if (!pill) return;
    var a = activeKey ? navLinks.filter(function (l) { return (' ' + l.getAttribute('data-nav-for') + ' ').indexOf(' ' + activeKey + ' ') >= 0; })[0] : null;
    navLinks.forEach(function (l) { if (l === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    if (!a || !a.offsetWidth) { pill.style.opacity = '0'; return; }
    var appearing = pill.style.opacity !== '1';
    if (appearing) pill.style.transition = 'none';            // appear in place, then glide from there
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    if (appearing) { void pill.offsetWidth; pill.style.transition = ''; }
    pill.style.opacity = '1';
  }
  if (pill && 'IntersectionObserver' in window) {
    var order = ['fit', 'details', 'pants', 'worn', 'shop'];
    var seen = {};
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      var k = null;
      for (var i = 0; i < order.length; i++) if (seen[order[i]]) { k = order[i]; break; }
      if (k !== activeKey) { activeKey = k; placePill(); }
    }, { rootMargin: '-45% 0px -54% 0px' });
    order.forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
    window.addEventListener('resize', placePill);
    document.addEventListener('grimz:lang', function () { setTimeout(placePill, 0); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);
  }
  document.addEventListener('grimz:cart', renderCart);
  document.addEventListener('grimz:lang', function () { renderShop(); renderCart(); renderPShops(); });

  var finder = $('[data-finder]');
  if (finder) {
    finder.addEventListener('submit', function (e) {
      e.preventDefault();
      var h = Number(finder.h.value), w = Number(finder.w.value);
      var out = $('[data-finder-out]');
      if (!h || h < 140 || h > 215) { finder.h.focus(); return; }
      var s = G.recommendSize(h, w || 0);
      out.innerHTML = '<span>' + esc(L('We recommend ', 'Ti consigliamo la ')) + '<strong>' + s + '</strong></span>' +
        '<button type="button" class="btn btn-pink" data-pick-size="' + s + '">' + esc(L('Select ', 'Seleziona ') + s) + '</button>';
      out.hidden = false;
    });
  }

  var news = $('[data-news]');
  if (news) {
    news.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('input[type="email"]', news);
      if (!input || !/\S+@\S+\.\S+/.test(input.value)) { if (input) input.focus(); return; }
      // TODO: send the email to your newsletter provider (Klaviyo, Mailchimp…).
      news.hidden = true;
      var note = $('[data-news-note]'); if (note) note.hidden = true;
      var ok = $('[data-news-ok]'); if (ok) ok.hidden = false;
    });
  }

  function toggleSound(btn) {
    var v = $('[data-hero-video]');
    state.muted = !state.muted;
    if (v) {
      v.muted = state.muted;
      if (!state.muted) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    }
    btn.setAttribute('aria-pressed', state.muted ? 'false' : 'true');
  }

  var marq = $('[data-marq]');
  if (marq && marq.firstElementChild) {
    var set = marq.firstElementChild;
    for (var i = 0; i < 5; i++) marq.appendChild(set.cloneNode(true));
  }

  /* =========================================================
     SCROLL ENGINE
     ========================================================= */
  var NAV = 64;
  var reduce = G.reduce;
  var ZOOM = 1.6;   // 1.6x keeps the detail sharp: the source video is only 832px wide

  var hero = $('[data-hero]');
  var heroVid = $('[data-hero-video]');
  var ovPhone = $('[data-ov-phone]'), ovL = $('[data-ov-l]'), ovR = $('[data-ov-r]');
  var buybar = $('[data-buybar]');
  var shop = $('#shop');
  var footEl = $('.foot');
  /* reveals: an observer instead of measuring every element on every frame */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting || en.boundingClientRect.top < 0) { en.target.classList.add('in'); revIO.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { revIO.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('in'); });
  function on(el, val) {
    if (!el) return;
    var v = val ? '1' : '0';
    if (el.getAttribute('data-on') !== v) el.setAttribute('data-on', v);
  }

  var scrubs = $$('[data-sec]').map(function (sec) {
    var s = {
      key: sec.getAttribute('data-sec'),
      d: Number(sec.getAttribute('data-dur')) || 8,
      sec: sec,
      stick: $('.dstick', sec),
      vid: $('video', sec),
      frame: $('.dframe', sec),
      col: $('.dcol', sec),
      hs: $$('[data-hs]', sec).map(function (el) { return { el: el, a: el.getAttribute('data-hs').split(',').map(Number) }; }),
      cap: $$('[data-rz]', sec).map(function (el) { return { el: el, a: el.getAttribute('data-rz').split(',').map(Number) }; }),
      prog: $('[data-prog]', sec),
      intro: $('[data-intro]', sec),
      deg: $('[data-deg]', sec),
      dot: $('[data-dot]', sec),
      cur: null, stageH: 0, fw: 0, fh: 0, colX: 0, firstT: 99,
      pshop: $('[data-pshop]', sec), still: $('[data-ps-still]', sec), slot: $('[data-ps-slot]', sec),
      m: -1, mdx: 0, mdy: 0, msc: 1, desk: true, shopIn: false,
      lenses: $$('.loupe', sec).map(function (el) {
        var hs = el.getAttribute('data-hs');
        var card = $('.dcard[data-hs="' + hs + '"]', sec);
        var cv = $('canvas', el);
        return {
          el: el, canvas: cv, ctx: cv ? cv.getContext('2d') : null, d: 0,
          a: hs.split(',').map(Number),
          path: el.getAttribute('data-path').split(';').map(function (p) { return p.split(',').map(Number); }),
          line: $('.dline[data-hs="' + hs + '"]', sec),
          side: card && card.getAttribute('data-side') === 'l' ? 'l' : 'r',
          cardTop: card ? parseFloat(card.style.top) || 50 : 50
        };
      })
    };
    s.hs.forEach(function (h) { if (h.a[0] < s.firstT) s.firstT = h.a[0]; });
    return s;
  });

  // prime a paused video so that seeking shows frames (iOS)
  function prime(v) {
    var go = function () {
      var p = v.play();
      if (p && p.then) p.then(function () { v.pause(); }).catch(function () {});
      else v.pause();
    };
    if (v.readyState >= 2) go(); else v.addEventListener('loadeddata', go, { once: true });
  }
  scrubs.forEach(function (s) {
    if (!s.vid) return;
    s.vid.muted = true;
    s.vid.playsInline = true;
    prime(s.vid);
  });
  // load the heavy scroll videos only when their section gets close
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var s = scrubs.filter(function (x) { return x.sec === en.target; })[0];
        if (s && s.vid && s.vid.preload !== 'auto') { s.vid.preload = 'auto'; if (s.vid.readyState === 0 && s.vid.networkState === 0) s.vid.load(); prime(s.vid); }
        io.unobserve(en.target);
      });
    }, { rootMargin: '120% 0px' });
    scrubs.forEach(function (s) { io.observe(s.sec); });
  }
  if (heroVid) heroVid.muted = true;

  function measure() {
    scrubs.forEach(function (s) {
      s.stageH = s.stick ? s.stick.offsetHeight : window.innerHeight;
      if (s.frame) {
        s.fw = s.frame.offsetWidth;
        s.fh = s.frame.offsetHeight;
      }
      s.lenses.forEach(function (Ln) { Ln.d = Ln.el.offsetWidth || 150; });
      // where the video frame lands when it becomes the product image
      if (s.pshop && s.frame) {
        s.frame.style.transform = '';
        s.desk = window.innerWidth >= 960;
        if (s.desk && s.slot) {
          var fr = s.frame.getBoundingClientRect(), sl = s.slot.getBoundingClientRect();
          s.msc = Math.min(1, sl.width / fr.width, sl.height / fr.height);
          s.mdx = (sl.left + sl.width / 2) - (fr.left + fr.width / 2);
          s.mdy = (sl.top + sl.height / 2) - (fr.top + fr.height / 2);
        }
        s.m = -1;
      }
    });
  }
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); if (typeof wake === 'function') wake(); });
  measure();

  function interp(path, t) {
    if (t <= path[0][0]) return path[0];
    for (var i = 1; i < path.length; i++) {
      if (t <= path[i][0]) {
        var a = path[i - 1], b = path[i];
        var k = (t - a[0]) / ((b[0] - a[0]) || 1);
        return [t, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      }
    }
    return path[path.length - 1];
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function placeLens(s, Ln, t) {
    var p = interp(Ln.path, t);
    var lx = p[1].toFixed(2) + '%', ly = p[2].toFixed(2) + '%';
    if (Ln._lx !== lx) { Ln._lx = lx; Ln.el.style.left = lx; }
    if (Ln._ly !== ly) { Ln._ly = ly; Ln.el.style.top = ly; }

    // real magnification: draw the area under the glass, enlarged
    var v = s.vid;
    if (Ln.ctx && v && v.videoWidth && v.readyState >= 2 && s.fw) {
      var size = Math.round(Ln.d * dpr);
      if (Ln.canvas.width !== size) {
        Ln.canvas.width = size; Ln.canvas.height = size;          // resizing resets the context state
        Ln.ctx.imageSmoothingEnabled = true; Ln.ctx.imageSmoothingQuality = 'high';
        if ('filter' in Ln.ctx) Ln.ctx.filter = 'contrast(1.06) saturate(1.04)';
      }
      var k = v.videoWidth / s.fw;
      var src = (Ln.d / ZOOM) * k;
      var sx = clamp(p[1] / 100 * v.videoWidth - src / 2, 0, v.videoWidth - src);
      var sy = clamp(p[2] / 100 * v.videoHeight - src / 2, 0, v.videoHeight - src);
      try { Ln.ctx.drawImage(v, sx, sy, src, src, 0, 0, size, size); } catch (e) { /* frame not ready */ }
    }

    if (!Ln.line || !s.fw) return;
    var R = Ln.d / 2 + 12;
    var x1 = p[1] / 100 * s.fw, y1 = p[2] / 100 * s.fh;
    var x2 = Ln.side === 'l' ? -12 : s.fw + 12, y2 = Ln.cardTop / 100 * s.fh;   // the card's dot, 12px outside the frame
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var len = Math.max(0, Math.hypot(x2 - x1, y2 - y1) - R);
    var gl = (x1 + Math.cos(ang) * R).toFixed(1) + 'px', gt = (y1 + Math.sin(ang) * R).toFixed(1) + 'px';
    var gw = len.toFixed(1) + 'px', gr = 'rotate(' + ang.toFixed(4) + 'rad)';
    if (Ln._gl !== gl) { Ln._gl = gl; Ln.line.style.left = gl; }
    if (Ln._gt !== gt) { Ln._gt = gt; Ln.line.style.top = gt; }
    if (Ln._gw !== gw) { Ln._gw = gw; Ln.line.style.width = gw; }
    if (Ln._gr !== gr) { Ln._gr = gr; Ln.line.style.transform = gr; }
  }

  // 360 rotation
  var drag = 0, dragging = null, rBase = null;
  function setAngle(v) { drag = v - (rBase || 0); wake(); }
  var rot = $('[data-rot]');
  if (rot) {
    rot.addEventListener('pointerdown', function (e) {
      dragging = { x: e.clientX, d0: drag, w: rot.getBoundingClientRect().width || 600 };
      try { rot.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    rot.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var base = rBase || 0;
      drag = clamp(dragging.d0 + (e.clientX - dragging.x) / dragging.w * 1.2, -base, 1 - base);
    });
    var end = function () { dragging = null; };
    rot.addEventListener('pointerup', end);
    rot.addEventListener('pointercancel', end);
  }

  function seek(v, t) {
    if (!v || v.readyState < 1 || v.seeking) return;
    if (Math.abs(v.currentTime - t) > 0.012) { try { v.currentTime = t; } catch (e) { /* ignore */ } }
  }

  document.documentElement.classList.add('js');

  /* The scroll engine only does its heavy work while the page is actually moving (scroll, drag,
     resize, a video finishing a seek) plus ~1s of easing afterwards. Standing still costs nothing,
     except the hero line below, which has to follow the playing hero video. */
  var busy = 90, heroOn = true;
  function wake(n) { if (busy < (n || 90)) busy = n || 90; }
  window.addEventListener('scroll', function () { wake(); }, { passive: true });
  window.addEventListener('resize', function () { wake(); });
  window.addEventListener('load', function () { wake(); });
  document.addEventListener('grimz:lang', function () { wake(); });
  scrubs.forEach(function (s) { if (s.vid) { s.vid.addEventListener('seeked', function () { wake(6); }); s.vid.addEventListener('loadeddata', function () { wake(6); }); } });
  if (rot) {
    rot.addEventListener('pointerdown', function () { wake(); });
    rot.addEventListener('pointermove', function () { if (dragging) wake(); });
  }
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { heroOn = e[0].isIntersecting; }, { rootMargin: '50px' }).observe(hero);
  }

  function tick() {
    requestAnimationFrame(tick);

    /* hero: headline + notifications follow the video time (only while the hero is on screen) */
    if (heroVid && hero && heroOn && !heroVid.paused) {
      var t = heroVid.currentTime || 0;
      var ph = t < 3.9 ? 'a' : (t < 6.55 ? 'b' : 'c');
      if (hero.getAttribute('data-phase') !== ph) hero.setAttribute('data-phase', ph);
      on(ovPhone, t >= 3.93 && t < 4.56);
      on(ovL, t >= 5.45 && t < 6.56);
      on(ovR, t >= 5.45 && t < 6.56);
    }

    if (busy <= 0) return;
    busy--;

    var vh = window.innerHeight;
    var lerp = reduce ? 1 : 0.2;

    /* reads */
    var heroRect = hero ? hero.getBoundingClientRect() : null;
    var shopRect = shop ? shop.getBoundingClientRect() : null;
    var secRects = scrubs.map(function (s) { return s.sec.getBoundingClientRect(); });

    /* scroll-driven videos */
    scrubs.forEach(function (s, i) {
      var r = secRects[i];
      var v = s.vid;
      if (!v) return;
      if (r.bottom < -vh || r.top > vh * 2) return;
      var dur = v.duration && isFinite(v.duration) ? v.duration : s.d;
      var scrolled = NAV - r.top;
      var total = s.pshop ? s.stageH * 5 : r.height - s.stageH;
      var p = total > 1 ? clamp(scrolled / total, 0, 1) : 0;
      var tShow;

      if (s.key === '360') {
        if (!dragging && rBase != null && Math.abs(p - rBase) > 0.001) drag *= 0.9;
        rBase = p;
        var rr = clamp(p + drag, 0, 1);
        s.cur = s.cur == null ? rr : s.cur + (rr - s.cur) * (reduce ? 1 : 0.22);
        tShow = s.cur * dur;
        seek(v, Math.min(tShow, dur - 0.04));
        s.cap.forEach(function (c) { on(c.el, s.cur >= c.a[0] && (s.cur < c.a[1] || c.a[1] >= 1)); });
        if (s.deg) { var dg = Math.round(s.cur * 180) + '°'; if (s.deg.textContent !== dg) s.deg.textContent = dg; }
        if (s.dot) {
          var th = s.cur * Math.PI;
          s.dot.setAttribute('cx', (100 + 88 * Math.sin(th)).toFixed(1));
          s.dot.setAttribute('cy', (20 + 14 * Math.cos(th)).toFixed(1));
        }
      } else {
        var target = p * dur;
        s.cur = s.cur == null ? target : s.cur + (target - s.cur) * lerp;
        tShow = s.cur;
        seek(v, Math.min(tShow, dur - 0.04));
        s.hs.forEach(function (h) { on(h.el, tShow >= h.a[0] && tShow < h.a[1]); });
        s.lenses.forEach(function (Ln) { if (tShow >= Ln.a[0] - 0.06 && tShow < Ln.a[1] + 0.06) placeLens(s, Ln, tShow); });
        on(s.intro, tShow < s.firstT);

        /* hand-off: the last frame cross-fades into the front still, glides into the slot, the shop appears */
        if (s.pshop) {
          var m = clamp((scrolled - total) / (s.stageH * 0.55), 0, 1);
          if (m !== s.m) {
            s.m = m;
            var e = m < 0.5 ? 2 * m * m : 1 - Math.pow(-2 * m + 2, 2) / 2;
            if (s.desk && s.frame) {
              s.frame.style.transform = m > 0 ? 'translate(' + (s.mdx * e).toFixed(1) + 'px,' + (s.mdy * e).toFixed(1) + 'px) scale(' + (1 + (s.msc - 1) * e).toFixed(4) + ')' : '';
            }
            if (s.still) s.still.style.opacity = clamp(m * 2.4, 0, 1).toFixed(3);
            s.sec.classList.toggle('is-shop', m > 0.02);
          }
          var want = s.shopIn ? m > 0.42 : m > 0.62;
          if (want !== s.shopIn) {
            s.shopIn = want;
            s.pshop.classList.toggle('in', want);
            if (want) { var ppr = $('[data-ps-price]', s.pshop); if (ppr && ppr._odoVal) setTimeout(function () { G.odo(ppr, ppr._odoVal, { fromZero: true }); }, 260); }
            s.pshop.setAttribute('aria-hidden', want ? 'false' : 'true');
            if (want) s.pshop.removeAttribute('inert'); else s.pshop.setAttribute('inert', '');
          }
        }
      }
      if (s.prog) {
        var pg = 'scaleX(' + (dur ? Math.min(1, tShow / dur) : 0).toFixed(4) + ')';
        if (s._pg !== pg) { s._pg = pg; s.prog.style.transform = pg; }
      }
    });

    scrubs.forEach(function (s2) { if (s2.vid && s2.cur != null && s2.last != null && Math.abs(s2.cur - s2.last) > 0.004) busy = Math.max(busy, 2); s2.last = s2.cur; });


    /* sticky buy bar: hidden over hero, shop and scroll stages */
    if (buybar && heroRect && shopRect) {
      var inStage = secRects.some(function (r) { return r.top <= NAV + 1 && r.bottom >= vh - 1; });
      var footRect = footEl ? footEl.getBoundingClientRect() : null;
      var show = heroRect.bottom < 0 && !inStage && !(shopRect.top < vh && shopRect.bottom > 0) && !(footRect && footRect.top < vh * 0.7);
      buybar.classList.toggle('show', show);
      if (!show && buybar.classList.contains('pick')) bbPick(false);
    }
  }

  if ('IntersectionObserver' in window) {
    var odoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.hasAttribute('data-piece-no')) { el._seen = true; G.flap(el, G.pieceNo()); }
        else if (el._odoVal) G.odo(el, el._odoVal, { fromZero: true });
        odoIO.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    setTimeout(function () { $$('.price[data-current-price], .bb-price, [data-piece-no]').forEach(function (el) { odoIO.observe(el); }); }, 0);
  }
  function pillsAll() { $$('.has-pill').forEach(G.slidePill); }
  var pillT = null;
  window.addEventListener('resize', function () { clearTimeout(pillT); pillT = setTimeout(pillsAll, 120); });
  document.addEventListener('grimz:lang', function () { setTimeout(pillsAll, 30); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pillsAll);

  /* init */
  renderPShops();
  renderShop();
  renderCart();
  document.dispatchEvent(new CustomEvent('grimz:dom'));
  requestAnimationFrame(tick);
})();
