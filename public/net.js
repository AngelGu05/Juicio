// Núcleo de la app: estado, conexión (en línea o una sola pantalla) y utilidades de interfaz.
const $ = id => document.getElementById(id);
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('ctr_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ctr_' + k, JSON.stringify(v)); } catch {} },
};

// Cambia el HTML de una zona sin perder lo que el jugador estaba escribiendo.
function setHTML(el, html) {
  if (el._html === html) return;
  const keep = {}, focus = document.activeElement && el.contains(document.activeElement) ? document.activeElement.id : null;
  el.querySelectorAll('input[id],textarea[id],select[id]').forEach(i => { keep[i.id] = i.value; });
  el.innerHTML = html; el._html = html;
  for (const id in keep) { const i = $(id); if (i && el.contains(i) && i.type !== 'file') i.value = keep[id]; }
  if (focus && $(focus)) $(focus).focus();
}

const App = {
  s: null, mode: null, me: null, ws: null, local: null, code: '', offset: 0, canOnline: false,
  now() { return Date.now() + App.offset; },
  player() { return App.s && App.s.players[App.me]; },

  toast(m) {
    const t = $('toast'); t.textContent = m; t.hidden = false;
    clearTimeout(App._tt); App._tt = setTimeout(() => { t.hidden = true; }, 2800);
  },
  modal(html) { const m = $('modal'); m.innerHTML = html ? '<div class="card">' + html + '</div>' : ''; m.hidden = !html; },

  act(a) {
    if (App.mode === 'local') {
      const r = Game.act(App.local, App.me, a);
      if (r.err) return App.toast(r.err);
      App.refreshLocal(); if (r.fx.length) Court.fx(r.fx);
    } else if (App.ws && App.ws.readyState === 1) App.ws.send(JSON.stringify({ t: 'act', a }));
    else App.toast('Sin conexión. Reintentando…');
  },

  // --- una sola pantalla ---
  startLocal(name) {
    App.mode = 'local'; App.local = Game.newState('', 'local'); App.me = 'p1'; App._n = 1;
    const p = Game.addPlayer(App.local, 'p1', name); Object.assign(p.acc, store.get('acc', {}));
    App.refreshLocal();
  },
  addLocal(name) {
    const id = 'p' + (++App._n); Game.addPlayer(App.local, id, name); App.me = id; App.refreshLocal();
  },
  refreshLocal() { App.s = Game.view(App.local, App.me); App.render(); },
  control(id) { App.me = id; App.reveal = false; App.refreshLocal(); },

  // --- en línea ---
  connect(code, name) {
    App.mode = 'online'; App.code = code || '';
    const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    App.ws = ws;
    ws.onopen = () => ws.send(JSON.stringify({ t: 'join', code: App.code, name, pid: store.get('pid', ''), acc: store.get('acc', null) }));
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.t === 'joined') { App.code = m.code; App.me = m.pid; store.set('pid', m.pid); store.set('room', m.code); }
      else if (m.t === 'state') { App.s = m.s; App.offset = m.s.now - Date.now(); App.render(); }
      else if (m.t === 'fx') Court.fx(m.fx);
      else if (m.t === 'err') { App.toast(m.m); if (m.fatal) App.leave(); }
    };
    ws.onclose = () => {
      if (App.ws !== ws || App.mode !== 'online') return;
      App.toast('Se perdió la conexión. Reconectando…');
      setTimeout(() => { if (App.ws === ws && App.mode === 'online') App.connect(App.code, name); }, 2000);
    };
  },
  leave() {
    const ws = App.ws; App.ws = null; App.mode = null; App.s = null; App.local = null; store.set('room', '');
    if (ws) ws.close();
    App.render();
  },

  render() {
    const s = App.s, inLobby = s && s.phase === 'lobby';
    $('home').hidden = !!s; $('lobby').hidden = !inLobby; $('court').hidden = !s || inLobby;
    const who = $('who'); who.hidden = !(s && App.mode === 'local');
    if (!who.hidden) {
      setHTML(who, '<span>Controlas a:</span>' + Game.list(s).map(p =>
        `<button class="btn ${p.id === App.me ? 'gold' : ''}" data-ctl="${p.id}">${esc(p.name)}</button>`).join(''));
    }
    if (!s) return;
    if (inLobby) Lobby.render(s); else Court.render(s);
  },
};

document.addEventListener('click', e => {
  const c = e.target.closest('[data-ctl]'); if (c) return App.control(c.dataset.ctl);
  const a = e.target.closest('[data-act]');
  if (a) { try { App.act(JSON.parse(a.dataset.act)); } catch {} $('menu').hidden = true; return; }
  if (e.target === $('modal') || e.target.closest('[data-close]')) App.modal('');
  if (!e.target.closest('.menu') && !e.target.closest('.ch') && !e.target.closest('.gl')) $('menu').hidden = true;
});

function boot(saved) {
  App.canOnline = /^https?:$/.test(location.protocol) && !window.claude;
  $('onlineBox').hidden = !App.canOnline; $('onlineNote').hidden = App.canOnline;
  $('nameInput').value = store.get('name', '');
  $('homeCast').innerHTML = [['demandante', { cabeza: 'audifonos' }], ['abogado_dte', { ojos: 'lentes' }], ['policia', { cara: 'bigote' }],
    ['juez', { cabeza: 'peluca', ojos: 'monoculo' }], ['abogado_ddo', { cuello: 'mono', piel: '#9a6038' }], ['demandado', { cara: 'nariz_payaso', cabeza: 'gorro' }]]
    .map(([r, a], i) => Avatar.svg(r, Object.assign({ piel: GameData.SKINS[i % 5], pelo: GameData.HAIRS[i] }, a))).join('');
  const name = () => { const n = $('nameInput').value.trim(); if (!n) { App.toast('Primero escribe tu nombre.'); $('nameInput').focus(); return null; } store.set('name', n); return n; };
  $('btnCreate').onclick = () => { const n = name(); if (n) App.connect('', n); };
  $('btnJoin').onclick = () => { const n = name(), c = $('codeInput').value.trim().toUpperCase(); if (!n) return; if (c.length !== 4) return App.toast('El código tiene 4 letras.'); App.connect(c, n); };
  $('btnLocal').onclick = () => { const n = name(); if (n) App.startLocal(n); };
  $('btnLeave').onclick = () => App.leave();
  setInterval(() => { if (App.s && App.s.phase !== 'lobby') Court.tick(); }, 500);
  if (saved && saved.local) { App.mode = 'local'; App.local = saved.local; App.me = saved.me; App._n = saved.n || 99; App.refreshLocal(); }
  else if (App.canOnline && store.get('room', '') && store.get('name', '')) App.connect(store.get('room', ''), store.get('name', ''));
}

// Arranca cuando ya cargaron todos los scripts. En un artefacto, conserva la partida local al actualizarse la página.
window.addEventListener('DOMContentLoaded', () => {
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => (App.mode === 'local' ? { local: App.local, me: App.me, n: App._n } : {}));
  if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
});
