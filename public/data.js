// Datos del juego: roles, fases, casos y cartas de testigo.
(function (root, f) {
  if (typeof module === 'object' && module.exports) module.exports = f();
  else root.GameData = f();
})(typeof self !== 'undefined' ? self : this, function () {
  const ROLES = {
    juez: { name: 'Juez', unique: true },
    demandante: { name: 'Demandante', unique: true, side: 'dte' },
    abogado_dte: { name: 'Abogado del demandante', unique: true, side: 'dte' },
    demandado: { name: 'Demandado', unique: true, side: 'ddo' },
    abogado_ddo: { name: 'Abogado del demandado', unique: true, side: 'ddo' },
    policia: { name: 'Policía', unique: true },
    publico: { name: 'Público', unique: false },
  };

  const PHASES = [
    { id: 'caso', name: 'El caso', hint: 'Lean el caso. El juez continúa cuando todos estén listos.' },
    { id: 'prep', name: 'Preparación', hint: 'Dibujen o suban sus pruebas y hablen con su abogado.' },
    { id: 'apertura', name: 'Apertura', hint: 'El juez golpea el mazo y abre la sesión.' },
    { id: 'demanda', name: 'Alegato del demandante', hint: 'El lado demandante explica de qué acusa.' },
    { id: 'defensa', name: 'Defensa', hint: 'El lado demandado responde a la acusación.' },
    { id: 'pruebas', name: 'Pruebas y testigos', hint: 'Presenten pruebas y llamen testigos al estrado.' },
    { id: 'publico', name: 'Preguntas del público', hint: 'El público pregunta; el juez elige qué se responde.' },
    { id: 'finales', name: 'Alegatos finales', hint: 'Última palabra de cada lado. Cortita.' },
    { id: 'veredicto', name: 'Veredicto', hint: 'El jurado vota: ¿culpable o inocente?' },
    { id: 'sentencia', name: 'Sentencia', hint: 'El juez dicta la sentencia. Cuanto más ridícula, mejor.' },
    { id: 'fin', name: 'La verdad', hint: 'Se revela la verdad y se reparten los premios.' },
  ];

  // Segundos sugeridos por fase según el ritmo elegido.
  const PACE = {
    rapido: { demanda: 60, defensa: 60, pruebas: 180, publico: 60, finales: 60 },
    normal: { demanda: 120, defensa: 120, pruebas: 300, publico: 120, finales: 90 },
    libre: {},
  };

  const ACCESSORIES = {
    cabeza: ['', 'peluca', 'sombrero', 'corona', 'gorro', 'audifonos'],
    ojos: ['', 'lentes', 'lentes_sol', 'monoculo'],
    cara: ['', 'nariz_payaso', 'bigote', 'barba'],
    cuello: ['', 'mono', 'bufanda', 'collar'],
  };
  const ACC_NAMES = {
    '': 'Nada', peluca: 'Peluca', sombrero: 'Sombrero', corona: 'Corona', gorro: 'Gorro de fiesta',
    audifonos: 'Audífonos', lentes: 'Lentes', lentes_sol: 'Lentes de sol', monoculo: 'Monóculo',
    nariz_payaso: 'Nariz de payaso', bigote: 'Bigote', barba: 'Barba', mono: 'Moño', bufanda: 'Bufanda', collar: 'Collar de perlas',
  };
  const SKINS = ['#f6d2b0', '#e8b88a', '#c98d5e', '#9a6038', '#6b4226', '#b8e986', '#c7b8ff'];
  const HAIRS = ['#2b1d16', '#6b3f1d', '#d9a441', '#c0392b', '#8e8e93', '#ff6fb5', '#3d7dd8'];

  // g = detalle si es culpable, i = detalle si es inocente (solo lo ve el demandado).
  const CASES = [
    { t: 'El wifi robado', s: 'El demandante asegura que su vecino usó su wifi durante 3 años sin permiso y que por eso nunca pudo ver una serie sin que se trabara.',
      p: 'Tu contraseña era "12345678" y la tenías pegada en la ventana. Mejor que no se sepa.',
      g: 'Sí lo usaste. Hasta le cambiaste el nombre a la red por "Gracias vecino".', i: 'Tú tienes tu propio plan. El que se cuelga es el perro del demandante, que pisa el router.' },
    { t: 'El último pedazo de pizza', s: 'El demandante exige justicia: alguien se comió el último pedazo de pizza que tenía su nombre escrito en la caja.',
      p: 'Tú ya te habías comido 6 de los 8 pedazos. Ese dato no te conviene.',
      g: 'Te lo comiste a las 3 a. m., de pie frente al refri. Sin remordimiento.', i: 'Tú no fuiste: viste al gato arrastrando la caja debajo del sofá.' },
    { t: 'El spoiler imperdonable', s: 'El demandante acusa al demandado de contarle el final de la serie que llevaba dos años esperando.',
      p: 'En realidad tú ya habías leído el final en internet, pero te dolió igual.',
      g: 'Lo contaste a propósito, y con efectos de sonido.', i: 'Solo dijiste "qué fuerte el final". El demandante dedujo todo solito.' },
    { t: 'El perro que se comió la tarea', s: 'El demandante afirma que el perro del demandado se comió su tarea, su cargador y una de sus sandalias.',
      p: 'La tarea no la habías hecho. Lo del cargador y la sandalia sí es verdad.',
      g: 'Tu perro lo hizo, y tú grabaste un video porque te dio risa.', i: 'Tu perro no tiene dientes desde 2019. Es físicamente imposible.' },
    { t: 'La planta abandonada', s: 'El demandante se fue de viaje y dejó su planta, Rosalinda, al cuidado del demandado. Al volver, Rosalinda ya no estaba entre nosotros.',
      p: 'Rosalinda ya estaba medio seca cuando la entregaste.',
      g: 'La regaste con refresco de cola "para darle energía".', i: 'La cuidaste con amor. Le pusiste música y todo. Simplemente era su hora.' },
    { t: 'El préstamo de 5 pesos', s: 'El demandante prestó 5 pesos hace cuatro años y hoy exige que se los devuelvan con intereses: 4,000 pesos.',
      p: 'No recuerdas si fueron 5 pesos o si fue un chicle. Pero tú insiste.',
      g: 'Sí te los prestó y te compraste un chicle. Nunca pensaste pagar.', i: 'Se los devolviste al día siguiente, en monedas de 10 centavos.' },
    { t: 'El karaoke de las 4 a. m.', s: 'El demandante lleva tres semanas sin dormir porque el demandado canta rancheras a todo volumen de madrugada.',
      p: 'Tú también haces ruido: practicas batería los domingos a las 7 a. m.',
      g: 'Cantas todas las noches. Y crees que cantas hermoso.', i: 'No eres tú: es tu loro, que aprendió las canciones de la radio.' },
    { t: 'La foto sin filtro', s: 'El demandante acusa al demandado de subir una foto grupal donde solo el demandado salía bien y él salía con los ojos cerrados y la boca abierta.',
      p: 'Tú has hecho exactamente lo mismo dos veces. Que no revisen tu perfil.',
      g: 'Tenías 14 fotos para elegir y escogiste esa a propósito.', i: 'Era la única foto que existía. El fotógrafo era un mesero con prisa.' },
    { t: 'El control remoto desaparecido', s: 'El control de la tele desapareció hace un mes. El demandante sostiene que el demandado lo escondió para no ver más telenovelas.',
      p: 'Una vez lo perdiste tú y apareció en el congelador.',
      g: 'Lo escondiste dentro de una caja de cereal. Sigue ahí.', i: 'No lo tocaste. Sospechas del sofá: ese sofá se traga cosas.' },
    { t: 'El gol con la mano', s: 'En el partido del domingo, el demandado metió el gol del triunfo. El demandante jura que fue con la mano y exige repetir el partido.',
      p: 'Tú estabas viendo el celular en ese momento. No viste nada.',
      g: 'Fue con la mano. Con las dos, de hecho.', i: 'Fue con la panza. Y la panza es legal.' },
    { t: 'El audio de 14 minutos', s: 'El demandante exige una indemnización por tener que escuchar los audios eternos del demandado, incluido uno de 14 minutos sobre un sándwich.',
      p: 'Nunca escuchaste el audio completo. Lo pusiste a velocidad x2 y te dormiste.',
      g: 'Mandaste el audio sabiendo que era largo. Y tienes otro de 22 minutos listo.', i: 'Se te quedó el botón pegado. Ni tú sabes qué dice ese audio.' },
    { t: 'El regalo reciclado', s: 'El demandante descubrió que el regalo de cumpleaños que le dio el demandado era el mismo que él le había regalado el año anterior.',
      p: 'Ese regalo tú también lo habías recibido de otra persona.',
      g: 'Sí lo reciclaste. Ni le quitaste la tarjeta que decía "de parte de" el demandante.', i: 'Compraste uno igualito porque pensaste que le gustaba mucho.' },
    { t: 'El lugar apartado', s: 'El demandante dejó su suéter apartando un asiento en el cine. Al volver con las palomitas, el demandado estaba sentado ahí, encima del suéter.',
      p: 'Te tardaste 40 minutos porque fuiste por nachos, hot dog y un helado.',
      g: 'Viste el suéter. Lo usaste de cojín.', i: 'Estaba oscuro y pensaste que el suéter era parte del asiento.' },
    { t: 'El perfume del ascensor', s: 'El demandante acusa al demandado de un acto atroz cometido en un ascensor cerrado, entre el piso 1 y el piso 9.',
      p: 'En el ascensor iban solo ustedes dos. O eso crees. Había un señor atrás.',
      g: 'Fuiste tú. Y pusiste cara de "¿quién habrá sido?".', i: 'No fuiste tú. Fue el señor de atrás, que se bajó en el piso 4 silbando.' },
  ];

  const WITNESS_CARDS = [
    'Lo viste todo, con lujo de detalle. Estás muy seguro de ti mismo.',
    'No viste nada, pero te encanta la atención. Inventa con confianza.',
    'Te sobornaron con una empanada para apoyar al demandante.',
    'Te sobornaron con una empanada para apoyar al demandado.',
    'Viste todo, pero tienes pésima memoria y confundes los nombres.',
    'Estás nerviosísimo: contesta cada pregunta con otra pregunta.',
    'Eres primo de alguien en esta sala y no quieres que se sepa.',
    'Todo te recuerda a una anécdota de tu abuela. Cuéntala cada vez.',
    'Dices la verdad, pero hablas como narrador de fútbol.',
    'Llegaste tarde y crees que este juicio es sobre otra cosa.',
  ];

  const SENTENCES = [
    'Se le condena a bailar una canción completa frente a la sala.',
    'Deberá pedir perdón cantando.',
    'Queda condenado a hablar como pirata durante 5 minutos.',
    'Deberá decirle un cumplido sincero a cada persona de la sala.',
    'Se le condena a imitar a una gallina cada vez que alguien diga "justicia".',
    'Deberá invitar la próxima ronda de botanas.',
  ];

  return { ROLES, PHASES, PACE, ACCESSORIES, ACC_NAMES, SKINS, HAIRS, CASES, WITNESS_CARDS, SENTENCES };
});
