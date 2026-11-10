// Sala de espera: roles, personaje, caso y ajustes.
App.actAs = (pid, a) => {
  if (App.mode !== 'local') return App.act(a);
  const r = Game.act(App.local, pid, a);
  if (r.err) return App.toast(r.err);
  App.refreshLocal(); if (r.fx.length) Court.fx(r.fx);
};

const Lobby = {
  custom: false,
  isHost(s) { return App.mode === 'local' || s.hostId === App.me; },
  hostAct(a) { App.actAs(App.s.hostId, a); },

  render(s) {
    const D = GameData, me = s.players[App.me], ps = Game.list(s), host = Lobby.isHost(s);
    setHTML($('lobbyCode'), App.mode === 'online' ? 'SALA ' + esc(s.code) : '');
    $('localAdd').hidden = App.mode !== 'local';

    // Roles
    setHTML($('roleGrid'), Object.keys(D.ROLES).map(r => {
      const who = ps.filter(p => p.role === r), mine = me && me.role === r;
      if (r === 'publico') {
        return `<button class="role ${who.length ? 'taken' : ''} ${mine ? 'mine' : ''}" data-role="${r}">
          <span class="mini">${who.map(p => Avatar.svg(r, p.acc, { seed: p.id })).join('') || Avatar.svg(r, {}, { seed: 'x' })}</span>
          <span class="rn">Público y jurado</span><span class="pn">${who.length ? who.map(p => esc(p.name)).join(', ') : 'Sin límite'}</span></button>`;
      }
      const p = who[0];
      return `<button class="role ${p ? 'taken' : ''} ${mine ? 'mine' : ''}" data-role="${r}">
        ${Avatar.svg(r, p ? p.acc : { piel: '#d9cdb8', pelo: '#b8aa93' }, { seed: r })}
        <span class="rn">${D.ROLES[r].name}</span><span class="pn">${p ? esc(p.name) : 'Libre'}</span></button>`;
    }).join(''));
    const sin = ps.filter(p => !p.role).map(p => esc(p.name));
    setHTML($('lobbyRoleTools'),
      (host ? '<button class="btn" data-lob="random">Repartir al azar</button>' : '') +
      `<span class="note">${ps.length} ${ps.length === 1 ? 'jugador' : 'jugadores'}${sin.length ? ' · sin rol: ' + sin.join(', ') : ''}. Toca un rol para tomarlo.</span>`);

    // Personaje
    if (me) {
      $('lookTitle').textContent = App.mode === 'local' ? 'Personaje de ' + me.name : 'Tu personaje';
      setHTML($('lookPreview'), Avatar.svg(me.role || 'publico', me.acc, { seed: me.id }));
      const cats = { cabeza: 'Cabeza', ojos: 'Ojos', cara: 'Cara', cuello: 'Cuello' };
      setHTML($('lookOpts'), Object.keys(cats).map(c => `<div class="optRow"><b>${cats[c]}</b><div class="chips">` +
        D.ACCESSORIES[c].map(v => `<button class="btn small ${me.acc[c] === v ? 'on' : ''}" data-acc="${c}:${v}">${D.ACC_NAMES[v]}</button>`).join('') + '</div></div>').join('') +
        `<div class="optRow"><b>Piel</b><div class="chips">${D.SKINS.map(c => `<button class="sw ${me.acc.piel === c ? 'on' : ''}" style="background:${c}" data-acc="piel:${c}" aria-label="Tono de piel"></button>`).join('')}</div></div>` +
        `<div class="optRow"><b>Pelo</b><div class="chips">${D.HAIRS.map(c => `<button class="sw ${me.acc.pelo === c ? 'on' : ''}" style="background:${c}" data-acc="pelo:${c}" aria-label="Color de pelo"></button>`).join('')}</div></div>` +
        '<p class="note">La ropa depende del rol. Los accesorios son tuyos.</p>');
    }

    // Caso y ajustes
    const c = s.custom || D.CASES[s.caseIdx];
    const ready = ['juez', 'demandante', 'demandado'].every(r => Game.byRole(s, r));
    let h = `<p class="caseTitle">${esc(c.t)}</p><p>${esc(c.s)}</p>`;
    if (host) {
      h += `<div class="row wrap"><button class="btn" data-lob="other">Otro caso al azar</button>
        <button class="btn ${Lobby.custom ? 'on' : ''}" data-lob="toggle">Escribir nuestro caso</button></div>`;
      if (Lobby.custom) h += `<div class="stack">
        <div class="field"><label for="cTitle">Título del caso</label><input id="cTitle" maxlength="60" placeholder="El misterio del yogur desaparecido"></div>
        <div class="field"><label for="cSum">¿De qué se acusa al demandado?</label><textarea id="cSum" maxlength="400" placeholder="El demandante asegura que…"></textarea></div>
        <div class="field"><label for="cGuilt">¿El demandado es culpable?</label><select id="cGuilt">
          <option value="azar">Al azar (solo lo sabrá el demandado)</option><option value="si">Sí, es culpable</option><option value="no">No, es inocente</option></select></div>
        <button class="btn gold" data-lob="use">Usar este caso</button></div>`;
      const preps = [0, 1, 2, 3, 5, 10];
      h += `<div class="settings">
        <div class="field"><label for="prepSel">Tiempo de preparación</label><select id="prepSel">${preps.map(m =>
          `<option value="${m}" ${s.settings.prepMin === m ? 'selected' : ''}>${m ? m + (m === 1 ? ' minuto' : ' minutos') : 'Omitir'}</option>`).join('')}</select></div>
        <div class="field"><label for="paceSel">Ritmo del juicio</label><select id="paceSel">
          ${[['rapido', 'Rápido (1 minuto por alegato)'], ['normal', 'Normal (2 minutos por alegato)'], ['libre', 'Libre (sin cronómetro)']].map(([v, t]) =>
          `<option value="${v}" ${s.settings.pace === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <button class="btn big gold" data-lob="start" ${ready ? '' : 'disabled'}>Empezar el juicio</button></div>`;
      if (!ready) h += '<p class="note">Para empezar hacen falta el juez, el demandante y el demandado.</p>';
    } else {
      const hp = s.players[s.hostId];
      h += `<p class="note">Preparación: ${s.settings.prepMin ? s.settings.prepMin + ' min' : 'omitida'} · Ritmo: ${s.settings.pace}. ${hp ? esc(hp.name) + ' empieza el juicio cuando estén listos.' : ''}</p>`;
    }
    setHTML($('caseBox'), h);
    // Los select no conservan "selected" si setHTML no repinta; se sincronizan aquí.
    if ($('prepSel') && document.activeElement !== $('prepSel')) $('prepSel').value = String(s.settings.prepMin);
    if ($('paceSel') && document.activeElement !== $('paceSel')) $('paceSel').value = s.settings.pace;
  },
};

$('lobby').addEventListener('click', e => {
  const r = e.target.closest('[data-role]'), a = e.target.closest('[data-acc]'), l = e.target.closest('[data-lob]');
  const me = App.player();
  if (r && me) return App.act({ type: 'setRole', role: me.role === r.dataset.role ? '' : r.dataset.role });
  if (a && me) {
    const i = a.dataset.acc.indexOf(':'), acc = Object.assign({}, me.acc, { [a.dataset.acc.slice(0, i)]: a.dataset.acc.slice(i + 1) });
    if (App.mode === 'online' || App.me === 'p1') store.set('acc', acc);
    return App.act({ type: 'setAcc', acc });
  }
  if (!l) return;
  const k = l.dataset.lob;
  if (k === 'random') Lobby.hostAct({ type: 'randomRoles' });
  else if (k === 'other') { Lobby.custom = false; Lobby.hostAct({ type: 'setCase' }); }
  else if (k === 'toggle') { Lobby.custom = !Lobby.custom; Lobby.render(App.s); }
  else if (k === 'use') Lobby.hostAct({ type: 'setCase', custom: { t: $('cTitle').value, s: $('cSum').value }, guilt: $('cGuilt').value });
  else if (k === 'start') Lobby.hostAct({ type: 'start' });
});
$('lobby').addEventListener('change', e => {
  if (e.target.id === 'prepSel') Lobby.hostAct({ type: 'settings', prepMin: +e.target.value });
  if (e.target.id === 'paceSel') Lobby.hostAct({ type: 'settings', pace: e.target.value });
});
$('btnAddLocal').onclick = () => {
  const n = $('localName').value.trim(); if (!n) return App.toast('Escribe el nombre del jugador.');
  App.addLocal(n); $('localName').value = ''; $('localName').focus();
};
$('localName').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnAddLocal').click(); });
$('lobbyCode').addEventListener('click', () => {
  if (navigator.clipboard) navigator.clipboard.writeText(App.code).then(() => App.toast('Código copiado.'), () => {});
});
