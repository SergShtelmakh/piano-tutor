[English](README.md) · [Українська](README.uk.md) · [Deutsch](README.de.md) · **Français**

# Piano Tutor

Une application web ludique pour apprendre le piano : branchez un clavier MIDI (Web MIDI) et obtenez en temps réel un retour sur la justesse de vos notes. Côté client uniquement, sans serveur. Voir [specs/mission.md](specs/mission.md).

> État : les phases 1 à 13 sont terminées. Jeu libre avec un clavier MIDI, le clavier de l'ordinateur ou le piano à l'écran ; un parcours de 13 leçons pour la première semaine ; une progression locale (étoiles, XP, niveaux, série quotidienne) ; une application installable et utilisable hors ligne (PWA) ; un piano à l'écran adaptatif ; un lecteur de fichiers MIDI avec partition ; une bibliothèque de 34 pièces classiques du domaine public ; et des **cours** qui enseignent le début d'une pièce de la bibliothèque, main par main. L'application est déployée en ligne (voir Déploiement). Suite — voir [specs/roadmap.md](specs/roadmap.md).

> Ce fichier est une traduction de [README.md](README.md) (la version anglaise fait foi). En cas de divergence, c'est la version anglaise qui compte.

## Prérequis

- [Bun](https://bun.sh) (npm fonctionne aussi)
- Un navigateur basé sur Chromium (Chrome, Edge) pour Web MIDI. Les autres navigateurs permettent quand même de jouer avec le piano à l'écran et le clavier de l'ordinateur.

## Démarrage

```bash
bun install
bun run dev      # http://localhost:3000
```

## Comment jouer

- **Clavier MIDI :** cliquez sur **Connect MIDI keyboard** (connecter le clavier MIDI) et autorisez l'accès. Tous les claviers connectés fonctionnent, pédale de sustain comprise. Web MIDI nécessite Chrome ou Edge et une page sécurisée (HTTPS ou `localhost`).
- **Clavier de l'ordinateur :** `A S D F G H J K L ;` sont les touches blanches (do ré mi fa sol la si do ré mi) et `W E T Y U O P` les touches noires. La touche `Shift` de gauche (`⇧`) joue le si situé juste sous le premier do. `Z` / `X` décalent l'octave vers le bas / le haut. Les touches sont reconnues par leur position physique : cela fonctionne donc aussi avec les dispositions QWERTZ et AZERTY.
- **Piano à l'écran :** cliquez ou touchez les touches. Le piano a la largeur de la fenêtre et affiche plus d'octaves quand elles tiennent (les touches font au moins 40 px de large, jusqu'aux 88 touches sur un grand écran). Sur un téléphone étroit, les touches gardent une taille adaptée aux doigts et le piano défile latéralement : glissez sur la règle des octaves au-dessus des touches (glisser sur les touches les joue). Les boutons d'octave et `Z` / `X` déplacent la plage jouée par le clavier de l'ordinateur (B2–C5 par défaut : le si sous le premier do, deux octaves et le do du haut), et la vue suit.
- **Taille du clavier :** le bouton **Keyboard** à côté de l’état MIDI (visible quand Web MIDI est disponible, masqué pendant une leçon) indique à l’appli combien de touches a votre vrai clavier : choisissez 25, 37, 49, 61, 76 ou 88 touches et décalez la plage par octaves si elle commence sur une autre note, ou appuyez sur **Calibrate**, jouez la touche la plus grave puis la plus aiguë de votre clavier MIDI et enregistrez le résultat (toute taille convient). Le réglage reste sur votre appareil. Les touches du piano à l’écran hors de cette plage sont atténuées (elles jouent quand même), et une leçon avec des notes que votre clavier n’a pas affiche un message avec leur nombre ; la leçon reste jouable. Tant que vous ne choisissez pas de taille, rien n’est défini.
- **Accueil et leçons :** l'application s'ouvre sur **Home** (Accueil), avec 13 leçons en cinq unités : main droite (clé de sol), main gauche (clé de fa), les deux clés, mélodies (Mary Had a Little Lamb, Ode to Joy, Twinkle Twinkle), et intervalles et accords. Appuyez sur **Start** sur une carte de leçon ; la leçon marquée **Next** est la première que vous n'avez pas terminée, mais rien n'est verrouillé. La portée affiche une rangée de notes : la note en surbrillance est celle à jouer, les notes jouées deviennent grises. Pour un accord, jouez toutes ses notes dans n'importe quel ordre. Une mauvaise touche compte comme une erreur et la cible reste jusqu'à ce que vous la jouiez correctement. À la fin, vous obtenez votre précision, 1 à 3 étoiles et de l'XP. Les leçons aléatoires donnent un nouvel ordre à chaque démarrage.
- **Lecteur :** le mode **Player** ouvre un fichier MIDI (`.mid`, formats 0 et 1, jusqu'à 2 Mo) avec un sélecteur de fichier. Le fichier est lu sur votre appareil et n'est jamais envoyé. Il est affiché en partition (dièses, valeurs de notes, silences, mesures, liaisons ; une version simplifiée à une voix, sans armure, ligatures ni triolets) sur des systèmes, et joué avec un curseur mobile pendant que les touches qui sonnent s'allument en bleu. **Play** / **Pause** / **Stop**, un curseur de tempo (50–150 %) et un curseur de position (ou un clic sur la partition) permettent de se déplacer. Les percussions sont ignorées.
- **MuseScore / MusicXML :** le lecteur ouvre aussi une partition exportée depuis MuseScore (**Fichier → Exporter → MusicXML**) en `.mxl` compressé ou en `.musicxml` / `.xml` simple (jusqu’à 2 Mo) ; le format est reconnu d’après le contenu. Toutes les parties sont fusionnées, les percussions sont ignorées, et la pièce est jouée une fois à 120 bpm, comme écrite (les indications de tempo, les reprises et les notes d’agrément sont ignorées ; le curseur de tempo fonctionne toujours). Dans une partie à deux portées, la portée du haut est la main droite et celle du bas la main gauche : le bouton **Learn** à côté du nom du fichier crée donc un cours (comme pour une pièce de la bibliothèque) où chaque note est dans la main pour laquelle elle est écrite. **Learn** fonctionne aussi pour votre propre fichier `.mid` (les mains y sont séparées au do central). Les étoiles et l’XP d’un tel cours sont enregistrées sur votre appareil, mais le fichier lui-même n’est pas conservé et n’apparaît donc pas sur Home ; rouvrez le même fichier pour revoir ses étoiles.
- **Bibliothèque :** le bouton **Library** du lecteur ouvre 34 pièces classiques pour piano de 10 compositeurs (Bach, Beethoven, Brahms, Burgmüller, Chopin, Haendel, Haydn, Mozart, Schubert, Schumann), regroupées par compositeur, avec un portrait de chacun, et notées de 1 (débutant) à 5 (expert). Filtrez par difficulté ou par favoris, choisissez une pièce et appuyez sur **Play**. Marquez les pièces comme favorites (★) ou terminées (☑) ; les marques restent sur votre appareil. Une pièce déjà ouverte une fois s'ouvre aussi hors ligne. Les fichiers sont des rendus mécaniques de la partition : ils sonnent avec exactitude mais sans expression.
- **Apprendre une pièce :** appuyez sur **Learn** à côté d'une pièce de la bibliothèque (ou dans sa ligne d'information au-dessus de la partition). L'application construit un **cours** à partir du début de la pièce (ses 6 premières parties, de 4 mesures au plus chacune) et ordonne les leçons du plus simple au plus difficile. D'abord pour la **main droite**, puis la **main gauche** : lire les notes utilisées dans la pièce, puis ses accords (s'il y en a), puis les parties une à une, puis les parties réunies (1–2, 3–4, 5–6, 1–4, 1–6). Ensuite, les **deux mains ensemble** : les parties, puis les parties réunies. Chaque leçon affiche la vraie partition de la pièce, l'étape en cours étant marquée en bleu ; vous jouez ce que vous voyez, et l'application juge les notes (pas le rythme). Rien n'est verrouillé, un repère **Next** signale la première leçon non terminée, et Home liste les pièces que vous apprenez. Les deux mains en même temps peuvent demander plusieurs doigts ou touches à la fois ; le piano à l'écran ou un clavier MIDI aide alors.
- **Progression :** l'XP fait monter votre niveau, et terminer au moins une leçon par jour construit une série quotidienne. Tout est enregistré uniquement sur votre appareil ; **Reset progress** sur Home l'efface.

## Bibliothèque

Les pièces sont des fichiers MIDI du [Mutopia Project](https://www.mutopiaproject.org/), conservés dans `public/library/<composer>/`. **Seules sont utilisées les pièces dont la page Mutopia indique « Public Domain »** (champ « Copyright »). Le Mutopia Project publie aussi des pièces sous CC-BY et CC-BY-SA, qui exigent une attribution ou un partage dans les mêmes conditions ; elles sont écartées, et `src/core/library.test.ts` échoue si une pièce a une autre licence. Les portraits des compositeurs sont des peintures, dessins et photographies du domaine public de [Wikimedia Commons](https://commons.wikimedia.org/) (la page Commons doit indiquer « Public domain » ; un test n'autorise rien d'autre). La source, la licence et la date de vérification de chaque pièce et de chaque portrait figurent dans [licenses/library-sources.md](licenses/library-sources.md) et dans le catalogue (`src/core/libraryCatalog.ts`). C'est un relevé, pas un avis juridique. Attention : le filtre « Public Domain » de Mutopia liste aussi des pièces CC ; lisez donc toujours la page de la pièce.

Pour ajouter une pièce :

1. Ouvrez la page de la pièce sur mutopiaproject.org et vérifiez qu'elle indique **Copyright: Public Domain**. Prenez le fichier `.mid` seul (pas une archive zip).
2. Enregistrez-le sous `public/library/<composer>/<slug>.mid`, avec un slug en minuscules, chiffres et tirets.
3. Ajoutez une entrée à `LIBRARY_PIECES` dans `src/core/libraryCatalog.ts` : l'identifiant Mutopia, le titre usuel avec son numéro d'opus ou de catalogue, la durée en secondes et une difficulté de 1 à 5 (grille dans [specs/phase-10-midi-library/requirements.md](specs/phase-10-midi-library/requirements.md), FR-4). Un nouveau compositeur nécessite aussi une entrée dans `LIBRARY_COMPOSERS` (avec un portrait du domaine public de Wikimedia Commons, enregistré en JPEG carré de 40 Ko au plus dans `public/library/portraits/`) et un nom `composer…` dans les quatre langues.
4. Ajoutez une ligne à `licenses/library-sources.md`.
5. Lancez `bun run test` : il vérifie la licence, le fichier, sa durée et sa taille.

## Installation et hors ligne

Piano Tutor est une application web installable (PWA). Ouvrez-la une fois en ligne ; ensuite elle fonctionne sans connexion : leçons, jeu libre, son, progression et entrée MIDI.

- **Installer :** dans Chrome (Android ou ordinateur), Home affiche une carte **Install**, ou utilisez le menu du navigateur / l'icône d'installation dans la barre d'adresse. **Not now** masque la carte définitivement.
- **Mises à jour :** quand une nouvelle version est déployée, une bannière propose **Reload** ou **Later**. L'application ne se recharge jamais seule, et la bannière attend que vous quittiez une leçon. La progression et les réglages sont conservés.
- **Développement :** `bun run dev` n'a pas de service worker. Pour essayer le mode hors ligne, utilisez `bun run build && bun run preview`.
- **Icône :** dessinée dans `public/icon.svg`. Après une modification, lancez `bun run icons` pour régénérer les fichiers PNG et ICO, et commitez-les.

## Scripts

| Script                 | Ce qu'il fait                                                 |
| ---------------------- | ------------------------------------------------------------- |
| `bun run dev`          | Serveur de développement sur http://localhost:3000            |
| `bun run build`        | Vérification des types + build de production dans `dist/`     |
| `bun run preview`      | Sert le build de production en local                          |
| `bun run lint`         | Vérification des types TypeScript, puis ESLint                |
| `bun run format`       | Formate tous les fichiers avec Prettier                       |
| `bun run format:check` | Échoue si un fichier n'est pas formaté                        |
| `bun run test`         | Lance les tests unitaires une fois (Vitest)                   |
| `bun run icons`        | Régénère les icônes de l'application depuis `public/icon.svg` |

La CI (GitHub Actions) lance `lint`, `format:check`, `build` et `test` sur chaque pull request et chaque push vers `main`.

## Déploiement

L'application est un site statique, déployé sur deux hébergeurs pour pouvoir les comparer (voir [specs/phase-03-deployment-device-testing/](specs/phase-03-deployment-device-testing/)). Web MIDI nécessite HTTPS, que les deux fournissent.

| Hébergeur            | URL                                                                                                                                               | Mode de déploiement                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Pages         | https://sergshtelmakh.github.io/piano-tutor/                                                                                                      | Le job `deploy-github-pages` de `.github/workflows/ci.yml` s'exécute après la réussite de la CI sur `main`. Pas d'aperçus de PR. |
| Cloudflare (Workers) | https://piano-tutor.sh-serg1993.workers.dev/ (aperçu de branche : https://feature-deployment-device-testing-piano-tutor.sh-serg1993.workers.dev/) | Intégration Git : les push vers `main` mettent à jour la production ; chaque autre branche et chaque PR reçoit une URL d'aperçu. |

Le pied de page de l'application affiche le commit et l'hébergeur du build en cours.

La configuration des deux hébergeurs (une seule fois : GitHub Pages avec la source **GitHub Actions** et `BASE_PATH=/piano-tutor/` ; Cloudflare avec l'intégration Git, les commandes de build et d'aperçu, `wrangler.jsonc`, `BUN_VERSION` et Web Analytics désactivé) est décrite en détail dans le [README anglais](README.md#deployment).

## Crédits

Les formes des clés de sol et de fa, ainsi que les dièses, bécarres, crochets et silences de la partition du lecteur MIDI, sont des contours de la police musicale [Bravura](https://github.com/steinbergmedia/bravura), © Steinberg Media Technologies GmbH, utilisés sous la licence SIL Open Font License 1.1 (voir [licenses/Bravura-OFL-1.1.txt](licenses/Bravura-OFL-1.1.txt)).

Les pièces de la bibliothèque proviennent du [Mutopia Project](https://www.mutopiaproject.org/) (éditions du domaine public), et les portraits des compositeurs sont des images du domaine public de [Wikimedia Commons](https://commons.wikimedia.org/) (voir [licenses/library-sources.md](licenses/library-sources.md)).

## Langue

L'interface est disponible en anglais, ukrainien, allemand et français. À la première visite, la langue du navigateur est utilisée (avec l'anglais en repli) ; le sélecteur de langue mémorise votre choix.

## Processus de développement

Ce projet utilise le Spec-Driven Development (développement piloté par les spécifications). Les spécifications de [specs/](specs/) sont la source de vérité — commencez par [specs/README.md](specs/README.md).
