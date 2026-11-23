# devfest-2026-workshop

Workshop codelab: **Building a workshop to build an Angular web app with Firebase AI Logic Server Prompt Template**

## Prerequisites

Install the project dependencies (`@deepakvishwakarma/node-claat` and `serve`):

```bash
npm install
```

*(Alternatively, you can install them globally with `npm install -g @deepakvishwakarma/node-claat serve`.)*

## Build the Codelab from Markdown

The codelab Markdown source is located at `docs/angular-firebase-ai-logic-server-prompt-template.md`.

Run the build script to clean `public/` and compile the Markdown file(s) in `docs/` into static HTML in `public/`:

```bash
npm run build
```

Under the hood, this runs:
1. `npm run clean` (`rm -rf public`) via the `prebuild` hook to remove any stale output.
2. `node-claat --docs docs --output public` to generate the codelab files.

This generates:
- `public/angular-firebase-ai-logic-server-prompt-template/index.html`
- `public/angular-firebase-ai-logic-server-prompt-template/codelab.json`

## Host the Codelab Locally with `serve`

Start the local static server to host the `public` directory:

```bash
npm run serve
```

*(Or run `npx serve public` / `serve public` directly.)*

Then open [http://localhost:3000/angular-firebase-ai-logic-server-prompt-template](http://localhost:3000/angular-firebase-ai-logic-server-prompt-template) in your browser.

Alternatively, to serve the generated codelab directory directly at the root URL:

```bash
npx serve public/angular-firebase-ai-logic-server-prompt-template
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
