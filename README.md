# Parliamo! Italienisch lernen mit den eigenen Unterlagen

Eine Lern-App für das Smartphone, die den wöchentlichen Italienischunterricht ergänzt. Fotos von Arbeitsblättern, Grammatikübersichten und Notizen werden von einer KI gelesen und in neue, spielerische Übungen verwandelt. Die App ist auf Lernende über 60 auf dem Niveau A1 zugeschnitten: große Schrift, große Schaltflächen, kurze Einheiten, keine Strafen für Fehler.

## Funktionen

- **Fotos aus dem Unterricht:** Kamera oder Fotomediathek, bis zu sechs Bilder pro Lektion. Daraus entstehen Wortliste, Grammatikkarten, Verbtabellen, eine kleine Geschichte, ein Kultur-Häppchen und 14 bis 18 Aufgaben.
- **Weiterführende Aufgaben:** Auf Knopfdruck erzeugt die KI neues Material zu einer Lektion in einer neuen Alltagssituation, abgestimmt auf das aktuelle Niveau und auf die Wörter, die noch schwerfallen.
- **Übungsarten:** Wortkarten, Auswahlaufgaben in beide Richtungen, Hörverstehen, Lückentexte, Satzbau, freies Schreiben, Paare zuordnen, Nachsprechen, Lesetexte mit Verständnisfragen.
- **Spiele:** Memory, Verb-Trainer, Hör-Training, Satzbau, Aussprache, Wiederholung.
- **Anpassung an das Niveau:** Fünf Stufen. Richtige Antworten heben die Stufe langsam an, Fehler senken sie. Die Stufe lässt sich auch fest einstellen.
- **Wiederholung in wachsenden Abständen:** Jedes Wort wandert durch sechs Fächer (Leitner-System) und kommt nach 1, 2, 4, 9 und 21 Tagen wieder.
- **Motivation:** Tagesziel, Lernserie, Punkte, Abzeichen, Wochenübersicht.
- **Mehrere Personen:** Jede Person hat ein eigenes Profil mit eigenem Lernstand. Die Lektionen werden geteilt.
- **Ohne KI nutzbar:** Vier eingebaute Grundlagen-Lektionen und die Möglichkeit, Wörter selbst einzutippen.

## Einrichtung

### 1. App veröffentlichen (GitHub Pages)

1. Im Repository auf **Settings → Pages** gehen.
2. Unter **Build and deployment** die Quelle **Deploy from a branch** wählen, den Branch mit diesen Dateien und den Ordner `/ (root)` auswählen und speichern.
3. Nach ein bis zwei Minuten ist die App unter `https://<benutzername>.github.io/<repository-name>/` erreichbar.

Im kostenlosen GitHub-Tarif setzt GitHub Pages ein öffentliches Repository voraus. Im Repository liegen nur der Programmcode und keine persönlichen Daten.

### 2. Auf dem iPhone installieren

1. Den Link in **Safari** öffnen.
2. Auf das Teilen-Symbol tippen und **Zum Home-Bildschirm** wählen.
3. Die App über das neue Symbol starten.

### 3. KI-Zugang einrichten (einmalig)

1. Unter <https://console.anthropic.com> ein Konto anlegen, Guthaben aufladen und einen API-Schlüssel erzeugen. Es empfiehlt sich, dort ein monatliches Ausgabenlimit zu setzen.
2. In der App unter **Mehr → KI-Zugang für Fotos** den Schlüssel eintragen.

Der Schlüssel wird nur im Speicher des Geräts abgelegt und ausschließlich an die Claude-API gesendet. Er steht nicht im Programmcode und wird nicht in die Sicherungsdatei geschrieben. Wer den Schlüssel gar nicht auf dem Gerät haben möchte, kann stattdessen einen eigenen Proxy eintragen, der die Anfrage unverändert an `https://api.anthropic.com/v1/messages` weiterleitet und die Kopfzeilen `x-api-key` und `anthropic-version` ergänzt.

## Datenschutz

- Lernstände, Profile und Lektionen liegen ausschließlich im lokalen Speicher des Browsers auf dem Gerät.
- Fotos werden auf dem Gerät verkleinert, zur Auswertung an die Claude-API gesendet und danach nicht gespeichert.
- Unter **Mehr → Daten** lässt sich eine Sicherung speichern und auf einem anderen Gerät einspielen.

## Bekannte Grenzen

- Die Spracherkennung für Ausspracheübungen hängt vom Browser ab. Wo sie nicht verfügbar ist, bestätigt man das Nachsprechen selbst.
- Die Vorlesestimme stammt vom Gerät. Auf dem iPhone lässt sich unter **Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Italienisch** eine hochwertigere Stimme laden.
- iOS kann den lokalen Speicher von Web-Apps löschen, wenn die App mehrere Wochen nicht geöffnet wird. Eine gelegentliche Sicherung schützt davor.

## Technik

Reine Web-App ohne Build-Schritt: `index.html`, `css/style.css`, JavaScript-Module in `js/`, Service Worker `sw.js` für die Offline-Nutzung. Zum lokalen Testen genügt `python3 -m http.server` im Projektordner.
