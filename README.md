# HEAL health data integration document

One page, with shared editing: the Apple Health and Google Health Connect proposal for
HEAL, served at `/health-integration/`. The site root redirects there.

The page ends with an appendix of the data fields in view, in two lists. Anyone with the
link can change the "Useful for" value on any row of the first list and save it; the
second list, which opens and closes, is not editable. A saved value is what everyone
sees from then on.

## What is in this branch

- `site/health-integration/index.html` is the page.
- `netlify/functions/field-edits/` is `/api/field-edits`, which stores the saved
  "Useful for" values. `keys.mjs` lists the rows and values it accepts.
- `health-integration-data/` holds the full 345-row list of every field the two
  platforms offer, and the workout type values that used to be an appendix. It sits
  outside `site/`, so it is in the repo and never served.
- `dev/local-server.mjs` runs the page and the function on this machine.

## How saving works

`/api/field-edits` keeps one record per row in Netlify Blobs (store
`health-field-edits`), so saves on different rows never overwrite each other. A row's
value must be one of the two "Useful for" values the page offers. Choosing the value the
page was built with deletes the saved record, so an untouched row stays untouched. If
two people save the same row, the second is told and shown the first one's value.

Every save is also written to a history record that is never rewritten:
`GET /api/field-edits?history=1` lists the latest 300, newest first.

Read the current values at any time:

    GET https://<site>/api/field-edits

## Where the page comes from

Don't edit `site/health-integration/index.html` or
`netlify/functions/field-edits/keys.mjs` by hand. Both are built from the project's
health-integration folder, which is outside this repo:

    python health-integration/snapshot_useful_for.py    # optional: catch up with the live values
    python health-integration/build_doc_site.py

The page's prose lives in `health-integration/doc_content.json` and its field tables in
`health_fields.json`, written by `build_health_fields.py`. Saved values live on the
server, not in the page, so rebuilding and redeploying never loses them.

## Run it locally

    npm install
    node dev/local-server.mjs          # http://localhost:8770

This runs the real function against a local store in `dev/.blobs/` (ignored by git).

## Deploy (Netlify)

`netlify.toml` sets everything: publish `site`, functions `netlify/functions`, no build
command. Netlify Blobs needs no setup. A push to this branch deploys the site. The site
sends `noindex` so search engines leave it alone.
