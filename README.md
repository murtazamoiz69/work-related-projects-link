# Sprint Planner

A small board for planning the remaining sprints (Sprint 4: 23 to 29 Oct, Sprint 5: 30 Oct to 5 Nov,
Sprint 6: 6 to 12 Nov, the last delivery). Anyone with the link can add, edit, move and delete items,
and everyone sees the same plan.

- **Board**: "All items" on the left, one column per sprint. Drag cards between and within columns.
  Click a card for its description, priority, assignees, attachments and comments.
- **Calendar**: each sprint as a week with its delivery date and items, plus everything not planned yet.

## How it is built

- `site/index.html`: the page. `site/plan-ops.mjs`: the rules for each change, shared by the page and the server.
- `netlify/functions/plan/plan.mjs`: `/api/plan`, the shared plan, stored in Netlify Blobs. Each change is
  applied to the latest copy and written only if nobody wrote in between, so simultaneous edits do not
  overwrite each other. Every change is also kept in a log in the same store.
- `netlify/functions/files/files.mjs`: `/api/files`, attachment files (4 MB each) in Netlify Blobs.
- Sprint dates are `SPRINTS` in `site/plan-ops.mjs`.

## Starting items

A new site starts with the pending items of the NWS Roadmap & feedbacks sheet (as of 20 Oct 2026), all in
"All items": rows of "User Feedback (UF)" not struck through and not marked "Moved to Sprint N", and rows
of "Roadmap" not struck through or already in a sprint, with same-issue rows merged (57 items). They live
in `netlify/functions/plan/seed.mjs`, built by `python dev/build_seed.py`. The server uses them only while
nothing has been saved; after the first change the saved plan is used.

## Deploy

Connect this branch to a Netlify site (Add new site, Import from Git, branch `sprint-planning`).
Netlify reads `netlify.toml`, installs `@netlify/blobs` and deploys the functions. Dragging the folder
onto Netlify Drop does not deploy functions, so saving would not work that way.

## Run locally

    npm install
    node dev/local-server.mjs

Then open http://localhost:8771. Local data goes to `dev/.blobs/`.
