// La sala: escenario, personajes, efectos y menú al tocar a alguien.
const Court = {
  pos: {}, splat: {}, sig: '', is3d: false, want3d: store.get('3d', true),
  SPOT: { juez: [50, 52], policia: [32, 56], demandante: [10, 72], abogado_dte: [22, 72], abogado_ddo: [78, 72], demandado: [90, 72] },
  WORDS: { aplauso: '¡Bravo!', abucheo: '¡Buuu!', murmullo: 'bla, bla, bla…', risa: '¡Ja, ja, ja!', sorpresa: '¡¿Qué?!' },

  base() {
    if (!Court._base) { const b = document.createElement('div'); b.className = 'base'; $('stage').appendChild(b); Court._base = b; }
    return Court._base;
  },

  render(s) {
    const D = GameData, now = App.now(), ps = Game.list(s), ph = D.PHASES.find(p => p.id === s.phase);
    $('phaseName').textContent = ph.name; $('phaseHint').textContent = ph.hint;
    setHTML($('courtCode'), App.mode === 'online' ? 'SALA ' + esc(s.code) : '');

    const three = Court.want3d && Stage3D.init();
    Court.is3d = three; $('stage').classList.toggle('three', three);
    $('btnCam').hidden = !three; $('stageHint').hidden = !three; $('btnView').hidden = Stage3D.failed;
    $('btnView').textContent = three ? 'Ver en 2D' : 'Ver en 3D';
    const q = s.questions.find(x => x.id === s.question);
    const qh = q ? `<div class="qBanner"><b>Pregunta del público:</b> ${esc(q.text)}</div>` : '';
    if (three) { setHTML(Court.base(), qh); Stage3D.sync(s); Court.sig = Court.signature(); Panels.render(s); Evidence.render(s); return Court.tick(); }

    const pub = ps.filter(p => p.role === 'publico' && p.id !== s.witness);
    Court.pos = {};
    const star = (cx, cy, c) => `<polygon fill="${c}" points="${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 1.2 : 3; return (cx + Math.cos(a) * q).toFixed(2) + ',' + (cy + Math.sin(a) * q).toFixed(2); }).join(' ')}"/>`;
    let h = `<svg class="flag2d" viewBox="0 0 30 20" role="img" aria-label="Bandera de Panamá"><rect width="30" height="20" fill="#fff"/><rect x="15" width="15" height="10" fill="#da121a"/><rect y="10" width="15" height="10" fill="#072357"/>${star(7.5, 5.3, '#072357')}${star(22.5, 15.3, '#da121a')}</svg>` +
      '<div class="seal">§</div><div class="furn bench">JUEZ</div><div class="furn stand">TESTIGO</div>' +
      '<div class="furn tableL">DEMANDANTE</div><div class="furn tableR">DEMANDADO</div><div class="furn rail"></div>';
    const ev = s.evidence.find(e => e.id === s.shown);
    h += ev ? `<button class="evScreen" data-zoom="${ev.id}"><img src="${ev.img}" alt=""><b>${esc(ev.title)}</b></button>`
      : '<div class="evScreen empty">Aquí se muestran las pruebas</div>';
    h += qh;

    ps.forEach(p => {
      let xy, layer = 'back';
      if (p.id === s.witness) xy = [69.5, 56];
      else if (p.role === 'publico') {
        const i = pub.indexOf(p), perRow = Math.min(pub.length, 10), row = Math.floor(i / 10), k = i % 10;
        const n = row === Math.floor((pub.length - 1) / 10) ? pub.length - row * 10 : perRow;
        xy = [6 + 88 * (k + 0.5) / n, 98.5 - row * 6]; layer = 'front';
      } else { xy = Court.SPOT[p.role] || [50, 99]; if (D.ROLES[p.role] && D.ROLES[p.role].side) layer = 'mid'; }
      Court.pos[p.id] = xy;
      const jailed = p.jailedUntil > now, cls = ['ch', layer, p.id === App.me ? 'me' : '', p.on ? '' : 'off', s.speaker === p.id ? 'speaker' : ''].join(' ');
      h += `<button class="${cls}" data-ch="${p.id}" style="left:${xy[0]}%;top:${xy[1]}%" aria-label="${esc(p.name)}, ${D.ROLES[p.role].name}">` +
        Avatar.svg(p.role, p.acc, { seed: p.id, jailed, splat: Court.splat[p.id] > Date.now() }) + '</button>' +
        `<span class="nm ${p.id === App.me ? 'me' : ''}" style="left:${xy[0]}%;top:${xy[1] - 3.4}%">${esc(p.name)}</span>`;
    });
    setHTML(Court.base(), h);
    Court.sig = Court.signature();
    Panels.render(s); Evidence.render(s); Court.tick();
  },

  signature() {
    const s = App.s, now = App.now();
    return Game.list(s).filter(p => p.jailedUntil > now).map(p => p.id).join() + '|' + Object.keys(Court.splat).filter(k => Court.splat[k] > Date.now()).join();
  },

  tick() {
    const s = App.s, t = $('timer');
    t.hidden = !s.timerEnd;
    if (s.timerEnd) {
      const left = Math.ceil((s.timerEnd - App.now()) / 1000);
      t.classList.toggle('over', left <= 0);
      t.textContent = left <= 0 ? '¡Tiempo!' : Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    }
    if (Court.signature() !== Court.sig) Court.render(s);
  },

  // --- efectos ---
  put(cls, text, xy, ms) {
    const el = document.createElement('div'); el.className = cls; el.textContent = text;
    if (xy) { el.style.left = Math.max(12, Math.min(88, xy[0])) + '%'; el.style.top = Math.max(9, xy[1]) + '%'; }
    $('stage').appendChild(el); setTimeout(() => el.remove(), ms); return el;
  },
  banner(text, tone) {
    $('stage').querySelectorAll('.banner').forEach(b => b.remove());
    Court.put('banner ' + (tone || '') + (text.length > 13 ? ' long' : ''), text, null, 2000);
  },
  head(id) { if (Court.is3d) return Stage3D.head(id); const p = Court.pos[id] || [50, 50]; return [p[0], p[1] - 29]; },
  hop(id) {
    if (Court.is3d) return Stage3D.hop(id);
    const el = Court.base().querySelector(`[data-ch="${id}"]`); if (!el) return;
    el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
  },
  beep(freq, dur, type, at) {
    try {
      const C = Court._ac || (Court._ac = new (window.AudioContext || window.webkitAudioContext)());
      const o = C.createOscillator(), g = C.createGain(), t0 = C.currentTime + (at || 0);
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.12, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(C.destination); o.start(t0); o.stop(t0 + dur);
    } catch {}
  },
  fx(list) {
    if (!App.s || App.s.phase === 'lobby') return;
    for (const f of list) {
      if (f.k === 'sign' && Court.is3d) Stage3D.sign(f.by, f.text);
      else if (f.k === 'sign') {
        const old = $('stage').querySelector(`.sign[data-by="${f.by}"]`); if (old) old.remove();
        Court.put('sign', f.text, Court.head(f.by), 4500).dataset.by = f.by; Court.hop(f.by);
      } else if (f.k === 'react') Court.put('word', Court.WORDS[f.kind] || '', Court.head(f.by), 1600);
      else if (f.k === 'banner') Court.banner(f.text, f.tone);
      else if (f.k === 'gavel') {
        const st = $('stage'); st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); if (Court.is3d) Stage3D.hitGavel();
        Court.beep(140, 0.12, 'square'); Court.beep(120, 0.16, 'square', 0.22);
        const j = Game.byRole(App.s, 'juez'); if (j) Court.hop(j.id);
      } else if (f.k === 'objection') {
        Court.banner('¡OBJECIÓN!', 'no'); Court.hop(f.by);
        Court.beep(440, 0.1, 'sawtooth'); Court.beep(660, 0.25, 'sawtooth', 0.1);
      } else if (f.k === 'warn') Court.put('word', '¡Advertencia!', Court.head(f.to), 1600);
      else if (f.k === 'jail') { Court.banner('¡A la celda!', 'no'); Court.beep(90, 0.3, 'square'); }
      else if (f.k === 'carry') { Court.hop(f.by); Court.put('word', '¡Voy!', Court.head(f.by), 1600); }
      else if (f.k === 'tomato') {
        if (Court.is3d) Stage3D.tomato(f.by, f.to);
        const a = Court.head(f.by), b = Court.head(f.to), el = Court.put('tomato' + (Court.is3d ? ' hid' : ''), '', null, 650);
        el.style.left = a[0] + '%'; el.style.top = (a[1] + 12) + '%'; void el.offsetWidth;
        el.style.left = b[0] + '%'; el.style.top = (b[1] + 12) + '%';
        setTimeout(() => { Court.splat[f.to] = Date.now() + 6000; Court.beep(200, 0.08, 'triangle'); if (App.s) Court.render(App.s); }, 560);
      }
    }
  },

  // --- menú al tocar un personaje ---
  menu(id, x, y) {
    const s = App.s, me = App.player(), t = s.players[id]; if (!t || !me) return;
    const D = GameData, juez = me.role === 'juez', poli = me.role === 'policia', hayPoli = !!Game.byRole(s, 'policia');
    const adv = Game.isAdvocate(s, me), self = id === App.me, items = [];
    const b = (label, a, cls) => items.push(`<button class="btn ${cls || ''}" data-act='${esc(JSON.stringify(a))}'>${label}</button>`);
    if (juez && s.speaker !== id) b('Dar la palabra', { type: 'giveWord', to: id }, 'gold');
    if ((juez || adv) && s.phase === 'pruebas' && s.witness !== id && !['juez', 'policia'].includes(t.role)) b('Llamar al estrado', { type: 'callWitness', to: id });
    if (juez && t.role !== 'juez') b('Advertencia' + (t.warnings ? ' (lleva ' + t.warnings + ')' : ''), { type: 'warn', to: id });
    if ((poli || (juez && !hayPoli)) && !self && t.role !== 'juez') b('Mandar a la celda 30 s', { type: 'jail', to: id }, 'red');
    if (me.role === 'publico' && !self) b('Lanzar tomate (' + me.tomatoes + ')', { type: 'tomato', to: id }, me.tomatoes ? 'red' : '');
    const m = $('menu');
    m.innerHTML = `<b>${esc(t.name)}</b><span class="note">${D.ROLES[t.role].name}${t.warnings ? ' · ' + t.warnings + ' advertencia(s)' : ''}</span>` + items.join('');
    m.hidden = false;
    m.style.left = Math.max(8, Math.min(x, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = Math.max(8, Math.min(y, innerHeight - m.offsetHeight - 8)) + 'px';
  },
};

$('stage').addEventListener('click', e => {
  const c = e.target.closest('[data-ch]'), z = e.target.closest('[data-zoom]');
  if (c) Court.menu(c.dataset.ch, e.clientX, e.clientY);
  else if (z) Evidence.zoom(z.dataset.zoom);
});
$('chatForm').addEventListener('submit', e => {
  e.preventDefault(); const t = $('chatInput').value.trim(); if (!t) return;
  App.act({ type: 'chat', text: t }); $('chatInput').value = '';
});
$('reacts').innerHTML = Object.keys(Court.WORDS).map(k =>
  `<button class="btn small" data-act='{"type":"react","kind":"${k}"}'>${Court.WORDS[k]}</button>`).join('');

$('btnView').onclick = () => { Court.want3d = !Court.want3d; store.set('3d', Court.want3d); if (App.s) Court.render(App.s); };
$('btnCam').onclick = () => Stage3D.nextView();
