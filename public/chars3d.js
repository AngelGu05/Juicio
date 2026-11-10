// Personajes en 3D hechos con figuras simples. La ropa depende del rol; los accesorios, del jugador.
const Chars3D = (() => {
  const mats = {};
  const mat = c => mats[c] || (mats[c] = new THREE.MeshLambertMaterial({ color: c }));
  const SHIRTS = ['#e4572e', '#17bebb', '#ffc914', '#76b041', '#a56cc1', '#ef798a', '#4d9de0'];
  const BODY = { juez: '#22201f', policia: '#2b5fb3', abogado_dte: '#27356b', abogado_ddo: '#5d6470', demandante: '#f08a24', demandado: '#8b5fbf' };
  const INK = '#2a1a12';
  const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const sph = (r, a, b, c, d) => new THREE.SphereGeometry(r, 20, 14, 0, Math.PI * 2, a || 0, b == null ? Math.PI : b);
  const cyl = (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n || 18);
  const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
  const tor = (r, t, arc) => new THREE.TorusGeometry(r, t, 8, 24, arc || Math.PI * 2);

  function build(role, acc, opts) {
    acc = acc || {}; opts = opts || {};
    const g = new THREE.Group();
    const m = (geo, color, p, r, s) => {
      const o = new THREE.Mesh(geo, mat(color));
      if (p) o.position.set(p[0], p[1], p[2]); if (r) o.rotation.set(r[0], r[1], r[2]); if (s) o.scale.set(s[0], s[1], s[2]);
      o.castShadow = true; g.add(o); return o;
    };
    const skin = acc.piel || '#e8b88a', hair = acc.pelo || '#2b1d16';
    const body = BODY[role] || SHIRTS[hash(opts.seed) % SHIRTS.length];

    // cuerpo y brazos
    m(cyl(0.27, role === 'juez' ? 0.56 : 0.46, 1.0), body, [0, 0.5, 0]);
    // cada brazo gira desde el hombro, para poder levantar carteles
    g.userData.arms = [-1, 1].map(k => {
      const a = new THREE.Group(); a.position.set(k * 0.3, 0.95, 0.02); a.userData.k = k; g.add(a);
      a.add(m(cyl(0.085, 0.085, 0.55, 10), body, [0, -0.275, 0])); a.add(m(sph(0.1), skin, [0, -0.57, 0]));
      return a;
    });
    // detalles de la ropa según el rol
    if (role === 'juez') m(box(0.22, 0.34, 0.06), '#ffffff', [0, 0.8, 0.31], [-0.15, 0, 0]);
    if (role === 'abogado_dte' || role === 'abogado_ddo') {
      m(box(0.26, 0.3, 0.04), '#ffffff', [0, 0.84, 0.29], [-0.15, 0, 0]);
      m(box(0.09, 0.42, 0.05), role === 'abogado_dte' ? '#d7263d' : '#1b998b', [0, 0.72, 0.33], [-0.15, 0, 0]);
    }
    if (role === 'policia') {
      m(cyl(0.06, 0.06, 0.03, 6), '#ffc914', [0.16, 0.8, 0.33], [Math.PI / 2 - 0.15, 0, 0]);
      m(box(0.72, 0.07, 0.6), '#14294f', [0, 0.42, 0.02]);
    }
    if (role === 'demandado') [-1, 1].forEach(k => m(cyl(0.015, 0.015, 0.26, 6), '#ffffff', [k * 0.07, 0.8, 0.32], [-0.15, 0, 0]));

    // cabeza
    const HY = 1.4;
    m(sph(0.4), skin, [0, HY, 0]);
    if (acc.cabeza !== 'peluca') m(sph(0.425, 0, Math.PI * 0.52), hair, [0, HY + 0.01, -0.02], [-0.42, 0, 0]);
    [-1, 1].forEach(k => m(sph(0.05), INK, [k * 0.14, HY + 0.04, 0.365]));
    m(tor(0.1, 0.018, Math.PI), INK, [0, HY - 0.1, 0.375], [0.15, 0, Math.PI]);

    // cara
    if (acc.cara === 'nariz_payaso') m(sph(0.1), '#e3242b', [0, HY - 0.04, 0.42]);
    else m(sph(0.045), skin, [0, HY - 0.03, 0.4]);
    if (acc.cara === 'bigote') [-1, 1].forEach(k => m(sph(0.1), hair, [k * 0.09, HY - 0.11, 0.39], [0, 0, k * -0.3], [1.1, 0.4, 0.4]));
    if (acc.cara === 'barba') m(sph(0.43, Math.PI * 0.58, Math.PI * 0.42), hair, [0, HY, 0.03], [0.5, 0, 0]);

    // ojos
    if (acc.ojos === 'lentes') { [-1, 1].forEach(k => m(tor(0.1, 0.018), INK, [k * 0.14, HY + 0.04, 0.4])); m(box(0.1, 0.02, 0.02), INK, [0, HY + 0.04, 0.41]); }
    if (acc.ojos === 'lentes_sol') { [-1, 1].forEach(k => m(box(0.21, 0.13, 0.04), '#111111', [k * 0.14, HY + 0.04, 0.39])); m(box(0.1, 0.03, 0.03), '#111111', [0, HY + 0.07, 0.4]); }
    if (acc.ojos === 'monoculo') { m(tor(0.105, 0.02), '#c9a227', [0.14, HY + 0.04, 0.4]); m(cyl(0.008, 0.008, 0.4, 5), '#c9a227', [0.26, HY - 0.16, 0.36], [0, 0, 0.2]); }

    // cabeza: accesorio elegido, o la gorra si es policía
    const c = acc.cabeza || (role === 'policia' ? '_gorra' : '');
    if (c === 'peluca') {
      const W = '#f4f1ea';
      m(sph(0.44), W, [0, HY + 0.08, -0.06], null, [1.05, 0.95, 1]);
      [-1, 1].forEach(k => [0.12, -0.12, -0.36].forEach((dy, i) => m(sph(0.17), W, [k * (0.4 + i * 0.02), HY + dy, 0.02 - i * 0.02])));
      [-0.2, 0, 0.2].forEach(dx => m(sph(0.17), W, [dx, HY + 0.36, 0.2]));
    }
    if (c === 'sombrero') { m(cyl(0.62, 0.62, 0.04, 24), '#3a2a20', [0, HY + 0.3, 0]); m(cyl(0.3, 0.33, 0.36), '#3a2a20', [0, HY + 0.49, 0]); m(cyl(0.337, 0.337, 0.08), '#d7263d', [0, HY + 0.36, 0]); }
    if (c === 'corona') {
      m(cyl(0.3, 0.3, 0.16, 16), '#ffc914', [0, HY + 0.4, 0]);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; m(new THREE.ConeGeometry(0.07, 0.18, 8), '#ffc914', [Math.sin(a) * 0.26, HY + 0.56, Math.cos(a) * 0.26]); }
      m(sph(0.05), '#d7263d', [0, HY + 0.4, 0.3]);
    }
    if (c === 'gorro') { m(new THREE.ConeGeometry(0.23, 0.6, 16), '#17bebb', [0.05, HY + 0.62, 0], [0, 0, -0.12]); m(sph(0.07), '#ffc914', [0.09, HY + 0.94, 0]); m(tor(0.2, 0.03), '#ffffff', [0.03, HY + 0.4, 0], [Math.PI / 2, 0, 0]); }
    if (c === 'audifonos') { m(tor(0.44, 0.035, Math.PI), INK, [0, HY, 0]); [-1, 1].forEach(k => m(cyl(0.14, 0.14, 0.1), '#d7263d', [k * 0.43, HY, 0], [0, 0, Math.PI / 2])); }
    if (c === '_gorra') { m(cyl(0.36, 0.41, 0.2), '#1d3f7a', [0, HY + 0.33, 0]); m(box(0.52, 0.04, 0.28), '#14294f', [0, HY + 0.25, 0.32]); m(sph(0.06), '#ffc914', [0, HY + 0.34, 0.39]); }

    // cuello
    if (acc.cuello === 'mono') { [-1, 1].forEach(k => m(new THREE.ConeGeometry(0.09, 0.18, 8), '#d7263d', [k * 0.11, 0.98, 0.3], [0, 0, k * Math.PI / 2])); m(sph(0.045), '#d7263d', [0, 0.98, 0.31]); }
    if (acc.cuello === 'bufanda') { m(tor(0.29, 0.09), '#1b998b', [0, 1.02, 0], [Math.PI / 2, 0, 0]); m(box(0.16, 0.42, 0.07), '#1b998b', [0.16, 0.8, 0.34], [-0.15, 0, 0]); }
    if (acc.cuello === 'collar') for (let i = -4; i <= 4; i++) { const a = i * 0.26; m(sph(0.04), '#ffffff', [Math.sin(a) * 0.3, 0.98 - Math.cos(a) * 0.03, Math.cos(a) * 0.3]); }

    if (opts.splat) { m(sph(0.24), '#e3242b', [0.05, HY + 0.3, 0.16], null, [1, 0.5, 1]); m(sph(0.1), '#e3242b', [-0.2, HY + 0.12, 0.3], null, [1, 0.6, 0.6]); m(cyl(0.02, 0.02, 0.12, 5), '#3f8f3a', [0.05, HY + 0.44, 0.16]); }
    if (opts.jailed) {
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; m(cyl(0.03, 0.03, 2.2, 6), '#555d66', [Math.sin(a) * 0.72, 1.1, Math.cos(a) * 0.72]); }
      m(tor(0.72, 0.04), '#555d66', [0, 2.2, 0], [Math.PI / 2, 0, 0]); m(tor(0.72, 0.04), '#555d66', [0, 0.03, 0], [Math.PI / 2, 0, 0]);
    }
    return g;
  }
  return { build, mat };
})();
