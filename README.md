# HEAL health data fields

Two pages with shared editing, each a sheet of the data fields from Apple Health and
Google Health Connect with an Implementation Phase of V1, V2 or Undecided:

- `/health-integration-siam/`
- `/health-integration-nws/`

They started as copies of each other on 12 October 2026 and are independent from then on:
each has its own field list, its own V1 list and its own saved phases. The site root and
the old address, `/health-integration/`, redirect to the siam page.

The two platforms offer 345 fields. Each page shows 91: only fields that both platforms
have. Fields that can be worked out from others, per-record plumbing, iOS metadata keys
and groups the programme does not need are left off; rows that are the same data under a
different name on each platform are merged into one; and what only one platform has is
left off. All of it is listed in the build script.

The fields in V1 sit together in a block at the top; everything else follows by group.
Anyone with the link can change a field's phase and it saves itself. A field moved into
or out of V1 moves between the two blocks. A saved value is what everyone sees on that
page from then on.

## What is in this branch

- `site/health-integration-siam/index.html` and `site/health-integration-nws/index.html`
  are the pages.
- `netlify/functions/field-edits/` is `/api/field-edits`, which stores the saved phases.
  `keys.mjs` lists the pages, the fields on each and the values it accepts.
- `health-integration-data/` holds the full list of 345 as a sheet, with the phase each
  page is built with (or that the field is not on it), its earlier marking and the reason
  noted for it, and the workout type values that used to be an appendix. It sits outside
  `site/`, so it is in the repo and never served.
- `dev/local-server.mjs` runs the pages and the function on this machine.

## How saving works

Every request names its page: `/api/field-edits?page=siam` or `?page=nws`. The function
keeps one record per field in Netlify Blobs (store `health-field-edits`, keys
`<page>/phase/<id>`), so saves on different fields never overwrite each other and the two
pages never share a record. A value must be V1, V2 or Undecided. Choosing the phase the
page was built with deletes the saved record, so an untouched field stays untouched. If
two people save the same field, the second is told and shown the first one's value.

Every save is also written to a history record that is never rewritten:
`GET /api/field-edits?page=<page>&history=1` lists the latest 300, newest first.

Read the current values at any time:

    GET https://<site>/api/field-edits?page=siam
    GET https://<site>/api/field-edits?page=nws

Older records are still in the same store, untouched and unread: `phase/<id>` and
`phase-history/...` from the single page that existed until 12 October 2026 (no phase was
saved there when it was split), and `row/<id>` and `history/...` from the "Useful for"
column that the phases replaced on 9 October 2026.

## Where the pages come from

Don't edit the two `index.html` files or `netlify/functions/field-edits/keys.mjs` by
hand. All three are built from the project's health-integration folder, which is outside
this repo:

    python health-integration/build_doc_site.py

What each page shows and which fields start in V1 are the `PAGES` lists in that script;
a change to one page goes on that page's own lists. The field tables come from
`health_fields.json`, written by `build_health_fields.py`. Saved phases live on the
server, not in the page, so rebuilding and redeploying never loses them.

## Run it locally

    npm install
    node dev/local-server.mjs          # http://localhost:8770

This runs the real function against a local store in `dev/.blobs/` (ignored by git).

## Deploy (Netlify)

`netlify.toml` sets everything: publish `site`, functions `netlify/functions`, the
redirects, no build command. Netlify Blobs needs no setup. A push to this branch deploys
the site. The site sends `noindex` so search engines leave it alone.
