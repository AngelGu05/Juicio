// Paneles laterales: acciones según el rol, información secreta y registro del chat.
const Panels = {
  btn: (label, a, cls, dis) => `<button class="btn ${cls || ''}" ${dis ? 'disabled' : ''} data-act='${esc(JSON.stringify(a))}'>${label}</button>`,

  render(s) {
    const me = App.player(); if (!me) return;
    setHTML($('actions'), Panels.actions(s, me));
    setHTML($('secret'), Panels.secret(s, me));
    const log = $('log'), html = s.log.slice(-50).map(l => {
      if (l.kind === 'chat') { const p = s.players[l.by]; return `<div><b>${esc(p ? p.name : '¿?')}:</b> ${esc(l.text)}</div>`; }
      return `<div class="${l.kind}">${esc(l.text)}</div>`;
    }).join('');
    if (log._html !== html) { setHTML(log, html); log.scrollTop = log.scrollHeight; }
  },

  actions(s, me) {
    const D = GameData, B = Panels.btn, juez = me.role === 'juez', poli = me.role === 'policia', pub = me.role === 'publico';
    const adv = Game.isAdvocate(s, me), jurado = Game.publico(s), now = App.now();
    const name = id => esc((s.players[id] || {}).name || '¿?');
    let h = `<h3>${esc(me.name)} <span class="pill">${D.ROLES[me.role].name}</span></h3>`;
    if (me.jailedUntil > now) h += '<p class="secretBox">Estás en la celda. No puedes hablar ni reaccionar por unos segundos.</p>';
    if (s.phase === 'caso' || s.phase === 'prep') h += `<p class="caseTitle">${esc(s.kase.title)}</p><p>${esc(s.kase.summary)}</p>`;

    // Veredicto, sentencia y verdad: lo ve todo el mundo
    if (s.verdict) h += `<div class="final"><p class="note">Veredicto</p><p class="big">${s.verdict === 'culpable' ? 'CULPABLE' : 'INOCENTE'}</p>${s.sentence ? `<p><b>Sentencia:</b> ${esc(s.sentence)}</p>` : ''}</div>`;
    if (s.phase === 'fin') {
      const ok = (s.verdict === 'culpable') === s.kase.guilty;
      h += `<div class="final secretBox"><p class="note">La verdad</p><p class="big">${s.kase.guilty ? 'Era culpable' : 'Era inocente'}</p>
        <p>${esc(s.kase.dSecret.replace(/^ERES (CULPABLE|INOCENTE)\. /, ''))}</p><p><b>${ok ? 'Se hizo justicia.' : 'La justicia se equivocó.'}</b></p></div>`;
      h += Panels.awards(s, me);
    }

    if (me.hold) h += `<div class="secretBox"><b>Llevas en la mano: ${Court.HOLD[me.hold]}.</b><div class="acts">${me.hold === 'mazo' && !juez ? B('Golpear el mazo', { type: 'gavel' }, 'gold') : ''}${B('Soltar', { type: 'drop' })}</div>
      <p class="note">Toca a alguien para ${me.hold === 'libro' || me.hold === 'vaso' ? 'lanzárselo o ' : ''}entregárselo.</p></div>`;
    const thief = s.items && s.items.mazo && s.items.mazo !== me.id ? s.players[s.items.mazo] : null;
    if (juez && thief) h += `<p class="secretBox"><b>Te robaron el mazo.</b> Lo tiene ${esc(thief.name)}. Sin él no puedes pedir orden ni cerrar la votación: que el policía se lo quite, o usa "¡Orden!".</p>`;
    const a = [];
    if (juez) {
      const i = D.PHASES.findIndex(p => p.id === s.phase);
      let nx = null;
      for (let k = i + 1; k < D.PHASES.length; k++) {
        const id = D.PHASES[k].id;
        if ((id === 'prep' && !s.settings.prepMin) || (id === 'publico' && !jurado.length)) continue;
        nx = D.PHASES[k]; break;
      }
      const blocked = (s.phase === 'veredicto' && !s.verdict) || (s.phase === 'sentencia' && !s.sentence);
      if (nx && !blocked) a.push(B('Siguiente: ' + nx.name, { type: 'next' }, 'gold'));
      if (s.phase !== 'caso' && s.phase !== 'fin') a.push(B('Mazo: ¡orden en la sala!', { type: 'gavel' }), B('¡Orden! Todos a su lugar', { type: 'order' }, 'red'));
      if (s.objection && !s.objection.ruling) h += `<div class="secretBox"><b>${name(s.objection.by)} objeta.</b><div class="votes">${B('Ha lugar', { type: 'rule', ok: true }, 'ok')}${B('No ha lugar', { type: 'rule', ok: false }, 'red')}</div></div>`;
      if (s.phase === 'publico') {
        const qs = s.questions.filter(q => !q.used);
        h += '<div class="stack"><b>Preguntas del público</b>' + (qs.length ? qs.map(q =>
          `<div class="row"><span style="flex:1;min-width:0">${name(q.by)}: ${esc(q.text)}</span>${B('Elegir', { type: 'pickQuestion', id: q.id }, 'small')}</div>`).join('')
          : '<span class="note">Todavía no hay preguntas.</span>') + '</div>';
      }
      if (s.phase === 'veredicto' && !s.verdict) {
        if (jurado.length && !s.voteClosed) h += `<p>Han votado ${s.voteCount || 0} de ${jurado.length} jurados.</p>` + B('Cerrar la votación', { type: 'closeVote' }, 'gold');
        else h += `<p><b>${jurado.length ? 'Empate en el jurado.' : 'No hay jurado.'}</b> Decides tú.</p><div class="votes">${B('Culpable', { type: 'vote', v: 'culpable' }, 'red')}${B('Inocente', { type: 'vote', v: 'inocente' }, 'ok')}</div>`;
      }
      if (s.phase === 'sentencia' && !s.sentence) h += `<div class="stack"><label for="sentText">Dicta la sentencia</label>
        <textarea id="sentText" maxlength="200" placeholder="Se le condena a…"></textarea>
        <div class="row wrap"><button class="btn" data-pan="idea">Dame una idea</button><button class="btn gold" data-pan="sentence">Dictar sentencia</button></div></div>`;
    }
    if (poli) {
      s.evidence.filter(e => e.status === 'presentada').forEach(e => a.push(B('Llevar "' + esc(e.title) + '" al juez', { type: 'carryEvidence', id: e.id }, 'gold')));
      if (s.witnessCall) a.push(B('Traer a ' + name(s.witnessCall) + ' al estrado', { type: 'bringWitness' }, 'gold'));
    }
    if (adv && ['demanda', 'defensa', 'pruebas', 'publico', 'finales'].includes(s.phase))
      a.push(B('¡Objeción! (' + me.objections + ')', { type: 'objection' }, 'red', !me.objections || (s.objection && !s.objection.ruling)));
    if ((juez || adv) && s.witness) a.push(B('Retirar al testigo', { type: 'dismissWitness' }));
    if (pub && s.phase === 'publico') h += `<div class="stack"><label for="qText">Tu pregunta para la sala</label>
      <div class="row"><input id="qText" maxlength="140" placeholder="¿Y el perro qué opina?"><button class="btn gold" data-pan="ask">Enviar</button></div></div>`;
    if (pub && s.phase === 'veredicto' && !s.verdict && !s.voteClosed) {
      const v = s.votes[me.id];
      h += `<p><b>Jurado: ¿culpable o inocente?</b></p><div class="votes">${B('Culpable', { type: 'vote', v: 'culpable' }, v === 'culpable' ? 'red' : '')}${B('Inocente', { type: 'vote', v: 'inocente' }, v === 'inocente' ? 'ok' : '')}</div>`;
    }
    if (a.length) h += '<div class="acts">' + a.join('') + '</div>';

    // Pista de qué puede hacer este rol
    const tips = [];
    if (juez) tips.push('Toca a un personaje para darle la palabra o advertirle.');
    if (poli) tips.push('Toca a alguien para mandarlo a la celda cuando el juez lo ordene.');
    if (adv && s.phase === 'pruebas') tips.push('Toca a alguien para llamarlo al estrado.');
    if (pub) tips.push('Toca a un personaje para lanzarle un tomate. Te quedan ' + me.tomatoes + '.');
    if (!juez && s.phase !== 'fin') { const j = Game.byRole(s, 'juez'); tips.push('El juez' + (j ? ' (' + esc(j.name) + ')' : '') + ' avanza el juicio.'); }
    if (s.phase === 'fin' && (App.mode === 'local' || s.hostId === App.me)) h += `<button class="btn big gold" data-pan="again">Otro juicio</button>`;
    return h + (tips.length ? `<p class="note">${tips.join(' ')}</p>` : '');
  },

  awards(s, me) {
    const ps = Game.list(s), evs = s.evidence.filter(e => e.status === 'admitida'), mine = s.awards[me.id];
    const tally = k => { const c = {}; Object.values(s.awards).forEach(v => { if (v[k]) c[v[k]] = (c[v[k]] || 0) + 1; }); return Object.entries(c).sort((x, y) => y[1] - x[1])[0]; };
    const m = tally('mvp'), e = tally('ev');
    let h = '<div class="stack"><b>Premios de la sala</b>';
    if (m) h += `<p>Mejor actuación: <b>${esc((s.players[m[0]] || {}).name)}</b> (${m[1]})</p>`;
    if (e) h += `<p>Mejor prueba: <b>${esc((s.evidence.find(x => x.id === e[0]) || {}).title)}</b> (${e[1]})</p>`;
    if (!mine) h += `<div class="field"><label for="awMvp">Tu voto a la mejor actuación</label><select id="awMvp">${ps.filter(p => p.id !== me.id).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>` +
      (evs.length ? `<div class="field"><label for="awEv">Tu voto a la mejor prueba</label><select id="awEv">${evs.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select></div>` : '') +
      '<button class="btn" data-pan="award">Votar</button>';
    else h += '<p class="note">Ya votaste.</p>';
    return h + '</div>';
  },

  secret(s, me) {
    if (!s.kase || s.phase === 'fin') return '';
    const parts = [];
    if (me.role === 'demandado') parts.push(s.kase.dSecret);
    if (Game.sideOf(me) === 'dte') parts.push(s.kase.pSecret);
    if (me.role === 'abogado_ddo') parts.push('Tu cliente sabe si es culpable o inocente. Tú no: pregúntale… y decide si le crees.');
    if (s.witness === me.id && s.witnessCard) parts.push('Tu papel como testigo: ' + s.witnessCard);
    if (me.bribe) parts.push(((s.players[me.bribe] || {}).name || 'Alguien') + ' te dio una empanada y te la comiste. Estás sobornado: favorece a su lado… o confiésalo ante el juez.');
    if (!parts.length) return '';
    if (App.mode === 'local' && !App.reveal) return `<h3>Información secreta</h3><p class="note">Pásale la pantalla a ${esc(me.name)} y que nadie más mire.</p><button class="btn" data-pan="reveal">Ver lo que solo sabe ${esc(me.name)}</button>`;
    return '<h3>Solo tú lo sabes</h3>' + parts.map(t => `<p class="secretBox">${esc(t)}</p>`).join('') +
      (App.mode === 'local' ? '<button class="btn" data-pan="hide">Ocultar</button>' : '');
  },
};

document.querySelector('.side').addEventListener('click', e => {
  const b = e.target.closest('[data-pan]'); if (!b) return;
  const k = b.dataset.pan, S = GameData.SENTENCES;
  if (k === 'idea') $('sentText').value = S[Math.floor(Math.random() * S.length)];
  else if (k === 'sentence') { const t = $('sentText').value.trim(); if (!t) return App.toast('Escribe la sentencia.'); App.act({ type: 'sentence', text: t }); }
  else if (k === 'ask') { const t = $('qText').value.trim(); if (t) { App.act({ type: 'ask', text: t }); $('qText').value = ''; App.toast('Pregunta enviada al juez.'); } }
  else if (k === 'award') App.act({ type: 'award', mvp: $('awMvp') && $('awMvp').value, ev: $('awEv') && $('awEv').value });
  else if (k === 'again') App.actAs(App.s.hostId, { type: 'again' });
  else if (k === 'reveal' || k === 'hide') { App.reveal = k === 'reveal'; Panels.render(App.s); }
});
