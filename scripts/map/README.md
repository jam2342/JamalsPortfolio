# The map pipeline

The site is one map. Where each dot sits, its colour, and the solid lines
between dots are computed from the content, not placed by hand. This folder
holds the code that does that.

```
src/map/data.js   +  src/map/content.json
        │  npm run map:docs
        ▼
scripts/map/docs.json   (every node's text)
        │  scripts/map/ml.py
        ▼
src/map/ml.json         (positions, clusters, similarity edges, checks)
```

`ml.py` embeds each node's text with `all-MiniLM-L6-v2`, splitting long items
into ~200-token chunks and averaging them weighted by length. On the full
384-dimension vectors it then:

- finds clusters with Leiden on the union 10-nearest-neighbour graph (the colours)
- keeps mutual 5-nearest-neighbour pairs as the solid lines
- names each cluster with c-TF-IDF on length-normalised counts

UMAP projects to 2-D for display only, and each run is rotated (or reflected) to line up with the previous `ml.json`, so editing a sentence doesn't flip the whole map. Seeds are fixed, so the same content
gives the same map. The method was reviewed with GPT-6.1 Sol. The page's "How
this map was made" card shows the parameters and the quality checks.

## When to re-run

After any change to `src/map/data.js` (nodes, titles, summaries) or
`src/map/content.json` (page text). If you skip it, new nodes have no position
and the page drops them.

## Setup (once)

```sh
python3 -m venv --system-site-packages scripts/map/.venv
scripts/map/.venv/bin/pip install -r scripts/map/requirements.txt
```

The first run downloads the MiniLM model (about 90 MB) from Hugging Face. After
that it runs offline. No API keys are involved.

## Run

```sh
npm run map:docs
scripts/map/.venv/bin/python -I scripts/map/ml.py
```

`ml.py` prints the clusters it found and the checks (trustworthiness,
neighbour preservation, seed and resolution stability). Read them before
committing a new `ml.json`.

## Writing content

Keep embedded text honest. Don't add the same prefix or boilerplate to many
items: shared wording pulls them together and invents clusters. The first
version of this map made exactly that mistake with the season log.

`extract.py` is the one-time script that moved the old multi-page site into
`content.json`. It's kept for the record and won't run against the current site.
