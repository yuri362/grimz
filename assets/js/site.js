/* =========================================================
   GRIMZ — site.js
   Shared by every page: config, language, cart, cookie banner,
   withdrawal form, magnetic buttons, custom cursor.
   Exposes window.GRIMZ for the page scripts.
   ========================================================= */
(function () {
  'use strict';

  /* ===== CONFIG — edit here ===== */
  var CONFIG = {
    prices: { set: 109.99, jacket: 69.99, pants: 59.99 },
    model: { height: 0, size: '' },   // fill in, e.g. { height: 185, size: 'L' } → "The model is 185 cm and wears L" // euro, VAT included · 0 = shows the placeholder [PRICE]
    pieces: 0,        // limited-run size · 0 = shows [N]
    soldCount: 0,     // pieces already sold → the next piece is number soldCount + 1 (connect to your backend)
    sizes: ['XS', 'S', 'M', 'L', 'XL'],

    // Recommended BODY measurements per size (cm, kg).
    // PROVISIONAL standard values for an oversized unisex fit: replace them with the real GRIMZ chart.
    sizeChart: {
      XS: { height: [160, 168], chest: [84, 90],   waist: [70, 76],  hips: [86, 92],   weight: [50, 60] },
      S:  { height: [166, 174], chest: [90, 96],   waist: [76, 82],  hips: [92, 98],   weight: [58, 68] },
      M:  { height: [172, 180], chest: [96, 102],  waist: [82, 88],  hips: [98, 104],  weight: [66, 77] },
      L:  { height: [178, 186], chest: [102, 108], waist: [88, 94],  hips: [104, 110], weight: [75, 87] },
      XL: { height: [184, 194], chest: [108, 116], waist: [94, 102], hips: [110, 118], weight: [85, 100] }
    },

    shipping: [
      // days = business days for delivery (provisional: set your real courier times) · price 0 = shows the placeholder
      { id: 'standard', price: 0, days: [2, 4], name: { en: 'Standard', it: 'Standard' }, eta: { en: '2–4 business days', it: '2–4 giorni lavorativi' } },
      { id: 'express', price: 0, days: [1, 2], name: { en: 'Express', it: 'Express' }, eta: { en: '1–2 business days', it: '1–2 giorni lavorativi' } }
    ],
    cutoffHour: 14,      // orders after this hour ship the next business day
    // drop state: 'live' (on sale) · 'soon' (countdown + waitlist) · 'soldout' (sold out → Drop 02 list). Preview with ?drop=soon / ?drop=soldout
    drop: { status: 'live', launch: '2026-11-21T18:00:00+01:00', next: 'Drop 02' },
    // availability per size (false = sold out → "notify me"). Preview with ?oos=M
    stock: {
      set: { XS: true, S: true, M: true, L: true, XL: true },
      jacket: { XS: true, S: true, M: true, L: true, XL: true },
      pants: { XS: true, S: true, M: true, L: true, XL: true }
    },
    // garment measurements in cm, laid flat (PROVISIONAL — replace with the real pattern measurements before going live)
    garment: {
      jacket: { cols: ['chest', 'length', 'sleeve'], XS: [60, 64, 80], S: [62.5, 66, 82], M: [65, 68, 84], L: [67.5, 70, 86], XL: [70, 72, 88] },
      pants: { cols: ['waist', 'outseam', 'inseam', 'hem'], XS: [34, 102, 76, 27], S: [36, 104, 77, 28], M: [38, 106, 78, 29], L: [40, 108, 79, 30], XL: [42, 110, 80, 31] }
    },
    // materials & origin — fill in (empty = shows "to be completed")
    materials: { shell: '', lining: '', weight: '', origin: '', panels: '' },
    whatsapp: '',        // e.g. '393331234567' → WhatsApp button in Help & FAQ
    freeShippingFrom: 0, // € threshold for free shipping · 0 = bar hidden
    installments: 3,     // "pay in 3 interest-free" message · 0 = hidden
    discounts: {},       // e.g. { WELCOME10: 10 } = 10% off
    hq: { lat: 42.5, lng: 12.5 } // brand base shown on the globe (placeholder: Italy)
  };

  var VARIANTS = {
    set: {
      imgs: ['set-front.webp', 'set-side.webp', 'set-back.webp'],
      name: { en: 'Track Set', it: 'Completo' },
      cart: { en: 'Sanzaru Track Set', it: 'Sanzaru Completo' },
      desc: {
        en: 'Jacket and pants, made to be worn together: reflective lightning panels, ankh zip hardware, the three monkeys on the back.',
        it: 'Giacca e pantalone, fatti per stare insieme: pannelli riflettenti a saetta, zip con tiretti ankh, le tre scimmie sulla schiena.'
      }
    },
    jacket: {
      imgs: ['jacket-front.webp', 'jacket-side.webp', 'jacket-back.webp'],
      name: { en: 'Jacket', it: 'Giacca' },
      cart: { en: 'Sanzaru Jacket', it: 'Sanzaru Giacca' },
      desc: {
        en: 'Cropped technical jacket with storm hood, reflective panels, ankh zip pockets and the three wise monkeys on the back.',
        it: 'Giacca tecnica corta con cappuccio, pannelli riflettenti, tasche zip ankh e le tre scimmie sagge sulla schiena.'
      }
    },
    pants: {
      imgs: ['pants-front.webp', 'pants-side.webp', 'pants-back.webp'],
      name: { en: 'Pants', it: 'Pantalone' },
      cart: { en: 'Sanzaru Pants', it: 'Sanzaru Pantalone' },
      desc: {
        en: 'Wide-leg technical pants with elastic waist, lightning reflective panels, ankh zip pocket and ankle zips.',
        it: 'Pantalone tecnico a gamba larga con vita elastica, pannelli riflettenti a saetta, tasca zip ankh e zip alla caviglia.'
      }
    }
  };

  var MEDIA = 'assets/media/';

  /* ===== helpers ===== */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('grimz:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('grimz:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    }
  };
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== language ===== */
  var lang = document.documentElement.getAttribute('data-lang') === 'it' ? 'it' : 'en';
  function L(en, it) { return lang === 'it' ? it : en; }
  function applyLang() {
    var html = document.documentElement;
    html.lang = lang;
    html.setAttribute('data-lang', lang);
    $$('[data-lang-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang-btn') === lang ? 'true' : 'false');
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      var v = el.getAttribute('data-' + lang);
      if (v != null) el.setAttribute(el.getAttribute('data-i18n-attr'), v);
    });
  }
  function setLang(l) {
    lang = l === 'it' ? 'it' : 'en';
    store.set('lang', lang);
    applyLang();
    document.dispatchEvent(new CustomEvent('grimz:lang', { detail: lang }));
  }

  /* ===== money & product ===== */
  function price(v) {
    var n = Number(CONFIG.prices[v]);
    return isFinite(n) && n > 0 ? n : 0;
  }
  function money(n) {
    if (!n) return L('€ [PRICE]', '€ [PREZZO]');
    // local convention: "109,99 €" in Italian, "€109.99" in English
    return new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-GB', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
  }
  /* delivery estimate in business days, e.g. "Wed 29 – Fri 31 Oct" */
  function addBusinessDays(d, n) {
    var x = new Date(d.getTime());
    while (n > 0) { x.setDate(x.getDate() + 1); var w = x.getDay(); if (w !== 0 && w !== 6) n--; }
    return x;
  }
  function eta(id) {
    var o = CONFIG.shipping.filter(function (s) { return s.id === (id || 'standard'); })[0] || CONFIG.shipping[0];
    if (!o || !o.days) return null;
    var now = new Date(), start = new Date(now.getTime());
    if (now.getHours() >= (CONFIG.cutoffHour || 14) || now.getDay() === 0 || now.getDay() === 6) start = addBusinessDays(now, 1);
    var a = addBusinessDays(start, o.days[0]), b = addBusinessDays(start, o.days[1]);
    var loc = lang === 'it' ? 'it-IT' : 'en-GB';
    var fd = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric' });
    var fm = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short' });
    var range = fd.format(a) + ' – ' + fm.format(b);
    return { from: a, to: b, text: L('Order today, arrives ' + range, 'Ordina oggi, arriva tra ' + range.replace(' – ', ' e ')) };
  }
  /* gift option and wishlist (per-viewer conveniences, kept in the browser) */
  function getGift() { return store.get('gift', { on: false, msg: '' }) || { on: false, msg: '' }; }
  function setGift(g) { store.set('gift', g); }
  function getWish() { return store.get('wish', []) || []; }
  function toggleWish(v) {
    var w = getWish(), i = w.indexOf(v);
    if (i >= 0) w.splice(i, 1); else w.push(v);
    store.set('wish', w);
    document.dispatchEvent(new CustomEvent('grimz:wish'));
    return i < 0;
  }
  /* preview switches for the drop states and sold-out sizes: ?drop=soon|soldout · ?oos=M,L */
  (function previewParams() {
    try {
      var q = new URLSearchParams(location.search);
      var d = q.get('drop'); if (d === 'soon' || d === 'soldout' || d === 'live') CONFIG.drop.status = d;
      var o = q.get('oos');
      if (o) o.split(',').forEach(function (sz) { ['set', 'jacket', 'pants'].forEach(function (v) { if (CONFIG.stock[v][sz] !== undefined) CONFIG.stock[v][sz] = false; }); });
    } catch (e) { /* ignore */ }
  })();
  function inStock(v, size) { var s = CONFIG.stock[v]; return !s || s[size] !== false; }

  function pieceNo(offset) {
    var n = (Number(CONFIG.soldCount) || 0) + 1 + (offset || 0);
    return '№ ' + String(n).padStart(3, '0');
  }

  /* ===== sizes ===== */
  function fitText(size) {
    var c = CONFIG.sizeChart[size];
    if (!c) return null;
    var r = function (a) { return a[0] + '–' + a[1]; };
    return {
      size: size,
      rows: [
        { k: L('Height', 'Altezza'), v: r(c.height) + ' cm' },
        { k: L('Chest', 'Torace'), v: r(c.chest) + ' cm' },
        { k: L('Waist', 'Vita'), v: r(c.waist) + ' cm' },
        { k: L('Hips', 'Bacino'), v: r(c.hips) + ' cm' }
      ]
    };
  }
  // simple fit finder: height decides, weight nudges one size up/down
  function recommendSize(h, w) {
    var sizes = CONFIG.sizes;
    var best = 0, bestScore = Infinity;
    sizes.forEach(function (s, i) {
      var c = CONFIG.sizeChart[s];
      var hm = (c.height[0] + c.height[1]) / 2, wm = (c.weight[0] + c.weight[1]) / 2;
      var score = Math.abs(h - hm) / 4 + (w ? Math.abs(w - wm) / 5 : 0);
      if (score < bestScore) { bestScore = score; best = i; }
    });
    return sizes[best];
  }

  /* ===== cart ===== */
  function getCart() {
    var c = store.get('cart', []);
    if (!Array.isArray(c)) return [];
    return c.filter(function (i) {
      return i && VARIANTS[i.variant] && typeof i.qty === 'number' && i.qty > 0 && typeof i.size === 'string';
    });
  }
  function setCart(c) {
    store.set('cart', c);
    document.dispatchEvent(new CustomEvent('grimz:cart'));
  }
  function addItem(variant, size) {
    var c = getCart();
    var key = variant + '-' + size;
    var f = c.filter(function (i) { return i.key === key; })[0];
    if (f) f.qty += 1; else c.push({ key: key, variant: variant, size: size, qty: 1 });
    setCart(c);
    if (navigator.vibrate) { try { navigator.vibrate(14); } catch (e) { /* ignore */ } }
  }
  function changeQty(key, d) {
    setCart(getCart()
      .map(function (i) { return i.key === key ? { key: i.key, variant: i.variant, size: i.size, qty: i.qty + d } : i; })
      .filter(function (i) { return i.qty > 0; }));
  }
  function totals(cart) {
    var count = 0, sub = 0, missing = false;
    (cart || getCart()).forEach(function (i) {
      var u = price(i.variant);
      count += i.qty; sub += u * i.qty;
      if (!u) missing = true;
    });
    return { count: count, sub: sub, missing: missing };
  }

  /* ===== cookie banner (Garante 10/06/2021: X = reject, accept/reject same weight) ===== */
  var CONSENT_DAYS = 180;
  function getConsent() {
    var c = store.get('consent', null);
    if (!c || !c.ts) return null;
    if (Date.now() - c.ts > CONSENT_DAYS * 864e5) return null;
    return c;
  }
  function saveConsent(analytics, marketing) {
    var c = { necessary: true, analytics: !!analytics, marketing: !!marketing, ts: Date.now() };
    store.set('consent', c);
    document.dispatchEvent(new CustomEvent('grimz:consent', { detail: c }));
    // TODO: load analytics / marketing tools here ONLY if c.analytics / c.marketing are true.
    return c;
  }
  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'cc';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', 'cc-title');
    el.innerHTML =
      '<button type="button" class="cc-x" data-cc="reject" aria-label="' + esc(L('Close and reject', 'Chiudi e rifiuta')) + '">' +
      '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<p class="cc-t" id="cc-title">Cookie</p>' +
      '<p class="cc-p"><span class="en">We use technical tools needed for the site to work (cart, language). With your consent we could also use statistics and marketing cookies.</span>' +
      '<span class="it">Usiamo strumenti tecnici necessari al funzionamento del sito (carrello, lingua). Con il tuo consenso potremmo usare anche cookie statistici e di marketing.</span> ' +
      '<a href="cookie.html">Cookie policy</a></p>' +
      '<div class="cc-prefs" data-cc-prefs hidden>' +
      '<label class="cc-row"><span><strong><span class="en">Necessary</span><span class="it">Necessari</span></strong><small><span class="en">Always on</span><span class="it">Sempre attivi</span></small></span><input type="checkbox" checked disabled></label>' +
      '<label class="cc-row"><span><strong><span class="en">Statistics</span><span class="it">Statistiche</span></strong><small><span class="en">Anonymous visit measurement</span><span class="it">Misurazione anonima delle visite</span></small></span><input type="checkbox" data-cc-analytics></label>' +
      '<label class="cc-row"><span><strong>Marketing</strong><small><span class="en">Personalised ads</span><span class="it">Pubblicità personalizzata</span></small></span><input type="checkbox" data-cc-marketing></label>' +
      '</div>' +
      '<div class="cc-actions">' +
      '<button type="button" class="btn btn-line" data-cc="reject"><span class="en">Reject</span><span class="it">Rifiuta</span></button>' +
      '<button type="button" class="btn btn-line" data-cc="accept"><span class="en">Accept all</span><span class="it">Accetta tutti</span></button>' +
      '<button type="button" class="cc-link" data-cc="prefs"><span class="en">Customise</span><span class="it">Personalizza</span></button>' +
      '<button type="button" class="btn btn-line" data-cc="save" hidden><span class="en">Save choices</span><span class="it">Salva le scelte</span></button>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }
  var banner = null;
  function openConsent(withPrefs) {
    if (!banner) banner = buildBanner();
    var c = getConsent();
    $('[data-cc-analytics]', banner).checked = !!(c && c.analytics);
    $('[data-cc-marketing]', banner).checked = !!(c && c.marketing);
    $('[data-cc-prefs]', banner).hidden = !withPrefs;
    $('[data-cc="save"]', banner).hidden = !withPrefs;
    $('[data-cc="prefs"]', banner).hidden = !!withPrefs;
    banner.classList.add('show');
  }
  function closeConsent() { if (banner) banner.classList.remove('show'); }

  /* ===== withdrawal form (recesso.html — art. 54-bis Codice del Consumo) ===== */
  function initWithdrawal() {
    var form = $('[data-withdraw]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', form).forEach(function (i) {
        var bad = !i.value.trim() || (i.type === 'email' && !/\S+@\S+\.\S+/.test(i.value));
        i.classList.toggle('bad', bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      // TODO: send to your backend: it must store the request and email the confirmation
      //       (content of the declaration + date and time) on a durable medium.
      var now = new Date();
      var stamp = now.toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' });
      $('[data-withdraw-stamp]').textContent = stamp;
      $('[data-withdraw-order]').textContent = $('[name="order"]', form).value.trim();
      $('[data-withdraw-email]').textContent = $('[name="email"]', form).value.trim();
      form.hidden = true;
      $('[data-withdraw-done]').hidden = false;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ===== magnetic buttons ===== */
  function clampPct(v) { return Math.max(-10, Math.min(110, v)).toFixed(1); }
  function initMagnetic() {
    if (!fine || reduce) return;
    var items = [];
    function collect() { items = $$('[data-magnetic]'); }   // buy buttons stay still: no magnet on .btn-pink
    collect();
    document.addEventListener('grimz:dom', collect);
    var mx = -999, my = -999, queued = false;
    document.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    function update() {
      queued = false;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width || r.bottom < -100 || r.top > window.innerHeight + 100) return;
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = mx - cx, dy = my - cy;
        var reach = Math.max(r.width, r.height) * 0.5 + 70;   // attraction radius
        var d = Math.hypot(dx, dy);
        if (d < reach) {
          var f = (1 - d / reach);
          el.style.transform = 'translate(' + (dx * 0.32 * f).toFixed(1) + 'px,' + (dy * 0.42 * f).toFixed(1) + 'px)';
          el.classList.add('is-mag');
        } else if (el.classList.contains('is-mag')) {
          el.style.transform = '';
          el.classList.remove('is-mag');
        }
      });
    }
  }

  /* ===== pink liquid glass: the specular highlight follows the cursor (the button itself does not move) ===== */
  function initSheen() {
    if (!fine) return;
    document.addEventListener('pointermove', function (e) {
      var b = e.target.closest ? e.target.closest('.btn-pink') : null;
      if (!b) return;
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', clampPct((e.clientX - r.left) / r.width * 100) + '%');
    }, { passive: true });
  }

  /* ===== custom cursor (desktop only) ===== */
  function initCursor() {
    if (!fine || reduce) return;
    var c = document.createElement('div');
    c.className = 'cursor';
    c.innerHTML = '<span class="cursor-lbl"></span>';
    document.body.appendChild(c);
    document.documentElement.classList.add('has-cursor');
    var lbl = c.firstChild;
    var x = -100, y = -100, tx = -100, ty = -100;
    var running = false;
    function loop() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      // stop the loop as soon as the cursor has caught up: no work while the mouse is still
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) requestAnimationFrame(loop); else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; kick();
      var t = e.target.closest ? e.target.closest('[data-cursor], a, button, input, select, label, summary') : null;
      var mode = t && t.hasAttribute('data-cursor') ? t.getAttribute('data-cursor') : (t ? 'link' : '');
      if (c.getAttribute('data-mode') !== mode) {
        c.setAttribute('data-mode', mode);
        var words = { drag: L('Drag', 'Trascina'), zoom: 'Zoom', scroll: L('Scroll', 'Scorri') };
        lbl.textContent = words[mode] || '';
      }
    }, { passive: true });
    document.addEventListener('pointerdown', function () { c.classList.add('down'); });
    document.addEventListener('pointerup', function () { c.classList.remove('down'); });
    document.addEventListener('mouseleave', function () { tx = ty = -100; kick(); });
  }

  /* ===== global events ===== */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang-btn],[data-cc],[data-open-consent]');
    if (!b) return;
    if (b.hasAttribute('data-lang-btn')) { setLang(b.getAttribute('data-lang-btn')); return; }
    if (b.hasAttribute('data-open-consent')) { e.preventDefault(); openConsent(true); return; }
    var a = b.getAttribute('data-cc');
    if (a === 'accept') { saveConsent(true, true); closeConsent(); }
    else if (a === 'reject') { saveConsent(false, false); closeConsent(); }
    else if (a === 'prefs') { openConsent(true); }
    else if (a === 'save') { saveConsent($('[data-cc-analytics]', banner).checked, $('[data-cc-marketing]', banner).checked); closeConsent(); }
  });


  /* =========================================================
     PREMIUM MOTION LAYER — transform/opacity only, off with "reduce motion"
     ========================================================= */

  /* price odometer: every digit rolls like a mechanical counter; cents small and raised, € lighter */
  function odo(el, n, opts) {
    if (!el) return;
    el._odoVal = n;
    if (!n) { el.textContent = money(n); el._odoKey = null; return; }
    var loc = lang === 'it' ? 'it-IT' : 'en-GB';
    var parts = new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).formatToParts(n);
    var key = loc + '|' + parts.map(function (p) { return (p.type === 'integer' || p.type === 'fraction') ? p.type + p.value.length : p.type; }).join('|');
    var fresh = el._odoKey !== key || (opts && opts.fromZero);
    if (fresh) {
      var col = '<span class="od-d"><span class="od-col">' + '0123456789'.split('').map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</span></span>';
      el.innerHTML = '<span class="sr">' + esc(money(n)) + '</span><span class="od" aria-hidden="true">' + parts.map(function (p) {
        if (p.type === 'integer') return '<span class="od-int">' + p.value.split('').map(function () { return col; }).join('') + '</span>';
        if (p.type === 'fraction') return '<span class="od-frac">' + p.value.split('').map(function () { return col; }).join('') + '</span>';
        if (p.type === 'decimal') return '<span class="od-dec">' + esc(p.value) + '</span>';
        if (p.type === 'currency') return '<span class="od-cur">' + esc(p.value) + '</span>';
        if (p.type === 'group') return '<span class="od-grp">' + esc(p.value) + '</span>';
        return '<span class="od-lit">' + (/\s/.test(p.value) ? '&#8202;' : esc(p.value)) + '</span>';
      }).join('') + '</span>';
      el._odoKey = key;
    } else {
      var sr = el.querySelector('.sr'); if (sr) sr.textContent = money(n);
    }
    var digits = parts.filter(function (p) { return p.type === 'integer' || p.type === 'fraction'; }).map(function (p) { return p.value; }).join('');
    var cols = el.querySelectorAll('.od-col'), i;
    if (fresh) { for (i = 0; i < cols.length; i++) { cols[i].style.transition = 'none'; cols[i].style.transform = 'translateY(0)'; } void el.offsetWidth; }
    for (i = 0; i < cols.length; i++) {
      cols[i].style.transition = '';
      cols[i].style.transitionDelay = (reduce ? 0 : i * 45) + 'ms';
      cols[i].style.transform = 'translateY(' + (-Number(digits[i]) * 10) + '%)';
    }
  }

  /* split-flap: the digits shuffle and settle one after the other, like a departures board */
  function flap(el, text) {
    if (!el) return;
    clearInterval(el._flap);
    if (reduce) { el.textContent = text; return; }
    var chars = text.split(''), t0 = performance.now(), base = 260, per = 90;
    el._flap = setInterval(function () {
      var t = performance.now() - t0, out = '';
      for (var i = 0; i < chars.length; i++) out += /\d/.test(chars[i]) && t < base + i * per ? String(Math.floor(Math.random() * 10)) : chars[i];
      el.textContent = out;
      if (t > base + chars.length * per) { clearInterval(el._flap); el.textContent = text; }
    }, 50);
  }

  /* count a number up/down inside a sentence */
  function countTo(el, from, to, render) {
    if (!el) return;
    cancelAnimationFrame(el._cnt);
    if (reduce || !from || from === to) { el.textContent = render(to); return; }
    var t0 = performance.now(), d = 560;
    (function step(now) {
      var p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3);
      el.textContent = render(from + (to - from) * e);
      if (p < 1) el._cnt = requestAnimationFrame(step);
    })(t0);
  }

  /* one white pill that glides between the options of a group (sizes, variants) */
  function slidePill(group) {
    if (!group) return;
    var pill = group.querySelector(':scope > .slide-pill');
    if (!pill) {
      pill = document.createElement('span'); pill.className = 'slide-pill'; pill.setAttribute('aria-hidden', 'true');
      group.insertBefore(pill, group.firstChild); group.classList.add('has-pill');
    }
    var on = group.querySelector(':scope > .on');
    if (!on || !on.offsetWidth) { pill.style.opacity = '0'; return; }
    var appearing = pill.style.opacity !== '1';
    if (appearing) pill.style.transition = 'none';
    pill.style.width = on.offsetWidth + 'px';
    pill.style.height = on.offsetHeight + 'px';
    pill.style.transform = 'translate(' + on.offsetLeft + 'px,' + on.offsetTop + 'px)';
    if (appearing) { void pill.offsetWidth; pill.style.transition = ''; }
    pill.style.opacity = '1';
  }

  /* headings rise line by line from behind a mask */
  var LINE_SEL = '.mani .disp, .worn-head .disp, .world .disp, .news .disp, .st-h, .st-tz-h, .dttl, .faq-h, .ar-next .st-h';
  var lineIO = null;
  function splitLines(el) {
    var host = el.querySelector(':scope > .' + lang) || el;
    var stamp = lang + '|' + window.innerWidth;
    if (host._split === stamp || host._split === 'skip') return;
    if (host._orig == null) host._orig = host.innerHTML; else host.innerHTML = host._orig;
    if (/<(?!br\b|\/?span class="(?:en|it)")[a-z]/i.test(host._orig)) { host._split = 'skip'; return; }
    var tokens = host._orig.split(/(<br\s*\/?>|\s+)/i).filter(function (t) { return t && !/^\s+$/.test(t); });
    host.innerHTML = tokens.map(function (t) { return /^<br/i.test(t) ? '<br>' : '<span class="lw">' + t + '</span>'; }).join(' ');
    var lines = [], last = null;
    Array.prototype.forEach.call(host.querySelectorAll('.lw, br'), function (n) {
      if (n.tagName === 'BR') { last = null; return; }
      var top = n.offsetTop;
      if (last === null || Math.abs(top - last) > 4) { lines.push([]); last = top; }
      lines[lines.length - 1].push(n.innerHTML);
    });
    host.innerHTML = lines.map(function (ws, i) { return '<span class="ln"><span class="ln-in" style="transition-delay:' + (i * 70) + 'ms">' + ws.join(' ') + '</span></span>'; }).join('');
    host._split = stamp;
  }
  function initLines() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var els = $$(LINE_SEL);
    if (!els.length) return;
    function run() {
      els.forEach(function (el) { splitLines(el); el.classList.add('lines'); });
      if (!lineIO) {
        lineIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('lines-in'); lineIO.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -12% 0px' });
        els.forEach(function (el) { lineIO.observe(el); });
      }
    }
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
    var rt = null, lastW = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(rt); rt = setTimeout(function () { els.forEach(splitLines); }, 200); });
    document.addEventListener('grimz:lang', function () { setTimeout(function () { els.forEach(splitLines); }, 0); });
  }

  /* photos open like a curtain; a few drift slightly while scrolling */
  function initCurtains() {
    var els = $$('[data-curtain]');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  function initParallax() {
    var els = $$('[data-parallax]');
    if (!els.length || reduce || !('IntersectionObserver' in window)) return;
    function box(e) { var p = e.parentElement; return p && p.tagName === 'PICTURE' ? p.parentElement : p; }
    var queued = false;
    function run() {
      queued = false;
      var vh = window.innerHeight;
      els.forEach(function (e) {
        if (!e._pv) return;
        var r = box(e).getBoundingClientRect();
        var k = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        e.style.transform = 'translate3d(0,' + (k * -5).toFixed(2) + '%,0)';
      });
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(run); } }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { en.target._pv = en.isIntersecting; }); queue(); }, { rootMargin: '10% 0px' });
    els.forEach(function (e) { io.observe(e); });
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
  }

  /* page transitions: shared elements morph (View Transitions); every other page change passes under a signed glass veil */
  var vtNative = 'onpagereveal' in window;
  function initTransitions() {
    $$('[data-vt]').forEach(function (e) { e.style.viewTransitionName = e.getAttribute('data-vt'); });
    var v = document.createElement('div');
    v.className = 'veil'; v.setAttribute('aria-hidden', 'true');
    v.innerHTML = '<span class="veil-g">G</span>';
    document.body.appendChild(v);
    var root = document.documentElement;
    if (root.classList.contains('veil-in')) {
      v.classList.add('cover');
      root.classList.remove('veil-in');
      setTimeout(function () {
        v.classList.remove('cover'); v.classList.add('lift');
        setTimeout(function () { v.classList.remove('lift'); }, 700);
      }, 160);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname) || url.pathname === location.pathname) return;
      if (vtNative && (a.querySelector('[data-vt]') || /checkout\.html$/.test(url.pathname))) return;   // the browser morphs the shared element
      if (reduce) return;
      e.preventDefault();
      try { sessionStorage.setItem('grimz:veil', '1'); } catch (err) { /* ignore */ }
      v.classList.add('drop');
      setTimeout(function () { location.href = url.href; }, 400);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) v.classList.remove('drop', 'cover', 'lift'); });
  }

  /* ===== scroll reveal for pages without the home engine ===== */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!els.length || document.querySelector('[data-hero]')) return;   // the home page has its own engine
    document.documentElement.classList.add('js');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ===== waitlist / back-in-stock / newsletter forms (front-end only) =====
     TODO: send { email, list, size, variant } to your email provider (e.g. Klaviyo) with explicit consent. */
  function initWaitlist() {
    document.addEventListener('submit', function (e) {
      var f = e.target.closest('[data-waitlist]');
      if (!f) return;
      e.preventDefault();
      var input = $('input[type="email"]', f);
      if (!input || !/\S+@\S+\.\S+/.test(input.value)) { if (input) input.focus(); return; }
      f.hidden = true;
      var ok = f.parentNode.querySelector('[data-waitlist-ok]'); if (ok) ok.hidden = false;
    });
  }

  /* =========================================================
     PREMIUM LAYER — sounds, chrome light, ticker, ambient light,
     thawing photos, local-currency hint, end-of-page signature
     ========================================================= */

  /* --- UI sounds: synthesised (no files), OFF until the visitor turns them on --- */
  var sfxOn = store.get('sfx', false) === true, actx = null;
  function sfx(name) {
    if (!sfxOn) return;
    try {
      if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; actx = new AC(); }
      if (actx.state === 'suspended') actx.resume();
      var t = actx.currentTime + 0.005, out = actx.createGain();
      out.gain.value = 0.9; out.connect(actx.destination);
      var tone = function (f0, f1, dur, vol, type, at) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t + (at || 0));
        if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + (at || 0) + dur);
        g.gain.setValueAtTime(0.0001, t + (at || 0));
        g.gain.exponentialRampToValueAtTime(vol, t + (at || 0) + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (at || 0) + dur);
        o.connect(g); g.connect(out); o.start(t + (at || 0)); o.stop(t + (at || 0) + dur + 0.02);
      };
      var noise = function (dur, freq, vol, at) {
        var n = Math.floor(actx.sampleRate * dur), b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
        var s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
        s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9; g.gain.value = vol;
        s.connect(f); f.connect(g); g.connect(out); s.start(t + (at || 0));
      };
      if (name === 'tick') { tone(2100, 1400, 0.035, 0.05, 'triangle'); }
      else if (name === 'add') { tone(190, 105, 0.11, 0.16); tone(1568, 0, 0.18, 0.035, 'sine', 0.06); tone(2349, 0, 0.22, 0.02, 'sine', 0.1); }
      else if (name === 'shutter') { noise(0.03, 3200, 0.5); noise(0.045, 1800, 0.35, 0.07); }
      else if (name === 'stamp') { tone(92, 48, 0.2, 0.32); noise(0.05, 900, 0.3); }
      else if (name === 'on') { tone(1320, 0, 0.06, 0.04, 'sine'); tone(1980, 0, 0.09, 0.03, 'sine', 0.05); }
    } catch (e) { /* audio unavailable: stay silent */ }
  }
  function renderSfx() {
    $$('[data-sfx-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', sfxOn ? 'true' : 'false');
      var lb = b.querySelector('[data-sfx-label]');
      if (lb) lb.textContent = sfxOn ? L('Sounds on', 'Suoni attivi') : L('Sounds off', 'Suoni spenti');
      b.setAttribute('aria-label', L('Interface sounds', 'Suoni dell’interfaccia'));
    });
  }
  function initSfx() {
    renderSfx();
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-sfx-toggle]');
      if (!b) return;
      sfxOn = !sfxOn; store.set('sfx', sfxOn); renderSfx(); sfx('on');
    });
    document.addEventListener('grimz:lang', renderSfx);
  }

  /* --- chrome that catches the light: the highlight follows the pointer (desktop) or the scroll (touch) --- */
  function initChrome() {
    if (reduce) return;
    var els = $$('.logo, .foot-word, .deg, .piece strong, .st-num, .st-word, .st-card-type span, .st-cert-no, .ar-no');
    if (!els.length) return;
    var live = [], px = window.innerWidth / 2, py = window.innerHeight * 0.3, raf = 0;
    els.forEach(function (e) { e.classList.add('chrome-live'); e._cx = 50; e._cy = 50; });
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
      en.forEach(function (x) { var i = live.indexOf(x.target); if (x.isIntersecting && i < 0) live.push(x.target); else if (!x.isIntersecting && i >= 0) live.splice(i, 1); });
      kick();
    }) : null;
    if (io) els.forEach(function (e) { io.observe(e); }); else live = els.slice();
    function frame() {
      raf = 0;
      var vw = window.innerWidth, vh = window.innerHeight, moving = false;
      live.forEach(function (e) {
        var tx, ty;
        // desktop: only the pointer moves the light (scrolling never repaints the letters);
        // touch: the scroll position does, in 2% steps, so big words repaint a few times, not every frame
        if (fine) { tx = 50 - (px / vw - 0.5) * 70; ty = 50 - (py / vh - 0.5) * 50; }
        else { var r = e.getBoundingClientRect(), k = (r.top + r.height / 2) / vh; tx = 15 + k * 70; ty = 30 + k * 40; }
        tx = Math.max(0, Math.min(100, tx)); ty = Math.max(0, Math.min(100, ty));
        e._cx += (tx - e._cx) * 0.14; e._cy += (ty - e._cy) * 0.14;
        if (Math.abs(tx - e._cx) > 0.2 || Math.abs(ty - e._cy) > 0.2) moving = true;
        var q = fine ? 0.5 : 2, bp = (Math.round(e._cx / q) * q) + '% ' + (Math.round(e._cy / q) * q) + '%';
        if (e._bp !== bp) { e._bp = bp; e.style.backgroundPosition = bp; }
      });
      if (moving) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && live.length) raf = requestAnimationFrame(frame); }
    if (fine) window.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; kick(); }, { passive: true });
    else window.addEventListener('scroll', kick, { passive: true });
    kick();
  }

  /* --- ticker: runs faster and leans with the scroll, and runs backwards when you scroll up --- */
  function initTicker() {
    var marq = $('[data-marq]');
    if (!marq || reduce || !marq.getAnimations) return;
    var anim = null, sets = $$('.marq-set', marq), lastY = window.scrollY, lastT = performance.now(), vel = 0, rate = 1, raf = 0, vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(marq);
    function frame(now) {
      raf = 0;
      if (!anim) {
        anim = marq.getAnimations()[0] || null;
        if (!anim) return;
        var d = anim.effect && anim.effect.getTiming ? anim.effect.getTiming().duration : 0;
        if (typeof d === 'number' && d > 0) anim.currentTime = (anim.currentTime || 0) + d * 400;   // room to run backwards
      }
      vel *= 0.9;                                                   // the push fades out
      var target = 1 + Math.max(-7, Math.min(7, vel / 220));
      if (Math.abs(target) < 0.15) target = target < 0 ? -0.15 : 0.15;
      rate += (target - rate) * 0.18;
      anim.playbackRate = rate;
      var sk = Math.max(-10, Math.min(10, -vel / 160)).toFixed(2);
      sets.forEach(function (s) { s.style.transform = 'skewX(' + sk + 'deg)'; });
      if (Math.abs(vel) > 2 || Math.abs(rate - 1) > 0.01) raf = requestAnimationFrame(frame);
      else { anim.playbackRate = 1; sets.forEach(function (s) { s.style.transform = ''; }); }
    }
    window.addEventListener('scroll', function () {
      var now = performance.now(), y = window.scrollY, dt = Math.max(8, now - lastT);
      vel = vel * 0.6 + ((y - lastY) / dt * 1000) * 0.4; lastY = y; lastT = now;
      if (vis && !raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }

  /* --- ambient light: the room light changes with the section (pink at the product, cold at the globe, warm at the end) --- */
  function initAmbient() {
    var secs = $$('[data-amb]');
    if (!secs.length || !('IntersectionObserver' in window)) return;
    var amb = document.createElement('div');
    amb.className = 'amb'; amb.setAttribute('aria-hidden', 'true');
    amb.innerHTML = '<i class="amb-pink"></i><i class="amb-cold"></i><i class="amb-warm"></i>';
    document.body.appendChild(amb);
    var cur = '';
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { x.target._ambIn = x.isIntersecting; });
      var next = '';
      secs.forEach(function (s) { if (s._ambIn) next = s.getAttribute('data-amb'); });
      if (next !== cur) { cur = next; amb.setAttribute('data-on', cur); }
    }, { rootMargin: '-35% 0px -35% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* --- photos that thaw: a frosted, blurred preview until the real picture arrives --- */
  function initThaw() {
    var imgs = $$('img[data-lq]');
    imgs.forEach(function (img) {
      if (img.complete && img.naturalWidth) return;
      var lq = img.getAttribute('data-lq');
      img.classList.add('lq');
      img.style.backgroundImage = 'linear-gradient(110deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.09) 50%, rgba(255,255,255,0) 70%), url("' + lq + '")';
      function done() {
        var r = img.getBoundingClientRect(), seen = r.bottom > 0 && r.top < window.innerHeight;
        img.classList.remove('lq');
        if (seen && !reduce) {
          img.classList.add('lq-thaw');
          setTimeout(function () { img.classList.remove('lq-thaw'); img.style.backgroundImage = ''; }, 900);
        } else img.style.backgroundImage = '';
      }
      img.addEventListener('load', function () { (img.decode ? img.decode() : Promise.resolve()).then(done, done); }, { once: true });
      img.addEventListener('error', function () { img.classList.remove('lq'); }, { once: true });
    });
  }

  /* --- local currency: an approximate conversion next to the price (you always pay in euro) ---
     ECB reference rates, units per 1 € — update now and then. Preview with ?cur=USD */
  var FX = {
    date: { en: '23 Oct 2026', it: '23 ott 2026' },
    rates: { USD: 1.1193, GBP: 0.83728, CHF: 0.9227, JPY: 175.51, CAD: 1.5665, AUD: 1.5939, SEK: 11.131, NOK: 10.4665, DKK: 7.4748, PLN: 4.3945, CZK: 24.327, HUF: 366.73, RON: 5.3492, CNY: 7.466, KRW: 1482.46, BRL: 5.6485, MXN: 21.0226, INR: 106.272, TRY: 55.6715, ZAR: 18.5777, SGD: 1.431, HKD: 8.7793, NZD: 1.9682 },
    region: { US: 'USD', GB: 'GBP', CH: 'CHF', LI: 'CHF', JP: 'JPY', CA: 'CAD', AU: 'AUD', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', CN: 'CNY', KR: 'KRW', BR: 'BRL', MX: 'MXN', IN: 'INR', TR: 'TRY', ZA: 'ZAR', SG: 'SGD', HK: 'HKD', NZ: 'NZD' },
    tz: { 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX', 'Europe/London': 'GB', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Istanbul': 'TR', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG', 'Asia/Kolkata': 'IN', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Pacific/Auckland': 'NZ', 'Africa/Johannesburg': 'ZA' }
  };
  var localCur = (function () {
    try { var q = new URLSearchParams(location.search).get('cur'); if (q && FX.rates[q.toUpperCase()]) return q.toUpperCase(); } catch (e) { /* ignore */ }
    var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) { var m = /-([A-Z]{2})\b/i.exec(langs[i] || ''); if (m) { var c = FX.region[m[1].toUpperCase()]; return c || ''; } }
    try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; return FX.region[FX.tz[tz]] || ''; } catch (e2) { return ''; }
  })();
  function fx(el, eur) {
    if (!el) return;
    var rate = localCur && FX.rates[localCur];
    if (!rate || !eur) { el.hidden = true; return; }
    var loc = navigator.language || (lang === 'it' ? 'it-IT' : 'en-GB'), v = eur * rate, txt;
    try { txt = new Intl.NumberFormat(loc, { style: 'currency', currency: localCur, maximumFractionDigits: v >= 100 ? 0 : 2 }).format(v); } catch (e) { txt = Math.round(v) + ' ' + localCur; }
    var key = txt + lang;
    el.hidden = false;
    if (el._fx === key) return;
    el._fx = key;
    el.innerHTML = '<button type="button" class="fx-btn" aria-expanded="false" aria-describedby="">≈ ' + esc(txt) + '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01"/></svg></button>' +
      '<span class="fx-tip" role="tooltip"><strong>≈ ' + esc(txt) + '</strong>' + esc(L('Approximate, at the ECB rate of ' + FX.date.en + '. You pay in euro: your bank applies the rate of the day.', 'Indicativo, al cambio BCE del ' + FX.date.it + '. Paghi in euro: la tua banca applica il cambio del giorno.')) + '</span>';
  }
  function initFx() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.fx-btn');
      $$('.fx-chip.open').forEach(function (c) { if (!b || c !== b.parentNode) { c.classList.remove('open'); var bb = c.querySelector('.fx-btn'); if (bb) bb.setAttribute('aria-expanded', 'false'); } });
      if (!b) return;
      var open = b.parentNode.classList.toggle('open'); b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* --- end-of-page signature: keep scrolling at the very bottom and GRIMZ signs the page --- */
  function initSignature() {
    var sig = $('[data-endsig]');
    if (!sig) return;
    var done = false, idle = null, ty = null;
    function atBottom() { return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4; }
    function stamp() {
      if (done) return; done = true;
      sig.classList.add('stamped');
      sfx('stamp');
      if (navigator.vibrate) { try { navigator.vibrate([10, 40, 18]); } catch (e) { /* ignore */ } }
    }
    window.addEventListener('wheel', function (e) { if (!done && e.deltaY > 0 && atBottom()) stamp(); }, { passive: true });
    window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) { if (!done && ty != null && ty - e.touches[0].clientY > 36 && atBottom()) stamp(); }, { passive: true });
    window.addEventListener('keydown', function (e) { if (!done && /^(End|PageDown|ArrowDown| )$/.test(e.key) && atBottom()) stamp(); });
    window.addEventListener('scroll', function () {
      clearTimeout(idle);
      if (!done && atBottom()) idle = setTimeout(function () { if (atBottom()) stamp(); }, 1400);   // or simply resting on the last line
    }, { passive: true });
  }

  function init() {
    applyLang();
    document.documentElement.classList.add('js');
    initSfx();
    initChrome();
    initTicker();
    initAmbient();
    initThaw();
    initFx();
    initSignature();
    initTransitions();
    initReveal();
    initLines();
    initCurtains();
    initParallax();
    initWaitlist();
    initWithdrawal();
    initMagnetic();
    initSheen();
    initCursor();
    if (!getConsent()) setTimeout(function () { openConsent(false); }, document.querySelector('[data-intro-screen]') ? 2200 : 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.GRIMZ = {
    CONFIG: CONFIG, VARIANTS: VARIANTS, MEDIA: MEDIA,
    $: $, $$: $$, esc: esc, store: store, fine: fine, reduce: reduce,
    lang: function () { return lang; }, L: L, setLang: setLang, applyLang: applyLang,
    price: price, money: money, pieceNo: pieceNo,
    fitText: fitText, recommendSize: recommendSize,
    getCart: getCart, setCart: setCart, addItem: addItem, changeQty: changeQty, totals: totals,
    openConsent: openConsent, odo: odo, flap: flap, countTo: countTo, slidePill: slidePill, eta: eta, getGift: getGift, setGift: setGift, getWish: getWish, toggleWish: toggleWish, inStock: inStock,
    sfx: sfx, fx: fx
  };
})();
