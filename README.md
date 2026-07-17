# NWS — Nourish with Sim

Prototype repository for **NWS (Nourish with Sim)**. Contains two prototype tracks that live side by side:

| Folder   | What it is                                      | How to run                     |
|----------|-------------------------------------------------|--------------------------------|
| `react/` | Vite + React prototype (the primary app)        | `cd react && npm run dev`      |
| `html/`  | Standalone static HTML mockups (no build step)  | Open the `.html` file directly |

## React app (`react/`)

Built with [Vite](https://vitejs.dev/) + React.

```bash
cd react
npm install      # first time only
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build -> react/dist
npm run preview  # preview the production build
```

> The React structure / architecture notes will be documented separately (MD file to be added).

## HTML mockups (`html/`)

Plain HTML/CSS/JS mockups with no build step — open any file directly in a browser
(or serve the folder with any static server, e.g. `npx serve html`).

## Repository

- Remote: `gitlab.siamcomputing.com/siamcomputing-projects/prototype/2026/nws/nws-app`
