# devfest-2026-workshop

Workshop codelab: **Building a workshop to build an Angular web app with Firebase AI Logic Server Prompt Template**

## Prerequisites

Install the project dependencies (`marked` and `serve`):

```bash
npm install
```

## Build the Codelab from Markdown

The codelab Markdown source is located at `docs/angular-firebase-ai-logic-server-prompt-template.md`.

Run the build script to clean `public/` and compile the Markdown file(s) in `docs/` into static HTML in `public/`:

```bash
npm run build
```

Under the hood, this runs:

1. `npm run clean` (`rm -rf public`) via the `prebuild` hook to remove any stale output.
2. `node scripts/build-codelab.mjs` to generate the self-contained codelab HTML from `docs/*.md` (including step navigation and copy buttons on code blocks).
3. `cp -r docs/images public/angular-firebase-ai-logic-server-prompt-template/` via the `postbuild` hook to copy the workshop screenshots into the build output.

This generates:

- `public/index.html` (redirects to `./angular-firebase-ai-logic-server-prompt-template/`)
- `public/angular-firebase-ai-logic-server-prompt-template/index.html`
- `public/angular-firebase-ai-logic-server-prompt-template/images/*`

## Host the Codelab Locally with `serve`

To build and start the local static server in one command:

```bash
npm run preview
```

Or, if you have already run `npm run build`, start the local static server to host the `public` directory:

```bash
npm run serve
```

*(Or run `npx serve public` / `serve public` directly.)*

Then open [http://localhost:3000/angular-firebase-ai-logic-server-prompt-template/](http://localhost:3000/angular-firebase-ai-logic-server-prompt-template/) in your browser.

Alternatively, to serve the generated codelab directory directly at the root URL:

```bash
npx serve public/angular-firebase-ai-logic-server-prompt-template
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
