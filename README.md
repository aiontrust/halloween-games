# Halloween Games

A small static arcade of Halloween games with one arcade-style scoreboard, built to play on a phone. Three scored games, two creative ones, no build step and no dependencies.

Play it: https://aiontrust.github.io/halloween-games/

## Games

| Game | Type | What you do |
| --- | --- | --- |
| Bones Plinko | Scored | A skeleton falls apart one bone at a time. Time each drop to land in a high bin. |
| Pumpkin Bowling | Scored | Roll a pumpkin at ten ghosts. Three taps set position, angle and power. One to three players take turns on one device and each saves their own score. |
| Bat Catcher | Scored | Forty seconds to swing a net at bats. Chain catches for a multiplier and avoid the crows. A cackling witch flies past to tease you. |
| Witch Dinner | Creative | Drop three ingredients in a cauldron and stir. The same three always make the same quirky dish, drawn as a picture. 455 recipes to find, kept in a recipe book you can tap through. |
| Haunted House | Creative | Decorate from a table of items, paint the walls, roof, door and trim, and turn the lights on and off room by room. |

The three scored games feed the scoreboard on the main page. Witch Dinner and Haunted House have no score. The hub shows how many recipes you have found and how many decorations you have placed.

## Run it

Open `index.html` in a browser, or serve the folder so the fonts and storage behave like a real site:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Fonts come from Google Fonts, so the pages fall back to system serif fonts when offline.

## Offline and install

The games work with no connection after the first visit. `sw.js` is a service worker that saves every page, script, style and icon when the site first loads. Online it always asks the network first, so updates appear straight away, and it falls back to the saved copy after 3 seconds or when offline. The Google Fonts are saved the first time they load, and pages use system serif fonts until then.

On a phone, use Share, then Add to Home Screen (iPhone) or the install prompt (Android) to get a full-screen app icon. `manifest.webmanifest` and `icons/` supply the name and the pumpkin icon.

When you add a file, list it in `PRECACHE` in `sw.js` and change `CACHE` so phones refresh their saved list. Service workers need https or `localhost`, so opening `index.html` straight from disk skips offline support.

## Scores

When an arcade game ends, a modal asks for three letters, like an old cabinet. Use the arrows, tap a letter, or type. Enter saves.

- A player's overall total is the sum of their best score in each scored game.
- Scores live in `localStorage` under `halloween-games:scores:v1`, so they are per browser and per device. Two tabs stay in sync through the `storage` event.
- All reads and writes go through `Arcade.scores` in `js/arcade.js` (`load`, `save`, `add`, `stats`, `rankOf`, `clear`). To share scores across devices, replace `load` and `save` with calls to a server and keep the rest.
- Entries are validated on load, so a damaged save is dropped rather than breaking the page.
- Because there is no server, scores can be edited from the browser console. Treat the board as friendly, not secure.

Witch Dinner keeps its recipe book in `halloween-games:witch-book:v1` and Haunted House keeps its house in `halloween-games:house:v1`.

## Layout

```
index.html            hub: game cards and scoreboard
css/arcade.css        shared look and the initials modal
js/arcade.js          window.Arcade: canvas setup, game loop, sound, scores, initials modal
js/hub.js             hub cards and scoreboard
sw.js                 service worker for offline play
manifest.webmanifest  name and icons for installing on a phone
icons/                app icons
games/<name>/         one folder per game: index.html, game.js (and style.css where needed)
```

## Add a game

1. Copy a folder in `games/` and keep the `<body data-root="../../" data-game="id">` line.
2. Add the game to `GAMES` and `ORDER` in `js/arcade.js`, and extend the hard-coded ids in `clean`-adjacent `stats()` (`best` and `per`).
3. When the game ends, call `Arcade.finish({ game: 'id', points: n, onReplay: restart })`.
4. Add a card and a scoreboard tab to `index.html`, and a column in `js/hub.js`.

Games with no score only need a card on the hub.

## Controls

Every game works with touch, mouse and keyboard. Space or Enter acts, and Bat Catcher also moves with the arrow keys. Sound starts after your first tap and can be switched off with the button at the top.
