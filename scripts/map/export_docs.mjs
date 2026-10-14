/**
 * Write every map node's text to scripts/map/docs.json, the input to ml.py.
 *
 * Mirrors what the page itself indexes: a node's own summary, plus its page
 * content (header blocks and any inline sections) or, for a section node, the
 * section's blocks. Section nodes are created the same way the page creates them.
 *
 * Usage: npm run map:docs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildGraph } from "../../src/map/data.js";

const content = JSON.parse(readFileSync(new URL("../../src/map/content.json", import.meta.url), "utf8"));
const { nodes } = buildGraph();

// Sections become their own nodes, exactly as the page does it.
for (const hub of nodes.filter((n) => n.page)) {
  const page = content[hub.id];
  if (!page) continue;
  const secs = page.sections.slice();
  if (content.roles[hub.id]) secs.push({ ...content.roles[hub.id], h: "My role" });
  if (secs.length < 2) { hub.inline = secs; continue; }
  secs.forEach((s, i) => nodes.push({ id: `${hub.id}--${s.id}`, title: s.h, topics: hub.topics, size: 1, sat: true, parent: hub, idx: i, blocks: s.blocks }));
}

const strip = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const flat = (bl) => (bl || []).map((b) =>
  b.t === "details" ? b.s + " " + flat(b.blocks)
  : b.t === "ul" ? b.items.join(" ")
  : b.t === "kv" ? b.rows.flat().join(" ")
  : (b.html || b.text || b.cap || b.label || "")).join(" ");

const docs = nodes.map((n) => {
  let txt = n.body || "";
  if (n.sat) txt += " " + flat(n.blocks);
  else if (content[n.id]) txt += " " + flat(content[n.id].head) + " " + (n.inline || []).map((s) => flat(s.blocks)).join(" ");
  return { id: n.id, title: n.title, text: strip(txt), parent: n.parent ? n.parent.id : null, size: n.size,
           sat: !!n.sat, season: !!n.season, when: n.when || "", topics: n.topics };
});

const out = new URL("./docs.json", import.meta.url);
writeFileSync(out, JSON.stringify(docs, null, 0));
console.log(`${docs.length} documents -> scripts/map/docs.json`);
