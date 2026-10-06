# HEAL pages, with shared editing

Two pages, each with its own save endpoint, deployed together:

- `/` the **journey map**: the first-week journey of HEAL's proactive messages. Anyone
  with the link can edit a message (the example and its notification, or the Context
  setting message) and save it.
- `/health-integration/` the **Apple Health and Health Connect document**: the whole
  proposal, with a 345-row appendix of every field the two platforms offer. Anyone with
  the link can change the "Useful for" value on any row and save it.

A saved edit is what everyone sees from then on.

## How saving works

The two pages work the same way, against their own endpoint and their own Blobs store:
`/api/edits` with store `journey-edits` for the journey map, `/api/field-edits` with
store `health-field-edits` for the health-data document. The health document's rows are
keyed by section and field name, its value must be one of the four "Useful for" labels,
and choosing the value the page was built with deletes the saved edit rather than
storing it, so an untouched row stays untouched.

- `site/index.html` is the page. It loads the saved edits from `/api/edits` before it
  renders, and again when the tab comes back into view.
- `netlify/functions/edits/edits.mjs` is `/api/edits`. It stores one record per message
  in Netlify Blobs (store `journey-edits`), so saves on different messages never
  overwrite each other. If two people save the same message, the second is told and
  keeps their text, and can save again to replace the first.
- Every save is also written to a history record that is never rewritten:
  `GET /api/edits?history=1` lists the latest 200, newest first, with the text before
  and after. Use it to put back anything overwritten by mistake.
- Only the messages on the page can be edited (`keys.mjs`); the server checks shape
  and length too.

Read the current edits at any time:

    GET https://<site>/api/edits

## Where the page comes from

Don't edit `site/index.html` or `netlify/functions/edits/keys.mjs` by hand. Both are
built from the project's proactive-sim folder (outside this repo):

    python proactive-sim/build_netlify_site.py

The same holds for `site/health-integration/index.html` and
`netlify/functions/field-edits/keys.mjs`, built from the health-integration folder:

    python health-integration/build_doc_site.py

That page is the health-data document itself: the Google Doc and Google Sheet it came
from were discarded on 6 October 2026. Its prose lives in `health-integration/
doc_content.json` and its field tables in `health_fields.json`, written by
`build_health_fields.py`.

That uses the same `message_data.py` and `journey_map_template.html` as the artifact
version, and swaps in `netlify_save_layer.js` as the save code. Saved edits live on the
server, not in the page, so rebuilding and redeploying never loses them.

## Run it locally

    npm install
    node dev/local-server.mjs          # http://localhost:8770

This runs the real function against a local store in `dev/.blobs/` (ignored by git).

## Deploy (Netlify)

Import this repo. `netlify.toml` sets everything: publish `site`, functions
`netlify/functions`, no build command. Netlify Blobs needs no setup. The site sends
`noindex` so search engines leave it alone.

Two branches, two sites:

- `proactive-messages` is the journey map, live at proactive-messages.netlify.app.
- `health-app-integration` is the health-data document's own site. Its `netlify.toml`
  adds one rewrite, so the document is served at the site root as well as at
  `/health-integration/`. Everything else is the same, which is why the journey map and
  its `/api/edits` ride along unused.

The two stores are separate, so a saved edit on one site never touches the other.
