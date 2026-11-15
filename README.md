# SCOUT — project companion site

Static, single-page companion to the ISBI submission *SCOUT: Scoring with Clinical Vocabulary and Neighbor Distance for OOD Detection in Medical Vision-Language Models*.

## Hosting on GitHub Pages

1. Create a new repository and push the contents of this folder to its root (or to `/docs` if you prefer).
2. In the repo's **Settings → Pages**, set the source branch and folder (`/ (root)` or `/docs`) and save.
3. GitHub will serve `index.html` at `https://<username>.github.io/<repo>/`.

No build step is required — the page is plain HTML/CSS/JS and fetches its data from the local `data/*.json` files at runtime.

## Structure

- `index.html` — the page
- `assets/site.js` — all rendering logic (tables, charts, demo, embeddings)
- `assets/figures/` — real figures (paper Figure 1, t-SNE embeddings, per-image diagnostics, demo sample images)
- `data/results.json` — every number on the page, sourced from the paper's Tables 1–3
- `data/demo_samples.json` — 30 real per-image score rows (seed 42) powering the "Play a random eval image" button
- `data/phase3_*_per_image.csv` — the full per-image exports those 30 rows were sampled from

## Updating numbers

Edit `data/results.json` directly — nothing in `index.html` or `site.js` has hand-typed numbers.
