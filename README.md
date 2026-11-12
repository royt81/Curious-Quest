# 🦊 Curious Quest

**Free games for curious kids — no ads, no purchases, no accounts, no data collected.**

### ▶️ Play now: **[curious-quest-mda.pages.dev](https://curious-quest-mda.pages.dev/)**

Works in any browser on computers, tablets and phones — and can be installed as an app ("Add to Home screen").

Curious Quest is a collection of 15 games for children aged about 4–10, built by a dad for his child.
Every game comes in five worlds (Animals, Dinosaurs, Space, Robots, Under the Sea), each with its own
painted characters, music and animated background, guided by Fox, the explorer mascot.

## Games

| | |
|---|---|
| 🗺️ **Adventure** – roll the dice, answer questions, race to the trophy | 🧠 **Memory** – 12 painted pictures per world |
| 🧮 **Quiz Race** – maths and letters for readers and non-readers | 🎨 **Draw & Paint** – free drawing and colouring pages |
| 🐍 **Snakes & Ladders**, 🏁 **Race**, 🀄 **Mahjong**, 🧱 **Calm Blocks** | ♟️ **Chess**, **Checkers**, **Backgammon**, **Domino**, **Colour Clash**, **Dots & Boxes** |
| 🔬 **Game of Life** | |

Made for small hands: big touch targets, a reading voice for children who can't read yet,
"How to play" cards for every game, a calm-colours / black & white mode for bedtime,
and play against the computer or pass-and-play with friends.

## Languages

English and German. The game starts in German when the device is set to German, and
Settings → Language switches at any time (the reading voice switches too).

- Every text goes through `t('English text')` (`src/i18n/`); the English text is the key,
  so anything not yet translated simply stays English.
- `npm run i18n:check` lists texts that still need a German line.
- Quiz content is written per language, not translated word by word:
  German trivia (`challengeQuestions.de.js`), German spelling words with umlauts
  (`QuizRace/quizWords.js`) and German picture questions with der/die/das and plurals.

## Privacy by design

- No cookies, analytics, ads or third-party requests — fonts, pictures and sounds are all bundled.
- Settings and scores live only in the browser's local storage.
- Installable as an app (PWA) and playable offline after the first visit.

## Tech

- **React 19** + **Vite** (single-page app, no backend)
- **framer-motion** for animation, **lottie-react** for animated creatures
- Web Speech API for the reading voice, ZzFX + Web Audio for sound effects
- Self-hosted fonts via **@fontsource**
- Hand-written service worker for offline play
- Deployed as static files on **Cloudflare Pages** (automatic deploy on every push to `main`)

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

Requires Node.js 22 or newer.

## Art

Characters and Memory pictures were created for Curious Quest with AI image tools (Canva, FLUX.2)
and edited by hand. Some icons and colouring outlines are licensed from Flaticon.

## Licence

The **source code** is released under the [MIT License](LICENSE).
The **artwork** (characters, Memory pictures, boards, backgrounds, logo) and the licensed Flaticon icons
are **not** covered by the MIT License and may not be reused without permission.
