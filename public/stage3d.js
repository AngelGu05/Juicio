// La sala en 3D: escenario, cámara que se gira arrastrando, personajes y efectos.
const Stage3D = {
  ok: false, failed: false, chars: {}, toms: [], t: 0,
  VIEWS: { galeria: { az: 0, pol: 0.98, r: 12.8 }, juez: { az: Math.PI, pol: 0.92, r: 12.5 }, lado: { az: 1.05, pol: 1.0, r: 13.5 } },
  cam: { az: 0, pol: 0.98, r: 12.8 }, want: { az: 0, pol: 0.98, r: 12.8 }, view: 'galeria',

  init() {
    if (this.ok || this.failed) return this.ok;
    try {
      if (!window.THREE) throw new Error('sin THREE');
      const R = this.renderer = new THREE.WebGLRenderer({ antialias: true });
      R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
      R.outputEncoding = THREE.sRGBEncoding; R.setClearColor('#123330');
      R.domElement.className = 'gl'; $('stage').insertBefore(R.domElement, $('stage').firstChild);
      this.ov = document.createElement('div'); this.ov.className = 'ov3d'; $('stage').appendChild(this.ov);
      this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(42, 1.6, 0.1, 100);
      this.target = new THREE.Vector3(0, 1.1, -1.4); this.ray = new THREE.Raycaster(); this.v = new THREE.Vector3();
      this.buildRoom(); this.bind();
      new ResizeObserver(() => this.resize()).observe($('stage')); this.resize();
      this.ok = true; requestAnimationFrame(t => this.frame(t));
    } catch (e) { this.failed = true; console.warn('3D no disponible:', e.message); }
    return this.ok;
  },

  resize() { const s = $('stage'), w = s.clientWidth, h = s.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); },

  buildRoom() {
    const S = this.scene, M = Chars3D.mat, WOOD = '#a05a2c', DARK = '#6b3618', GOLD = '#ffc914';
    const add = (geo, color, p, ry, parent) => {
      const o = new THREE.Mesh(geo, typeof color === 'string' ? M(color) : color); o.position.set(p[0], p[1], p[2]); if (ry) o.rotation.y = ry;
      o.castShadow = o.receiveShadow = true; (parent || S).add(o); return o;
    };
    const box = (x, y, z) => new THREE.BoxGeometry(x, y, z), plane = (w, h) => new THREE.PlaneGeometry(w, h);
    S.add(new THREE.HemisphereLight(0xfff5dc, 0x4a3628, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55); sun.position.set(5, 11, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, far: 40 }); S.add(sun);

    // piso de tablones
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#c98d4f'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#a8713a'; for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 2, 64);
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 1); tex.encoding = THREE.sRGBEncoding;
    const floor = new THREE.Mesh(plane(14, 14.5), new THREE.MeshLambertMaterial({ map: tex })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 0.25); floor.receiveShadow = true; S.add(floor);
    // paredes de una sola cara: desde afuera no estorban
    const wall = (w, p, ry) => { add(plane(w, 6.5), '#1d4b46', [p[0], 3.25, p[2]], ry).castShadow = false; add(plane(w, 1.3), DARK, [p[0] * 0.998, 0.65, p[2] * 0.998 + (p[0] ? 0 : 0.02)], ry).castShadow = false; };
    wall(14, [0, 0, -7]); wall(14.5, [-7, 0, 0.25], Math.PI / 2); wall(14.5, [7, 0, 0.25], -Math.PI / 2);
    add(new THREE.CircleGeometry(0.62, 28), DARK, [0, 5.1, -6.97]); add(new THREE.CircleGeometry(0.52, 28), GOLD, [0, 5.1, -6.95]);
    // pantalla de pruebas
    add(plane(3.3, 2.55), '#2a1a12', [-4.3, 3.1, -6.97]).castShadow = false;
    this.paper = new THREE.MeshBasicMaterial({ color: '#f3e3bd' });
    this.screen = add(plane(3.0, 2.25), this.paper, [-4.3, 3.1, -6.94]); this.screen.castShadow = false;

    // estrado del juez
    add(box(5.4, 0.6, 2.6), DARK, [0, 0.3, -5.5]); add(box(3.8, 0.95, 0.55), WOOD, [0, 1.075, -4.55]); add(box(4.1, 0.08, 0.8), DARK, [0, 1.59, -4.55]);
    add(box(1.3, 0.3, 0.04), GOLD, [0, 1.1, -4.26]);
    this.gavel = new THREE.Group(); this.gavel.position.set(1.0, 1.66, -4.5);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), DARK, [0, 0.28, 0], 0, this.gavel);
    const head = add(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12), WOOD, [0, 0.55, 0], 0, this.gavel); head.rotation.x = Math.PI / 2;
    this.gavel.rotation.z = -1.2; S.add(this.gavel);
    // estrado del testigo
    add(box(1.9, 0.3, 1.7), DARK, [3.3, 0.15, -4.6]); add(box(1.9, 1.0, 0.14), WOOD, [3.3, 0.8, -3.82]);
    add(box(0.14, 1.0, 1.6), WOOD, [2.42, 0.8, -4.6]); add(box(0.14, 1.0, 1.6), WOOD, [4.18, 0.8, -4.6]); add(box(0.9, 0.22, 0.04), GOLD, [3.3, 0.85, -3.74]);
    // mesas de las partes, giradas hacia el centro
    [-1, 1].forEach(k => {
      const t = new THREE.Group(); t.position.set(k * 3.9, 0, -1.3); t.rotation.y = -k * 0.93;
      add(box(2.7, 0.85, 0.8), WOOD, [0, 0.425, 0], 0, t); add(box(2.95, 0.07, 1.0), DARK, [0, 0.885, 0], 0, t); add(box(1.4, 0.26, 0.04), GOLD, [0, 0.45, 0.41], 0, t);
      S.add(t);
      add(box(5.5, 0.8, 0.14), WOOD, [k * 4.25, 0.4, 1.8]); add(box(5.7, 0.1, 0.26), DARK, [k * 4.25, 0.85, 1.8]);
    });
    [3.75, 5.05, 6.35].forEach(z => add(box(11.5, 0.45, 0.4), DARK, [0, 0.225, z]));
    // aro dorado para quien tiene la palabra
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color: GOLD })); this.ring.rotation.x = Math.PI / 2; this.ring.visible = false; S.add(this.ring);
    this.decorate();
  },

  // Dónde se para cada quien: [x, y, z, giro]
  spot(s, p, pub) {
    if (p.id === s.witness) return [3.3, 0.3, -4.55, 0];
    const sp = { juez: [0, 0.6, -5.35, 0], policia: [-3.0, 0, -4.0, 0.25], abogado_dte: [-4.19, 0, -2.33, 0.93], demandante: [-4.97, 0, -1.29, 0.93],
      abogado_ddo: [4.19, 0, -2.33, -0.93], demandado: [4.97, 0, -1.29, -0.93] }[p.role];
    if (sp) return sp;
    const i = pub.indexOf(p), row = Math.floor(i / 8), n = Math.min(8, pub.length - row * 8);
    return [((i % 8) - (n - 1) / 2) * 1.35, 0, 3.1 + row * 1.3, Math.PI];
  },

  sync(s) {
    const now = App.now(), ps = Game.list(s), pub = ps.filter(p => p.role === 'publico' && p.id !== s.witness), seen = {};
    const trial = s.code + '|' + (s.kase ? s.kase.title : '');
    if (this._trial !== trial) { this._trial = trial; this.setView((App.player() || {}).role === 'juez' ? 'juez' : 'galeria'); }
    ps.forEach(p => {
      seen[p.id] = 1;
      const sig = p.role + JSON.stringify(p.acc) + (p.jailedUntil > now) + (Court.splat[p.id] > Date.now()) + p.on;
      let c = this.chars[p.id];
      const to = this.spot(s, p, pub);
      if (!c) { c = this.chars[p.id] = { g: new THREE.Group(), sig: '', hop: 0, ph: Math.random() * 6 }; c.g.position.set(to[0], to[1], to[2]); c.g.rotation.y = to[3]; c.g.userData.pid = p.id; this.scene.add(c.g);
        c.lab = document.createElement('span'); c.lab.className = 'nm nm3'; this.ov.appendChild(c.lab); }
      if (c.sig !== sig) { c.sig = sig; if (c.mesh) c.g.remove(c.mesh); c.mesh = Chars3D.build(p.role, p.acc, { seed: p.id, jailed: p.jailedUntil > now, splat: Court.splat[p.id] > Date.now() }); c.g.add(c.mesh); }
      c.to = to;
      c.lab.textContent = p.name + (s.speaker === p.id ? ' · tiene la palabra' : '');
      c.lab.className = 'nm nm3' + (p.id === App.me ? ' me' : '') + (s.speaker === p.id ? ' speak' : '') + (p.on ? '' : ' off');
    });
    for (const id in this.chars) if (!seen[id]) { this.scene.remove(this.chars[id].g); this.chars[id].lab.remove(); delete this.chars[id]; }
    this.speaker = s.speaker;
    const ev = s.evidence.find(e => e.id === s.shown), key = ev ? ev.id : '';
    if (this._ev !== key) {
      this._ev = key;
      if (ev) new THREE.TextureLoader().load(ev.img, tx => { tx.encoding = THREE.sRGBEncoding; if (this._ev === key) this.screen.material = new THREE.MeshBasicMaterial({ map: tx }); });
      else this.screen.material = this.paper;
    }
    this.screen.userData.zoom = key;
  },

  setView(name) { this.view = name; Object.assign(this.want, this.VIEWS[name]); },
  nextView() { const k = Object.keys(this.VIEWS); this.setView(k[(k.indexOf(this.view) + 1) % k.length]); },

  project(x, y, z) { const v = this.v.set(x, y, z).project(this.camera); return v.z > 1 ? null : [(v.x * 0.5 + 0.5) * 100, (-v.y * 0.5 + 0.5) * 100]; },
  head(id, dy) { const c = this.chars[id]; if (!c) return [50, 50]; const p = c.g.position; return this.project(p.x, p.y + (dy || 2.5), p.z) || [50, 50]; },
  hop(id) { if (this.chars[id]) this.chars[id].hop = 1; },
  hitGavel() { this.gavelT = 1; this.shake = 1; },
  tomato(by, to) {
    const a = this.chars[by], b = this.chars[to]; if (!a || !b) return;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), Chars3D.mat('#e3242b')); this.scene.add(m);
    this.toms.push({ m, a: a.g.position.clone().setY(a.g.position.y + 1.6), b: b.g.position.clone().setY(b.g.position.y + 1.5), k: 0 });
  },

  bind() {
    const el = this.renderer.domElement; let down = null, moved = false;
    el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; moved = false; });
    el.addEventListener('pointermove', e => {
      if (!down) return; const dx = e.clientX - down[0], dy = e.clientY - down[1];
      if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      moved = true; down = [e.clientX, e.clientY];
      this.want.az -= dx * 0.007; this.want.pol = Math.max(0.3, Math.min(1.45, this.want.pol - dy * 0.005));
    });
    el.addEventListener('pointerup', () => { down = null; }); el.addEventListener('pointercancel', () => { down = null; });
    el.addEventListener('click', e => {
      if (moved) return;
      const r = el.getBoundingClientRect(), xy = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      this.ray.setFromCamera(xy, this.camera);
      const hit = this.ray.intersectObjects(Object.values(this.chars).map(c => c.g).concat(this.screen), true)[0];
      let o = hit && hit.object; while (o && !o.userData.pid && !o.userData.zoom) o = o.parent;
      if (o && o.userData.pid) Court.menu(o.userData.pid, e.clientX, e.clientY);
      else { $('menu').hidden = true; if (o && o.userData.zoom) Evidence.zoom(o.userData.zoom); }
    });
    el.addEventListener('wheel', e => { e.preventDefault(); this.want.r = Math.max(6, Math.min(22, this.want.r + e.deltaY * 0.01)); }, { passive: false });
  },

  frame(ms) {
    requestAnimationFrame(t => this.frame(t));
    if (!Court.is3d || $('court').hidden) return;
    const dt = Math.min(0.05, (ms - this.t) / 1000 || 0); this.t = ms;
    const c = this.cam, w = this.want, k = 1 - Math.pow(0.002, dt);
    c.az += (w.az - c.az) * k; c.pol += (w.pol - c.pol) * k; c.r += (w.r - c.r) * k;
    const sh = this.shake > 0 ? (this.shake -= dt * 3, Math.sin(ms * 0.09) * 0.12 * Math.max(0, this.shake)) : 0;
    this.camera.position.set(this.target.x + c.r * Math.sin(c.pol) * Math.sin(c.az) + sh, this.target.y + c.r * Math.cos(c.pol) + sh, this.target.z + c.r * Math.sin(c.pol) * Math.cos(c.az));
    this.camera.lookAt(this.target);
    if (this.gavelT > 0) { this.gavelT -= dt * 3; this.gavel.rotation.z = -1.2 + (this.gavelT > 0 ? Math.sin(this.gavelT * Math.PI * 2) * 0.9 : 0); }
    for (const id in this.chars) {
      const ch = this.chars[id], g = ch.g, to = ch.to;
      g.position.x += (to[0] - g.position.x) * k; g.position.z += (to[2] - g.position.z) * k;
      let y = to[1]; if (ch.hop > 0) { ch.hop -= dt * 2.4; y += Math.sin(Math.max(0, ch.hop) * Math.PI) * 0.45; }
      g.position.y += (y - g.position.y) * Math.min(1, k * 3);
      g.rotation.y += (to[3] - g.rotation.y) * k; g.scale.y = 1 + Math.sin(ms * 0.003 + ch.ph) * 0.015;
      const p = this.project(g.position.x, g.position.y + 2.05, g.position.z);
      ch.lab.hidden = !p; if (p) { ch.lab.style.left = p[0] + '%'; ch.lab.style.top = p[1] + '%'; }
    }
    const sp = this.chars[this.speaker]; this.ring.visible = !!sp;
    if (sp) this.ring.position.set(sp.g.position.x, sp.to[1] + 0.06 + Math.sin(ms * 0.004) * 0.03, sp.g.position.z);
    this.toms = this.toms.filter(t => {
      t.k += dt * 1.8; const q = Math.min(1, t.k);
      t.m.position.lerpVectors(t.a, t.b, q); t.m.position.y += Math.sin(q * Math.PI) * 2.2;
      if (q >= 1) this.scene.remove(t.m); return q < 1;
    });
    // los carteles siguen a su personaje aunque gire la cámara
    $('stage').querySelectorAll('.sign[data-by]').forEach(el => { const p = this.head(el.dataset.by, 2.75); el.style.left = Math.max(12, Math.min(88, p[0])) + '%'; el.style.top = Math.max(9, p[1]) + '%'; });
    this.extras(ms, dt);
    this.renderer.render(this.scene, this.camera);
  },
};
