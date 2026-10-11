# site/

The project page for **micro** — a static landing page, no build step.

```
site/
├── index.html          the whole page
└── assets/
    ├── style.css       design tokens, layout, both colour themes
    └── app.js          theme, highlighting, tabs, pipeline, charts
```

Plain HTML, CSS and ES5-compatible JavaScript. Open `index.html` over any static
server and it works:

```bash
python3 -m http.server --directory site 8000
```

## Deploying to GitHub Pages

`.github/workflows/pages.yml` publishes `site/` on every push to `dev` that
touches it. The "build" is a copy, plus a check that every local reference still
resolves, every in-page anchor has a target, and no `id` is used twice.

One-time setup in the repository:

> **Settings → Pages → Build and deployment → Source: GitHub Actions**

After that the first push to `dev` publishes the site and the workflow prints
the URL. There is nothing to install and nothing to compile.

The workflow does three things to the copy:

- deletes `site/README.md`, which is repo documentation rather than site content,
- creates `_site/.nojekyll`, so Jekyll stays out of the way if the Pages source
  is ever switched from Actions to a branch,
- runs the reference check, which fails the deploy on a broken asset path, a
  dangling `#anchor`, or a duplicated `id` — `getElementById` returns the first
  match, so a duplicate id silently breaks the script.

### If you prefer a branch instead of Actions

`git subtree push --prefix site origin gh-pages` publishes the same directory
as a branch, with no workflow at all. The two cannot both be the configured
source; pick one and set it under **Settings → Pages**.

### Changing the branch it deploys from

The trigger is `push: branches: [dev]`, because that is where the work happens.
If the project moves to `main`, change that one line.

### Adding a custom domain

Put a `CNAME` file with the hostname in `site/` and point the DNS at
`desvor58.github.io`. The workflow copies everything in `site/`, so the file is
picked up without any other change.

## Where the numbers come from

Everything factual on the page is taken from the repository, not invented:

| on the page          | source                                            |
|----------------------|---------------------------------------------------|
| line counts          | `wc -l` over `src/` and `include/`                 |
| test count           | `tests/` — 191 cases, all passing                  |
| compile timings      | medians in `comp/results.json`                     |
| listings, byte sizes | real output of `bin/microc -Pa`                    |
| status table         | the status table in `README.md`                    |

When any of those change, change them on the page too.

## Changing the look

Both themes live in one place, at the top of `assets/style.css`:

```css
html[data-theme='dark']  { --bg: …; --fg: …; --accent: …; }
html[data-theme='light'] { --bg: …; --fg: …; --accent: …; }
```

The accent colour is `--accent` and its two helpers `--accent-soft` (backgrounds)
and `--accent-line` (borders). The theme choice is stored in `localStorage` under
`micro-theme` and applied before first paint by the inline script in `<head>`.

## Adding a language sample

Code blocks are highlighted at runtime from `data-lang`:

```html
<pre class="code-block"><code data-lang="micro">fun main
start
end</code></pre>
```

Supported today: `micro`, `c`, `asm` (micro's own listing syntax), `bash`. To
add one, extend `RULES` in `assets/app.js` — each entry is a regular expression
with numbered groups and a `render` function that returns HTML.

Escape `<`, `>` and `&` in the sample itself; the highlighter reads
`textContent`, so the browser decodes the entities before the tokeniser sees
them.# desvor58.github.io
# desvor58.github.io
