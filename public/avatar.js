// Dibuja a cada personaje en SVG: la ropa depende del rol, los accesorios los elige el jugador.
(function (root) {
  const INK = '#2a1a12';
  const st = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const SHIRTS = ['#e4572e', '#17bebb', '#ffc914', '#76b041', '#a56cc1', '#ef798a', '#4d9de0'];
  const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  function outfit(role, seed) {
    const body = (fill, extra) => `<path d="M22 138 Q22 92 50 90 Q78 92 78 138 Z" fill="${fill}" ${st}/>${extra || ''}`;
    const tie = c => `<path d="M42 92 L50 104 L58 92 Z" fill="#fff" ${st}/><path d="M50 102 L45 124 L50 132 L55 124 Z" fill="${c}" ${st}/>`;
    switch (role) {
      case 'juez': return body('#22201f', `<path d="M40 92 Q50 112 60 92 L56 118 Q50 124 44 118 Z" fill="#fff" ${st}/>`);
      case 'policia': return body('#2b5fb3', `<path d="M50 92 V138" ${st} fill="none"/><path d="M60 104 l5 3 v6 q-5 5 -5 5 q0 0 -5 -5 v-6 z" fill="#ffc914" ${st}/><circle cx="46" cy="106" r="2" fill="${INK}"/><circle cx="46" cy="118" r="2" fill="${INK}"/>`);
      case 'abogado_dte': return body('#27356b', tie('#d7263d'));
      case 'abogado_ddo': return body('#5d6470', tie('#1b998b'));
      case 'demandante': return body('#f08a24', `<path d="M38 92 Q50 104 62 92" fill="none" ${st}/>`);
      case 'demandado': return body('#8b5fbf', `<path d="M40 93 Q50 108 60 93" fill="#6d459c" ${st}/><path d="M46 104 v12 M54 104 v12" ${st} fill="none"/>`);
      default: return body(SHIRTS[hash(seed) % SHIRTS.length], `<path d="M40 92 Q50 100 60 92" fill="none" ${st}/>`);
    }
  }

  function head(a, role) {
    const skin = a.piel || '#e8b88a', hair = a.pelo || '#2b1d16';
    let s = `<rect x="43" y="78" width="14" height="16" rx="4" fill="${skin}" ${st}/>`;
    // pelo de atrás, cabeza, pelo de adelante
    if (a.cabeza !== 'peluca') s += `<path d="M22 50 Q20 18 50 16 Q80 18 78 50 Q78 60 72 62 L28 62 Q22 60 22 50 Z" fill="${hair}" ${st}/>`;
    s += `<ellipse cx="50" cy="52" rx="25" ry="28" fill="${skin}" ${st}/>`;
    if (a.cabeza !== 'peluca') s += `<path d="M26 44 Q30 22 50 22 Q70 22 74 44 Q62 32 50 34 Q38 32 26 44 Z" fill="${hair}" ${st}/>`;
    // cara
    s += `<circle cx="40" cy="52" r="3.4" fill="${INK}"/><circle cx="60" cy="52" r="3.4" fill="${INK}"/>`;
    s += `<path d="M35 44 q5 -4 10 0 M55 44 q5 -4 10 0" fill="none" ${st}/>`;
    s += `<path d="M41 66 Q50 74 59 66" fill="none" ${st}/>`;
    if (a.cara === 'barba') s += `<path d="M27 58 Q28 86 50 86 Q72 86 73 58 Q66 70 50 62 Q34 70 27 58 Z" fill="${hair}" ${st}/><path d="M43 69 Q50 73 57 69" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
    if (a.cara === 'bigote') s += `<path d="M34 64 Q42 56 50 62 Q58 56 66 64 Q58 68 50 64 Q42 68 34 64 Z" fill="${hair}" ${st}/>`;
    if (a.cara === 'nariz_payaso') s += `<circle cx="50" cy="59" r="7" fill="#e3242b" ${st}/><circle cx="47.500" cy="56.500" r="2" fill="#fff"/>`;
    else s += `<path d="M50 54 q3 5 -1 6" fill="none" ${st}/>`;
    // ojos
    if (a.ojos === 'lentes') s += `<circle cx="40" cy="52" r="8" fill="#ffffff55" ${st}/><circle cx="60" cy="52" r="8" fill="#ffffff55" ${st}/><path d="M48 52 h4 M32 51 l-7 -3 M68 51 l7 -3" ${st} fill="none"/>`;
    if (a.ojos === 'lentes_sol') s += `<path d="M30 46 h17 v6 q0 7 -8.500 7 q-8.500 0 -8.500 -7 z M53 46 h17 v6 q0 7 -8.500 7 q-8.500 0 -8.500 -7 z" fill="#1b1b1b" ${st}/><path d="M47 48 h6 M30 48 l-6 -2 M70 48 l6 -2" ${st} fill="none"/>`;
    if (a.ojos === 'monoculo') s += `<circle cx="60" cy="52" r="8.500" fill="#ffffff55" stroke="#c9a227" stroke-width="3"/><path d="M66 58 q6 12 2 24" fill="none" stroke="#c9a227" stroke-width="2"/>`;
    // cabeza
    const c = a.cabeza || (role === 'policia' ? '_gorra' : '');
    if (c === 'peluca') s += `<path d="M24 60 Q10 60 14 46 Q8 34 20 28 Q20 14 34 14 Q42 4 52 10 Q64 4 70 14 Q84 16 80 30 Q92 36 86 48 Q90 60 76 60 Q78 44 70 38 Q60 30 50 32 Q38 30 30 38 Q22 46 24 60 Z" fill="#f4f1ea" ${st}/><path d="M16 60 q6 -6 12 0 q-6 6 -12 0 M72 60 q6 -6 12 0 q-6 6 -12 0" fill="#f4f1ea" ${st}/>`;
    if (c === 'sombrero') s += `<ellipse cx="50" cy="30" rx="36" ry="7" fill="#3a2a20" ${st}/><path d="M32 30 V10 Q50 4 68 10 V30 Z" fill="#3a2a20" ${st}/><path d="M32 24 H68" stroke="#d7263d" stroke-width="5"/>`;
    if (c === 'corona') s += `<path d="M30 30 L28 8 L40 20 L50 4 L60 20 L72 8 L70 30 Z" fill="#ffc914" ${st}/><circle cx="50" cy="22" r="3" fill="#d7263d"/>`;
    if (c === 'gorro') s += `<path d="M34 28 L52 -4 L68 26 Z" fill="#17bebb" ${st}/><circle cx="52" cy="-4" r="5" fill="#ffc914" ${st}/><path d="M40 18 l20 -4 M37 24 l28 -5" stroke="#fff" stroke-width="3"/>`;
    if (c === 'audifonos') s += `<path d="M24 52 Q22 16 50 16 Q78 16 76 52" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><rect x="16" y="44" width="12" height="20" rx="5" fill="#d7263d" ${st}/><rect x="72" y="44" width="12" height="20" rx="5" fill="#d7263d" ${st}/>`;
    if (c === '_gorra') s += `<path d="M26 34 Q26 12 50 12 Q74 12 74 34 Z" fill="#1d3f7a" ${st}/><path d="M22 34 H78 Q80 42 50 40 Q20 42 22 34 Z" fill="#14294f" ${st}/><circle cx="50" cy="24" r="5" fill="#ffc914" ${st}/>`;
    return s;
  }

  function neck(a) {
    if (a.cuello === 'mono') return `<path d="M50 94 L36 86 V102 Z M50 94 L64 86 V102 Z" fill="#d7263d" ${st}/><circle cx="50" cy="94" r="4" fill="#d7263d" ${st}/>`;
    if (a.cuello === 'bufanda') return `<path d="M34 86 Q50 98 66 86 L68 96 Q50 108 32 96 Z" fill="#1b998b" ${st}/><path d="M58 98 l4 24 l10 -2 l-5 -24 z" fill="#1b998b" ${st}/>`;
    if (a.cuello === 'collar') return [38, 44, 50, 56, 62].map((x, i) => `<circle cx="${x}" cy="${94 + [0, 3, 4, 3, 0][i]}" r="3" fill="#fff" ${st}/>`).join('');
    return '';
  }

  function svg(role, acc, opts) {
    opts = opts || {}; acc = acc || {};
    let s = `<svg class="av" viewBox="0 -12 100 152" aria-hidden="true">` + outfit(role, opts.seed) + head(acc, role) + neck(acc);
    if (opts.splat) s += `<path d="M38 36 q6 -10 12 -2 q10 -6 10 6 q10 4 0 10 q2 10 -8 6 q-6 8 -10 -2 q-12 0 -6 -8 q-8 -8 2 -10 z" fill="#e3242b" ${st}/><path d="M48 30 q2 -6 6 -4" fill="none" stroke="#3f8f3a" stroke-width="3" stroke-linecap="round"/>`;
    if (opts.jailed) s += [18, 34, 50, 66, 82].map(x => `<rect x="${x - 2}" y="-8" width="4" height="148" fill="#555d66" stroke="${INK}" stroke-width="1.500"/>`).join('') + `<rect x="8" y="-10" width="84" height="5" fill="#555d66" stroke="${INK}" stroke-width="1.500"/>`;
    return s + '</svg>';
  }

  root.Avatar = { svg };
})(typeof self !== 'undefined' ? self : this);
