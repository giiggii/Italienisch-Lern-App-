// Fest eingebaute Grundlagen (A1). Damit funktioniert die App auch ohne KI und ohne eigene Fotos.

const V = (it, de, emoji, ex_it, ex_de) => ({ it, de, emoji, ex_it, ex_de });

export const STARTER = [
  {
    id: 'b-saluti', builtin: true, emoji: '👋', title: 'Begrüßen und Höflichkeit',
    summary: 'Die wichtigsten Wörter, um jemanden zu begrüßen, sich zu bedanken und höflich zu fragen.',
    vocab: [
      V('ciao', 'hallo / tschüss', '👋', 'Ciao, come stai?', 'Hallo, wie geht es dir?'),
      V('buongiorno', 'guten Tag', '☀️', 'Buongiorno, signora Rossi!', 'Guten Tag, Frau Rossi!'),
      V('buonasera', 'guten Abend', '🌆', 'Buonasera a tutti!', 'Guten Abend allerseits!'),
      V('buonanotte', 'gute Nacht', '🌙', 'Buonanotte e sogni d\'oro!', 'Gute Nacht und träum süß!'),
      V('grazie', 'danke', '🙏', 'Grazie mille per l\'aiuto!', 'Vielen Dank für die Hilfe!'),
      V('prego', 'bitte (gern geschehen)', '😊', 'Prego, si accomodi!', 'Bitte, nehmen Sie Platz!'),
      V('per favore', 'bitte (bei einer Bitte)', '🙂', 'Un caffè, per favore.', 'Einen Kaffee, bitte.'),
      V('scusi', 'Entschuldigung', '🙇', 'Scusi, dov\'è la stazione?', 'Entschuldigung, wo ist der Bahnhof?'),
      V('arrivederci', 'auf Wiedersehen', '🤝', 'Arrivederci e buona giornata!', 'Auf Wiedersehen und einen schönen Tag!'),
    ],
    grammar: [{
      title: 'Du oder Sie?',
      text: 'Im Italienischen sagt man zu Freunden und Familie „tu“ (du) und zu Fremden „Lei“ (Sie). „Ciao“ passt nur zum Du, „buongiorno“ und „arrivederci“ passen immer. „Scusa“ sagt man zu Freunden, „scusi“ zu Fremden.',
      examples: [{ it: 'Come stai?', de: 'Wie geht es dir?' }, { it: 'Come sta?', de: 'Wie geht es Ihnen?' }],
    }],
    pool: [],
  },
  {
    id: 'b-cibo', builtin: true, emoji: '🍝', title: 'Essen und Trinken',
    summary: 'Wörter für das Café, den Markt und das Restaurant.',
    vocab: [
      V('il pane', 'das Brot', '🍞', 'Compro il pane ogni mattina.', 'Ich kaufe jeden Morgen Brot.'),
      V('l\'acqua', 'das Wasser', '💧', 'Vorrei un bicchiere d\'acqua.', 'Ich hätte gern ein Glas Wasser.'),
      V('il vino', 'der Wein', '🍷', 'Il vino rosso è molto buono.', 'Der Rotwein ist sehr gut.'),
      V('il caffè', 'der Kaffee', '☕', 'Prendo un caffè al bar.', 'Ich nehme einen Kaffee in der Bar.'),
      V('il formaggio', 'der Käse', '🧀', 'Mi piace il formaggio italiano.', 'Ich mag italienischen Käse.'),
      V('la mela', 'der Apfel', '🍎', 'La mela è rossa.', 'Der Apfel ist rot.'),
      V('il pesce', 'der Fisch', '🐟', 'Stasera mangiamo il pesce.', 'Heute Abend essen wir Fisch.'),
      V('la carne', 'das Fleisch', '🥩', 'Non mangio la carne.', 'Ich esse kein Fleisch.'),
      V('il gelato', 'das Eis', '🍨', 'Il gelato al limone è fresco.', 'Das Zitroneneis ist erfrischend.'),
      V('la pasta', 'die Nudeln', '🍝', 'La pasta è pronta!', 'Die Nudeln sind fertig!'),
      V('il latte', 'die Milch', '🥛', 'Bevo il latte a colazione.', 'Ich trinke Milch zum Frühstück.'),
      V('la colazione', 'das Frühstück', '🥐', 'Facciamo colazione alle otto.', 'Wir frühstücken um acht Uhr.'),
    ],
    grammar: [{
      title: 'Der bestimmte Artikel',
      text: 'Männliche Wörter haben meistens „il“ (il pane), weibliche „la“ (la mela). Beginnt das Wort mit einem Vokal, wird der Artikel zu „l\'“ verkürzt (l\'acqua, l\'amico). Vor s + Konsonant oder z steht „lo“ (lo studente, lo zucchero).',
      examples: [{ it: 'il vino, la pasta, l\'acqua, lo zucchero', de: 'der Wein, die Nudeln, das Wasser, der Zucker' }],
    }],
    pool: [],
  },
  {
    id: 'b-famiglia', builtin: true, emoji: '👨‍👩‍👧', title: 'Familie und Freunde',
    summary: 'Über die eigene Familie sprechen.',
    vocab: [
      V('la madre', 'die Mutter', '👩', 'Mia madre si chiama Anna.', 'Meine Mutter heißt Anna.'),
      V('il padre', 'der Vater', '👨', 'Mio padre lavora in banca.', 'Mein Vater arbeitet in der Bank.'),
      V('il figlio', 'der Sohn', '👦', 'Nostro figlio abita a Monaco.', 'Unser Sohn wohnt in München.'),
      V('la figlia', 'die Tochter', '👧', 'Mia figlia studia a Roma.', 'Meine Tochter studiert in Rom.'),
      V('il fratello', 'der Bruder', '🧑', 'Ho un fratello e due cugini.', 'Ich habe einen Bruder und zwei Cousins.'),
      V('la sorella', 'die Schwester', '👩‍🦰', 'Mia sorella è molto simpatica.', 'Meine Schwester ist sehr sympathisch.'),
      V('il nonno', 'der Großvater', '👴', 'Il nonno legge il giornale.', 'Der Großvater liest die Zeitung.'),
      V('la nonna', 'die Großmutter', '👵', 'La nonna cucina molto bene.', 'Die Großmutter kocht sehr gut.'),
      V('l\'amico', 'der Freund', '🤝', 'Paolo è un amico di Marco.', 'Paolo ist ein Freund von Marco.'),
      V('il marito', 'der Ehemann', '🤵', 'Mio marito parla un po\' d\'italiano.', 'Mein Mann spricht ein bisschen Italienisch.'),
      V('la moglie', 'die Ehefrau', '👰', 'Mia moglie ama l\'Italia.', 'Meine Frau liebt Italien.'),
    ],
    grammar: [{
      title: 'Mein, dein bei Verwandten',
      text: 'Normalerweise steht vor „mio, tuo, suo“ der Artikel (il mio libro). Bei einzelnen Verwandten fällt der Artikel weg: mia madre, mio fratello. In der Mehrzahl kommt er wieder: i miei fratelli.',
      examples: [{ it: 'Mia sorella abita a Milano.', de: 'Meine Schwester wohnt in Mailand.' }, { it: 'Il mio amico è italiano.', de: 'Mein Freund ist Italiener.' }],
    }],
    pool: [],
  },
  {
    id: 'b-viaggio', builtin: true, emoji: '🚆', title: 'Unterwegs in Italien',
    summary: 'Wörter für die Reise, die Stadt und den Urlaub.',
    vocab: [
      V('la stazione', 'der Bahnhof', '🚉', 'La stazione è vicino al centro.', 'Der Bahnhof ist in der Nähe des Zentrums.'),
      V('il treno', 'der Zug', '🚆', 'Il treno parte alle nove.', 'Der Zug fährt um neun Uhr ab.'),
      V('l\'albergo', 'das Hotel', '🏨', 'L\'albergo ha una bella terrazza.', 'Das Hotel hat eine schöne Terrasse.'),
      V('la spiaggia', 'der Strand', '🏖️', 'Andiamo in spiaggia domani.', 'Wir gehen morgen an den Strand.'),
      V('il mare', 'das Meer', '🌊', 'Il mare è calmo oggi.', 'Das Meer ist heute ruhig.'),
      V('la città', 'die Stadt', '🏙️', 'Firenze è una città bellissima.', 'Florenz ist eine wunderschöne Stadt.'),
      V('la strada', 'die Straße', '🛣️', 'La strada è lunga e stretta.', 'Die Straße ist lang und schmal.'),
      V('il biglietto', 'die Fahrkarte', '🎫', 'Compro un biglietto per Venezia.', 'Ich kaufe eine Fahrkarte nach Venedig.'),
      V('la piazza', 'der Platz', '⛲', 'Ci vediamo in piazza alle sei.', 'Wir sehen uns um sechs auf dem Platz.'),
      V('il ristorante', 'das Restaurant', '🍽️', 'Il ristorante apre alle sette.', 'Das Restaurant öffnet um sieben.'),
      V('la chiesa', 'die Kirche', '⛪', 'La chiesa è molto antica.', 'Die Kirche ist sehr alt.'),
      V('il mercato', 'der Markt', '🧺', 'Al mercato compro frutta fresca.', 'Auf dem Markt kaufe ich frisches Obst.'),
    ],
    grammar: [],
    culture: {
      title: 'La passeggiata',
      it: 'La sera molti italiani fanno una passeggiata in centro. Incontrano gli amici in piazza, parlano e prendono un gelato.',
      de: 'Abends machen viele Italiener einen Spaziergang im Zentrum. Sie treffen Freunde auf dem Platz, unterhalten sich und essen ein Eis.',
    },
    pool: [],
  },
];

// Verben im Präsens für den Verb-Trainer.
export const PERSONS = ['io', 'tu', 'lui / lei', 'noi', 'voi', 'loro'];
export const VERBS = [
  { inf: 'essere', de: 'sein', forms: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'] },
  { inf: 'avere', de: 'haben', forms: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'] },
  { inf: 'parlare', de: 'sprechen', forms: ['parlo', 'parli', 'parla', 'parliamo', 'parlate', 'parlano'] },
  { inf: 'abitare', de: 'wohnen', forms: ['abito', 'abiti', 'abita', 'abitiamo', 'abitate', 'abitano'] },
  { inf: 'mangiare', de: 'essen', forms: ['mangio', 'mangi', 'mangia', 'mangiamo', 'mangiate', 'mangiano'] },
  { inf: 'andare', de: 'gehen / fahren', forms: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'] },
  { inf: 'fare', de: 'machen', forms: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'] },
  { inf: 'prendere', de: 'nehmen', forms: ['prendo', 'prendi', 'prende', 'prendiamo', 'prendete', 'prendono'] },
  { inf: 'bere', de: 'trinken', forms: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'] },
  { inf: 'volere', de: 'wollen', forms: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'] },
  { inf: 'potere', de: 'können', forms: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'] },
  { inf: 'venire', de: 'kommen', forms: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'] },
  { inf: 'dormire', de: 'schlafen', forms: ['dormo', 'dormi', 'dorme', 'dormiamo', 'dormite', 'dormono'] },
  { inf: 'capire', de: 'verstehen', forms: ['capisco', 'capisci', 'capisce', 'capiamo', 'capite', 'capiscono'] },
];

export const PRAISE = ['Bravo!', 'Ottimo!', 'Perfetto!', 'Benissimo!', 'Esatto!', 'Molto bene!', 'Fantastico!'];
export const COMFORT = ['Fast!', 'Nicht schlimm.', 'Das kommt noch.', 'Guter Versuch.', 'Beim nächsten Mal klappt es.'];

export const LEVELS = [
  { n: 1, name: 'Sanfter Einstieg', ai: 'sehr leicht (A1.1): nur Wiedererkennen, Sätze mit höchstens 5 Wörtern, nur Präsens, sehr häufige Wörter' },
  { n: 2, name: 'Leicht', ai: 'leicht (A1.1 bis A1.2): kurze Sätze mit höchstens 7 Wörtern, Präsens, einfache Lücken mit klaren Auswahlmöglichkeiten' },
  { n: 3, name: 'Mittel', ai: 'mittel (A1.2): Sätze bis 9 Wörter, die Grammatik der Stunde aktiv anwenden, einzelne neue Wörter aus dem Kontext erschließbar' },
  { n: 4, name: 'Fordernd', ai: 'fordernd (A1.2 bis A2.1): neue Alltagssituationen, Wörter in gebeugter Form, kurze eigene Übersetzungen, ähnliche Antwortmöglichkeiten' },
  { n: 5, name: 'Anspruchsvoll', ai: 'anspruchsvoll (A2.1): längere Sätze, Verbindung mehrerer Grammatikthemen, mehrere neue Wörter, feine Unterschiede zwischen den Antwortmöglichkeiten' },
];

export const BADGES = [
  { id: 'first', emoji: '🌱', name: 'Erster Schritt', text: 'Die erste Lerneinheit geschafft', test: p => p.sessions >= 1 },
  { id: 's3', emoji: '🔥', name: '3 Tage am Stück', text: 'Drei Tage hintereinander gelernt', test: p => p.best >= 3 },
  { id: 's7', emoji: '🏆', name: 'Eine ganze Woche', text: 'Sieben Tage hintereinander gelernt', test: p => p.best >= 7 },
  { id: 's30', emoji: '👑', name: 'Ein ganzer Monat', text: '30 Tage hintereinander gelernt', test: p => p.best >= 30 },
  { id: 'x100', emoji: '⭐', name: '100 Punkte', text: '100 Punkte gesammelt', test: p => p.xp >= 100 },
  { id: 'x500', emoji: '🌟', name: '500 Punkte', text: '500 Punkte gesammelt', test: p => p.xp >= 500 },
  { id: 'x2000', emoji: '💫', name: '2000 Punkte', text: '2000 Punkte gesammelt', test: p => p.xp >= 2000 },
  { id: 'w25', emoji: '📚', name: '25 Wörter', text: '25 Wörter sicher gelernt', test: (p, s) => s.mastered >= 25 },
  { id: 'w100', emoji: '🎓', name: '100 Wörter', text: '100 Wörter sicher gelernt', test: (p, s) => s.mastered >= 100 },
  { id: 'perfect', emoji: '💯', name: 'Fehlerfrei', text: 'Eine Lerneinheit ohne Fehler', test: p => p.perfect >= 1 },
  { id: 'photo', emoji: '📷', name: 'Eigene Unterlagen', text: 'Die erste eigene Lektion aus dem Unterricht angelegt', test: (p, s) => s.ownUnits >= 1 },
  { id: 'photo5', emoji: '🗂️', name: 'Fleißig gesammelt', text: 'Fünf eigene Lektionen angelegt', test: (p, s) => s.ownUnits >= 5 },
  { id: 'memory', emoji: '🃏', name: 'Gutes Gedächtnis', text: 'Ein Memory-Spiel gewonnen', test: p => p.memory >= 1 },
];
