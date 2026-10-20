"""Builds netlify/functions/plan/seed.mjs: the starting plan a new site shows before anyone saves.

The items are the pending rows of the NWS Roadmap & feedbacks sheet (read 20 Oct 2026): every row of
"User Feedback (UF)" that is not struck through and not marked "Moved to Sprint N", and every row of
"Roadmap" that is not struck through or already in a sprint. Rows about the same thing are merged.
All items start in "All items". Run: python dev/build_seed.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "netlify", "functions", "plan", "seed.mjs")
CREATED = 1792434600000  # 20 Oct 2026, 00:00 IST

# (title, summary, sources, sheet status, links)
# sources: "UF5 (6 Oct, WhatsApp, Abirami)" style strings
ITEMS = [
    # ---- already pointed at a sprint in the sheet ----
    ("App: Recipes section with Simrun's recipes",
     "Add a Recipes (quick-to-make recipes) section to the side menu. Members asked whether Simrun's own recipes will be in the app and don't want to lose access to them.",
     ["UF5 (6 Oct, WhatsApp, Abirami)", "UF54 (10 Oct, onboarding call, Vedika)"], "To move to Sprint 4", []),
    ("Agent: Work out fibre for every logged meal",
     "Fibre is often missing or wrong in logged meals, so members who track it can't rely on the breakdown. Fibre should be worked out for every logged food, like calories and macros.",
     ["UF61 (14 Oct, WhatsApp, Mythri Raghu)"], "To move to Sprint 4",
     [("fiber-not-included.jpeg", "https://drive.google.com/file/d/1ddL90YvGNjLLNzVrsyyme2JRWWaGrXBs/view?usp=drive_link")]),
    ("Internal: Move to PLR API version 2",
     "The PLR (patient record) API has to be changed to version 2.",
     ["UF78 (16 Oct, internal, Khuze)"], "Planned for Sprint 4", []),
    ("App + panel: Delete account and data (needed for store approval)",
     "Add an option to delete or disable a member's account and its data, in the app and in the nutritionist panel. The Play Store and App Store require it for approval.",
     ["UF10 (6 Oct, standup, Khuze)", "UF94 (16 Oct, weekly call, NWS team)"], "Pending decision", []),
    ("App: Search inside the chat by keyword",
     "A search button inside the chat to find an earlier message by keyword.",
     ["UF12 (6 Oct, WhatsApp, Cauvya)"], "To move to Sprint 3", []),
    ("Panel: Add member form, mobile number optional (digits and + only)",
     "In the nutritionist panel's Add member form, the mobile number should be optional and accept any length. Agreed on 20 Oct: the field takes only digits and a leading +.",
     ["UF57 (13 Oct, feedback, Murtaza)"], "To move to Sprint 3", []),
    ("Agent: Breakfast suggestion should follow the member's usual breakfast time",
     "A breakfast suggestion arrived at 10:30 AM, which felt late, possibly because no breakfast photo was logged. Its timing should follow the member's usual breakfast time, not a missing log.",
     ["UF62 (14 Oct, WhatsApp, Gouri Barve)"], "To move to Sprint 3", []),
    ("Internal: Separate OpenRouter keys for live and dev",
     "Live and dev use the same OpenRouter key. Set up a separate key, and check with Khuze whether auto renew can be set up on production only.",
     ["UF69 (15 Oct, internal, Chid)"], "To move to Sprint 2", []),

    # ---- the agent: logging ----
    ("Agent: Don't ask for amounts already given in a text meal log",
     "For 'a chicken pesto sandwich and fried egg coffee, and half a chocolate croissant', the agent replied as if a photo had been sent and asked how much of the sandwich and coffee. A single item with no amount can be logged as one serving and confirmed.",
     ["UF98 (19 Oct, WhatsApp, Khuze)"], "No status",
     [("quantity-log.jpeg", "https://drive.google.com/file/d/1c3fUgl1uLqN_A5mu7HERh0n3-5A36K_Y/view?usp=drive_link")]),
    ("Agent: Log what it says it will log, even while waiting on another answer",
     "The agent said it would log the vermicelli upma as breakfast, then held the whole log back while it asked about a protein shake. When it says it will log something, it should log it then.",
     ["UF96 (19 Oct, WhatsApp, Khuze)"], "No status",
     [("partial-log.jpeg", "https://drive.google.com/file/d/1aoGF9-7x6z4ciX0hxzM1wCy5ACR3schd/view?usp=drive_link")]),
    ("Agent: Make a reasonable portion guess instead of saying 'I don't know'",
     "When the agent can't tell a portion exactly (for example a half-eaten meal), it should make a reasonable guess and log it rather than giving up. Its confidence is used internally only.",
     ["UF80 (16 Oct, internal, Induja)"], "No status",
     [("meal-portion.jpg", "https://drive.google.com/file/d/1JAblKThOjcwHN5CRrsA-A-FX3wiyyd3m/view?usp=drive_link")]),
    ("Agent: Ask what kind of coffee instead of assuming black coffee",
     "A coffee was logged as black coffee (about 2 kcal) without asking. The agent should ask once what kind (milk, sugar, how much) and remember the member's usual coffee.",
     ["UF95 (19 Oct, WhatsApp, Mythri Raghu)"], "On hold", []),
    ("Agent: Find calories for common items (e.g. Diet Pepsi) instead of skipping them",
     "The agent left out 2 Diet Pepsi because it 'couldn't price them', so the meal and the day's total were incomplete.",
     ["UF19 (6 Oct, traces, Khuze)"], "Pending decision", []),
    ("Agent: Remember what the member just said (prepared dinner)",
     "The member said dinner was already prepared; the agent asked them to list it again. It should keep the immediate conversation in mind.",
     ["UF20 (6 Oct, traces, Khuze)"], "Pending decision", []),
    ("Agent: Same food should get the same calorie estimate every time",
     "Calorie estimates for the same meal items differ between the agent's replies.",
     ["UF77 (15 Oct, WhatsApp, Sapna)"], "Pending decision",
     [("inconsistent calorie estimates (folder)", "https://drive.google.com/drive/folders/1GkH5cO9fv-z1lRN2tUBFSPSPIqLtzWSP?usp=sharing")]),
    ("Agent: Meals logged from the plan use the plan's calorie figure",
     "When a member logs a meal from their plan, the calories come from the model's estimate, not from the plan.",
     ["UF75 (15 Oct, internal, Chid)"], "Pending decision", []),
    ("Agent: Accept the member's own calorie figure and flag it to the nutritionist",
     "When a member's calorie figure differs from the agent's estimate, the agent accepts it, says the nutritionist will review it, and flags the difference to the nutritionist. It never argues. Agreed on the 16 Oct call.",
     ["UF88 (16 Oct, weekly call, NWS team)"], "No status", []),

    # ---- the agent: conversation and support ----
    ("Agent: Pick up the conversation after the nutritionist hands the chat back",
     "After a nutritionist hands a chat back, the agent should read what was discussed, ask for anything still missing, and log the meals, workouts or readings mentioned.",
     ["UF27 (7 Oct, feedback, Khuze)"], "Pending decision", []),
    ("Agent: Don't send 'plan ready' while the nutritionist has taken over the chat",
     "The meal or workout plan ready message should not arrive during a nutritionist takeover, only after the chat is handed back to the agent.",
     ["UF58 (13 Oct, feedback, Chid)"], "Pending decision", []),
    ("Agent: Ask more about completed workouts (how much, how long, how hard)",
     "Ask whether the workout was fully completed, how long it took, how hard it felt or whether an alternative is needed, plus water intake and quick tips.",
     ["UF25 (7 Oct, traces, Alina)"], "Pending decision", []),
    ("Agent: Multiple-choice answers for photo questions (e.g. how many rotis)",
     "When the agent is unsure about a photo, it could ask with options to tap, for example 'How many rotis? 1, 2, 3, or type your answer'.",
     ["UF21 (7 Oct, WhatsApp, Richa)"], "Discuss with Simrun", []),
    ("Agent: Spot habits and suggest recommendations to the nutritionist",
     "The agent notices habits (for example a daily butter cookie) and shows them to the nutritionist with a recommendation. Track how many are accepted before it recommends to members directly. Agreed on the 16 Oct call.",
     ["UF89 (16 Oct, weekly call, NWS team)"], "No status", []),
    ("Agent: Remind members of their own recurring patterns (e.g. monthly bloating)",
     "If a member has a known pattern, such as bloating every second week of the month, remind them when it comes round so they aren't caught out or discouraged.",
     ["UF55 (10 Oct, onboarding call, Jhuma)"], "Pending decision", []),

    # ---- workouts ----
    ("Workouts: Alternative exercises for a medical condition (e.g. slipped disc)",
     "A member who can't do certain movements because of a condition (for example no forward bends with a slipped disc) should be offered a suitable alternative exercise.",
     ["UF51 (10 Oct, onboarding call, Gouri)"], "Pending decision", []),
    ("Workouts: Adjust the workout when a member reports pain or injury",
     "When a member mentions knee or lower back pain, their workout should be updated to account for it.",
     ["UF52 (10 Oct, onboarding call, Reshma)"], "Pending decision", []),
    ("Workouts: Shorter workouts for busy or travel days",
     "Suggest a shorter workout when a member is travelling or can't fit in the usual 30 to 45 minutes.",
     ["UF53 (10 Oct, onboarding call, Shivani)"], "Pending decision", []),
    ("Workouts: Let members choose their active rest day",
     "The active rest day is fixed as day 7. A member should be able to ask for a different day; once the nutritionist approves, the live workout plan shows it.",
     ["UF63 (14 Oct, WhatsApp and traces, Alina)"], "Pending decision", []),
    ("App: Bring back the old Reboot app's daily meals and workout page",
     "A page with a place to upload each meal and the day's exercise sets, an alternative workout when the set is too hard, and today's workout plan at a glance. The 16 Oct call agreed to bring the old app's workout experience into HEAL.",
     ["UF4 (6 Oct, WhatsApp, Alina)", "UF93 (16 Oct, weekly call, NWS team)"], "Discuss with Simrun", []),

    # ---- member app ----
    ("App: Let members edit their goals mid-programme",
     "Members want to change their goals partway through their programme.",
     ["UF48 (9 Oct, WhatsApp, Alina)"], "Pending decision", []),
    ("App: Let members type while the agent replies (disable only Send)",
     "After sending a message, only the Send button should be disabled, so the member can keep typing while the agent responds.",
     ["UF74 (15 Oct, WhatsApp, Sumedha)"], "Pending decision", []),
    ("App: Organise chat history by week or topic",
     "Make older conversations easy to find: group the chat by week, or let members keep topic folders (for example everything about PCOS). Good to have, likely a later version.",
     ["UF1 (5 Oct, WhatsApp, Richa)"], "Discuss with Simrun, low priority", []),
    ("App: Log Apple Health and Google Health Connect data by default",
     "Log health app data automatically and tell the member. Values entered or edited by hand are marked and flagged to the nutritionist with any difference from the health app data. Agreed on the 16 Oct call.",
     ["UF92 (16 Oct, weekly call, NWS team)"], "No status", []),
    ("App + panel: Upload and read lab reports and blood work",
     "Members or nutritionists upload blood work and other reports as a photo or PDF, the results are stored, and nutritionists can read them. The 16 Oct call planned blood work for Sprint 5, ahead of recipes.",
     ["UF47 (9 Oct, weekly call, Cauvya)", "UF93 (16 Oct, weekly call, NWS team)"], "Pending decision", []),
    ("App: Upload Simrun's HELP kit to plan next day's meals, recipes and workouts",
     "Bring the HELP kit (Sim's Healthy Eating Lifestyle Plan) into the app so members can plan the next day's meals, recipes and workouts.",
     ["UF49 (9 Oct, WhatsApp, Anandita)", "Roadmap (9 Oct)"], "Pending decision",
     [("HELP kit (PDF)", "https://drive.google.com/file/d/1ImsSol5vGBqa_WjsttaowHw6ZYLhriJT/view?usp=drive_link")]),

    # ---- nutritionist panel ----
    ("Panel: See a member's whole day of meals with photos in one view",
     "'At a glance' only shows a text summary on hover. Add a view button that opens all of that day's meals together, with the photos.",
     ["UF46 (9 Oct, weekly call, Cauvya)"], "Pending decision", []),
    ("Panel: Nutritionist can change a member's calorie target",
     "Now: let the nutritionist change a member's calorie target from the panel. Later: decide what else nutritionists can edit (for example calories, medical escalations), who has the final say, and how edits flow back to the agent and the patient record.",
     ["UF81 (16 Oct, internal, Khuze)"], "No status", []),
    ("Panel: Nutritionists rate the agent's replies and reply to them",
     "A nutritionist can give each agent reply a thumbs up or down, and use the reply button on the agent's messages, not only the member's. Agreed on the 16 Oct call.",
     ["UF91 (16 Oct, weekly call, NWS team)"], "No status", []),
    ("Panel: Order chats by latest message date and time",
     "Chats in the nutritionist panel should be ordered by date and time.",
     ["UF73 (15 Oct, internal, Khuze)"], "Pending decision", []),
    ("Panel: Show how urgent each escalation is",
     "Escalations should show their urgency, so a nutritionist can tell what needs attention now from what can wait 10 minutes or an hour.",
     ["UF50 (10 Oct, onboarding call, Simrun and Khuze)"], "Pending decision", []),
    ("Panel: Needs attention filters for no logs in 2 to 3 days, and urgency",
     "Add two filters to Needs attention: members who haven't logged for 2 or 3 days, and urgency. Agreed on the 16 Oct call. The sheet notes it is the same as UF79 and UF82, which are in Sprint 3.",
     ["UF86 (16 Oct, weekly call, NWS team)"], "No status", []),
    ("Panel: Nutritionist coverage, weekly check-ins and reminders",
     "Track escalations against check-ins the nutritionist starts. Nutritionists review chats without escalations too, at least weekly per member, and get a reminder when they haven't been in touch with a member for a few days. Agreed on the 16 Oct call.",
     ["UF90 (16 Oct, weekly call, NWS team)"], "No status", []),
    ("Panel: Away message when the nutritionist is offline",
     "If a member asks for the nutritionist outside working hours, tell them the nutritionist will be back in the morning.",
     ["UF11 (6 Oct, WhatsApp, Cauvya)"], "Pending decision", []),
    ("Panel: Nutritionist can chat privately with the agent",
     "Nutritionists want to talk to the agent about a member without the member seeing that conversation.",
     ["UF13 (6 Oct, WhatsApp, Cauvya)"], "Discuss with Simrun", []),

    # ---- internal ----
    ("Internal: Share the list of inactive members with NWS",
     "Share the list of members who have become inactive, so NWS can reach out to them. Agreed on the 16 Oct call.",
     ["UF87 (16 Oct, weekly call, NWS team)"], "No status", []),
    ("Internal: Review NWS's Common Queries and Special Instructions documents",
     "NWS shared two documents: Common Queries & Solutions (sheet) and Special Instructions (doc). Review them and plan how the agent will use the member objections and responses and the instruction lists agreed on the 16 Oct call.",
     ["UF97 (19 Oct, WhatsApp, NWS team)"], "No status",
     [("NWS shared documents (folder)", "https://drive.google.com/drive/folders/1fq2gOI9W4rMPNKtufl3soUTZiX0_2GvL")]),
    ("Internal: Traces in IST and a stronger password",
     "Show times in traces in IST, and protect traces with stronger credentials.",
     ["UF83 (16 Oct, internal, Khuze)"], "No status", []),
    ("Internal: Nutritionist user interviews",
     "Run user interviews with the nutritionists (the interview guide is ready).",
     ["UF85 (16 Oct, internal, Khuze)"], "No status", []),

    # ---- waiting on the client ----
    ("Client input: Waist-to-height ratio as a red/green risk marker",
     "Show the waist-to-height ratio as a risk marker in red and green zones, so members see their risk and stay adherent.",
     ["UF44 (9 Oct, weekly call, Simrun)"], "Client dependency",
     [("Questionnaire training guide", "https://docs.google.com/document/d/1ZFx__YA9j8-lYsQ5ceVd5zCJg47AXnQm3apqFbWILFw/edit?usp=sharing"),
      ("medical symptom tracker.pdf", "https://drive.google.com/file/d/1pQoapmbMkfJuyErdb1uJzy4jwWZmJdlG/view?usp=drive_link")]),
    ("Client input: One HEAL score from Simrun's medical scoring",
     "Reduce the data to one or two key metrics with colour zones, as a single HEAL score. Simrun will share the medical scoring system used at a member's first consultation to base it on.",
     ["UF45 (9 Oct, weekly call, Simrun)"], "Client dependency", []),

    # ---- roadmap ideas ----
    ("Agent: Let the agent look up data itself (read-only, sensitive data hidden)",
     "Let the agent decide what data it needs and fetch it from the database itself, within set limits: read-only queries, with medical details and contact information blocked or masked.",
     ["Roadmap (1 Oct, Khuze)"], "Roadmap, no status", []),
    ("Agent: Web search for deeper answers",
     "Give the agent web search so it can look beyond the member's plan and history to answer with more depth.",
     ["Roadmap (1 Oct, Khuze)"], "Roadmap, no status", []),
    ("Agent: Fetch recipes from Simrun's website",
     "Let the agent find recipes on Simrun's site, either ones the member asks for or ones that match the ingredients they have, and share a link to the page.",
     ["Roadmap (1 Oct, HEAL member)"], "Roadmap, no status", []),
    ("Agent: Adjust voice and tone to each member",
     "The agent's voice and tone should adapt to how each member responds.",
     ["Roadmap (1 Oct, Khuze)"], "Roadmap, no status", []),
    ("Agent: Learn from feedback and improve its prompts (with human review)",
     "Let the agent learn from thumbs up or down, nutritionist corrections and traces, and refine its own prompts and playbooks, with a human review before any change goes live.",
     ["Roadmap (1 Oct, Khuze)"], "Roadmap, no status", []),
    ("Internal: Trial open-source AI models (e.g. Kimi)",
     "Test open models such as Kimi against the current model on answer quality, speed and cost, and whether hosting them ourselves helps keep data in the country.",
     ["Roadmap (1 Oct, Khuze)"], "Roadmap, no status", []),
    ("Internal: Test Jev in the agent's decision layer",
     "Bring in Jev (TypeSafe) and test what it can do in the agent's decision layer.",
     ["Roadmap (internal team)"], "Roadmap, no status", []),
    ("App: Community chat for members",
     "A community chat section where members across HEAL's plans can talk to each other.",
     ["Roadmap (1 Oct, HEAL member)"], "Roadmap, no status", []),
]


def build():
    items, order = {}, []
    for i, (title, summary, sources, status, links) in enumerate(ITEMS, 1):
        assert len(title) <= 90, title
        iid = "seeditem%03d" % i
        desc = summary + "\n\nFrom the sheet: " + "; ".join(sources) + "\nSheet status: " + status
        items[iid] = {
            "id": iid, "num": i, "title": title, "description": desc, "priority": "", "day": "",
            "assignees": [], "comments": [], "created": CREATED, "updated": CREATED,
            "attachments": [{"id": "%sa%d" % (iid, k), "type": "link", "name": name, "url": url} for k, (name, url) in enumerate(links, 1)],
        }
        order.append(iid)
    plan = {"version": 0, "nextNum": len(ITEMS) + 1, "items": items, "cols": {"backlog": order, "s4": [], "s5": [], "s6": []}}
    text = json.dumps(plan, ensure_ascii=False, indent=1)
    assert "—" not in text and "–" not in text
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("// The starting plan a new site shows before anyone saves: the pending items of the NWS Roadmap &\n")
        f.write("// feedbacks sheet as of 20 Oct 2026. Generated by dev/build_seed.py; edit that, not this file.\n")
        f.write("export default " + text + ";\n")
    print(len(ITEMS), "items written to", os.path.relpath(OUT))


if __name__ == "__main__":
    build()
