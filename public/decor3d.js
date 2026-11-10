// Decoración de la sala 3D (bandera, ventanas, plantas, libros…) y los carteles que los personajes levantan con las manos.
Object.assign(Stage3D, {
  tex(w, h, draw) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t;
  },
  star(g, cx, cy, r, color) {
    g.fillStyle = color; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.4 : r; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); }
    g.closePath(); g.fill();
  },

  decorate() {
    const S = this.scene, M = Chars3D.mat, GOLD = '#ffc914', DARK = '#6b3618', WOOD = '#a05a2c', INK = '#2a1a12';
    const put = (geo, color, p, rot, parent) => {
      const o = new THREE.Mesh(geo, typeof color === 'string' ? M(color) : color); o.position.set(p[0], p[1], p[2]);
      if (rot) o.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0); o.castShadow = o.receiveShadow = true; (parent || S).add(o); return o;
    };
    const box = (x, y, z) => new THREE.BoxGeometry(x, y, z), cyl = (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n || 14);
    const sph = r => new THREE.SphereGeometry(r, 14, 10), plane = (w, h) => new THREE.PlaneGeometry(w, h);
    const pic = (w, h, p, ry, t) => { const o = put(plane(w, h), new THREE.MeshBasicMaterial({ map: t }), p, [0, ry || 0, 0]); o.castShadow = false; return o; };
    const flat = (w, d, color, p) => { const o = put(plane(w, d), color, p, [-Math.PI / 2, 0, 0]); o.castShadow = false; return o; };

    // pared del frente: solo se ve desde dentro (primera persona)
    put(plane(14, 6.5), '#1d4b46', [0, 3.25, 7.5], [0, Math.PI, 0]).castShadow = false; put(plane(14, 1.3), DARK, [0, 0.65, 7.48], [0, Math.PI, 0]).castShadow = false;
    // alfombra del pasillo central
    flat(2.6, 10.6, '#8f1d2c', [0, 0.012, 2.1]); [-1, 1].forEach(k => flat(0.14, 10.6, GOLD, [k * 1.12, 0.016, 2.1]));

    // bandera de Panamá en su asta, junto al juez
    put(cyl(0.26, 0.32, 0.14), DARK, [-2.25, 0.67, -6.3]); put(cyl(0.045, 0.045, 3.7, 10), GOLD, [-2.25, 2.5, -6.3]); put(sph(0.1), GOLD, [-2.25, 4.4, -6.3]);
    const flagTex = this.tex(300, 200, (g) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 300, 200); g.fillStyle = '#da121a'; g.fillRect(150, 0, 150, 100); g.fillStyle = '#072357'; g.fillRect(0, 100, 150, 100);
      this.star(g, 75, 52, 30, '#072357'); this.star(g, 225, 152, 30, '#da121a');
    });
    const fg = new THREE.PlaneGeometry(1.8, 1.2, 16, 1); fg.translate(0.9, 0, 0);
    // De una sola cara, como las paredes: vista desde atrás (cámara del juez) no tapa la sala.
    this.flag = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ map: flagTex })); this.flag.position.set(-2.2, 3.7, -6.3); S.add(this.flag);
    this.flagX = Array.from(fg.attributes.position.array);
    // banderita de escritorio en el estrado, para que el juez también la vea
    put(cyl(0.07, 0.09, 0.04), GOLD, [1.7, 1.65, -4.45]); put(cyl(0.012, 0.012, 0.56, 6), GOLD, [1.7, 1.91, -4.45]);
    const mini = put(plane(0.45, 0.3), new THREE.MeshLambertMaterial({ map: flagTex, side: THREE.DoubleSide }), [1.93, 2.03, -4.45]); mini.castShadow = false;

    // pared del fondo: lema, reloj y cuadro
    const motto = this.tex(1024, 96, (g, w, h) => {
      const draw = () => { g.fillStyle = DARK; g.fillRect(0, 0, w, h); g.strokeStyle = GOLD; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
        g.fillStyle = GOLD; g.font = '46px "Lilita One", "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TRIBUNAL SUPREMO DE ASUNTOS SIN IMPORTANCIA', w / 2, h / 2 + 3, w - 40); };
      draw(); if (document.fonts && document.fonts.load) document.fonts.load('46px "Lilita One"').then(() => { draw(); motto.needsUpdate = true; }, () => {});
    });
    pic(6.2, 0.58, [0, 4.15, -6.955], 0, motto);
    pic(1.0, 1.0, [4.9, 4.9, -6.955], 0, this.tex(200, 200, g => {
      g.fillStyle = INK; g.beginPath(); g.arc(100, 100, 98, 0, 7); g.fill(); g.fillStyle = '#fff5dc'; g.beginPath(); g.arc(100, 100, 86, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.lineWidth = 5; g.beginPath(); g.moveTo(100 + Math.cos(a) * 70, 100 + Math.sin(a) * 70); g.lineTo(100 + Math.cos(a) * 80, 100 + Math.sin(a) * 80); g.stroke(); }
      g.lineWidth = 9; g.beginPath(); g.moveTo(100, 100); g.lineTo(70, 62); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(100, 100); g.lineTo(148, 70); g.stroke();
    }));
    pic(1.9, 1.5, [5.3, 3.35, -6.955], 0, this.tex(380, 300, g => {
      g.fillStyle = GOLD; g.fillRect(0, 0, 380, 300); g.fillStyle = '#27356b'; g.fillRect(22, 22, 336, 256);
      g.strokeStyle = GOLD; g.fillStyle = GOLD; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath(); g.moveTo(190, 70); g.lineTo(190, 235); g.moveTo(140, 240); g.lineTo(240, 240); g.moveTo(95, 95); g.lineTo(285, 95); g.stroke();
      [95, 285].forEach(x => { g.lineWidth = 4; g.beginPath(); g.moveTo(x, 95); g.lineTo(x - 38, 170); g.moveTo(x, 95); g.lineTo(x + 38, 170); g.stroke(); g.beginPath(); g.arc(x, 170, 40, 0, Math.PI); g.fill(); });
      g.beginPath(); g.arc(190, 68, 12, 0, 7); g.fill();
    }));

    // ventanas y puerta en las paredes laterales
    const win = sun => this.tex(220, 280, g => {
      const sky = g.createLinearGradient(0, 0, 0, 280); sky.addColorStop(0, '#7cc7ea'); sky.addColorStop(1, '#d6f0f7'); g.fillStyle = sky; g.fillRect(0, 0, 220, 280);
      if (sun) { g.fillStyle = '#ffd94a'; g.beginPath(); g.arc(160, 70, 26, 0, 7); g.fill(); }
      g.fillStyle = '#ffffff'; [[60, 120, 22], [86, 112, 28], [112, 122, 20]].forEach(c => { g.beginPath(); g.arc(c[0], c[1] + (sun ? 60 : 0), c[2], 0, 7); g.fill(); });
      g.fillStyle = '#2f8f4e'; g.beginPath(); g.arc(40, 300, 70, 0, 7); g.arc(170, 310, 80, 0, 7); g.fill();
      g.strokeStyle = DARK; g.lineWidth = 18; g.strokeRect(9, 9, 202, 262); g.lineWidth = 9; g.beginPath(); g.moveTo(110, 0); g.lineTo(110, 280); g.moveTo(0, 140); g.lineTo(220, 140); g.stroke();
    });
    const wA = win(true), wB = win(false);
    [-3.6, 1.6].forEach((z, i) => { pic(2.3, 2.9, [-6.955, 3.7, z], Math.PI / 2, i ? wB : wA); pic(2.3, 2.9, [6.955, 3.7, z], -Math.PI / 2, i ? wA : wB); });
    pic(1.9, 3.3, [6.955, 1.65, 5.6], -Math.PI / 2, this.tex(190, 330, g => {
      g.fillStyle = DARK; g.fillRect(0, 0, 190, 330); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(4, 4, 182, 322);
      g.lineWidth = 5; g.strokeStyle = '#4d2510'; g.strokeRect(28, 28, 134, 120); g.strokeRect(28, 176, 134, 126); g.fillStyle = GOLD; g.beginPath(); g.arc(160, 168, 9, 0, 7); g.fill();
    }));

    // plantas
    [[-6.3, -6.3], [6.3, -2.6], [-6.3, 6.7], [6.3, 2.9], [-6.3, -0.9]].forEach(([x, z]) => {
      put(cyl(0.34, 0.25, 0.55), '#b5532a', [x, 0.275, z]);
      [[0, 0.95, 0, 0.42], [0.18, 1.3, 0.1, 0.32], [-0.2, 1.25, -0.08, 0.3], [0.02, 1.62, 0, 0.24]].forEach(l => put(sph(l[3]), '#2f8f4e', [x + l[0], l[1], z + l[2]]));
    });

    // librero en la esquina del fondo
    const COL = ['#d7263d', '#1b998b', '#2b5fb3', '#ffc914', '#8b5fbf', '#f08a24', '#f4f1ea'];
    put(box(2.5, 2.5, 0.55), DARK, [5.5, 1.25, -6.68]);
    [0.5, 1.28, 2.06].forEach((y, r) => { put(box(2.3, 0.06, 0.5), WOOD, [5.5, y - 0.3, -6.5]);
      for (let i = 0; i < 8; i++) { const hgt = 0.42 + ((i * 7 + r * 3) % 5) * 0.04; put(box(0.2, hgt, 0.3), COL[(i * 3 + r * 2) % COL.length], [4.55 + i * 0.27, y - 0.27 + hgt / 2, -6.42], [0, 0, (i + r) % 6 === 5 ? 0.18 : 0]); } });

    // cosas sobre las mesas de las partes
    [-1, 1].forEach(k => {
      const t = new THREE.Group(); t.position.set(k * 3.9, 0.92, -1.3); t.rotation.y = -k * 0.93; S.add(t);
      [0, 1, 2].forEach(i => put(box(0.5 - i * 0.05, 0.09, 0.36), COL[(i + (k > 0 ? 2 : 0)) % 5], [-0.85, 0.045 + i * 0.09, 0.05], [0, i * 0.2, 0], t));
      put(box(0.42, 0.012, 0.56), '#ffffff', [0.2, 0.01, 0.1], [0, 0.15, 0], t); put(box(0.42, 0.012, 0.56), '#fff5dc', [0.32, 0.02, 0.06], [0, -0.2, 0], t);
      put(cyl(0.07, 0.06, 0.2), '#bfe6f2', [0.95, 0.1, -0.1], null, t);
    });

    // balanza de la justicia y papeles en el estrado del juez
    const sc = new THREE.Group(); sc.position.set(-1.35, 1.63, -4.5); S.add(sc);
    put(cyl(0.16, 0.2, 0.06), GOLD, [0, 0.03, 0], null, sc); put(cyl(0.025, 0.025, 0.7, 8), GOLD, [0, 0.38, 0], null, sc); put(box(0.8, 0.035, 0.035), GOLD, [0, 0.7, 0], null, sc); put(sph(0.05), GOLD, [0, 0.75, 0], null, sc);
    [-1, 1].forEach(k => { put(cyl(0.006, 0.006, 0.3, 4), GOLD, [k * 0.38, 0.55, 0], null, sc); put(cyl(0.15, 0.09, 0.04), GOLD, [k * 0.38, 0.4, 0], null, sc); });
    put(box(0.5, 0.012, 0.36), '#ffffff', [0, 1.636, -4.5], [0, 0.1, 0]); [0, 1].forEach(i => put(box(0.5, 0.1, 0.36), COL[i + 1], [-0.55, 1.68 + i * 0.1, -4.55], [0, i * 0.25, 0]));
    // micrófono del testigo y escritorio del secretario con su máquina de escribir
    put(cyl(0.015, 0.015, 0.34, 6), INK, [3.3, 1.47, -3.82], [0.3, 0, 0]); put(sph(0.06), INK, [3.3, 1.64, -3.77]);
    put(box(1.3, 0.72, 0.7), WOOD, [-1.75, 0.36, -3.3]); put(box(1.45, 0.06, 0.85), DARK, [-1.75, 0.75, -3.3]);
    put(box(0.5, 0.16, 0.36), '#3b4048', [-1.75, 0.86, -3.3]); put(box(0.4, 0.3, 0.02), '#ffffff', [-1.75, 1.05, -3.42], [-0.25, 0, 0]); put(cyl(0.2, 0.2, 0.45), DARK, [-1.75, 0.225, -2.55]);
  },

  // --- cartel de cartón con palo, sostenido con las dos manos ---
  sign(id, text) {
    const c = this.chars[id]; if (!c) return;
    if (c.sign) c.g.remove(c.sign.g);
    const t = this.tex(640, 272, (g, w, h) => {
      g.fillStyle = '#e9c98a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a1a12'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
      g.fillStyle = '#2a1a12'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let lines = [], size = 92;
      for (; size >= 30; size -= 6) {
        g.font = '800 ' + size + 'px Nunito, "Trebuchet MS", sans-serif'; lines = []; let cur = '';
        for (let wd of text.split(/\s+/)) {
          while (g.measureText(wd).width > w - 60) { let n = wd.length; while (n > 1 && g.measureText(wd.slice(0, n)).width > w - 60) n--; if (cur) { lines.push(cur); cur = ''; } lines.push(wd.slice(0, n)); wd = wd.slice(n); }
          const tryL = cur ? cur + ' ' + wd : wd;
          if (g.measureText(tryL).width > w - 60) { lines.push(cur); cur = wd; } else cur = tryL;
        }
        if (cur) lines.push(cur);
        if (lines.length * size * 1.12 <= h - 44) break;
      }
      lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.12 + 4));
    });
    const g = new THREE.Group(); g.position.set(0, 0, 0.5);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 8), Chars3D.mat('#6b3618')); pole.position.y = 1.75; pole.castShadow = true; g.add(pole);
    const board = new THREE.Group(); board.position.y = 3.25; g.add(board);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.16, 0.06), Chars3D.mat('#c9a35f')); back.castShadow = true; board.add(back);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.105), new THREE.MeshBasicMaterial({ map: t })); face.position.z = 0.035; board.add(face);
    c.g.add(g); c.sign = { g, board, k: 0, until: this.t + 4800 }; c.hop = 1;
  },

  // Animaciones por cuadro: brazos, carteles y bandera.
  extras(ms, dt) {
    const DOWN = this._down || (this._down = new THREE.Vector3(0, -1, 0)), d = this._dir || (this._dir = new THREE.Vector3());
    for (const id in this.chars) {
      const c = this.chars[id], sg = c.sign;
      if (sg) {
        sg.k = Math.max(0, Math.min(1, sg.k + (ms < sg.until ? dt * 4 : -dt * 4)));
        if (sg.k <= 0 && ms >= sg.until) { c.g.remove(sg.g); c.sign = null; }
        else {
          const e = 1 - Math.pow(1 - sg.k, 3), p = c.g.position, dist = this.camera.position.distanceTo(p);
          sg.g.scale.setScalar(Math.max(0.001, e)); sg.g.position.y = -0.7 * (1 - e);
          sg.board.scale.setScalar(Math.max(0.85, Math.min(1.5, dist / 12)));
          // En primera persona, tu propio cartel se gira hacia ti y baja para que lo veas.
          const own = this.isFp && id === App.me;
          sg.board.position.set(0, own ? 2.4 : 3.25, own ? 1.7 : 0);
          if (own) sg.board.scale.setScalar(0.38);
          sg.g.children[0].visible = !own;
          sg.board.rotation.y = own ? Math.PI : Math.atan2(this.camera.position.x - p.x, this.camera.position.z - p.z) - c.g.rotation.y;
          sg.board.rotation.z = Math.sin(ms * 0.006) * 0.05;
        }
      }
      const up = c.sign ? 1 - Math.pow(1 - c.sign.k, 3) : 0, arms = c.mesh && c.mesh.userData.arms;
      if (arms) arms.forEach(a => {
        const k = a.userData.k;
        d.set(k * 0.27 - k * 0.49 * up, -0.96 + 1.03 * up, 0.05 + 0.4 * up).normalize(); a.quaternion.setFromUnitVectors(DOWN, d);
      });
    }
    if (this.flag) {
      const a = this.flag.geometry.attributes.position, b = this.flagX;
      for (let i = 0; i < a.count; i++) a.setZ(i, Math.sin(b[i * 3] * 4 - ms * 0.004) * 0.09 * b[i * 3]);
      a.needsUpdate = true;
    }
  },
});
