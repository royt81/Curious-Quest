# Google Play release – Curious Quest

The Android app is a **Trusted Web Activity (TWA)**: a thin Android wrapper that opens
https://curious-quest-mda.pages.dev full-screen. Every update pushed to GitHub reaches the app
automatically — no new app upload is needed for game changes.

## Store listing (copy & paste)

**App name** (max 30): `Curious Quest – Kids Games`

**Short description** (max 80):
`15 free learning games for kids. No ads, no purchases, no data collected.`

**Full description:**

Curious Quest is a free collection of 15 games for curious kids aged about 4 to 10 — made by a dad for his child.

Explore five colourful worlds with Fox, the explorer: Animal Kingdom, Dinosaurs, Space, Robots and Under the Sea. Every game changes its look, characters and music to match the world you pick.

🗺️ Adventure – roll the dice, answer simple questions and race to the trophy
🧠 Memory – 12 painted pictures in every world
🀄 Mahjong – match the painted pictures and clear the pile, in three levels
🧱 Calm Blocks – turn and stack falling blocks, nice and slow
🏁 Quiz Race – numbers and letters, with a reading voice for children who can't read yet
🎨 Draw & Paint – free drawing and 20 colouring pages
🐍 Snakes & Ladders and Race
♟️ Chess, Checkers, Backgammon, Domino, Colour Clash, Dots & Boxes
🔬 Game of Life

In English and German (Deutsch).

Made for small hands:
• Big buttons and a "How to play" card for every game
• Play against the computer or pass the device to a friend
• Calm-colours and black & white mode for bedtime
• Works offline after the first start

Safe for children:
• No ads, no in-app purchases, no accounts
• No personal data collected — settings stay on the device
• No links out to social media

**Category:** Education (or Games › Educational) · **Tags:** kids, learning, family
**Contact e-mail:** info@curiousqueststudio.art
**Privacy policy URL:** https://curious-quest-mda.pages.dev/privacy.html

## Store listing – German (Deutsch)

Add it in Play Console under *Store presence → Main store listing → Manage translations → German (de-DE)*.

**App name** (max 30): `Curious Quest – Kinderspiele`

**Short description** (max 80):
`15 kostenlose Lernspiele für Kinder. Ohne Werbung, ohne Käufe, ohne Daten.`

**Full description:**

Curious Quest ist eine kostenlose Sammlung von 15 Spielen für neugierige Kinder von etwa 4 bis 10 Jahren – gemacht von einem Papa für sein Kind.

Entdecke mit dem Fuchs fünf bunte Welten: Tierreich, Dinosaurier, Weltraum, Roboter und Unterwasserreich. Jedes Spiel passt Aussehen, Figuren und Musik an die gewählte Welt an.

🗺️ Abenteuer – würfeln, einfache Fragen beantworten und zum Pokal rennen
🧠 Memory – 12 gemalte Bilder in jeder Welt
🀄 Mahjong – gleiche Bilder finden und den Stapel abräumen, in drei Stufen
🧱 Bauklötze – fallende Klötze drehen und stapeln, ganz gemütlich
🏁 Quiz-Rennen – Zahlen und Buchstaben, mit Vorlesestimme für Kinder, die noch nicht lesen können
🎨 Malen & Zeichnen – freies Malen und 20 Ausmalbilder
🐍 Schlangen & Leitern und Wettrennen
♟️ Schach, Dame, Backgammon, Domino, Farben-Duell, Käsekästchen
🔬 Spiel des Lebens

Auf Deutsch und Englisch.

Für kleine Hände gemacht:
• Große Knöpfe und eine Spielanleitung für jedes Spiel
• Gegen den Computer spielen oder das Gerät an Freunde weitergeben
• Ruhige Farben und Schwarz-Weiß-Modus für den Abend
• Funktioniert nach dem ersten Start auch offline

Sicher für Kinder:
• Keine Werbung, keine In-App-Käufe, keine Konten
• Es werden keine persönlichen Daten gesammelt – Einstellungen bleiben auf dem Gerät
• Keine Links zu sozialen Netzwerken

## Graphics
- App icon 512×512: `public/icons/icon-512.png`
- Feature graphic 1024×500: `docs/play-store/feature-graphic.png`
- Phone/tablet screenshots (1920×1080): `docs/play-store/screenshot-*.jpg`

## Play Console answers
- **App or game:** Game · **Free** · Contains ads: **No**
- **Target audience:** ages 5 & under, 6–8, 9–12 → the app falls under the **Families policy** (fine: no ads, no data)
- **Data safety:** "No data collected" and "No data shared"
- **Content rating questionnaire:** no violence, no user interaction/chat, no purchases → expected rating: PEGI 3 / Everyone
- **App access:** all functionality available without login

## Digital Asset Links
After uploading the first bundle, copy the **SHA-256 certificate fingerprint** from
Play Console → Test and release → App integrity → App signing, and put it into
`public/.well-known/assetlinks.json` (template there). Without it the app shows a browser address bar.
