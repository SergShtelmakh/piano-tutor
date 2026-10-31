[English](README.md) · [Українська](README.uk.md) · **Deutsch** · [Français](README.fr.md)

# Piano Tutor

Eine spielerische Web-App zum Klavierlernen: Verbinde ein MIDI-Keyboard (Web MIDI) und erhalte in Echtzeit Rückmeldung, ob du die richtigen Noten spielst. Nur Client, kein Backend. Siehe [specs/mission.md](specs/mission.md).

> Stand: Die Phasen 1–17 sind abgeschlossen. Freies Spielen mit MIDI-Keyboard, Computertastatur oder Bildschirmklavier; ein Einstiegskurs mit 13 Lektionen für die erste Woche; lokaler Fortschritt (Sterne, XP, Level, tägliche Serie); eine installierbare Offline-App (PWA); ein anpassungsfähiges Bildschirmklavier; ein Player für MIDI-Dateien mit Notenansicht; eine Bibliothek mit 34 gemeinfreien klassischen Stücken; und **Kurse**, die den Anfang eines Bibliotheksstücks Hand für Hand beibringen; und ein aufgenommener Klavierklang. Die App ist online bereitgestellt (siehe Bereitstellung). Weiter — siehe [specs/roadmap.md](specs/roadmap.md).

> Diese Datei ist eine Übersetzung von [README.md](README.md) (die englische Fassung ist die Vorlage). Bei Abweichungen gilt die englische Fassung.

## Voraussetzungen

- [Bun](https://bun.sh) (npm funktioniert auch)
- Ein Chromium-basierter Browser (Chrome, Edge) für Web MIDI. In anderen Browsern kann man trotzdem mit dem Bildschirmklavier und der Computertastatur spielen.

## Erste Schritte

```bash
bun install
bun run dev      # http://localhost:3000
```

## So spielst du

- **MIDI-Keyboard:** Klicke auf **Connect MIDI keyboard** (MIDI-Keyboard verbinden) und erlaube den Zugriff. Jedes angeschlossene Keyboard funktioniert, auch das Sustain-Pedal. Web MIDI braucht Chrome oder Edge und eine sichere Seite (HTTPS oder `localhost`).
- **Computertastatur:** `A S D F G H J K L ;` sind die weißen Tasten (C D E F G A H C D E) und `W E T Y U O P` die schwarzen. Die linke `Shift`-Taste (`⇧`) spielt das H direkt unter dem ersten C. `Z` / `X` verschieben die Oktave nach unten / oben. Die Tasten werden nach ihrer physischen Position erkannt, das funktioniert also auch mit QWERTZ- und AZERTY-Layouts.
- **Bildschirmklavier:** Klicke oder tippe auf die Tasten. Das Klavier ist so breit wie das Fenster und zeigt mehr Oktaven, wenn sie passen (die Tasten sind mindestens 40 px breit, auf einem breiten Monitor bis zu allen 88 Tasten). Auf einem schmalen Handy behält es fingergroße Tasten und scrollt seitlich: Wische über das Oktavlineal über den Tasten (Wischen über die Tasten spielt sie). Die Oktavtasten und `Z` / `X` verschieben den Bereich, den die Computertastatur spielt (standardmäßig B2–C5: das H unter dem ersten C, zwei Oktaven und das obere C), und die Ansicht folgt.
- **Tastaturgröße:** Die Schaltfläche **Keyboard** neben dem MIDI-Status (sichtbar, wenn Web MIDI verfügbar ist, und während einer Lektion ausgeblendet) sagt der App, wie viele Tasten dein echtes Keyboard hat: Wähle 25, 37, 49, 61, 76 oder 88 Tasten und verschiebe den Bereich oktavweise, wenn er auf einer anderen Note beginnt, oder drücke **Calibrate**, spiele die tiefste und dann die höchste Taste deines MIDI-Keyboards und speichere das Ergebnis (jede Größe geht). Die Einstellung bleibt auf deinem Gerät. Tasten des Bildschirmklaviers außerhalb davon sind abgedunkelt (sie spielen trotzdem), und eine Lektion mit Noten, die dein Keyboard nicht hat, zeigt einen Hinweis mit der Anzahl; die Lektion bleibt spielbar. Solange du keine Größe wählst, ist nichts eingestellt.
- **Start und Lektionen:** Die App öffnet sich auf **Home** (Start) mit 13 Lektionen in fünf Einheiten: rechte Hand (Violinschlüssel), linke Hand (Bassschlüssel), beide Schlüssel, Melodien (Mary Had a Little Lamb, Ode to Joy, Twinkle Twinkle) sowie Intervalle und Akkorde. Drücke bei einer Lektionskarte auf **Start**; die Lektion mit dem Hinweis **Next** ist die erste, die du noch nicht abgeschlossen hast, aber nichts ist gesperrt. Das Notensystem zeigt eine Reihe von Noten: Die hervorgehobene ist die zu spielende, gespielte werden grau. Bei einem Akkord spielst du alle Töne in beliebiger Reihenfolge. Eine falsche Taste zählt als Fehler, und das Ziel bleibt, bis du es richtig spielst. Am Ende siehst du deine Genauigkeit, 1–3 Sterne und XP. Zufällige Lektionen haben bei jedem Start eine neue Reihenfolge.
- **Player:** Der Modus **Player** öffnet über einen Dateidialog eine MIDI-Datei (`.mid`, Formate 0 und 1, bis 2 MB). Die Datei wird auf deinem Gerät gelesen und nie hochgeladen. Sie wird als Noten angezeigt (Tonartvorzeichen, Kreuze und Bs, Notenwerte, Pausen, Takte, Bindebögen; Balken innerhalb eines Schlags; zwei Stimmen pro System, wenn eine MusicXML-Datei sie enthält, sonst eine vereinfachte Fassung mit einer Stimme; ohne Triolen; der Abstand zwischen den Systemen wächst, wenn Noten dazwischen stehen) in Zeilen und spielt mit einem wandernden Cursor, während die klingenden Tasten blau leuchten. **Play** / **Pause** / **Stop**, ein Tempo-Regler (50–150 %) und ein Positionsregler (oder ein Klick in die Noten) helfen beim Navigieren. Schlagzeug wird übersprungen.
- **MuseScore / MusicXML:** Der Player öffnet auch eine aus MuseScore exportierte Partitur (**Datei → Exportieren → MusicXML**) als komprimierte `.mxl` oder als einfache `.musicxml` / `.xml` (bis 2 MB); das Format wird am Inhalt erkannt. Alle Stimmen werden zusammengefasst, Schlagzeug wird übersprungen, und das Stück läuft einmal mit 120 bpm wie notiert (Tempoangaben, Wiederholungen und Vorschlagnoten werden ignoriert; der Tempo-Regler funktioniert weiter). In einer Stimme mit zwei Systemen ist das obere die rechte und das untere die linke Hand; die Schaltfläche **Learn** neben dem Dateinamen erstellt daher einen Kurs (wie für ein Bibliotheksstück), in dem jede Note in der Hand liegt, für die sie geschrieben ist. **Learn** funktioniert auch für deine eigene `.mid`-Datei (dort werden die Hände am mittleren C geteilt). Sterne und XP eines solchen Kurses werden auf deinem Gerät gespeichert, die Datei selbst aber nicht, sie steht also nicht auf Home; öffne dieselbe Datei erneut, um ihre Sterne zu sehen.
- **Bibliothek:** Die Schaltfläche **Library** im Player öffnet 34 klassische Klavierstücke von 10 Komponisten (Bach, Beethoven, Brahms, Burgmüller, Chopin, Händel, Haydn, Mozart, Schubert, Schumann), nach Komponist gruppiert, mit einem Porträt jedes Komponisten und bewertet von 1 (Anfänger) bis 5 (Experte). Filtere nach Schwierigkeit oder Favoriten, wähle ein Stück und drücke **Play**. Markiere Stücke als Favorit (★) oder erledigt (☑); die Markierungen bleiben auf deinem Gerät. Ein Stück, das du einmal geöffnet hast, öffnet sich auch offline. Die Dateien sind maschinelle Wiedergaben des Notentextes, sie klingen also exakt, aber nicht ausdrucksvoll.
- **Ein Stück lernen:** Drücke **Learn** neben einem beliebigen Bibliotheksstück (oder in dessen Infozeile über den Noten). Die App baut aus dem Anfang des Stücks einen **Kurs** (die ersten 6 Teile, jeweils bis zu 4 Takte) und ordnet die Lektionen vom Einfachsten zum Schwersten. Zuerst für die **rechte Hand**, dann für die **linke Hand**: die im Stück verwendeten Noten lesen, dann seine Akkorde (falls vorhanden), dann die Teile einzeln, dann die verbundenen Teile (1–2, 3–4, 5–6, 1–4, 1–6). Danach **beide Hände zusammen**: die Teile, dann die verbundenen Teile. Jede Lektion zeigt die echten Noten des Stücks, der aktuelle Schritt ist blau markiert; du spielst, was du siehst, und die App bewertet die Töne (nicht das Timing). Nichts ist gesperrt, ein **Next**-Hinweis markiert die erste nicht abgeschlossene Lektion, und auf Home stehen die Stücke, die du lernst. Beide Hände gleichzeitig können mehrere Finger oder Tasten auf einmal erfordern; dabei helfen das Bildschirmklavier oder ein MIDI-Keyboard.
- **Klang:** Jede Taste spielt ein aufgenommenes Klavier (ein Klavier mit zwei Lautstärkestufen, sodass leise und kräftige Anschläge verschieden klingen). Töne klingen von selbst aus wie auf einem echten Klavier und enden beim Loslassen, außer das Haltepedal ist gedrückt. **Volume** und **Mute** stehen in der Kopfzeile, neben einer Schaltfläche **Reverb**, die etwas Raumklang hinzufügt (standardmäßig an); alle drei Einstellungen werden auf deinem Gerät gespeichert. Der Klang wird beim Öffnen der App geladen: bis dahin sind die Tasten stumm und „Klaviersound wird geladen …“ wird angezeigt; schlägt das Laden fehl, drücke **Retry**.
- **Fortschritt:** XP steigern dein Level, und mindestens eine abgeschlossene Lektion pro Tag baut eine tägliche Serie auf. Alles wird nur auf deinem Gerät gespeichert; **Reset progress** auf Home löscht es.

## Bibliothek

Die Stücke sind MIDI-Dateien des [Mutopia Project](https://www.mutopiaproject.org/) und liegen in `public/library/<composer>/`. **Verwendet werden nur Stücke, auf deren eigener Mutopia-Seite „Public Domain“ steht** (Feld „Copyright“). Das Mutopia Project veröffentlicht auch Stücke unter CC-BY und CC-BY-SA, die Namensnennung oder Weitergabe unter gleichen Bedingungen verlangen; diese bleiben außen vor, und `src/core/library.test.ts` schlägt fehl, wenn ein Stück eine andere Lizenz hat. Die Porträts der Komponisten sind gemeinfreie Gemälde, Zeichnungen und Fotografien von [Wikimedia Commons](https://commons.wikimedia.org/) (die Commons-Seite muss „Public domain“ angeben; ein Test lässt nichts anderes zu). Quelle, Lizenz und Prüfdatum jedes Stücks und jedes Porträts stehen in [licenses/library-sources.md](licenses/library-sources.md) und im Katalog (`src/core/libraryCatalog.ts`). Das ist eine Dokumentation, keine Rechtsberatung. Beachte: Der eigene „Public Domain“-Filter von Mutopia listet auch CC-Stücke, lies also immer die Seite des Stücks.

So fügst du ein Stück hinzu:

1. Öffne die Seite des Stücks auf mutopiaproject.org und prüfe, dass dort **Copyright: Public Domain** steht. Nimm die einzelne `.mid`-Datei (kein Zip).
2. Speichere sie als `public/library/<composer>/<slug>.mid`, mit einem Slug aus Kleinbuchstaben, Ziffern und Bindestrichen.
3. Füge einen Eintrag in `LIBRARY_PIECES` in `src/core/libraryCatalog.ts` hinzu: die Mutopia-ID, den üblichen Titel mit Opus- oder Katalognummer, die Dauer in Sekunden und eine Schwierigkeit von 1 bis 5 (Bewertungsraster in [specs/phase-10-midi-library/requirements.md](specs/phase-10-midi-library/requirements.md), FR-4). Ein neuer Komponist braucht außerdem einen Eintrag in `LIBRARY_COMPOSERS` (mit einem gemeinfreien Porträt von Wikimedia Commons, gespeichert als quadratisches JPEG von höchstens 40 KB in `public/library/portraits/`) und einen Namen `composer…` in allen vier Sprachen.
4. Füge eine Zeile zu `licenses/library-sources.md` hinzu.
5. Führe `bun run test` aus: Der Test prüft Lizenz, Datei, Dauer und Größe.

## Installation und Offline-Betrieb

Piano Tutor ist eine installierbare Web-App (PWA). Öffne sie einmal online; danach funktioniert sie ohne Verbindung: Lektionen, freies Spielen, Klang, Fortschritt und MIDI-Eingabe.

- **Installieren:** In Chrome (Android oder Desktop) zeigt Home eine **Install**-Karte, oder nutze das Browsermenü bzw. das Installationssymbol in der Adressleiste. **Not now** blendet die Karte dauerhaft aus.
- **Updates:** Ist eine neue Version bereitgestellt, bietet ein Banner **Reload** oder **Later** an. Die App lädt nie von selbst neu, und das Banner wartet, bis du eine Lektion verlässt. Fortschritt und Einstellungen bleiben erhalten.
- **Entwicklung:** `bun run dev` hat keinen Service Worker. Zum Ausprobieren des Offline-Modus nutze `bun run build && bun run preview`.
- **Größe:** Beim ersten Besuch werden mit der App etwa 12 MB Klavier-Samples geladen, damit das Klavier auch offline klingt.
- **Symbol:** gezeichnet als `public/icon.svg`. Führe nach einer Änderung `bun run icons` aus, um die PNG- und ICO-Dateien neu zu erzeugen, und committe sie.

## Skripte

| Skript                           | Was es tut                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run dev`                    | Entwicklungsserver auf http://localhost:3000                                                                                                |
| `bun run build`                  | Typprüfung + Produktions-Build nach `dist/`                                                                                                 |
| `bun run preview`                | Den Produktions-Build lokal ausliefern                                                                                                      |
| `bun run lint`                   | TypeScript-Typprüfung, dann ESLint                                                                                                          |
| `bun run format`                 | Alle Dateien mit Prettier formatieren                                                                                                       |
| `bun run format:check`           | Schlägt fehl, wenn eine Datei nicht formatiert ist                                                                                          |
| `bun run test`                   | Unit-Tests einmal ausführen (Vitest)                                                                                                        |
| `bun run icons`                  | App-Symbole aus `public/icon.svg` neu erzeugen                                                                                              |
| `bun run piano-samples <Ordner>` | `public/piano/` aus dem entpackten FreePats-Set neu erzeugen (braucht ffmpeg; siehe [licenses/piano-samples.md](licenses/piano-samples.md)) |

CI (GitHub Actions) führt `lint`, `format:check`, `build` und `test` bei jedem Pull Request und jedem Push auf `main` aus.

## Bereitstellung

Die App ist eine statische Website, die auf zwei Hosts bereitgestellt wird, damit man sie vergleichen kann (siehe [specs/phase-03-deployment-device-testing/](specs/phase-03-deployment-device-testing/)). Web MIDI braucht HTTPS, das beide bieten.

| Host                 | URL                                                                                                                                            | Wie bereitgestellt wird                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GitHub Pages         | https://sergshtelmakh.github.io/piano-tutor/                                                                                                   | Der Job `deploy-github-pages` in `.github/workflows/ci.yml` läuft, nachdem CI auf `main` bestanden ist. Keine PR-Vorschauen. |
| Cloudflare (Workers) | https://piano-tutor.sh-serg1993.workers.dev/ (Branch-Vorschau: https://feature-deployment-device-testing-piano-tutor.sh-serg1993.workers.dev/) | Git-Integration: Pushes auf `main` aktualisieren die Produktion; jeder andere Branch und jeder PR erhält eine Vorschau-URL.  |

Die Fußzeile der App zeigt Commit und Host des laufenden Builds.

Die Einrichtung der beiden Hosts (einmalig: GitHub Pages mit der Quelle **GitHub Actions** und `BASE_PATH=/piano-tutor/`; Cloudflare mit Git-Integration, Build- und Vorschau-Befehlen, `wrangler.jsonc`, `BUN_VERSION` und ausgeschaltetem Web Analytics) ist ausführlich im [englischen README](README.md#deployment) beschrieben.

## Danksagung

Die Formen von Violin- und Bassschlüssel sowie die Kreuze, Auflösungszeichen, Fähnchen und Pausen in den Noten des MIDI-Players sind Umrisse der Musikschrift [Bravura](https://github.com/steinbergmedia/bravura), © Steinberg Media Technologies GmbH, verwendet unter der SIL Open Font License 1.1 (siehe [licenses/Bravura-OFL-1.1.txt](licenses/Bravura-OFL-1.1.txt)).

Die Stücke der Bibliothek stammen vom [Mutopia Project](https://www.mutopiaproject.org/) (gemeinfreie Ausgaben), und die Porträts der Komponisten sind gemeinfreie Bilder von [Wikimedia Commons](https://commons.wikimedia.org/) (siehe [licenses/library-sources.md](licenses/library-sources.md)).

Der Klaviersound stammt aus dem Sample-Set [Upright Piano KW](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html) des Projekts FreePats, aufgenommen von Gonzalo und Roberto an einem Kawai-Klavier und veröffentlicht unter der Gemeinfreiheits-Erklärung [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (siehe [licenses/piano-samples.md](licenses/piano-samples.md)). Die App wird nicht von Kawai hergestellt, gesponsert oder empfohlen.

## Sprache

Die Oberfläche gibt es auf Englisch, Ukrainisch, Deutsch und Französisch. Beim ersten Besuch wird die Browsersprache verwendet (mit Englisch als Rückfall); die Sprachauswahl merkt sich deine Wahl.

## Entwicklungsprozess

Dieses Projekt verwendet Spec-Driven Development (spezifikationsgetriebene Entwicklung). Die Spezifikationen in [specs/](specs/) sind die maßgebliche Quelle — beginne mit [specs/README.md](specs/README.md).
