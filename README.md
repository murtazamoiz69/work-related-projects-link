# Recipes prototype (Heal)

How recipes could come into the Heal app, two ways, on one page:

1. **Recipes in the menu**: a new left-menu item on the phone, drawn with the Heal phone kit.
   - Search (dish or ingredient) with a filter button beside it.
   - Meal tabs under the search: All, Breakfast, Lunch, Snacks, Dinner, Dessert. Breakfast = On Waking + Pre Breakfast + Breakfast; Snacks = Morning + Evening Snack; Dinner = Dinner + Post Dinner.
   - The filter button opens a bottom sheet: Diet (4 across) and Cuisine (3 across) as equal-width pills, one or more each; Clear in the header; one button "Show N recipes" with a live count.
   - Applied filters: a count badge on the button, and one row under the tabs with the filters as chips on the left ("+N" when they don't fit; tapping one opens the sheet) and the recipe count on the right.
   - A view-only recipe screen: photo, ingredients, nutrition, method.
   - Data: the 1,026 recipes from the old NWS admin panel. Collections (Sim's Family Recipes, Navratri, Ramzan, Rainbow Week, Chutneys & Sauces) aren't filters; search still finds them.
2. **Ask Simi: A vs B**: the same question goes to two Simis side by side, with "What Simi did" under each.
   - **A, the recipe database**: tools `search_recipes` (a weighted word index over name, ingredients, categories, cuisine, diet and method, with diet / category / cuisine filters) and `get_recipe`. Options come back as recipe cards that open the recipe.
   - **B, blog titles plus restricted browsing**: knows only the titles and links of the 264 posts under https://nourishwithsim.com/blogs/recipes/. Tool `open_page`, refused for any address outside that prefix, at most 3 pages per answer.
   - Model: `nvidia/nemotron-3-ultra-550b-a55b` on NVIDIA NIM, plain neutral voice.

## How it's built

| Path | What |
|---|---|
| `site/index.html` | The page: phone screens, filters, the Simi comparison |
| `site/engine.js` | Runs in the browser: loads the data, searches it, and runs Simi's tool loop |
| `site/data/recipes.json` | The 1,026 recipes (text split into ingredients / nutrition / method) |
| `site/data/blog-titles.json` | Titles and links of the blog's recipe posts (titles only) |
| `site/kit/` | The Heal phone kit (CSS + JS) |
| `netlify/edge-functions/llm.js` | `/api/llm`: one call to NVIDIA NIM. Holds the key; the browser never sees it |
| `netlify/edge-functions/page.js` | `/api/page`: opens one blog page, only under the recipes prefix |
| `dev/local_server.py` | Runs the same site and the same two APIs on your machine |
| `dev/build_data.py` | Rebuilds `site/data` and `site/kit` from the NWS workspace |

Edge functions, not regular functions, because a Simi call can take longer than a regular function's 10 seconds; an edge function has 40 seconds to start its answer.

## Host it on Netlify

1. Netlify: **Add new site → Import an existing project → GitHub**, pick `work-related-projects-link`, branch **`recipes`**.
2. Build settings come from `netlify.toml` (publish `site`, edge functions in `netlify/edge-functions`). Leave the build command empty.
3. **Site configuration → Environment variables → Add a variable**: `NVIDIA_API_KEY` = your NIM key. Optional: `NIM_MODEL` to try another model.
4. Deploy (or **Deploys → Trigger deploy** after adding the variable). Every push to `recipes` redeploys.

Check: open `https://<your-site>.netlify.app/api/llm` in a browser; it should show `{"model": "..."}`. If Simi says "NVIDIA_API_KEY is not set on this site", the variable is missing or the site wasn't redeployed after adding it.

The site is public with no passcode: anyone with the link can read the recipes and make Simi calls on the key.

## Run it locally

Put the key in `.env` (not committed):

```
NVIDIA_API_KEY=nvapi-...
```

Then `python dev/local_server.py` and open http://localhost:8830.
