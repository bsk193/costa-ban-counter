# Costa Ban Counter

A tiny standalone counter page. The shared tally starts at 4, and there is no visible add button. To add one, open the page with `?add=1` at the end of its URL. It increments once, then cleans the address bar.

## Publish on GitHub Pages

Create a public repository called `costa-ban-counter` and upload the files in this folder to the repository root. Then open **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, and save. The site will be available at `https://bsk193.github.io/costa-ban-counter/` after GitHub Pages finishes publishing.

The hidden increment link will be `https://bsk193.github.io/costa-ban-counter/?add=1`.

## Shared count

The page uses CountAPI's public counter endpoint so visitors see the same number without a server of our own. The count is initialized to 4 the first time the page is opened. The service documents its counters as public and shared, and anyone who knows the key can read or change it. The key is visible in this page's JavaScript, so this is suitable for a casual tally rather than a protected or tamper-proof record.
