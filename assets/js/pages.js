/* =========================================================
   GRIMZ — pages.js (archive, verify, orders, help)
   Front-end demos: each TODO marks where the store / backend plugs in.
   ========================================================= */
(function () {
  'use strict';
  var G = window.GRIMZ;
  if (!G) return;
  var $ = G.$, $$ = G.$$, esc = G.esc, CONFIG = G.CONFIG;
  var L = function (en, it) { return G.L(en, it); };

  /* ---------- archive: the Drop 01 button follows the drop state ---------- */
  var cta = $('[data-drop-cta]');
  if (cta && CONFIG.drop && CONFIG.drop.status !== 'live') {
    cta.classList.remove('btn-pink'); cta.classList.add('btn-line');
    cta.innerHTML = CONFIG.drop.status === 'soon' ? esc(L('Opens soon — join the list', 'Apre a breve — entra in lista')) : esc(L('Sold out', 'Esaurito'));
  }

  /* ---------- verify a piece ---------- */
  var vf = $('[data-verify]'), vout = $('[data-verify-out]');
  function verify(n, c) {
    // TODO: ask the backend register: GET /api/pieces/{n}?code={c}
    var num = parseInt(String(n).replace(/\D/g, ''), 10);
    var max = Number(CONFIG.pieces) || 999;
    var ok = num > 0 && num <= max && String(c).replace(/\s/g, '').length >= 4;
    var no = '№ ' + String(num || 0).padStart(3, '0');
    vout.hidden = false;
    vout.innerHTML = ok
      ? '<div class="st-cert vf-cert"><div class="st-cert-in"><p class="mono">GRIMZ · Drop 01</p><p class="st-cert-no">' + esc(no) + '</p>' +
        '<p class="mono st-cert-sub">' + esc(L('Sanzaru · authentic', 'Sanzaru · autentico')) + '</p></div></div>' +
        '<p class="vf-msg">' + esc(L('This piece is in the GRIMZ register. Thank you for being part of Drop 01.', 'Questo pezzo è nel registro GRIMZ. Grazie di far parte del Drop 01.')) + '</p>'
      : '<p class="vf-msg vf-bad">' + esc(L('We can’t find this piece. Check number and code, or write to us: we will look into it.', 'Non troviamo questo pezzo. Controlla numero e codice, oppure scrivici: verifichiamo noi.')) + ' <a href="faq.html">' + esc(L('Help', 'Assistenza')) + '</a></p>';
  }
  if (vf && vout) {
    vf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!vf.n.value.trim()) { vf.n.focus(); return; }
      if (!vf.c.value.trim()) { vf.c.focus(); return; }
      verify(vf.n.value, vf.c.value);
    });
    // the QR on the garment opens verifica.html?n=041&c=XXXX
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('n')) { vf.n.value = q.get('n'); vf.c.value = q.get('c') || ''; if (vf.c.value) verify(vf.n.value, vf.c.value); }
    } catch (e) { /* ignore */ }
  }

  /* ---------- track an order (demo timeline) ---------- */
  var od = $('[data-order]'), oout = $('[data-order-out]');
  if (od && oout) {
    od.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!/^GZ-?\d{4,}$/i.test(od.order.value.trim())) { od.order.focus(); return; }
      if (!/\S+@\S+\.\S+/.test(od.email.value)) { od.email.focus(); return; }
      // TODO: fetch the real status from Shopify / Stripe + courier tracking
      var steps = [[L('Order received', 'Ordine ricevuto'), 1], [L('Packed, with your numbered card', 'Preparato, con la tua card numerata'), 1], [L('Shipped', 'Spedito'), 0], [L('Delivered', 'Consegnato'), 0]];
      var eta = G.eta('standard');
      oout.hidden = false;
      oout.innerHTML = '<h2 class="disp">' + esc(od.order.value.trim().toUpperCase()) + '</h2>' +
        '<ol class="od-steps">' + steps.map(function (s) { return '<li class="' + (s[1] ? 'done' : '') + '"><span></span>' + esc(s[0]) + '</li>'; }).join('') + '</ol>' +
        (eta ? '<p class="eta mono">' + esc(eta.text.replace(/^[^,]*, /, L('Estimated delivery: ', 'Consegna stimata: '))) + '</p>' : '') +
        '<p class="mono mute">' + esc(L('Demo data', 'Dati di esempio')) + '</p>';
    });
  }

  /* ---------- WhatsApp contact ---------- */
  var wa = $('[data-whatsapp]');
  if (wa) {
    if (CONFIG.whatsapp) {
      wa.href = 'https://wa.me/' + String(CONFIG.whatsapp).replace(/\D/g, '');
      wa.target = '_blank'; wa.rel = 'noopener';
      var wl = $('[data-whatsapp-label]'); if (wl) wl.textContent = '+' + String(CONFIG.whatsapp).replace(/\D/g, '');
    } else wa.addEventListener('click', function (e) { e.preventDefault(); });
  }
})();
