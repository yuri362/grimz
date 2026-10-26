/* =========================================================
   GRIMZ — checkout.js
   Demo checkout: contact → address → shipping → payment → confirmation.
   Nothing is sent anywhere. In production the payment step must be
   handled by Stripe (Payment Element / Checkout) or Shopify.
   ========================================================= */
(function () {
  'use strict';
  var G = window.GRIMZ;
  if (!G) return;
  var $ = G.$, $$ = G.$$, esc = G.esc, CONFIG = G.CONFIG, VARIANTS = G.VARIANTS, MEDIA = G.MEDIA;
  var L = function (en, it) { return G.L(en, it); };

  var form = $('[data-checkout]');
  var ORDER = ['contact', 'address', 'ship', 'pay'];
  var state = { step: 'contact', ship: CONFIG.shipping[0] ? CONFIG.shipping[0].id : '', pay: 'card', discount: null };

  /* ---------- countries (ISO 3166, names localised by the browser) ---------- */
  var CODES = 'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
  function fillCountries() {
    var sel = $('[data-countries]');
    if (!sel) return;
    var cur = sel.value || guessCountry();
    var names;
    try { names = new Intl.DisplayNames([G.lang()], { type: 'region' }); } catch (e) { names = null; }
    var list = CODES.map(function (c) { return { c: c, n: names ? names.of(c) : c }; })
      .sort(function (a, b) { return a.n.localeCompare(b.n, G.lang()); });
    sel.innerHTML = list.map(function (x) { return '<option value="' + x.c + '">' + esc(x.n) + '</option>'; }).join('');
    sel.value = cur;
  }
  function guessCountry() {
    var m = (navigator.language || '').match(/-([A-Z]{2})$/i);
    var c = m ? m[1].toUpperCase() : (G.lang() === 'it' ? 'IT' : 'IT');
    return CODES.indexOf(c) >= 0 ? c : 'IT';
  }
  function countryName(code) {
    try { return new Intl.DisplayNames([G.lang()], { type: 'region' }).of(code); } catch (e) { return code; }
  }

  /* ---------- money ---------- */
  function shipOpt() { return CONFIG.shipping.filter(function (s) { return s.id === state.ship; })[0] || CONFIG.shipping[0]; }
  function calc() {
    var cart = G.getCart();
    var t = G.totals(cart);
    var disc = state.discount ? Math.round(t.sub * state.discount.pct) / 100 : 0;
    var opt = shipOpt();
    var th = Number(CONFIG.freeShippingFrom) || 0;
    var shipFree = th > 0 && !t.missing && t.sub - disc >= th;
    var shipPrice = shipFree ? 0 : (opt ? Number(opt.price) || 0 : 0);
    var shipMissing = !shipFree && !shipPrice;
    return {
      cart: cart, count: t.count, sub: t.sub, disc: disc, ship: shipPrice, shipFree: shipFree,
      missing: t.missing || shipMissing,
      total: t.sub - disc + shipPrice
    };
  }

  /* ---------- summary ---------- */
  function renderSummary() {
    var lang = G.lang();
    var c = calc();
    var box = $('[data-sum-items]');
    if (box) {
      box.innerHTML = c.cart.map(function (i) {
        var V = VARIANTS[i.variant];
        return '<div class="sum-item"><div class="sum-thumb"><img src="' + MEDIA + V.imgs[0] + '" alt=""><span class="sum-qty">' + i.qty + '</span></div>' +
          '<div><p>' + esc(V.cart[lang]) + '</p><small>' + esc(L('Size ', 'Taglia ') + i.size) + '</small></div>' +
          '<p>' + esc(G.money(G.price(i.variant) * i.qty)) + '</p></div>';
      }).join('');
    }
    var firstThumb = $('.sum-item .sum-thumb img'); if (firstThumb) firstThumb.style.viewTransitionName = 'product';
    var gs = $('[data-gift-sum]'), gift = G.getGift ? G.getGift() : null;
    if (gs) { gs.hidden = !(gift && gift.on); if (gift && gift.on) gs.textContent = L('Gift · no prices on the packing slip', 'Regalo · nessun prezzo nel documento di spedizione') + (gift.msg ? ' · “' + gift.msg + '”' : ''); }
    var eo = G.eta ? G.eta(state.ship || 'standard') : null;
    $$('[data-eta]').forEach(function (e) { e.textContent = eo ? eo.text : ''; });
    var sub = c.cart.some(function (i) { return !G.price(i.variant); }) ? G.money(0) : G.money(c.sub);
    set('[data-s-sub]', sub);
    var dr = $('[data-s-disc-row]');
    if (dr) dr.hidden = !c.disc;
    set('[data-s-disc]', '−' + G.money(c.disc));
    var shipTxt = state.step === 'contact' || state.step === 'address'
      ? L('Calculated at next step', 'Calcolata al passo successivo')
      : (c.shipFree ? L('Free', 'Gratuita') : G.money(c.ship));
    set('[data-s-ship]', shipTxt);
    var total = c.missing ? G.money(0) : G.money(c.total);
    set('[data-s-total]', total);
    set('[data-s-total-mini]', total);
    set('[data-pay-total]', total);
  }
  function set(sel, txt) { $$(sel).forEach(function (el) { if (el.textContent !== txt) el.textContent = txt; }); }

  /* ---------- shipping options ---------- */
  function renderShipOpts() {
    var box = $('[data-ship-opts]');
    if (!box) return;
    var lang = G.lang();
    var c = calc();
    box.innerHTML = CONFIG.shipping.map(function (o) {
      var price = c.shipFree ? L('Free', 'Gratuita') : G.money(Number(o.price) || 0);
      return '<label class="ship-opt"><input type="radio" name="ship" value="' + o.id + '"' + (o.id === state.ship ? ' checked' : '') + '>' +
        '<span class="so-t"><strong>' + esc(o.name[lang]) + '</strong><small>' + esc(o.eta[lang]) + '</small></span>' +
        '<span>' + esc(price) + '</span></label>';
    }).join('');
  }

  /* ---------- steps ---------- */
  function setStep(step) {
    state.step = step;
    var idx = ORDER.indexOf(step);
    $$('[data-step]').forEach(function (s) {
      var i = ORDER.indexOf(s.getAttribute('data-step'));
      s.setAttribute('data-state', i < idx ? 'done' : (i === idx ? 'active' : 'locked'));
    });
    $$('[data-crumb]').forEach(function (c) {
      var k = c.getAttribute('data-crumb');
      var on = (k === 'contact' && (step === 'contact' || step === 'address')) || (k === 'ship' && step === 'ship') || (k === 'pay' && step === 'pay');
      c.classList.toggle('on', on);
    });
    renderSummaries();
    renderSummary();
    var active = $('[data-step="' + step + '"]');
    if (active && idx > 0) {
      var y = active.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: G.reduce ? 'auto' : 'smooth' });
      var first = $('input:not([type="checkbox"]):not([type="radio"]), select', active);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
    }
  }
  function renderSummaries() {
    var f = form.elements;
    set('[data-sum="contact"]', f.email.value);
    set('[data-sum="address"]', [f.first.value + ' ' + f.last.value, f.address.value + (f.apt.value ? ', ' + f.apt.value : ''), f.zip.value + ' ' + f.city.value + (f.prov.value ? ' (' + f.prov.value + ')' : ''), countryName(f.country.value)].join(' · '));
    var o = shipOpt();
    if (o) set('[data-sum="ship"]', o.name[G.lang()] + ' · ' + o.eta[G.lang()]);
  }

  /* ---------- validation ---------- */
  function mark(input, bad, msg) {
    var fld = input.closest('.fld') || input.closest('.chk');
    if (!fld) return;
    fld.classList.toggle('bad', !!bad);
    var m = $('.msg', fld);
    if (bad && msg && fld.classList.contains('fld')) {
      if (!m) { m = document.createElement('span'); m.className = 'msg'; fld.appendChild(m); }
      m.textContent = msg;
    } else if (m) m.remove();
  }
  function luhn(num) {
    var s = 0, alt = false;
    for (var i = num.length - 1; i >= 0; i--) {
      var n = parseInt(num.charAt(i), 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      s += n; alt = !alt;
    }
    return s % 10 === 0;
  }
  function validate(step) {
    var f = form.elements, ok = true, firstBad = null;
    function req(el, cond, msg) {
      var bad = !cond;
      mark(el, bad, msg);
      if (bad) { ok = false; if (!firstBad) firstBad = el; }
    }
    if (step === 'contact') {
      req(f.email, /^\S+@\S+\.\S+$/.test(f.email.value.trim()), L('Enter a valid email', 'Inserisci un’email valida'));
    }
    if (step === 'address') {
      ['first', 'last', 'address', 'zip', 'city'].forEach(function (n) { req(f[n], f[n].value.trim().length > 0, L('Required', 'Obbligatorio')); });
      req(f.country, !!f.country.value, L('Required', 'Obbligatorio'));
    }
    if (step === 'pay') {
      if (state.pay === 'card') {
        var num = f.cc.value.replace(/\D/g, '');
        req(f.cc, num.length >= 13 && num.length <= 19 && luhn(num), L('Check the card number', 'Controlla il numero della carta'));
        var m = f.exp.value.match(/^(\d{2})\s*\/\s*(\d{2})$/);
        var future = false;
        if (m) {
          var mm = +m[1], yy = 2000 + (+m[2]);
          var now = new Date();
          future = mm >= 1 && mm <= 12 && (yy > now.getFullYear() || (yy === now.getFullYear() && mm >= now.getMonth() + 1));
        }
        req(f.exp, future, L('Invalid date', 'Data non valida'));
        req(f.cvc, /^\d{3,4}$/.test(f.cvc.value), L('3 or 4 digits', '3 o 4 cifre'));
        req(f.ccname, f.ccname.value.trim().length > 1, L('Required', 'Obbligatorio'));
      }
      var terms = $('[data-terms-row]');
      var tOk = f.terms.checked;
      terms.classList.toggle('bad', !tOk);
      if (!tOk) { ok = false; if (!firstBad) firstBad = f.terms; }
    }
    if (firstBad) firstBad.focus();
    return ok;
  }

  /* ---------- input formatting ---------- */
  form.addEventListener('input', function (e) {
    var t = e.target;
    if (t.name === 'cc') {
      var d = t.value.replace(/\D/g, '').slice(0, 19);
      t.value = d.replace(/(.{4})/g, '$1 ').trim();
    }
    if (t.name === 'exp') {
      var x = t.value.replace(/\D/g, '').slice(0, 4);
      t.value = x.length > 2 ? x.slice(0, 2) + ' / ' + x.slice(2) : x;
    }
    if (t.name === 'cvc') t.value = t.value.replace(/\D/g, '').slice(0, 4);
    if (t.closest('.fld') && t.closest('.fld').classList.contains('bad')) mark(t, false);
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'ship') { state.ship = e.target.value; renderSummary(); }
    if (e.target.name === 'terms') $('[data-terms-row]').classList.remove('bad');
  });

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-next],[data-edit],[data-pay-tab],[data-express],[data-sum-toggle]');
    if (!el) return;
    if (el.hasAttribute('data-next')) {
      var step = el.getAttribute('data-next');
      if (!validate(step)) return;
      var next = ORDER[ORDER.indexOf(step) + 1];
      if (next === 'ship') renderShipOpts();
      setStep(next);
      return;
    }
    if (el.hasAttribute('data-edit')) { setStep(el.getAttribute('data-edit')); return; }
    if (el.hasAttribute('data-pay-tab')) {
      state.pay = el.getAttribute('data-pay-tab');
      $$('[data-pay-tab]').forEach(function (b) {
        var on = b === el;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      $$('[data-pay-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-pay-panel') !== state.pay; });
      return;
    }
    if (el.hasAttribute('data-express')) { $('[data-xp-note]').hidden = false; return; }
    if (el.hasAttribute('data-sum-toggle')) {
      var aside = el.closest('.co-aside');
      var col = aside.getAttribute('data-collapsed') === '1';
      aside.setAttribute('data-collapsed', col ? '0' : '1');
      el.setAttribute('aria-expanded', col ? 'true' : 'false');
    }
  });

  /* ---------- discount ---------- */
  var disc = $('[data-disc]');
  if (disc) {
    disc.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = $('input', disc).value.trim().toUpperCase();
      var msg = $('[data-disc-msg]');
      var pct = CONFIG.discounts[code];
      if (code && pct) {
        state.discount = { code: code, pct: pct };
        msg.textContent = L('Code ' + code + ' applied: −' + pct + '%', 'Codice ' + code + ' applicato: −' + pct + '%');
      } else {
        state.discount = null;
        msg.textContent = L('This code is not valid.', 'Questo codice non è valido.');
      }
      msg.hidden = !code;
      renderSummary();
    });
  }

  /* ---------- place order ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.step !== 'pay' || !validate('pay')) return;
    // TODO: create the PaymentIntent / order on your backend, confirm the payment with Stripe,
    //       then increment the sold counter and send the confirmation email.
    var f = form.elements;
    var c = calc();
    var lang = G.lang();
    var orderNo = 'GZ-' + String(Date.now()).slice(-6) + Math.floor(Math.random() * 10);
    var pieces = [], n = 0;
    c.cart.forEach(function (i) { for (var q = 0; q < i.qty; q++) { pieces.push(G.pieceNo(n)); n++; } });
    var o = shipOpt();
    var payTxt = state.pay === 'card' ? L('Card', 'Carta') + ' •••• ' + f.cc.value.replace(/\D/g, '').slice(-4) : 'PayPal';
    var done = $('[data-done]');
    done.innerHTML =
      '<div class="done-box">' +
      '<div class="done-cert" aria-hidden="true"><div class="st-cert-in cert-flip"><p class="mono">GRIMZ · Drop 01</p><p class="st-cert-no">' + esc(pieces[0] || G.pieceNo()) + '</p>' +
      '<p class="mono st-cert-sub">' + esc(L('Sanzaru · authentic', 'Sanzaru · autentico')) + '</p>' +
      '<svg class="st-cert-qr" viewBox="0 0 21 21"><path d="M0 0h7v7H0zM2 2v3h3V2zM14 0h7v7h-7zM16 2v3h3V2zM0 14h7v7H0zM2 16v3h3v-3zM9 0h2v2H9zM9 4h3v2H9zM8 8h2v2H8zM12 8h3v2h-3zM17 9h2v3h-2zM9 12h2v3H9zM13 12h2v2h-2zM15 15h3v2h-3zM10 17h3v2h-3zM19 14h2v2h-2zM14 19h2v2h-2zM18 18h3v3h-3z" fill="currentColor"/></svg></div></div>' +
      '<p class="mono eye">' + esc(L('Order ', 'Ordine ')) + '#' + orderNo + '</p>' +
      '<h1 class="disp co-title">' + esc(L('Thank you, ', 'Grazie, ') + f.first.value.trim() + '!') + '</h1>' +
      '<p class="lead">' + esc(L('Your order is confirmed. You will receive a confirmation email at ', 'Il tuo ordine è confermato. Riceverai una mail di conferma a ') + f.email.value.trim() + L(' with the link to track the shipment.', ' con il link per seguire la spedizione.')) + '</p>' +
      '<div><p class="mono eye" style="margin-bottom:10px">' + esc(L('Your pieces', 'I tuoi pezzi')) + '</p><div class="pieces">' + pieces.map(function (p) { return '<span>' + p + '</span>'; }).join('') + '</div></div>' +
      '<div class="done-grid">' +
      '<div><strong>' + esc(L('Shipping to', 'Spedizione a')) + '</strong>' + esc(f.first.value + ' ' + f.last.value) + '<br>' + esc(f.address.value) + '<br>' + esc(f.zip.value + ' ' + f.city.value) + '<br>' + esc(countryName(f.country.value)) + '</div>' +
      '<div><strong>' + esc(L('Method', 'Metodo')) + '</strong>' + esc(o ? o.name[lang] + ' · ' + o.eta[lang] : '') + '</div>' +
      '<div><strong>' + esc(L('Payment', 'Pagamento')) + '</strong>' + esc(payTxt) + '</div>' +
      '<div><strong>' + esc(L('Total', 'Totale')) + '</strong>' + esc(c.missing ? G.money(0) : G.money(c.total)) + '</div>' +
      '</div>' +
      '<p class="co-legal">' + L('You have 14 days from delivery to withdraw: <a href="recesso.html">withdraw from contract here</a>.', 'Hai 14 giorni dalla consegna per recedere: <a href="recesso.html">recedi dal contratto qui</a>.') + '</p>' +
      '<a class="btn btn-pink" href="index.html">' + esc(L('Back to the shop', 'Torna allo shop')) + '</a>' +
      '</div>';
    $('[data-flow]').hidden = true;
    done.hidden = false;
    $$('[data-crumb]').forEach(function (c2) { c2.classList.remove('on'); });
    G.setCart([]);
    if (G.setGift) G.setGift({ on: false, msg: '' });
    window.scrollTo({ top: 0, behavior: G.reduce ? 'auto' : 'smooth' });
  });

  /* ---------- init ---------- */
  function init() {
    fillCountries();
    var empty = G.getCart().length === 0;
    $('[data-flow]').hidden = empty;
    $('[data-empty]').hidden = !empty;
    setStep('contact');
  }
  document.addEventListener('grimz:lang', function () {
    fillCountries();
    renderShipOpts();
    renderSummaries();
    renderSummary();
  });
  init();
})();
