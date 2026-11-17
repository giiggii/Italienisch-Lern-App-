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

## Einrichtung für die Eltern (ohne Anmeldung)

Die App wird über GitHub Pages ausgeliefert: <https://giiggii.github.io/Italienisch-Lern-App-/>

**Einmalig durch ein Familienmitglied**

1. Unter <https://aistudio.google.com/apikey> mit einem Google-Konto einen kostenlosen Gemini-API-Schlüssel erzeugen. Alternativ funktioniert ein kostenpflichtiger Claude-API-Schlüssel (beginnt mit `sk-ant-`).
2. Die App auf dem eigenen Gerät öffnen, unter **Mehr → KI-Zugang für Fotos** den Schlüssel eintragen und **Zugang testen** antippen.
3. **Einrichtungslink für ein weiteres Handy** antippen und den Link an die Eltern senden.

**Auf jedem iPhone der Eltern**

1. Den Einrichtungslink in **Safari** öffnen. Der KI-Zugang wird dabei automatisch gespeichert.
2. Auf das Teilen-Symbol tippen und **Zum Home-Bildschirm** wählen.
3. Die App künftig immer über das neue Symbol öffnen und beim ersten Start den Vornamen eintragen. Falls dort der KI-Zugang fehlt, den Schlüssel einmal unter **Mehr** einfügen.

Danach ist keine Anmeldung nötig. Der Lernstand wird automatisch auf dem Gerät gespeichert. Fotos werden in der App über **Foto aufnehmen** (Kamera) oder **Aus meinen Fotos wählen** (Mediathek) hinzugefügt. Eine fertige Lektion lässt sich über **Lektion an ein anderes Handy senden** weitergeben.

Der Schlüssel steht nicht im öffentlichen Programmcode. Er liegt nur auf den Geräten und im versendeten Einrichtungslink.

## Entwicklung

Die Quelldateien liegen in `css/` und `js/`. `python3 build.py` fügt sie zu `parliamo.html` zusammen. `index.html` lädt dieselben Quelldateien einzeln und eignet sich für ein Hosting wie GitHub Pages.

## Datenschutz

- Lernstände, Profile und Lektionen liegen ausschließlich im lokalen Speicher des Browsers auf dem Gerät.
- Fotos werden auf dem Gerät verkleinert, zur Auswertung an Claude gesendet und in der App nicht gespeichert.
- Unter **Mehr → Daten** lässt sich eine Sicherung speichern und auf einem anderen Gerät einspielen.

## Bekannte Grenzen

- Die Spracherkennung für Ausspracheübungen hängt vom Browser ab. In der Ansicht auf claude.ai ist das Mikrofon gesperrt, dort bestätigt man das Nachsprechen selbst.
- Die Vorlesestimme stammt vom Gerät. Auf dem iPhone lässt sich unter **Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Italienisch** eine hochwertigere Stimme laden.
- iOS kann den lokalen Speicher von Web-Apps löschen, wenn die App mehrere Wochen nicht geöffnet wird. Eine gelegentliche Sicherung schützt davor.
