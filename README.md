# E. Matthew Husband — academic website

Quarto + GitHub Pages source for https://emhusband.github.io/.

## Navigation
Home · Research · Publications · Group · CV

The CV navbar item links directly to `files/matthew-husband-cv.pdf`.

## Content sources
- `publications.bib` is the editable source of truth for publication entries, research-topic tags, DOIs, and publication links.
- `scripts/generate_publications.py` converts the BibTeX bibliography into `generated/publications-list.html` using only the Python standard library.
- `publications.qmd` is a thin page shell that includes the generated publication list; do not hand-edit the generated HTML.
- `research/index.qmd` contains the four research programmes and selected works.
- `group.qmd` contains current/former researchers, collaborative projects, and prospective-researcher information.

To regenerate the publication list locally after editing `publications.bib`:

```bash
python3 scripts/generate_publications.py
```

The GitHub Pages workflow regenerates the publication list automatically before Quarto renders the site.

## Visual assets
- `images/profile.jpg` is the homepage portrait.
- `images/selected-work/` contains the six homepage Selected Work illustrations.
- `js/research-network.js` drives the homepage Research at a Glance network.
- `js/page-header-network.js` drives the shared Research/Publications/Group title backdrops.
- `js/research-programmes.js` and `css/research-programmes.css` drive the four Research programme animations.

## Publishing
`.github/workflows/publish.yml` regenerates Publications, renders Quarto, and deploys `_site` using the GitHub Pages artifact workflow. It runs on pushes to `main` and can also be started manually from the Actions tab.
