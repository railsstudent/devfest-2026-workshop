import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { marked } from 'marked';

const docsDir = join(process.cwd(), 'docs');
const outputDir = join(process.cwd(), 'public');

const STEP_DIVIDER = /\n<!--\s*-+\s*-->\s*\n/;

function parseMetadata(headerBlock) {
  const meta = {};
  for (const line of headerBlock.split('\n')) {
    const match = line.match(/^([a-zA-Z\s]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '-');
      meta[key] = match[2].trim();
    }
  }
  return meta;
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatHeadingHtml(str) {
  return escapeHtml(str).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function transformCallouts(html) {
  return html
    .replace(
      /<blockquote>\s*<p>aside\s+(positive|negative)(?:<\/p>\s*|\s*\n?\s*)/gi,
      (match, type) => {
        const kind = type.toLowerCase();
        return match.includes('</p>')
          ? `<aside class="callout callout-${kind}">`
          : `<aside class="callout callout-${kind}"><p>`;
      }
    )
    .replace(
      /<aside class="callout callout-(positive|negative)">([\s\S]*?)<\/blockquote>/g,
      '<aside class="callout callout-$1">$2</aside>'
    );
}

function parseCodelab(raw, fallbackId) {
  const sections = raw.split(STEP_DIVIDER);
  const intro = sections.shift() || '';

  const titleMatch = intro.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : fallbackId;
  const metaBlock = titleMatch ? intro.slice(0, titleMatch.index) : intro;
  const meta = parseMetadata(metaBlock);
  meta.id = meta.id || fallbackId;
  meta.title = title;

  const steps = sections.map((section, index) => {
    const lines = section.trim().split('\n');
    let label = `Step ${index + 1}`;
    let duration = 0;

    if (lines[0]?.startsWith('## ')) {
      label = lines.shift().replace(/^##\s+/, '').trim();
    }
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift();
    }
    if (lines[0] && /^Duration:\s*/i.test(lines[0])) {
      const parsed = Number(lines.shift().replace(/^Duration:\s*/i, '').trim());
      if (!Number.isNaN(parsed)) duration = parsed;
    }

    const bodyHtml = transformCallouts(marked(lines.join('\n').trim()));
    return { index, label, duration, bodyHtml };
  });

  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
  return { meta, steps, totalDuration };
}

function renderHtml({ meta, steps, totalDuration }) {
  const navItems = steps
    .map(
      (s, i) => `
        <button class="step-nav-item${i === 0 ? ' active' : ''}" data-step="${i}" type="button">
          <span class="step-num">${i + 1}</span>
          <span class="step-label">${escapeHtml(s.label.replaceAll('`', ''))}</span>
        </button>`
    )
    .join('\n');

  const stepPanels = steps
    .map(
      (s, i) => `
      <section class="step-panel${i === 0 ? ' active' : ''}" data-step="${i}">
        <div class="step-header">
          <h2>${i + 1}. ${formatHeadingHtml(s.label)}</h2>
          ${s.duration ? `<span class="step-duration">Estimated duration: ${s.duration} min</span>` : ''}
        </div>
        <div class="step-body">
          ${s.bodyHtml}
        </div>
      </section>`
    )
    .join('\n');

  const feedbackLink = meta['feedback-link'] || '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <style>
    :root {
      --bg: #f8f9fa;
      --surface: #ffffff;
      --border: #dadce0;
      --text: #202124;
      --muted: #5f6368;
      --primary: #1a73e8;
      --primary-soft: #e8f0fe;
      --code-bg: #f1f3f4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.65;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 24px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .topbar-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
    }
    .topbar-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 0.875rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .topbar-meta a {
      color: var(--primary);
      text-decoration: none;
    }
    .layout {
      display: grid;
      grid-template-columns: 360px minmax(0, 1fr);
      max-width: 1360px;
      margin: 0 auto;
      gap: 24px;
      padding: 24px;
      align-items: start;
    }
    .sidebar {
      position: sticky;
      top: 72px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .step-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      text-align: left;
      padding: 10px 12px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--text);
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .step-nav-item:hover {
      background: var(--bg);
    }
    .step-nav-item.active {
      background: var(--primary-soft);
      color: var(--primary);
      font-weight: 600;
    }
    .step-num {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: var(--bg);
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .step-nav-item.active .step-num {
      background: var(--primary);
      color: #ffffff;
    }
    .content-area {
      min-width: 0;
    }
    .step-panel {
      display: none;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px 32px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .step-panel.active {
      display: block;
    }
    .step-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding-bottom: 14px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .step-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .step-duration {
      display: inline-block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-soft);
      padding: 4px 12px;
      border-radius: 999px;
    }
    .step-body h3 {
      margin-top: 24px;
      margin-bottom: 10px;
      font-size: 1.15rem;
    }
    .step-body a {
      color: var(--primary);
    }
    .step-body img {
      display: block;
      margin: 16px 0;
      max-width: 100%;
      height: auto;
    }
    .step-body code,
    .step-header h2 code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .callout {
      margin: 16px 0;
      padding: 14px 18px;
      border-radius: 8px;
      border-left: 4px solid var(--primary);
      background: var(--primary-soft);
    }
    .callout > :first-child {
      margin-top: 0;
    }
    .callout > :last-child {
      margin-bottom: 0;
    }
    .callout-positive {
      border-left-color: #1e8e3e;
      background: #e6f4ea;
    }
    .callout-negative {
      border-left-color: #ea8600;
      background: #fef7e0;
    }
    .code-wrapper {
      position: relative;
      margin: 14px 0 20px;
    }
    .code-wrapper pre {
      margin: 0;
      padding: 16px 76px 16px 16px;
      background: #1e293b;
      color: #f8fafc;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.875rem;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .code-wrapper pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: inherit;
    }
    .copy-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 5px 10px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
    }
    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.22);
    }
    .step-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
    }
    .nav-btn {
      padding: 10px 18px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 0.92rem;
      font-weight: 500;
      cursor: pointer;
    }
    .nav-btn.primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
    }
    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    @media (max-width: 860px) {
      .layout {
        grid-template-columns: 1fr;
        padding: 14px;
      }
      .sidebar {
        position: static;
      }
      .step-panel {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <h1 class="topbar-title">${escapeHtml(meta.title)}</h1>
    <div class="topbar-meta">
      ${totalDuration ? `<span>Total: ~${totalDuration} min</span>` : ''}
      ${feedbackLink ? `<a href="${escapeHtml(feedbackLink)}" target="_blank" rel="noopener">GitHub Repo</a>` : ''}
    </div>
  </header>

  <main class="layout">
    <nav class="sidebar" aria-label="Workshop Steps">
      ${navItems}
    </nav>

    <div class="content-area">
      ${stepPanels}
      <div class="step-footer">
        <button id="prev-btn" class="nav-btn" type="button">Previous</button>
        <button id="next-btn" class="nav-btn primary" type="button">Next</button>
      </div>
    </div>
  </main>

  <script>
    (function () {
      const navItems = Array.from(document.querySelectorAll('.step-nav-item'));
      const panels = Array.from(document.querySelectorAll('.step-panel'));
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      let current = 0;

      function showStep(index, updateHash = true) {
        if (index < 0 || index >= panels.length) return;
        current = index;
        navItems.forEach((el, i) => el.classList.toggle('active', i === index));
        panels.forEach((el, i) => el.classList.toggle('active', i === index));
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === panels.length - 1;
        if (updateHash) {
          history.replaceState(null, '', '#' + index);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      navItems.forEach((btn, i) => btn.addEventListener('click', () => showStep(i)));
      prevBtn.addEventListener('click', () => showStep(current - 1));
      nextBtn.addEventListener('click', () => showStep(current + 1));

      // Wrap every <pre> block and add a one-click Copy button
      document.querySelectorAll('.step-body pre').forEach((pre) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', async () => {
          const text = pre.innerText;
          await navigator.clipboard.writeText(text);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
        });
        wrapper.appendChild(copyBtn);
      });

      const initialHash = Number(window.location.hash.replace('#', ''));
      showStep(Number.isInteger(initialHash) && initialHash >= 0 && initialHash < panels.length ? initialHash : 0, false);
    })();
  </script>
</body>
</html>
`;
}

mkdirSync(outputDir, { recursive: true });
const mdFiles = readdirSync(docsDir).filter((f) => f.endsWith('.md'));

const codelabIds = [];
for (const file of mdFiles) {
  const raw = readFileSync(join(docsDir, file), 'utf8');
  const fallbackId = basename(file, '.md');
  const codelab = parseCodelab(raw, fallbackId);
  const outDir = join(outputDir, codelab.meta.id);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), renderHtml(codelab));
  codelabIds.push(codelab.meta.id);
  console.log(`✅ Built ${codelab.meta.id} (${codelab.steps.length} steps)`);
}

if (codelabIds.length > 0) {
  const primary = codelabIds[0];
  writeFileSync(
    join(outputDir, 'index.html'),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=./${primary}/">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="./${primary}/">${primary}</a>...</p>
</body>
</html>
`
  );
}
