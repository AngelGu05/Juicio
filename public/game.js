// Reglas del juicio. Lógica pura: la usan el servidor (en línea) y el navegador (una sola pantalla).
(function (root, f) {
  if (typeof module === 'object' && module.exports) module.exports = f(require('./data.js'));
  else root.Game = f(root.GameData);
})(typeof self !== 'undefined' ? self : this, function (D) {
  const ORDER = D.PHASES.map(p => p.id);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clean = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const uid = () => Math.random().toString(36).slice(2, 9);

  function newState(code, mode) {
    return {
      code, mode, hostId: null, phase: 'lobby', players: {}, order: [],
      settings: { prepMin: 2, pace: 'normal' },
      caseIdx: Math.floor(Math.random() * D.CASES.length), custom: null, guiltMode: 'azar',
      kase: null, speaker: null, timerEnd: null, evidence: [], shown: null,
      witness: null, witnessCall: null, witnessCard: '', objection: null,
      questions: [], question: null, votes: {}, voteClosed: false, verdict: null, sentence: '',
      awards: {}, log: [],
    };
  }

  function addPlayer(s, id, name) {
    if (!s.players[id]) {
      s.players[id] = {
        id, name: clean(name, 16) || 'Jugador', role: s.phase === 'lobby' ? '' : 'publico',
        acc: { cabeza: '', ojos: '', cara: '', cuello: '', piel: pick(D.SKINS.slice(0, 5)), pelo: pick(D.HAIRS) },
        on: true, jailedUntil: 0, warnings: 0, tomatoes: 3, objections: 3,
      };
      s.order.push(id);
    }
    s.players[id].on = true;
    if (!s.hostId || !s.players[s.hostId]) s.hostId = id;
    return s.players[id];
  }

  const list = s => s.order.map(id => s.players[id]).filter(Boolean);
  const byRole = (s, r) => list(s).find(p => p.role === r) || null;
  const publico = s => list(s).filter(p => p.role === 'publico');
  // Quien lleva la voz de cada lado: el abogado si existe, si no la propia parte.
  const advocate = (s, side) => byRole(s, 'abogado_' + side) || byRole(s, side === 'dte' ? 'demandante' : 'demandado');
  const sideOf = p => (p && D.ROLES[p.role] && D.ROLES[p.role].side) || null;
  const isAdvocate = (s, p) => { const sd = sideOf(p); return !!sd && advocate(s, sd).id === p.id; };
  const jailed = (p, now) => p.jailedUntil > now;

  function say(s, kind, text, by) {
    s.log.push({ id: uid(), t: Date.now(), kind, text, by: by || null });
    if (s.log.length > 80) s.log.shift();
  }

  function enter(s, phase, now) {
    s.phase = phase;
    s.objection = null; s.question = null;
    const secs = phase === 'prep' ? s.settings.prepMin * 60 : (D.PACE[s.settings.pace] || {})[phase];
    s.timerEnd = secs ? now + secs * 1000 : null;
    const j = byRole(s, 'juez');
    s.speaker = { demanda: advocate(s, 'dte'), defensa: advocate(s, 'ddo'), finales: advocate(s, 'dte') }[phase]
      ? { demanda: advocate(s, 'dte'), defensa: advocate(s, 'ddo'), finales: advocate(s, 'dte') }[phase].id
      : (j ? j.id : null);
    if (phase !== 'pruebas') { s.witness = null; s.witnessCall = null; s.witnessCard = ''; }
    if (phase === 'veredicto') { s.votes = {}; s.voteClosed = false; s.verdict = null; s.shown = null; }
    say(s, 'fase', D.PHASES.find(p => p.id === phase).name);
  }

  function nextPhase(s, now) {
    let i = ORDER.indexOf(s.phase) + 1;
    while (i < ORDER.length) {
      const id = ORDER[i];
      if (id === 'prep' && !s.settings.prepMin) { i++; continue; }
      if (id === 'publico' && !publico(s).length) { i++; continue; }
      break;
    }
    if (i < ORDER.length) enter(s, ORDER[i], now);
  }

  function randomRoles(s) {
    const ps = list(s).slice().sort(() => Math.random() - 0.5);
    const n = ps.length;
    let roles = ['juez', 'demandante', 'demandado'];
    if (n >= 5) roles.push('abogado_dte', 'abogado_ddo');
    if (n >= 6) roles.push('policia');
    ps.forEach((p, i) => { p.role = roles[i] || 'publico'; });
  }

  function start(s, now) {
    if (!byRole(s, 'juez') || !byRole(s, 'demandante') || !byRole(s, 'demandado')) return 'Faltan el juez, el demandante o el demandado.';
    list(s).forEach(p => { if (!p.role) p.role = 'publico'; p.jailedUntil = 0; p.warnings = 0; p.tomatoes = 3; p.objections = 3; });
    const c = s.custom || D.CASES[s.caseIdx];
    const guilty = s.custom && s.guiltMode !== 'azar' ? s.guiltMode === 'si' : Math.random() < 0.5;
    s.kase = {
      title: c.t, summary: c.s, guilty,
      pSecret: c.p || 'Tú presentaste la demanda. Convence a la sala de que tienes razón.',
      dSecret: guilty ? 'ERES CULPABLE. ' + (c.g || 'Lo hiciste. Que no se note.') : 'ERES INOCENTE. ' + (c.i || 'No lo hiciste. Demuéstralo.'),
    };
    s.evidence = []; s.shown = null; s.questions = []; s.sentence = ''; s.awards = {}; s.log = [];
    enter(s, 'caso', now);
    return null;
  }

  // Aplica una acción de un jugador. Devuelve {fx:[...]} o {err:'...'}.
  function act(s, pid, a, now) {
    now = now || Date.now();
    const p = s.players[pid];
    if (!p) return { err: 'No estás en la sala.' };
    const fx = [];
    const host = s.hostId === pid, juez = p.role === 'juez', poli = p.role === 'policia';
    const hayPoli = !!byRole(s, 'policia');
    const L = s.phase === 'lobby';
    const E = m => ({ err: m });
    const inTrial = ['demanda', 'defensa', 'pruebas', 'publico', 'finales'].includes(s.phase);

    switch (a.type) {
      case 'setName': p.name = clean(a.name, 16) || p.name; break;
      case 'setAcc': {
        const acc = a.acc || {};
        for (const k of Object.keys(D.ACCESSORIES)) if (D.ACCESSORIES[k].includes(acc[k])) p.acc[k] = acc[k];
        if (D.SKINS.includes(acc.piel)) p.acc.piel = acc.piel;
        if (D.HAIRS.includes(acc.pelo)) p.acc.pelo = acc.pelo;
        break;
      }
      case 'setRole': {
        if (!L) return E('El juicio ya empezó.');
        const r = a.role || '';
        if (r && !D.ROLES[r]) return E('Rol desconocido.');
        if (r && D.ROLES[r].unique && byRole(s, r) && byRole(s, r).id !== pid) return E('Ese rol ya está ocupado.');
        p.role = r; break;
      }
      case 'randomRoles': if (!host || !L) return E('Solo el anfitrión, antes de empezar.'); randomRoles(s); break;
      case 'settings': {
        if (!host || !L) return E('Solo el anfitrión, antes de empezar.');
        if (a.prepMin != null) s.settings.prepMin = Math.max(0, Math.min(15, Math.round(+a.prepMin) || 0));
        if (D.PACE[a.pace]) s.settings.pace = a.pace;
        break;
      }
      case 'setCase': {
        if (!host || !L) return E('Solo el anfitrión, antes de empezar.');
        if (a.custom) {
          const t = clean(a.custom.t, 60), su = clean(a.custom.s, 400);
          if (!t || !su) return E('Escribe el título y de qué trata el caso.');
          s.custom = { t, s: su }; s.guiltMode = ['azar', 'si', 'no'].includes(a.guilt) ? a.guilt : 'azar';
        } else {
          s.custom = null;
          s.caseIdx = a.idx == null ? Math.floor(Math.random() * D.CASES.length) : Math.max(0, Math.min(D.CASES.length - 1, a.idx | 0));
        }
        break;
      }
      case 'start': { if (!host || !L) return E('Solo el anfitrión puede empezar.'); const e = start(s, now); if (e) return E(e); fx.push({ k: 'banner', text: '¡Hay juicio!' }); break; }
      case 'again': {
        if (!host) return E('Solo el anfitrión.');
        s.phase = 'lobby'; s.kase = null; s.evidence = []; s.shown = null; s.speaker = null; s.timerEnd = null;
        s.witness = null; s.witnessCall = null; s.objection = null; s.verdict = null;
        s.custom = null; s.caseIdx = Math.floor(Math.random() * D.CASES.length);
        break;
      }
      case 'next': {
        if (!juez || L || s.phase === 'fin') return E('Solo el juez avanza el juicio.');
        if (s.phase === 'veredicto' && !s.verdict) return E('Primero hace falta el veredicto.');
        if (s.phase === 'sentencia' && !s.sentence) return E('Primero dicta la sentencia.');
        const was = s.phase; nextPhase(s, now);
        if (s.phase === 'apertura') fx.push({ k: 'gavel' }, { k: 'banner', text: 'Se abre la sesión' });
        else if (s.phase === 'fin') fx.push({ k: 'banner', text: s.kase.guilty ? 'Era CULPABLE' : 'Era INOCENTE' });
        else if (was !== s.phase) fx.push({ k: 'banner', text: D.PHASES.find(x => x.id === s.phase).name });
        break;
      }
      case 'giveWord': if (!juez) return E('Solo el juez da la palabra.'); if (s.players[a.to]) s.speaker = a.to; break;
      case 'chat': {
        if (jailed(p, now)) return E('Estás en la celda. Calladito.');
        const t = clean(a.text, 120); if (!t) break;
        say(s, 'chat', t, pid); fx.push({ k: 'sign', by: pid, text: t }); break;
      }
      case 'react': {
        if (jailed(p, now)) return E('Estás en la celda.');
        if (!['aplauso', 'abucheo', 'murmullo', 'risa', 'sorpresa'].includes(a.kind)) break;
        fx.push({ k: 'react', by: pid, kind: a.kind }); break;
      }
      case 'tomato': {
        if (p.role !== 'publico') return E('Solo el público lanza tomates.');
        if (jailed(p, now)) return E('Desde la celda no se lanzan tomates.');
        if (p.tomatoes < 1) return E('Ya no te quedan tomates.');
        if (!s.players[a.to] || a.to === pid) break;
        p.tomatoes--; fx.push({ k: 'tomato', by: pid, to: a.to }); break;
      }
      case 'objection': {
        if (!isAdvocate(s, p) || !inTrial) return E('Ahora no puedes objetar.');
        if (s.objection && !s.objection.ruling) return E('Ya hay una objeción pendiente.');
        if (p.objections < 1) return E('Ya no te quedan objeciones.');
        p.objections--; s.objection = { by: pid, ruling: null };
        say(s, 'sys', p.name + ' objeta.'); fx.push({ k: 'objection', by: pid }); break;
      }
      case 'rule': {
        if (!juez || !s.objection || s.objection.ruling) return E('No hay objeción pendiente.');
        s.objection.ruling = a.ok ? 'Ha lugar' : 'No ha lugar';
        say(s, 'sys', 'Objeción: ' + s.objection.ruling.toLowerCase() + '.');
        fx.push({ k: 'banner', text: s.objection.ruling, tone: a.ok ? 'ok' : 'no' }); break;
      }
      case 'gavel': if (!juez) return E('El mazo es del juez.'); fx.push({ k: 'gavel' }, { k: 'banner', text: '¡Orden en la sala!' }); break;
      case 'warn': {
        if (!juez) return E('Solo el juez advierte.');
        const t = s.players[a.to]; if (!t || t.role === 'juez') break;
        t.warnings++; say(s, 'sys', 'Advertencia para ' + t.name + ' (' + t.warnings + ').');
        fx.push({ k: 'warn', to: t.id }); break;
      }
      case 'jail': {
        if (!(poli || (juez && !hayPoli))) return E(hayPoli ? 'Eso le toca al policía.' : 'Solo el juez.');
        const t = s.players[a.to]; if (!t || t.role === 'juez' || t.id === pid) break;
        t.jailedUntil = now + 30000; say(s, 'sys', t.name + ' va a la celda 30 segundos.');
        fx.push({ k: 'jail', to: t.id }); break;
      }
      case 'addEvidence': {
        const sd = sideOf(p); if (!sd) return E('Solo las partes y sus abogados aportan pruebas.');
        if (!['prep', 'apertura', 'demanda', 'defensa', 'pruebas'].includes(s.phase)) return E('Ya no se aceptan pruebas nuevas.');
        if (s.evidence.filter(e => e.side === sd).length >= 3) return E('Máximo 3 pruebas por lado.');
        const img = String(a.img || '');
        if (!/^data:image\/(png|jpeg);base64,/.test(img) || img.length > 400000) return E('La imagen no es válida o pesa demasiado.');
        s.evidence.push({ id: uid(), side: sd, by: pid, title: clean(a.title, 40) || 'Prueba', img, status: 'borrador' });
        break;
      }
      case 'delEvidence': {
        const e = s.evidence.find(x => x.id === a.id);
        if (e && e.status === 'borrador' && sideOf(p) === e.side) s.evidence = s.evidence.filter(x => x !== e);
        break;
      }
      case 'presentEvidence': {
        const e = s.evidence.find(x => x.id === a.id);
        if (!e || e.side !== sideOf(p) || e.status !== 'borrador') break;
        if (!['demanda', 'defensa', 'pruebas'].includes(s.phase)) return E('Las pruebas se presentan durante los alegatos o en la fase de pruebas.');
        e.status = hayPoli ? 'presentada' : 'conjuez';
        say(s, 'sys', p.name + ' presenta la prueba "' + e.title + '".'); fx.push({ k: 'banner', text: 'Nueva prueba' }); break;
      }
      case 'carryEvidence': {
        const e = s.evidence.find(x => x.id === a.id);
        if (!poli || !e || e.status !== 'presentada') break;
        e.status = 'conjuez'; fx.push({ k: 'carry', by: pid }); break;
      }
      case 'ruleEvidence': {
        const e = s.evidence.find(x => x.id === a.id);
        if (!juez || !e || e.status !== 'conjuez') break;
        e.status = a.ok ? 'admitida' : 'rechazada'; if (a.ok) s.shown = e.id;
        say(s, 'sys', 'Prueba "' + e.title + '" ' + e.status + '.');
        fx.push({ k: 'banner', text: a.ok ? 'Prueba admitida' : 'Prueba rechazada', tone: a.ok ? 'ok' : 'no' }); break;
      }
      case 'showEvidence': {
        const e = s.evidence.find(x => x.id === a.id);
        if (!(juez || isAdvocate(s, p))) return E('Solo el juez o los abogados.');
        s.shown = e && e.status === 'admitida' ? e.id : null; break;
      }
      case 'callWitness': {
        if (s.phase !== 'pruebas') return E('Los testigos se llaman en la fase de pruebas.');
        if (!(juez || isAdvocate(s, p))) return E('Solo el juez o los abogados llaman testigos.');
        const t = s.players[a.to]; if (!t || t.role === 'juez' || t.role === 'policia') return E('Esa persona no puede subir al estrado.');
        if (hayPoli) { s.witnessCall = t.id; say(s, 'sys', p.name + ' llama a ' + t.name + ' al estrado.'); }
        else seat(s, t);
        break;
      }
      case 'bringWitness': {
        if (!poli || !s.witnessCall || !s.players[s.witnessCall]) break;
        seat(s, s.players[s.witnessCall]); fx.push({ k: 'carry', by: pid }); break;
      }
      case 'dismissWitness': if (!(juez || isAdvocate(s, p))) break; s.witness = null; s.witnessCall = null; s.witnessCard = ''; break;
      case 'ask': {
        if (p.role !== 'publico' || s.phase !== 'publico') return E('Las preguntas del público van en su fase.');
        const t = clean(a.text, 140); if (!t) break;
        if (s.questions.filter(q => q.by === pid).length >= 3) return E('Máximo 3 preguntas por persona.');
        s.questions.push({ id: uid(), by: pid, text: t, used: false }); break;
      }
      case 'pickQuestion': {
        const q = s.questions.find(x => x.id === a.id); if (!juez || !q) break;
        q.used = true; s.question = q.id; say(s, 'sys', 'Pregunta del público: ' + q.text); break;
      }
      case 'vote': {
        if (s.phase !== 'veredicto' || s.verdict) break;
        if (!['culpable', 'inocente'].includes(a.v)) break;
        const jurado = publico(s);
        if (p.role === 'publico' && !s.voteClosed) { s.votes[pid] = a.v; break; }
        // El juez decide si no hay jurado o si hubo empate.
        if (juez && (!jurado.length || s.voteClosed)) { s.verdict = a.v; fx.push({ k: 'gavel' }, { k: 'banner', text: a.v === 'culpable' ? '¡CULPABLE!' : '¡INOCENTE!', tone: a.v === 'culpable' ? 'no' : 'ok' }); }
        break;
      }
      case 'closeVote': {
        if (!juez || s.phase !== 'veredicto' || s.voteClosed) break;
        s.voteClosed = true;
        const v = Object.values(s.votes), c = v.filter(x => x === 'culpable').length, i = v.length - c;
        if (c !== i) { s.verdict = c > i ? 'culpable' : 'inocente'; fx.push({ k: 'gavel' }, { k: 'banner', text: c > i ? '¡CULPABLE!' : '¡INOCENTE!', tone: c > i ? 'no' : 'ok' }); }
        else say(s, 'sys', 'Empate en el jurado. Decide el juez.');
        break;
      }
      case 'sentence': {
        if (!juez || s.phase !== 'sentencia') break;
        s.sentence = clean(a.text, 200); if (s.sentence) { say(s, 'sys', 'Sentencia: ' + s.sentence); fx.push({ k: 'gavel' }); }
        break;
      }
      case 'award': {
        if (s.phase !== 'fin') break;
        s.awards[pid] = { mvp: s.players[a.mvp] && a.mvp !== pid ? a.mvp : null, ev: s.evidence.find(e => e.id === a.ev) ? a.ev : null };
        break;
      }
      default: return E('Acción desconocida.');
    }
    return { fx };
  }

  function seat(s, t) {
    s.witness = t.id; s.witnessCall = null;
    s.witnessCard = t.role === 'publico' ? pick(D.WITNESS_CARDS) : 'Eres parte del caso. Responde según lo que sabes… o lo que te convenga.';
    say(s, 'sys', t.name + ' sube al estrado.');
  }

  // Lo que ve cada jugador: se quitan los secretos que no le corresponden.
  function view(s, pid, now) {
    const p = s.players[pid] || {};
    const v = JSON.parse(JSON.stringify(s));
    v.now = now || Date.now(); v.me = pid;
    if (v.kase && s.phase !== 'fin') {
      const sd = sideOf(p);
      if (p.role !== 'demandado') { delete v.kase.guilty; delete v.kase.dSecret; }
      if (sd !== 'dte') delete v.kase.pSecret;
    }
    if (s.witness !== pid) v.witnessCard = '';
    if (s.phase === 'veredicto' && !s.verdict) { const mine = s.votes[pid]; v.voteCount = Object.keys(s.votes).length; v.votes = mine ? { [pid]: mine } : {}; }
    // Las pruebas en borrador solo las ve su lado.
    v.evidence = v.evidence.filter(e => e.status !== 'borrador' || e.side === sideOf(p));
    return v;
  }

  return { newState, addPlayer, act, view, list, byRole, publico, advocate, sideOf, isAdvocate };
});
