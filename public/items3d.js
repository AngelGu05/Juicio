// Objetos que se llevan en la mano, público de relleno en las bancas y más decoración.
(() => {
  const S = Stage3D, M = c => Chars3D.mat(c), STONE = '#b9b4a8', GOLD = '#ffc914', INK = '#2a1a12';
  const mesh = (geo, color, p, rot, parent) => {
    const o = new THREE.Mesh(geo, typeof color === 'string' ? M(color) : color); o.position.set(p[0], p[1], p[2]);
    if (rot) o.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
  };
  const box = (x, y, z) => new THREE.BoxGeometry(x, y, z), cyl = (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n || 14), sph = r => new THREE.SphereGeometry(r, 14, 10);
  const tor = (r, t) => new THREE.TorusGeometry(r, t, 8, 18);

  // Cómo se ve cada objeto en la mano (y en su sitio).
  function item(kind) {
    const g = new THREE.Group();
    if (kind === 'mazo') { mesh(cyl(0.03, 0.03, 0.55, 8), '#6b3618', [0, 0.1, 0], null, g); mesh(cyl(0.1, 0.1, 0.3, 12), '#a05a2c', [0, 0.38, 0], [Math.PI / 2, 0, 0], g); }
    if (kind === 'esposas') [-1, 1].forEach(k => mesh(tor(0.1, 0.025), '#8d959e', [k * 0.11, 0, 0], [Math.PI / 2 - 0.4, 0, 0], g));
    if (kind === 'empanada') { const e = mesh(sph(0.2), '#e0a83e', [0, 0, 0], null, g); e.scale.set(1, 0.42, 0.62); mesh(tor(0.19, 0.025), '#b9772a', [0, 0, 0.02], [Math.PI / 2, 0, 0], g).scale.set(1, 0.6, 1); }
    if (kind === 'libro') { mesh(box(0.34, 0.09, 0.26), '#d7263d', [0, 0, 0], null, g); mesh(box(0.31, 0.07, 0.27), '#fff5dc', [0.01, 0, 0], null, g); }
    if (kind === 'vaso') mesh(cyl(0.08, 0.065, 0.2), '#bfe6f2', [0, 0, 0], null, g);
    return g;
  }

  const decorate = S.decorate;
  S.decorate = function () {
    decorate.call(this);
    const sc = this.scene;
    // estatua de la Justicia
    const st = new THREE.Group(); st.position.set(5.7, 0, -4.6); st.rotation.y = -0.6; sc.add(st);
    mesh(box(1.1, 0.25, 1.1), STONE, [0, 0.125, 0], null, st); mesh(box(0.85, 0.75, 0.85), STONE, [0, 0.62, 0], null, st);
    mesh(cyl(0.2, 0.46, 1.5), STONE, [0, 1.75, 0], null, st); mesh(sph(0.21), STONE, [0, 2.68, 0], null, st); mesh(box(0.44, 0.07, 0.44), '#6f6a60', [0, 2.72, 0], null, st);
    mesh(cyl(0.06, 0.06, 0.7, 8), STONE, [0.38, 2.5, 0.05], [0, 0, -0.9], st); mesh(box(0.7, 0.03, 0.03), GOLD, [0.66, 2.75, 0.05], null, st);
    [-1, 1].forEach(k => { mesh(cyl(0.005, 0.005, 0.28, 4), GOLD, [0.66 + k * 0.32, 2.61, 0.05], null, st); mesh(cyl(0.13, 0.08, 0.04), GOLD, [0.66 + k * 0.32, 2.47, 0.05], null, st); });
    mesh(cyl(0.06, 0.06, 0.6, 8), STONE, [-0.33, 2.15, 0.1], [0.5, 0, 0.35], st); mesh(box(0.05, 1.3, 0.02), '#d9dde2', [-0.46, 1.5, 0.36], null, st); mesh(box(0.3, 0.05, 0.05), GOLD, [-0.46, 2.0, 0.36], null, st);
    this.ROUND.push([5.7, -4.6, 0.75]);
    // dispensador de agua y perchero
    mesh(box(0.55, 1.0, 0.5), '#f4f1ea', [-6.3, 0.5, 3.0], null, sc); mesh(cyl(0.22, 0.22, 0.55), '#7cc7ea', [-6.3, 1.3, 3.0], null, sc); mesh(box(0.1, 0.08, 0.1), '#2b5fb3', [-6.0, 0.75, 3.0], null, sc);
    mesh(cyl(0.3, 0.34, 0.08), '#6b3618', [6.3, 0.04, 3.9], null, sc); mesh(cyl(0.04, 0.04, 2.0, 8), '#6b3618', [6.3, 1.0, 3.9], null, sc);
    mesh(cyl(0.34, 0.34, 0.03, 18), '#3a2a20', [6.3, 2.0, 3.9], null, sc); mesh(cyl(0.17, 0.19, 0.2), '#3a2a20', [6.3, 2.1, 3.9], null, sc);
    mesh(cyl(0.1, 0.28, 0.9), '#27356b', [6.1, 1.35, 3.9], null, sc);
    // retratos de jueces ilustres en las paredes laterales
    const face = (skin, bg) => this.tex(260, 320, g => {
      g.fillStyle = GOLD; g.fillRect(0, 0, 260, 320); g.fillStyle = bg; g.fillRect(18, 18, 224, 284);
      g.fillStyle = '#22201f'; g.beginPath(); g.ellipse(130, 330, 110, 110, 0, 0, 7); g.fill();
      g.fillStyle = '#f4f1ea'; [[78, 120], [182, 120], [70, 165], [190, 165], [130, 82], [100, 92], [160, 92]].forEach(c => { g.beginPath(); g.arc(c[0], c[1], 34, 0, 7); g.fill(); });
      g.fillStyle = skin; g.beginPath(); g.ellipse(130, 150, 52, 60, 0, 0, 7); g.fill();
      g.fillStyle = INK; g.beginPath(); g.arc(110, 142, 6, 0, 7); g.arc(150, 142, 6, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(108, 178); g.lineTo(152, 178); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(116, 205, 28, 46);
    });
    [[-6.955, Math.PI / 2, '#e8b88a', '#6d2a2a'], [6.955, -Math.PI / 2, '#9a6038', '#27456b']].forEach(([x, ry, skin, bg]) => {
      const o = mesh(new THREE.PlaneGeometry(1.3, 1.6), new THREE.MeshBasicMaterial({ map: face(skin, bg) }), [x, 3.7, -1.0], [0, ry, 0], sc); o.castShadow = false;
    });
    // esposas en el escritorio del secretario y empanada en un plato sobre la baranda
    this.home = { esposas: item('esposas'), empanada: item('empanada') };
    this.home.esposas.position.set(-1.3, 0.81, -3.25); this.home.esposas.rotation.x = -Math.PI / 2 + 0.4; sc.add(this.home.esposas);
    mesh(cyl(0.28, 0.22, 0.03, 18), '#ffffff', [1.75, 0.915, 1.8], null, sc); this.home.empanada.position.set(1.75, 1.0, 1.8); sc.add(this.home.empanada);
  };

  // Público de relleno: ocupa las bancas que no usan los jugadores.
  S.npcs = [];
  S.fillBenches = function (n) {
    const first = n ? Math.ceil(n / 8) : 0; if (this._npcKey === first) return; this._npcKey = first;
    this.npcs.forEach(g => this.scene.remove(g)); this.npcs = [];
    const D = GameData, pick = (a, i) => a[i % a.length];
    for (let row = first; row < 3; row++) for (let k = 0; k < 8; k++) {
      const i = row * 8 + k; if ((k * 7 + row * 3) % 5 === 0) continue;
      const acc = { piel: pick(D.SKINS.slice(0, 5), i * 3 + 1), pelo: pick(D.HAIRS, i * 5 + 2), cabeza: i % 4 === 0 ? pick(['sombrero', 'gorro', 'audifonos'], i) : '', ojos: i % 3 === 0 ? pick(['lentes', 'lentes_sol'], i) : '', cara: i % 5 === 2 ? pick(['bigote', 'barba'], i) : '', cuello: i % 6 === 1 ? 'bufanda' : '' };
      const g = Chars3D.build('publico', acc, { seed: 'npc' + i }); g.position.set((k - 3.5) * 1.35, 0, 3.1 + row * 1.3); g.rotation.y = Math.PI; g.userData.ph = i * 1.7;
      this.scene.add(g); this.npcs.push(g);
    }
  };

  const sync = S.sync;
  S.sync = function (s) {
    sync.call(this, s);
    const now = App.now(), items = s.items || {};
    this.fillBenches(Game.publico(s).length);
    this.gavel.visible = !items.mazo; if (this.home) { this.home.esposas.visible = !items.esposas; this.home.empanada.visible = !items.empanada; }
    Game.list(s).forEach(p => {
      const c = this.chars[p.id]; if (!c) return;
      if (c.holdKind !== (p.hold || '')) { if (c.held) c.g.remove(c.held); c.holdKind = p.hold || ''; c.held = p.hold ? item(p.hold) : null; if (c.held) c.g.add(c.held); }
      const wet = p.wetUntil > now;
      if (!!c.wet !== wet) {
        if (c.wet) { c.g.remove(c.wet); c.wet = null; }
        else { c.wet = new THREE.Group(); for (let i = 0; i < 7; i++) { const a = i * 0.9; mesh(sph(0.055), '#4d9de0', [Math.sin(a) * 0.42, 1.25 + (i % 3) * 0.3, Math.cos(a) * 0.42], null, c.wet).scale.y = 1.6; } c.g.add(c.wet); }
      }
    });
  };

  S.throwObj = function (by, to, obj) {
    const a = this.chars[by], b = this.chars[to]; if (!a || !b) return;
    const m = obj === 'vaso' ? new THREE.Mesh(sph(0.2), M('#4d9de0')) : item('libro'); if (obj !== 'vaso') m.scale.setScalar(1.4);
    this.scene.add(m);
    this.toms.push({ m, a: a.g.position.clone().setY(a.g.position.y + 1.4), b: b.g.position.clone().setY(b.g.position.y + 1.5), k: 0 });
  };

  const extras = S.extras;
  S.extras = function (ms, dt) {
    extras.call(this, ms, dt);
    const DOWN = this._down, d = this._dir;
    for (const id in this.chars) {
      const c = this.chars[id];
      if (c.wet) c.wet.children.forEach((o, i) => { o.position.y = 0.9 + ((ms * 0.0012 + i * 0.37) % 1) * -0.5 + 0.9; });
      if (!c.held) continue;
      const own = this.isFp && id === App.me;
      c.held.position.set(own ? 0.34 : 0.3, own ? 1.3 : 1.05, own ? 0.8 : 0.58); c.held.rotation.z = Math.sin(ms * 0.004) * 0.08;
      const arms = c.mesh && c.mesh.userData.arms;
      if (arms && !c.sign && !c.emote) { d.set(0.02, 0.18, 0.95).normalize(); arms[1].quaternion.setFromUnitVectors(DOWN, d); }
    }
    this.npcs.forEach(g => { g.scale.y = 1 + Math.sin(ms * 0.003 + g.userData.ph) * 0.015; });
  };
})();
