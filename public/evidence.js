// Pruebas: lista, dibujo a mano, subida de imágenes y vista ampliada.
const Evidence = {
  STATUS: { borrador: 'Sin presentar', presentada: 'Espera al policía', conjuez: 'La revisa el juez', admitida: 'Admitida', rechazada: 'Rechazada' },

  render(s) {
    const me = App.player(); if (!me) return;
    const B = Panels.btn, side = Game.sideOf(me), juez = me.role === 'juez', adv = Game.isAdvocate(s, me);
    const canAdd = side && ['prep', 'apertura', 'demanda', 'defensa', 'pruebas'].includes(s.phase) && s.evidence.filter(e => e.side === side).length < 3;
    if (!s.evidence.length && !canAdd) return setHTML($('evidence'), '');
    let h = '<h3>Pruebas</h3>';
    if (s.evidence.length) h += '<div class="evList">' + s.evidence.map(e => {
      let b = '';
      if (e.status === 'borrador' && e.side === side) b += B('Presentar', { type: 'presentEvidence', id: e.id }, 'gold') + B('Borrar', { type: 'delEvidence', id: e.id });
      if (e.status === 'conjuez' && juez) b += B('Admitir', { type: 'ruleEvidence', id: e.id, ok: true }, 'ok') + B('Rechazar', { type: 'ruleEvidence', id: e.id, ok: false }, 'red');
      if (e.status === 'admitida' && (juez || adv) && s.shown !== e.id) b += B('Mostrar', { type: 'showEvidence', id: e.id });
      return `<div class="ev"><img src="${e.img}" alt="" data-zoom="${e.id}"><b>${esc(e.title)}</b>
        <span class="note">${e.side === 'dte' ? 'Demandante' : 'Demandado'} · ${Evidence.STATUS[e.status]}</span>${b}</div>`;
    }).join('') + '</div>';
    if (canAdd) h += `<div class="row wrap"><button class="btn" data-ev="draw">Dibujar una prueba</button>
      <button class="btn" data-ev="upload">Subir una imagen</button></div><p class="note">Hasta 3 pruebas por lado. Nadie más las ve hasta que las presentas.</p>`;
    setHTML($('evidence'), h);
  },

  zoom(id) {
    const e = App.s.evidence.find(x => x.id === id); if (!e) return;
    App.modal(`<h3>${esc(e.title)}</h3><img class="full" src="${e.img}" alt=""><button class="btn" data-close>Cerrar</button>`);
  },

  // Editor: dibujo libre o imagen subida, sobre un lienzo de 480 × 360.
  editor(img) {
    App.modal(`<h3>${img ? 'Tu imagen como prueba' : 'Dibuja tu prueba'}</h3>
      <canvas id="pad" class="pad" width="480" height="360"></canvas>
      <div class="row wrap" id="padTools">
        ${['#2a1a12', '#d7263d', '#2b5fb3', '#1b998b', '#ffc914', '#ffffff'].map((c, i) => `<button class="sw ${i ? '' : 'on'}" style="background:${c}" data-color="${c}" aria-label="Color"></button>`).join('')}
        <button class="btn small" data-size="4">Fino</button><button class="btn small" data-size="12">Grueso</button>
        ${img ? '' : '<button class="btn small" data-clear>Borrar todo</button>'}
      </div>
      <div class="field"><label for="evTitle">Nombre de la prueba</label><input id="evTitle" maxlength="40" placeholder="Prueba A: la caja de pizza vacía"></div>
      <div class="row"><button class="btn gold" id="evSave">Guardar prueba</button><button class="btn" data-close>Cancelar</button></div>`);
    const cv = $('pad'), g = cv.getContext('2d');
    let color = '#2a1a12', size = 4, last = null;
    const paintBase = () => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, 480, 360);
      if (img) { const k = Math.min(480 / img.width, 360 / img.height), w = img.width * k, hh = img.height * k; g.drawImage(img, (480 - w) / 2, (360 - hh) / 2, w, hh); }
    };
    paintBase();
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 480 / r.width, (e.clientY - r.top) * 360 / r.height]; };
    cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); last = at(e); g.fillStyle = color; g.beginPath(); g.arc(last[0], last[1], size / 2, 0, 7); g.fill(); };
    cv.onpointermove = e => {
      if (!last) return; const p = at(e);
      g.strokeStyle = color; g.lineWidth = size; g.lineCap = 'round'; g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p;
    };
    cv.onpointerup = cv.onpointercancel = () => { last = null; };
    $('padTools').onclick = e => {
      const c = e.target.closest('[data-color]'), sz = e.target.closest('[data-size]');
      if (c) { color = c.dataset.color; $('padTools').querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === c)); }
      if (sz) size = +sz.dataset.size;
      if (e.target.closest('[data-clear]')) paintBase();
    };
    $('evSave').onclick = () => {
      App.act({ type: 'addEvidence', title: $('evTitle').value, img: cv.toDataURL('image/jpeg', 0.72) });
      App.modal('');
    };
  },

  upload() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => Evidence.editor(im); im.onerror = () => App.toast('No se pudo abrir esa imagen.'); im.src = r.result; };
      r.readAsDataURL(f);
    };
    inp.click();
  },
};

$('evidence').addEventListener('click', e => {
  const b = e.target.closest('[data-ev]'), z = e.target.closest('[data-zoom]');
  if (b) return b.dataset.ev === 'draw' ? Evidence.editor(null) : Evidence.upload();
  if (z) Evidence.zoom(z.dataset.zoom);
});
