// Caminar por la sala, gestos con el cuerpo y objetos que reaccionan al tocarlos.
Object.assign(Stage3D, {
  mine: {}, keys: {}, lastSend: 0,

  // Objetos con los que se puede interactuar: centro [x, y, z], radio, animación y lo que "dicen".
  THINGS: {
    mazo: { c: [1.0, 1.9, -4.5], r: 0.5, name: 'el mazo' },
    bandera: { c: [-1.4, 3.7, -6.3], r: 1.3, name: 'la bandera', anim: 'flag', word: '¡Viva Panamá!', tune: [392, 392, 523, 659] },
    balanza: { c: [-1.35, 2.0, -4.5], r: 0.55, name: 'la balanza', anim: 'wobble', word: 'La justicia es ciega… y un poco torcida', tune: [880, 660] },
    maquina: { c: [-1.75, 0.95, -3.3], r: 0.55, name: 'la máquina de escribir', anim: 'jump', word: 'tac, tac, tac… ¡ding!', tune: [300, 300, 300, 1200] },
    librero: { c: [5.5, 1.3, -6.5], r: 1.5, name: 'el librero', take: 'libro', anim: 'jump', word: 'Código Penal, tomo 47…', tune: [200, 160] },
    reloj: { c: [4.9, 4.9, -6.95], r: 0.6, name: 'el reloj', anim: 'wobble', word: () => 'Son las ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) + '. ¡Qué tarde!', tune: [700, 500, 700, 500] },
    cuadro: { c: [5.3, 3.35, -6.95], r: 1.0, name: 'el cuadro', anim: 'wobble', word: 'Ese cuadro está torcido', tune: [250] },
    puerta: { c: [6.95, 1.65, 5.6], r: 1.7, name: 'la puerta', anim: 'jump', word: 'Toc, toc… está cerrada con llave', tune: [120, 120] },
    micro: { c: [3.3, 1.55, -3.8], r: 0.3, name: 'el micrófono', anim: 'wobble', word: 'Probando, probando… ¿se oye?', tune: [1400] },
    esposas: { c: [-1.3, 0.85, -3.25], r: 0.3, name: 'las esposas', take: 'esposas' },
    empanada: { c: [1.75, 1.0, 1.8], r: 0.35, name: 'la empanada', take: 'empanada' },
    vaso1: { c: [-3.41, 1.02, -2.12], r: 0.25, name: 'el vaso', take: 'vaso', anim: 'jump', word: 'glu, glu, glu', tune: [500, 450, 400] },
    vaso2: { c: [4.55, 1.02, -0.6], r: 0.25, name: 'el vaso', take: 'vaso', anim: 'jump', word: 'glu, glu, glu', tune: [500, 450, 400] },
    planta1: { c: [-6.3, 1.0, -6.3], r: 0.8, name: 'la planta', anim: 'wobble', word: 'fru, fru', tune: [900] },
    planta2: { c: [6.3, 1.0, -2.6], r: 0.8, name: 'la planta', anim: 'wobble', word: 'fru, fru', tune: [900] },
    planta3: { c: [-6.3, 1.0, 6.7], r: 0.8, name: 'la planta', anim: 'wobble', word: 'fru, fru', tune: [900] },
    planta4: { c: [6.3, 1.0, 2.9], r: 0.8, name: 'la planta', anim: 'wobble', word: 'fru, fru', tune: [900] },
    planta5: { c: [-6.3, 1.0, -0.9], r: 0.8, name: 'la planta', anim: 'wobble', word: 'fru, fru', tune: [900] },
  },
  // Muebles que no se pueden atravesar: cajas [x1, z1, x2, z2] y círculos [x, z, radio].
  BOXES: [[-1.9, -4.83, 1.9, -4.27], [2.35, -5.4, 2.49, -3.75], [4.11, -5.4, 4.25, -3.75], [2.35, -3.89, 4.25, -3.75], [-2.4, -3.65, -1.1, -2.95],
    [1.5, 1.73, 7, 1.87], [-7, 1.73, -1.5, 1.87], [-5.75, 3.55, 5.75, 3.95], [-5.75, 4.85, 5.75, 5.25], [-5.75, 6.15, 5.75, 6.55], [4.25, -6.95, 6.75, -6.4]],
  ROUND: [[-3.9, -1.3, 1.25], [3.9, -1.3, 1.25]],

  floorY(x, z) { return Math.abs(x) <= 2.7 && z <= -4.2 ? 0.6 : (x >= 2.35 && x <= 4.25 && z >= -5.45 && z <= -3.75 ? 0.3 : 0); },
  collide(x, z) {
    const R = 0.35;
    x = Math.max(-6.6, Math.min(6.6, x)); z = Math.max(-6.6, Math.min(7.1, z));
    for (const b of this.BOXES) {
      const x1 = b[0] - R, z1 = b[1] - R, x2 = b[2] + R, z2 = b[3] + R;
      if (x > x1 && x < x2 && z > z1 && z < z2) {
        const d = [x - x1, x2 - x, z - z1, z2 - z], m = Math.min(d[0], d[1], d[2], d[3]);
        if (m === d[0]) x = x1; else if (m === d[1]) x = x2; else if (m === d[2]) z = z1; else z = z2;
      }
    }
    for (const c of this.ROUND) { const dx = x - c[0], dz = z - c[1], d = Math.hypot(dx, dz), min = c[2] + R; if (d < min) { const k = min / (d || 0.001); x = c[0] + dx * k; z = c[1] + dz * k; } }
    return [x, z];
  },

  canMove() { const s = App.s, p = App.player(); return !!(Court.is3d && s && p && s.phase !== 'lobby' && s.witness !== p.id && !(p.jailedUntil > App.now())); },
  goHome() { delete this.mine[App.me]; App.sendPos({ home: true }); const p = App.player(); if (p) p.pos = null; this.fp.yaw = 0; if (App.s) this.sync(App.s); },

  moveTick(ms, dt) {
    const c = this.chars[App.me]; if (!c || !this.canMove()) return;
    const K = this.keys, f = (K.w || K.arrowup ? 1 : 0) - (K.s || K.arrowdown ? 1 : 0), side = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0);
    const turning = this.isFp && this.fp.yaw !== 0;
    if (!f && !side && !turning) return;
    const g = c.g; let r = g.rotation.y, x = g.position.x, z = g.position.z;
    if (this.isFp) { r += this.fp.yaw; this.fp.yaw = 0; }
    if (f || side) {
      // En primera persona se avanza hacia donde miras; en las otras cámaras, según la cámara.
      const yaw = this.isFp ? r : this.cam.az + Math.PI, sp = 3.4 * dt / Math.hypot(f, side);
      const dx = (Math.sin(yaw) * f - Math.cos(yaw) * side) * sp, dz = (Math.cos(yaw) * f + Math.sin(yaw) * side) * sp;
      [x, z] = this.collide(x + dx, z + dz);
      if (!this.isFp) r = Math.atan2(dx, dz);
    }
    const pos = this.mine[App.me] = { x, z, r };
    c.to = [x, this.floorY(x, z), z, r]; g.position.x = x; g.position.z = z; g.rotation.y = r;
    if (ms - this.lastSend > 90) { this.lastSend = ms; App.sendPos(pos); this.dirty = false; } else this.dirty = true;
  },

  // --- gestos ---
  emote(id, kind) { const c = this.chars[id]; if (c) c.emote = { kind, t: 0, dur: kind === 'baile' ? 3 : 1.8 }; },
  emotes(ms, dt) {
    const DOWN = this._down, d = this._dir;
    for (const id in this.chars) {
      const c = this.chars[id], e = c.emote, m = c.mesh; if (!e || !m) continue;
      e.t += dt; const p = e.t / e.dur, w = Math.max(0, Math.min(1, p * 6, (1 - p) * 6)), sw = Math.sin(ms * 0.014);
      m.rotation.set(0, 0, 0); m.position.y = 0;
      if (p >= 1) { c.emote = null; continue; }
      if (e.kind === 'reverencia') m.rotation.x = Math.sin(p * Math.PI) * 0.95;
      if (e.kind === 'baile') { m.rotation.y = p * Math.PI * 4; m.position.y = Math.abs(Math.sin(ms * 0.012)) * 0.3 * w; }
      if (e.kind === 'risa') m.position.y = Math.abs(Math.sin(ms * 0.03)) * 0.08 * w;
      if (c.sign || !m.userData.arms) continue;
      m.userData.arms.forEach(a => {
        const k = a.userData.k; let v = null;
        if (e.kind === 'saludo' && k > 0) v = [0.35 + sw * 0.3, 0.9, 0.1];
        if (e.kind === 'senalar' && k > 0) v = [0.05, 0.08, 1];
        if (e.kind === 'facepalm' && k > 0) v = [-0.42, 0.75, 0.5];
        if (e.kind === 'aplauso') v = [-k * (0.12 + 0.22 * Math.abs(sw)), 0.15, 0.9];
        if (e.kind === 'abucheo') v = [k * 0.35, 0.9 + sw * 0.1, 0.15];
        if (e.kind === 'sorpresa') v = [k * 0.8, 0.55, 0.2];
        if (e.kind === 'baile') v = [k * 0.55, Math.sin(ms * 0.012 + k) * 0.8, 0.25];
        if (!v) return;
        d.set(k * 0.27 + (v[0] - k * 0.27) * w, -0.96 + (v[1] + 0.96) * w, 0.05 + (v[2] - 0.05) * w).normalize(); a.quaternion.setFromUnitVectors(DOWN, d);
      });
    }
  },

  // --- objetos ---
  initThings() {
    const v = new THREE.Vector3(), isChar = o => { for (; o; o = o.parent) if (o.userData.pid) return true; return false; };
    for (const n in this.THINGS) this.THINGS[n].m = [];
    this.scene.traverse(o => {
      if (!o.isMesh || o === this.flag || isChar(o)) return;
      o.getWorldPosition(v);
      for (const n in this.THINGS) { const t = this.THINGS[n]; if (t.anim && t.anim !== 'flag' && v.distanceTo(new THREE.Vector3(t.c[0], t.c[1], t.c[2])) < t.r) { t.m.push({ o, y: o.position.y, rz: o.rotation.z }); break; } }
    });
    this._things = true;
  },
  clickThing() {
    const hit = this.ray.intersectObjects(this.scene.children, true).find(h => { for (let o = h.object; o; o = o.parent) if (o.userData.pid) return false; return true; });
    if (!hit) return;
    let best = null, bd = 1e9;
    for (const n in this.THINGS) { const t = this.THINGS[n], dd = hit.point.distanceTo(new THREE.Vector3(t.c[0], t.c[1], t.c[2])); if (dd < t.r + 0.25 && dd < bd) { bd = dd; best = n; } }
    if (!best) return;
    const t = this.THINGS[best], c = this.chars[App.me];
    if (c && Math.hypot(c.g.position.x - t.c[0], c.g.position.z - t.c[2]) > 3.3) return App.toast('Acércate a ' + t.name + ' para usarlo.');
    if (best === 'mazo') { const me = App.player(), h = (App.s.items || {}).mazo; return App.act(me && me.role === 'juez' && !h ? { type: 'gavel' } : { type: 'take', obj: 'mazo' }); }
    if (t.take) return App.act({ type: 'take', obj: t.take });
    App.act({ type: 'use', obj: best });
  },
  useFx(name, by) {
    const t = this.THINGS[name]; if (!t || !t.anim) return;
    t.t = 1.6; if (t.anim === 'flag') this.flagBoost = 2.5;
    const p = this.project(t.c[0], t.c[1] + t.r * 0.6, t.c[2]);
    if (p) Court.put('word', typeof t.word === 'function' ? t.word() : t.word, p, 1900);
    (t.tune || []).forEach((f, i) => Court.beep(f, 0.12, 'triangle', i * 0.13));
    this.hop(by);
  },
  thingTick(ms, dt) {
    if (!this._things) this.initThings();
    for (const n in this.THINGS) {
      const t = this.THINGS[n]; if (!(t.t > 0)) continue;
      t.t = Math.max(0, t.t - dt); const w = Math.min(1, t.t * 2);
      t.m.forEach(q => { if (t.anim === 'wobble') q.o.rotation.z = q.rz + Math.sin(ms * 0.025) * 0.16 * w; else q.o.position.y = q.y + Math.abs(Math.sin(ms * 0.014)) * 0.22 * w; });
    }
    if (this.flagBoost > 0 && this.flag) {
      this.flagBoost -= dt; const a = this.flag.geometry.attributes.position, b = this.flagX, amp = 0.09 + 0.22 * Math.max(0, Math.min(1, this.flagBoost));
      for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(b[i * 3] * 4 - ms * 0.012) * amp * b[i * 3]);
      a.needsUpdate = true;
    }
  },
});

// Engancha lo nuevo al ciclo de la sala sin tocar lo anterior.
(() => {
  const S = Stage3D, extras = S.extras, sync = S.sync;
  S.extras = function (ms, dt) { extras.call(this, ms, dt); this.emotes(ms, dt); this.thingTick(ms, dt); this.moveTick(ms, dt); if (this.dirty && ms - this.lastSend > 90 && this.mine[App.me]) { this.lastSend = ms; this.dirty = false; App.sendPos(this.mine[App.me]); } };
  S.sync = function (s) {
    const key = s.kase ? s.kase.id : '';
    if (this._key !== key) { this._key = key; this.mine = {}; }
    if (s.witness) delete this.mine[s.witness];
    sync.call(this, s);
    if (!this.pad) {
      const p = this.pad = document.createElement('div'); p.className = 'pad3d';
      p.innerHTML = '<span></span><button data-k="w" aria-label="Avanzar">▲</button><span></span><button data-k="a" aria-label="Izquierda">◀</button><button data-k="s" aria-label="Retroceder">▼</button><button data-k="d" aria-label="Derecha">▶</button><button class="home" data-home>Volver a mi lugar</button>';
      $('stage').appendChild(p);
      const set = (e, on) => { const b = e.target.closest('[data-k]'); if (b) { this.keys[b.dataset.k] = on; b.classList.toggle('on', on); e.preventDefault(); } };
      p.addEventListener('pointerdown', e => set(e, true));
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => p.addEventListener(n, e => set(e, false)));
      p.addEventListener('click', e => { if (e.target.closest('[data-home]')) this.goHome(); });
    }
  };
  const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
  const MOVE = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (!MOVE.includes(k) || typing() || !Court.is3d || $('court').hidden) return; S.keys[k] = true; e.preventDefault(); });
  addEventListener('keyup', e => { S.keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => { S.keys = {}; });
})();
