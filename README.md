# Personal site — Jamal Mammadzada

Static site built with Astro. No analytics, no trackers, no cookies, no backend.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the built site
```

Node 22.12 or newer.

## How the site works

The whole site is one page: a map of everything on it. Every dot is a project,
a section of a write-up, a fact, or a day in a season log. Opening a dot shows
its content in a card attached to it, and links between write-ups jump between
dots. Old URLs such as `/work/frcmob/` redirect to the matching dot
(`astro.config.mjs`).

Where the dots sit isn't hand-placed. Each item's text is embedded with a small
language model, and UMAP, Leiden clustering and nearest-neighbour edges are
computed from those embeddings. See `scripts/map/README.md`, and the "How this
map was made" card on the site.

## Where the content lives

| File | What it holds |
|---|---|
| `src/map/content.json` | All long-form text: every write-up's header and sections, roles, pipelines |
| `src/map/data.js` | The dots: titles, one-line summaries, dates, hand-drawn links and their reasons |
| `src/map/ml.json` | Generated layout (positions, clusters, similarity edges). Don't edit by hand |
| `src/map/app.js` | The map itself: rendering, cards, search, tour, the in-node widgets |
| `src/pages/index.astro` | Page shell, styles, the no-JavaScript text version |
| `src/data/site.ts` | Name, contact details, meta |
| `src/data/model.ts` | Detector evaluation numbers used by the recall grid |

**After changing `content.json` or `data.js`, regenerate the layout** with
`npm run map:docs` followed by `scripts/map/.venv/bin/python -I
scripts/map/ml.py`. New dots have no position until you do.

## Interactive figures

Spot the robots, the quadratic-variation demo, the season log, the detector
metrics and the picoCTF bars are written into `src/map/app.js`. The older
figures are still Astro components in `src/components/` (`FieldTracker`,
`RecallGrid`, `HardeningLab`, `RobotLogicLab`, `MeetingFlow`, `RouteBands`,
`SolvabilityMap`, `SdeSim`). They render once into an off-screen store on the
page and move into a card when its dot opens. Inside a card they always use
their own small-screen layout.

## Résumé

`public/Jamal_Mammadzada_Resume.pdf` and `.docx`. Both are linked from the site.
If you edit the .docx, regenerate the PDF and check it still fits one page:

```bash
soffice --headless --convert-to pdf public/Jamal_Mammadzada_Resume.docx \
  --outdir public/
```

Keep the résumé and `src/map/content.json` in agreement.

## Things to keep true

- **Private repositories stay unlinked.** The hardening framework, cryptography
  capstone, Eaglets site, and Notetaker remain private. FRCMOB is public under
  AGPL-3.0, but model weights, training data, recordings, database contents,
  credentials, and private assessment material stay unpublished.
- **Photographs from camps exclude students unless a release is verified.** The
  Eaglets evidence currently uses hardware-only photographs or crops that do
  not show student faces.
- **The extended essay is not published** while it's awaiting submission.
- Claims on this site were checked against the actual repositories, training
  artifacts, and documents. Don't loosen them without the same evidence.

## Theme

One deliberate dark theme. Colours are tokens on `:root` in
`src/pages/index.astro`. The older figures get the same palette through the
`.legacy` wrapper, with the open dot's colour as their accent.
