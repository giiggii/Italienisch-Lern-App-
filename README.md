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

## Öffnen und nutzen (ohne zusätzliche Kosten)

Die App besteht aus einer einzigen Datei: `parliamo.html`. Es gibt drei Wege, die KI zu nutzen. Die ersten beiden kosten nichts zusätzlich.

1. **Als Seite auf claude.ai (empfohlen):** Die App ist als Artifact veröffentlicht und über einen Link erreichbar. Wer den Link öffnet und bei Claude angemeldet ist, kann Fotos direkt in der App auswerten lassen. Die Anfragen laufen über das eigene Claude-Konto und zählen dort zum normalen Nutzungskontingent.
2. **Über die Claude-App mit Kopieren und Einfügen:** Die App erzeugt eine fertige Anleitung. Diese wird zusammen mit den Fotos in die Claude-App eingefügt, die Antwort wird in die Lern-App zurückkopiert. Das funktioniert überall, wo `parliamo.html` geöffnet werden kann.
3. **Eigener API-Schlüssel (kostenpflichtig, nicht nötig):** Unter „Mehr → KI-Zugang → Für Fortgeschrittene“.

Ohne KI lassen sich die vier Grundlagen-Lektionen, alle Spiele und selbst eingetippte Wortlisten nutzen.

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
