# Rob Run Costa Ban Counter

A standalone, unofficial Rob Run ban tally. The shared count starts at 4. The page uses a dark terminal-style layout and records timing for new ban events.

## Hidden increment link

Open the live page with `?add=1` at the end of its URL to add one ban. The URL removes that query after a successful increment, so refreshing does not add another.

- Site: https://bsk193.github.io/costa-ban-counter/
- Add one: https://bsk193.github.io/costa-ban-counter/?add=1

## Ban timing

After the first new ban is recorded, the page shows how long it has been since that event. After the next one, it also shows the elapsed time between the two. The original count of 4 has no timestamps, so timing starts with new events recorded through the hidden link.

The shared values use CountAPI's public counter service. The keys are visible in `app.js`; anyone who finds them can read or change the values. This is intended as a casual game tally, not protected data.
