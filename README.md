# HEAL health data fields

One page, with shared editing: every data field Apple Health and Google Health Connect
offer, 345 in all, each with an Implementation Phase of V1, V2 or Undecided. It is served
at `/health-integration/`. The site root redirects there.

The fields in V1 sit together in a block at the top; everything else follows by group.
Anyone with the link can change a field's phase and it saves itself. A field moved into
or out of V1 moves between the two blocks. A saved value is what everyone sees from then
on.

## What is in this branch

- `site/health-integration/index.html` is the page.
- `netlify/functions/field-edits/` is `/api/field-edits`, which stores the saved phases.
  `keys.mjs` lists the fields and values it accepts.
- `health-integration-data/` holds the full list as a sheet, with each field's phase as
  built, its earlier marking and the reason noted for it, and the workout type values
  that used to be an appendix. It sits outside `site/`, so it is in the repo and never
  served.
- `dev/local-server.mjs` runs the page and the function on this machine.

## How saving works

`/api/field-edits` keeps one record per field in Netlify Blobs (store
`health-field-edits`, keys `phase/<id>`), so saves on different fields never overwrite
each other. A value must be V1, V2 or Undecided. Choosing the phase the page was built
with deletes the saved record, so an untouched field stays untouched. If two people save
the same field, the second is told and shown the first one's value.

Every save is also written to a history record that is never rewritten:
`GET /api/field-edits?history=1` lists the latest 300, newest first.

Read the current values at any time:

    GET https://<site>/api/field-edits

Until 9 October 2026 the column was called "Useful for" and held a different set of
values. Those records are still in the same store under `row/<id>` and `history/...`,
untouched and unread.

## Where the page comes from

Don't edit `site/health-integration/index.html` or
`netlify/functions/field-edits/keys.mjs` by hand. Both are built from the project's
health-integration folder, which is outside this repo:

    python health-integration/build_doc_site.py

Which fields start in V1 is the `V1` list in that script. The field tables come from
`health_fields.json`, written by `build_health_fields.py`. Saved phases live on the
server, not in the page, so rebuilding and redeploying never loses them.

## Run it locally

    npm install
    node dev/local-server.mjs          # http://localhost:8770

This runs the real function against a local store in `dev/.blobs/` (ignored by git).

## Deploy (Netlify)

`netlify.toml` sets everything: publish `site`, functions `netlify/functions`, no build
command. Netlify Blobs needs no setup. A push to this branch deploys the site. The site
sends `noindex` so search engines leave it alone.
