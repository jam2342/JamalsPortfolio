/**
 * Prefix root-absolute URLs in the built HTML with the deploy base path.
 *
 * Astro's `base` option rewrites the asset paths it generates itself, but
 * links written literally in templates (href="/work/", src="/img/...") are
 * emitted verbatim and would 404 under a subpath deploy. This walks the build
 * output and prefixes those, skipping anything already prefixed, protocol
 * relative, or external.
 *
 * No-op unless BASE_PATH is set, so the Vercel build is untouched.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BASE = process.env.BASE_PATH;
if (!BASE) {
  console.log('base-rewrite: BASE_PATH not set, nothing to do');
  process.exit(0);
}

const base = BASE.replace(/\/$/, '');
// Canonical URLs are absolute, so they need the site origin to be rewritten.
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const DIST = 'dist';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

// href="/x" or src='/x' — but not "//host", not "/base/...", not bare "/"
const ATTR = /(\s(?:href|src|content|poster)\s*=\s*)(["'])\/(?!\/)([^"']*)\2/g;
const SRCSET = /(\ssrcset\s*=\s*)(["'])([^"']+)\2/g;

let files = 0;
let edits = 0;

for await (const file of walk(DIST)) {
  if (extname(file) !== '.html') continue;
  const original = await readFile(file, 'utf8');

  let out = original.replace(ATTR, (m, lead, q, rest) => {
    // href="/" is the home link and must become the project root, not the
    // user root, so it is prefixed like any other path.
    if (rest !== '' && `/${rest}`.startsWith(`${base}/`)) return m;
    edits += 1;
    return `${lead}${q}${base}/${rest}${q}`;
  });

  out = out.replace(SRCSET, (m, lead, q, value) => {
    const fixed = value
      .split(',')
      .map((part) => {
        const t = part.trim();
        if (!t.startsWith('/') || t.startsWith('//') || t.startsWith(`${base}/`)) return part;
        edits += 1;
        return ` ${base}${t}`;
      })
      .join(',');
    return `${lead}${q}${fixed}${q}`;
  });

  // Redirect pages (astro.config.mjs `redirects`): the meta refresh target
  // and the canonical URL are written without the base path.
  out = out.replace(/(<meta http-equiv="refresh" content="\d+;\s*url=)\/(?!\/)([^"]*)"/g, (m, lead, rest) => {
    if (`/${rest}`.startsWith(`${base}/`)) return m;
    edits += 1;
    return `${lead}${base}/${rest}"`;
  });
  if (SITE) {
    out = out.replace(/(<link rel="canonical" href=")([^"]*)"/g, (m, lead, url) => {
      if (!url.startsWith(SITE + '/') || url.startsWith(SITE + base + '/')) return m;
      edits += 1;
      return `${lead}${SITE}${base}${url.slice(SITE.length)}"`;
    });
  }

  if (out !== original) {
    await writeFile(file, out);
    files += 1;
  }
}

console.log(`base-rewrite: prefixed ${edits} URL(s) across ${files} file(s) with "${base}"`);
