# Google Play release – Curious Quest

The Android app is a **Trusted Web Activity (TWA)**: a thin Android wrapper that opens
https://curious-quest-mda.pages.dev full-screen. Every update pushed to GitHub reaches the app
automatically — no new app upload is needed for game changes.

## Store listing (copy & paste)

**App name** (max 30): `Curious Quest – Kids Games`

**Short description** (max 80):
`17 free learning games for kids. No ads, no purchases, no data collected.`

**Full description:**

Curious Quest is a free collection of 17 games for curious kids aged about 4 to 10 — made by a dad for his child.

Explore five colourful worlds with Fox, the explorer: Animal Kingdom, Dinosaurs, Space, Robots and Under the Sea. Every game changes its look, characters and music to match the world you pick.

🗺️ Adventure – roll the dice, answer simple questions and race to the trophy
🧠 Memory – 12 painted pictures in every world
🏁 Quiz Race – numbers and letters, with a reading voice for children who can't read yet
🎨 Draw & Paint – free drawing and 20 colouring pages
🐍 Snakes & Ladders, Race, Foursomes (Quartett)
♟️ Chess, Checkers, Backgammon, Domino, Colour Clash, Dots & Boxes
🔤 Letter Hunt, 🔢 Number Quest, 🔬 Game of Life

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
**Contact e-mail:** roytate.berlin@gmail.com
**Privacy policy URL:** https://curious-quest-mda.pages.dev/privacy.html

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
