# Chat (Conversations) API

Covers the **Chat** screen's conversations: list, thread, overview, and the
message/star/handoff/note actions. (The Plan Workspace opened from Chat has its
own doc: [plan-workspace.md](./plan-workspace.md).) See [README.md](./README.md).

> **Conversation id = client id.** A conversation's `id` is the same string as
> its user's `id` (e.g. `c-1`). The frontend deep-links with `?c=<clientId>`.

## Page functionality
- Left: conversation list. **Tab chips + badge counts are server-computed**
  (`GET /conversations/tabs`); row filtering by the active tab and the search box
  run client-side over the loaded `GET /conversations` set.
- Center: message thread; take over from the AI / hand back; send messages.
- Right: overview (AI insights, notes, medical, activity); add a note.
- Live incoming messages + typing — via **realtime (websocket/poll)**, not REST.

---

## `GET /conversations`
Return **all** conversation summaries. The client filters this set by the active
tab and search box locally; the tab **counts** come from `GET /conversations/tabs`.

**Success `200`** — array of `ConversationSummary`:
```json
[
  {
    "id": "c-1",
    "client": { /* full Client — see users.md */ },
    "status": "waiting",
    "handledBy": "ai",
    "unread": 2,
    "starred": false,
    "lastMessage": { "text": "Thanks, that makes sense!", "time": "2026-09-01T14:03:00.000Z", "hasAttachment": false }
  }
]
```
| Field | Type | Notes |
| --- | --- | --- |
| id | string | = client id. |
| client | `Client` | Full object (avatar/name/status/program used by the card). |
| status | `"waiting"` \| `"active"` | `waiting` = needs a nutritionist; drives the card tag + "Needs Attention" tab. |
| handledBy | `"ai"` \| `"nutritionist"` | Who's responding. |
| unread | number | Unread count. |
| starred | boolean | Pinned to top. |
| lastMessage | object | `{ text, time (ISO), hasAttachment }` — for the preview + timestamp. |

**Errors:** `401`; `500`.

> Client-side over this list: **which tab is active** (row filtering) and the
> **search box**. The tab set and their counts are the server's (below), so the
> badges stay correct even once the list is paginated.

---

## `GET /conversations/tabs`
The conversation-list **tab chips + badge counts**, computed server-side over the
whole caseload (independent of the active tab, like the dashboard's Catch Up
chips). Ordered for display; **Pinned is present only when something is pinned**.

**Success `200`** — array of `ConversationTab`:
```json
[
  { "id": "inbox", "label": "All", "total": 48, "unread": 30 },
  { "id": "waiting", "label": "Needs Attention", "total": 26, "unread": 26 },
  { "id": "starred", "label": "Pinned", "total": 3, "unread": 0 },
  { "id": "new", "label": "New", "total": 6, "unread": 6 },
  { "id": "active", "label": "Active", "total": 22, "unread": 4 }
]
```
| Field | Type | Notes |
| --- | --- | --- |
| id | `inbox` \| `waiting` \| `starred` \| `new` \| `active` | Drives the client's active-tab row filter. |
| label | string | Chip text. |
| total | number | Conversations in that tab. Tab membership: `inbox` = all; `waiting`/`active` by `status`; `new` by the user's `status === "new"`; `starred` by `starred`. |
| unread | number | Of those, how many have `unread > 0` (the small badge shows when `0 < unread < total`). |

The client **refetches this after star / mark-read / handoff / send**, since those
change a tab's membership or unread count.

**Errors:** `401`; `500`.

---

## `GET /conversations/:id`
Full conversation for the selected thread + overview.

**Success `200`** — a `Conversation`:
```json
{
  "id": "c-1",
  "client": { /* full Client */ },
  "status": "waiting",
  "handledBy": "ai",
  "unread": 2,
  "starred": false,
  "insights": { "mealPct": 42, "workoutDone": false, "workoutsCompleted": 2, "workoutsTotal": 5 },
  "flags": ["low-adherence"],
  "chatSummary": ["Adherence down to 42%", "Missed evening meals this week"],
  "messages": [
    { "from": "client", "text": "I keep missing dinner logs", "time": "2026-09-01T14:02:00.000Z", "attachment": null },
    { "from": "ai", "text": "Want me to set an 8pm reminder?", "time": "2026-09-01T14:03:00.000Z", "attachment": null }
  ],
  "notes": [ { "author": "Sarah Nolan", "text": "Prefers voice notes", "days": 3, "attachment": null } ],
  "uploads": [ { "date": "2026-08-30T00:00:00.000Z" } ],
  "activity": [
    { "kind": "meal", "icon": "utensils", "title": "Logged Lunch", "detail": "520 kcal",
      "time": "2026-09-01T12:30:00.000Z", "category": "Lunch" }
  ]
}
```
**Field reference**
| Field | Type | Notes |
| --- | --- | --- |
| messages[] | `ChatMessage` | `from`: `"client"` \| `"ai"` \| `"coach"` (the nutritionist) \| `"system"`. `time` ISO. `attachment`: `null` or `{ type: "image"\|"file", name, dataUrl?, size? }`. |
| insights | object | Numbers for the overview summary. |
| flags | string[] | Medical/attention flags. |
| chatSummary | string[] | AI insight bullet points. |
| notes[] | `ChatNote` | `{ author, text, days (ago), attachment? }`. No date field (uses `days`). |
| uploads[] | array | `{ date (ISO) }` — recent uploads. |
| activity[] | `ChatActivityItem` | `kind`: `checkin`\|`meal`\|`workout`\|`weight`\|`photo`; `time` ISO; optional `photos: string[]`, `delta`, `category`, `upcoming`. Used by the overview Activity tab **and** the Plan Workspace tracker. |

**Errors:** `404` `{ "message": "Conversation not found." }`; `401`; `500`.

---

## `POST /conversations/:id/messages`
Send a message **as the nutritionist**. Only allowed when `handledBy === "nutritionist"`.

**Request body**
```json
{ "text": "Great progress this week!", "attachment": null }
```
| Field | Type | Notes |
| --- | --- | --- |
| text | string | May be empty **only** if `attachment` is present. |
| attachment | object \| null | `{ type: "image"\|"file", name, dataUrl?, size? }`. `dataUrl` is a base64/data-URI for image previews in the prototype; the real backend will likely use an upload flow — flag if so. |

**Success `200`** — the updated `Conversation` (with the appended `coach` message; `unread` reset to 0).
> The client appends optimistically and reconciles with your response.
**Errors:** `404`; `401`; `500`.

---

## `PATCH /conversations/:id`
Star/pin and mark-read.

**Request body** (either/both)
```json
{ "starred": true, "unread": 0 }
```
| Field | Type | Notes |
| --- | --- | --- |
| starred | boolean? | Pin/unpin. |
| unread | number? | Client sends `0` to mark read (on open). |

**Success `200`** — the updated `Conversation`.
**Errors:** `404`; `401`; `500`.

---

## `PATCH /conversations/:id/handoff`
Take over from the AI, or hand back. **Also appends a `system` message** to the
thread describing the change.

**Request body**
```json
{ "handledBy": "nutritionist" }
```
| Value | Effect | System message |
| --- | --- | --- |
| `"nutritionist"` | Nutritionist takes over | "Sarah Nolan took over this conversation" |
| `"ai"` | Hand back to AI | "Handed the conversation back to Nourish AI" |

**Success `200`** — the updated `Conversation` (new `handledBy` + appended system message).
**Errors:** `404`; `401`; `500`.

---

## `POST /conversations/:id/notes`
Add an internal note (prepended to `notes`).

**Request body**
```json
{ "text": "Prefers morning check-ins", "attachment": null }
```
| Field | Type | Notes |
| --- | --- | --- |
| text | string | Note text (may be empty if attachment present). |
| attachment | object \| null | `{ name, type }` (document reference). |

**Success `200`** — the updated `Conversation` (server sets `author` = current user, `days` = 0).
**Errors:** `404`; `401`; `500`.

---

## Realtime (NOT REST) — websocket or polling
The thread shows a **typing indicator** and **incoming messages** (the client's
follow-ups and the AI's replies) arriving live. In the prototype this is
simulated client-side; **in production the frontend expects a realtime stream**.

Provide **one of**:
- A **websocket** (e.g. `wss://…/conversations/:id/stream`) that pushes events:
  - `{ "type": "typing", "who": "client" | "ai" | null }`
  - `{ "type": "message", "message": { "from": "client" | "ai", "text": "…", "time": "…", "attachment": null } }`
- …or a **poll** endpoint (e.g. `GET /conversations/:id/messages?since=<ISO|cursor>`)
  the client calls on an interval.

The frontend has a single swap point (`features/chat/realtime.ts`) that maps
these events into the UI, so either transport drops in there. Tell us which
you'll provide and the exact event/response shape.

## Not an API (this page)
- **Tab row-filtering + search** — client-side over `GET /conversations` (the tab
  chips/counts themselves are the API's — `GET /conversations/tabs`).
- **AI suggestion chips** — local pool today (could become `GET /ai/suggestions?conversationId=`; flag if you want it).
- Emoji picker, attachment staging — local composer state.
