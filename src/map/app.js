/**
 * The map: the whole site as one embedding plot.
 *
 * Layout, colours and solid edges come from ml.json (see scripts/map). Opening
 * a node renders its content (content.json) into a card attached to it; links
 * between pages become jumps between nodes. Nothing here moves a point.
 */
import * as d3 from "d3";
import { buildGraph } from "./data.js";
import CONTENT_JSON from "./content.json";
import ML_JSON from "./ml.json";

const { nodes, links, byId, ctf } = buildGraph();


  /* =================================================================
     Layout comes from ml.json, computed offline (scratchpad ml.py):
     MiniLM embeddings -> UMAP positions, Leiden clusters on the kNN graph
     for colour, mutual kNN in 384-D for the solid edges. Nothing here
     moves a point; hand-drawn links are a separate, dashed layer.
     ================================================================= */
  const PALETTE = ["#cfe08a", "#38b7da", "#f2896b", "#86b2ff", "#e8485f", "#f2a7c3", "#e7c07c", "#dcdcdc", "#c9a27e", "#9fd6c2"];
  const R = [2.6, 4, 6, 9];
  let CONTENT = null, ML = null, CL = [];
  let simEdges = [], authored = [], adj = new Map();
  const sats = new Map();
  links.forEach((l) => { l.source = byId.get(l.source); l.target = byId.get(l.target); });

  function addSatellites() {
    nodes.filter((n) => n.page).forEach((hub) => {
      const page = CONTENT[hub.id];
      if (!page) return;
      const secs = page.sections.slice();
      if (CONTENT.roles[hub.id]) secs.push(Object.assign({}, CONTENT.roles[hub.id], { h: "My role" }));
      if (secs.length < 2) { hub.inline = secs; return; }
      const list = secs.map((s, i) => {
        const n = { id: hub.id + "--" + s.id, title: s.h, topics: hub.topics, size: 1, sat: true, parent: hub, idx: i, blocks: s.blocks };
        nodes.push(n); byId.set(n.id, n);
        links.push({ source: hub, target: n, rel: "Section of " + hub.title });
        return n;
      });
      sats.set(hub.id, list);
    });
  }
  function relOf(l) {
    if (l.why) return l.why;
    if (l.rel) return l.rel;
    const t = l.target.id;
    if (/^k\d/.test(t)) return "Next kit generation";
    if (/^a\d/.test(t)) return "Next course activity";
    if (/^p\d/.test(t)) return "A picoCTF category";
    if ((l.source.seq && l.target.seq) || t === "s0") return "Next on the FRCMOB timeline";
    return null;
  }
  function applyML() {
    CL = ML.clusters.map((c, i) => Object.assign({}, c, { color: PALETTE[i % PALETTE.length], name: c.terms.join(" · ") }));
    const us = nodes.map((n) => ML.nodes[n.id] && ML.nodes[n.id].u).filter(Boolean);
    const x0 = d3.min(us, (u) => u[0]), y0 = d3.min(us, (u) => u[1]);
    const s = Math.min(1000 / (d3.max(us, (u) => u[0]) - x0), 700 / (d3.max(us, (u) => u[1]) - y0));
    nodes.forEach((n) => {
      const m = ML.nodes[n.id];
      if (!m) { n.missing = true; return; }
      Object.assign(n, { u: m.u, x: (m.u[0] - x0) * s, y: (m.u[1] - y0) * s, cluster: m.c, color: CL[m.c].color, r: R[n.size], nn: m.nn });
    });
    for (let i = nodes.length - 1; i >= 0; i--) if (nodes[i].missing) { byId.delete(nodes[i].id); nodes.splice(i, 1); }
    simEdges = ML.edges.map(([a, b, c]) => ({ source: byId.get(a), target: byId.get(b), cos: c, sim: true })).filter((e) => e.source && e.target);
    authored = links.filter((l) => l.source && l.target && byId.has(l.source.id) && byId.has(l.target.id));
    authored.forEach((l) => { l.reason = relOf(l); l.label = l.reason || "Linked by hand"; });
    adj = new Map(nodes.map((n) => [n.id, new Set()]));
    simEdges.concat(authored).forEach((l) => { adj.get(l.source.id).add(l.target.id); adj.get(l.target.id).add(l.source.id); });
  }

  /* =================================================================
     Canvas rendering
     ================================================================= */
  const canvas = document.getElementById("graph");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  let W = 0, H = 0, dpr = 1, t = d3.zoomIdentity;
  let hover = null, hoverLink = null, open = null, focusCluster = null, showAuthored = false, ready = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = () => W <= 720;
  const anims = [];
  let raf = 0;

  function rgba(hex, a) { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; }
  const P = (n) => [n.x * t.k + t.x, n.y * t.k + t.y];
  const rad = (n) => n.r * Math.max(0.7, Math.min(t.k, 2.2));
  function lit(n) {
    const f = open || hover;
    if (f) return n === f || adj.get(f.id).has(n.id);
    if (focusCluster !== null) return n.cluster === focusCluster;
    return true;
  }
  const authoredVisible = (l) => showAuthored || (open || hover) && (l.source === (open || hover) || l.target === (open || hover));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    draw();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#06070a"; ctx.fillRect(0, 0, W, H);
    let step = 26 * t.k; while (step < 14) step *= 2;
    const ox = ((t.x % step) + step) % step, oy = ((t.y % step) + step) % step;
    ctx.fillStyle = "#1b2a52";
    for (let x = ox; x < W; x += step) for (let y = oy; y < H; y += step) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
    if (!ready) {
      ctx.fillStyle = "#6f7889"; ctx.font = "13px 'Schibsted Grotesk', sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Plotting…", W / 2, H / 2); ctx.textAlign = "start"; return;
    }

    const f = open || hover;
    const focus = f || focusCluster !== null;
    ctx.lineCap = "round";
    const edge = (a, b, alpha, width, dash) => {
      const [x1, y1] = P(a), [x2, y2] = P(b);
      if (a.color === b.color) ctx.strokeStyle = rgba(a.color, alpha);
      else { const g = ctx.createLinearGradient(x1, y1, x2, y2); g.addColorStop(0, rgba(a.color, alpha)); g.addColorStop(1, rgba(b.color, alpha)); ctx.strokeStyle = g; }
      ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    // similarity: solid, stronger for closer pairs
    simEdges.forEach((l) => {
      const touch = f && (l.source === f || l.target === f);
      const base = 0.08 + 0.3 * Math.max(0, Math.min(1, (l.cos - 0.35) / 0.45));
      const inCl = focusCluster !== null && l.source.cluster === focusCluster && l.target.cluster === focusCluster;
      const a = l === hoverLink ? 1 : touch ? 0.9 : f ? 0.03 : focusCluster !== null ? (inCl ? base + 0.15 : 0.03) : base;
      edge(l.source, l.target, a, l === hoverLink ? 2.4 : touch ? 1.6 : 0.8);
    });
    // hand-drawn: dashed, only when asked for or around the focused node
    authored.forEach((l) => {
      if (!authoredVisible(l)) return;
      const touch = f && (l.source === f || l.target === f);
      edge(l.source, l.target, l === hoverLink ? 1 : touch ? 0.75 : 0.28, l === hoverLink ? 2 : 1.1, [3, 4]);
    });
    ctx.setLineDash([]);

    const now = performance.now();
    anims.forEach((a) => {
      const p = Math.min(1, (now - a.t0) / a.dur), e = 1 - Math.pow(1 - p, 3);
      a.paths.forEach(([from, to]) => {
        const [x1, y1] = P(from), [x2, y2] = P(to);
        ctx.fillStyle = rgba(to.color, 1 - p * 0.6);
        ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * e, y1 + (y2 - y1) * e, 2.6, 0, Math.PI * 2); ctx.fill();
      });
      const [x, y] = P(a.ring);
      ctx.strokeStyle = rgba(a.ring.color, 1 - p); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, rad(a.ring) + 4 + p * 34, 0, Math.PI * 2); ctx.stroke();
    });

    nodes.forEach((n) => {
      const [x, y] = P(n), r = rad(n), on = lit(n);
      ctx.globalAlpha = on ? 1 : 0.13;
      ctx.fillStyle = rgba(n.color, n.size >= 3 ? 0.95 : 0.82);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (n.size >= 2 || n.sat) { ctx.strokeStyle = rgba("#ffffff", n.sat ? 0.32 : 0.55); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, Math.PI * 2); ctx.stroke(); }
      if (n === open) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });

    // labels never overlap and never run off-screen: cluster tags first, then nodes by priority
    const taken = [];
    const free = (a, b, c, d) => !taken.some((r) => a < r[2] && c > r[0] && b < r[3] && d > r[1]);
    // project names are reserved before cluster tags so a tag never hides one
    const reserved = new Set();
    if (!f) {
      ctx.font = "500 13px 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif";
      nodes.filter((n) => n.size >= 3 && (focusCluster === null || n.cluster === focusCluster)).forEach((n) => {
        const [x, y] = P(n), w = ctx.measureText(n.title).width, tx = x + rad(n) + 7;
        if (tx < 4 || tx + w > W - 4 || !free(tx - 2, y - 9, tx + w + 2, y + 9)) return;
        taken.push([tx - 2, y - 9, tx + w + 2, y + 9]); reserved.add(n);
      });
    }
    if (!f) {
      ctx.font = "500 11px 'JetBrains Mono', ui-monospace, Menlo, monospace"; ctx.textBaseline = "middle";
      CL.forEach((c) => {
        // above the bulk of the cluster (15th percentile), not above its furthest outlier
        const m = nodes.filter((n) => n.cluster === c.id);
        const ys = m.map((n) => n.y).sort((a, b) => a - b);
        const label = narrow() ? c.terms[0] : c.name;
        const w = ctx.measureText(label).width + 12;
        let x = d3.mean(m, (n) => n.x) * t.k + t.x;
        x = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, x));
        const y0 = d3.quantile(ys, 0.15) * t.k + t.y - 18;
        const y = [0, -22, 22, -44, 44].map((d) => y0 + d).find((yy) => free(x - w / 2 - 2, yy - 11, x + w / 2 + 2, yy + 11));
        if (y === undefined) return;
        taken.push([x - w / 2 - 2, y - 11, x + w / 2 + 2, y + 11]);
        ctx.globalAlpha = focusCluster !== null && focusCluster !== c.id ? 0.25 : 1;
        ctx.fillStyle = "#2a62e8"; ctx.fillRect(x - w / 2, y - 9, w, 18);
        ctx.fillStyle = "#f4f7ff"; ctx.textAlign = "center"; ctx.fillText(label, x, y + 0.5); ctx.textAlign = "start"; ctx.globalAlpha = 1;
      });
    }
    const cand = nodes.filter((n) => {
      if (focus && !lit(n)) return false;
      if (f) return true;
      return n.size >= 3 || (n.size === 2 && t.k > 1.3) || t.k > 2.2;
    }).sort((a, b) => (b === f) - (a === f) || b.size - a.size);
    ctx.textBaseline = "middle";
    cand.forEach((n) => {
      const [x, y] = P(n), r = rad(n);
      ctx.font = (n.size >= 3 ? "500 13px " : "400 12px ") + "'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif";
      const w = ctx.measureText(n.title).width, tx = x + r + 7;
      if (!reserved.has(n)) {
        if (n !== f && (!free(tx - 2, y - 9, tx + w + 2, y + 9) || tx < 4 || tx + w > W - 4)) return;
        taken.push([tx - 2, y - 9, tx + w + 2, y + 9]);
      }
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(6,7,10,0.88)"; ctx.strokeText(n.title, tx, y);
      ctx.fillStyle = n === open ? "#ffffff" : n.size >= 3 || n.sat ? "#eef1f6" : "#b7bfcc"; ctx.fillText(n.title, tx, y);
    });

    if (open && !$("card").hidden) {
      const [x, y] = P(open), r = rad(open);
      const cr = $("card").getBoundingClientRect(), ar = $("app").getBoundingClientRect();
      const cx = narrow() ? Math.min(Math.max(x, cr.left - ar.left + 30), cr.right - ar.left - 30) : cr.left - ar.left;
      const cy = narrow() ? cr.top - ar.top : Math.min(Math.max(y, cr.top - ar.top + 30), cr.bottom - ar.top - 30);
      ctx.strokeStyle = rgba(open.color, 0.9); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + (narrow() ? 0 : r + 6), y + (narrow() ? r + 6 : 0));
      if (narrow()) ctx.bezierCurveTo(x, (y + cy) / 2, cx, (y + cy) / 2, cx, cy);
      else ctx.bezierCurveTo((x + cx) / 2, y, (x + cx) / 2, cy, cx, cy);
      ctx.stroke();
      ctx.fillStyle = open.color; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  function tick() {
    const now = performance.now();
    for (let i = anims.length - 1; i >= 0; i--) if (now - anims[i].t0 >= anims[i].dur) anims.splice(i, 1);
    draw();
    raf = anims.length ? requestAnimationFrame(tick) : 0;
  }
  function pulse(n) {
    if (reduce) return;
    anims.push({ t0: performance.now(), dur: 900, ring: n, paths: [...adj.get(n.id)].map((id) => [n, byId.get(id)]) });
    if (!raf) raf = requestAnimationFrame(tick);
  }

  /* =================================================================
     Camera
     ================================================================= */
  const zoom = d3.zoom().scaleExtent([0.3, 6]).on("zoom", (e) => { t = e.transform; positionTag(); draw(); hideHint(); });
  const sel = d3.select(canvas).call(zoom).on("dblclick.zoom", null);
  const go = (tr, ms) => (reduce || !ms ? sel : sel.transition().duration(ms).ease(d3.easeCubicInOut)).call(zoom.transform, tr);
  function cardBox() {
    if (narrow()) return { x0: 16, x1: W - 16, y0: 56, y1: card.classList.contains("full") ? 56 + 60 : H * 0.4 - 8 };
    const cw = Math.min($("card").classList.contains("wide") ? 1024 : 464, W - 32);
    return { x0: 16, x1: W - cw - 32, y0: 120, y1: H - 24 };
  }
  function fitBox(x0, x1, y0, y1, v, maxK, ms) {
    const labelPad = narrow() ? 60 : 150;
    const k = Math.max(0.3, Math.min(maxK, (v.x1 - v.x0 - labelPad) / Math.max(x1 - x0, 1), (v.y1 - v.y0) / Math.max(y1 - y0, 1)));
    const cx = (v.x0 + v.x1 - labelPad) / 2, cy = (v.y0 + v.y1) / 2;
    go(d3.zoomIdentity.translate(cx, cy).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2), ms);
  }
  function fit(ms) {
    // on phones the map starts below the intro, whatever height it wraps to
    const introBottom = document.querySelector(".intro").getBoundingClientRect().bottom - $("app").getBoundingClientRect().top;
    const v = { x0: 16, x1: W - 16, y0: narrow() ? introBottom + 40 : 36, y1: H - (narrow() ? 104 : 110) };
    fitBox(d3.min(nodes, (n) => n.x) - 30, d3.max(nodes, (n) => n.x) + 30, d3.min(nodes, (n) => n.y) - 40, d3.max(nodes, (n) => n.y) + 20, v, 1.8, ms);
  }
  function frameOn(n) {
    const pts = [n, ...[...adj.get(n.id)].map((id) => byId.get(id))];
    const pad = 24;
    fitBox(d3.min(pts, (p) => p.x) - pad, d3.max(pts, (p) => p.x) + pad, d3.min(pts, (p) => p.y) - pad, d3.max(pts, (p) => p.y) + pad, cardBox(), 2.6, 750);
  }

  /* =================================================================
     Hover, edge reasons, clicks
     ================================================================= */
  const tag = $("hover-tag");
  function pick(px, py, tol = 8) {
    let best = null, bd = Infinity;
    nodes.forEach((n) => { const [x, y] = P(n), d = Math.hypot(px - x, py - y); if (d < rad(n) + tol && d < bd) { bd = d; best = n; } });
    return best;
  }
  function pickLink(px, py) {
    let best = null, bd = 5;
    simEdges.concat(authored.filter(authoredVisible)).forEach((l) => {
      const [x1, y1] = P(l.source), [x2, y2] = P(l.target);
      const dx = x2 - x1, dy = y2 - y1, len = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len));
      const d = Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy));
      if (d < bd && u > 0.08 && u < 0.92) { bd = d; best = l; }
    });
    return best;
  }
  let tagAt = null;
  function positionTag() {
    if (hover) {
      const [x, y] = P(hover);
      tag.className = "hover-tag"; tag.replaceChildren();
      const b = document.createElement("b"); b.textContent = hover.title;
      tag.append(b, document.createTextNode(`(${hover.u[0].toFixed(2)}, ${hover.u[1].toFixed(2)})`));
      tag.style.left = x + rad(hover) + 2 + "px"; tag.style.top = y - 24 + "px"; tag.hidden = false;
    } else if (hoverLink && tagAt) {
      tag.className = "hover-tag why";
      tag.textContent = hoverLink.sim ? `Close in meaning · cosine similarity ${hoverLink.cos.toFixed(2)}` : hoverLink.label;
      tag.style.left = tagAt[0] + "px"; tag.style.top = tagAt[1] - 22 + "px"; tag.hidden = false;
    } else tag.hidden = true;
  }
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || !ready) return;
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const n = pick(px, py), l = n ? null : pickLink(px, py);
    tagAt = [px, py];
    if (n !== hover || l !== hoverLink) { hover = n; hoverLink = l; canvas.classList.toggle("is-pointing", !!n); draw(); }
    positionTag();
  });
  canvas.addEventListener("pointerleave", () => { hover = null; hoverLink = null; positionTag(); draw(); });
  sel.on("click", (e) => {
    if (!ready) return;
    const r = canvas.getBoundingClientRect();
    const n = pick(e.clientX - r.left, e.clientY - r.top, e.pointerType === "touch" ? 22 : 8);
    if (n) openNode(n); else if (open) closeAll();
  });

  /* =================================================================
     Rendering a node's content into its card
     ================================================================= */
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function blocksHTML(bl, ctxNode) {
    return (bl || []).map((b) => {
      switch (b.t) {
        case "p": return `<p class="${b.lede ? "lede" : ""}">${b.html}</p>`;
        case "note": return `<p class="note">${b.html}</p>`;
        case "h3": return `<h3>${esc(b.text)}</h3>`;
        case "label": return `<p class="label">${esc(b.text)}</p>`;
        case "ul": return `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
        case "math": return `<div class="math math-display">${b.html}</div>`;
        case "fig": return `<figure><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">${b.cap || b.label ? `<figcaption>${b.label ? `<b>${esc(b.label)}</b>` : ""}${esc(b.cap)}</figcaption>` : ""}</figure>`;
        case "kv": return `<dl>${b.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
        case "details": return `<details><summary>${esc(b.s)}</summary><div class="content">${blocksHTML(b.blocks, ctxNode)}</div></details>`;
        case "table": return `<div class="tablewrap"><table>${b.cap ? `<caption>${esc(b.cap)}</caption>` : ""}${b.rows.map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`).join("")}</table></div>`;
        case "pipeline": return `<ol class="stages">${(CONTENT.pipelines[b.id] || []).map((s) => `<li><span class="n">${esc(s.n)}</span><b>${esc(s.title)}</b><span>${esc(s.detail)}</span>${s.note ? `<small>${esc(s.note)}</small>` : ""}</li>`).join("")}</ol>`;
        case "widget": return widgetSlot(b.name, ctxNode);
        default: return "";
      }
    }).join("");
  }
  function widgetSlot(name, ctxNode) {
    if (name === "spot" && !(ctxNode && ctxNode.id === "spot")) return `<div class="teaser"><span>Before reading on, try the job the labels were meant to do.</span><button class="btn primary" type="button" data-go="spot">Play Spot the robots</button></div>`;
    if (name === "qv" && !(ctxNode && ctxNode.id === "qv")) return `<div class="teaser"><span>Try it: subdivide a Brownian path and watch the sum.</span><button class="btn primary" type="button" data-go="qv">Open the demo</button></div>`;
    if (["spot", "qv", "season", "metrics", "ctf"].includes(name)) return `<div data-widget="${name}"></div>`;
    return `<div data-legacy-slot="${esc(name)}"></div>`;
  }
  const clusterChip = (n) => `<span class="tchip"><span class="swatch" style="background:${n.color}"></span>${esc(CL[n.cluster].name)}</span>`;
  const linkOf = (a, b) => authored.find((l) => (l.source === a && l.target === b) || (l.source === b && l.target === a));
  function nnHTML(n) {
    return `<p class="sec-h">Nearest by meaning <button type="button" class="info" data-method aria-label="How similarity is measured">?</button></p><ul class="nn">${n.nn.map(([id, c]) => {
      const m = byId.get(id); if (!m) return "";
      return `<li><button type="button" data-go="${esc(id)}"><span class="swatch" style="background:${m.color}"></span><span class="nn-t">${esc(m.sat ? m.parent.title + " › " + m.title : m.title)}</span><span class="nn-c">${c.toFixed(2)}</span></button></li>`;
    }).join("")}</ul>`;
  }
  function authoredHTML(n) {
    const ls = authored.filter((l) => l.source === n || l.target === n).filter((l) => !(l.rel && l.rel.startsWith("Section of")));
    if (!ls.length) return "";
    return `<p class="sec-h">Linked by hand</p><ul class="links">${ls.map((l) => {
      const m = l.source === n ? l.target : l.source;
      return `<li><button type="button" data-go="${esc(m.id)}"><span class="swatch" style="background:${m.color}"></span>${esc(m.title)}</button>${l.reason ? `<span class="why">${esc(l.reason)}</span>` : ""}</li>`;
    }).join("")}</ul>`;
  }
  function cardHTML(n) {
    const out = [];
    if (n.sat) {
      out.push(`<div class="chips">${clusterChip(n)}</div><h2>${esc(n.title)}</h2><p class="when">${esc(n.parent.title)} · part ${n.idx + 1} of ${sats.get(n.parent.id).length}</p>`);
      out.push(`<div class="content">${blocksHTML(n.blocks, n)}</div>`);
      if (n.id === "frcmob--season" && !n.blocks.some((b) => b.t === "widget")) out.push(`<div data-widget="season"></div>`);
      const list = sats.get(n.parent.id), prev = list[n.idx - 1], next = list[n.idx + 1];
      out.push(`<div class="pager">${prev ? `<button type="button" data-go="${prev.id}"><span>Previous</span>${esc(prev.title)}</button>` : ""}${next ? `<button type="button" class="next" data-go="${next.id}"><span>Next</span>${esc(next.title)}</button>` : `<button type="button" class="next" data-go="${n.parent.id}"><span>Back to</span>${esc(n.parent.title)}</button>`}</div>`);
      out.push(nnHTML(n));
      return out.join("");
    }
    out.push(`<div class="chips">${clusterChip(n)}</div><h2>${esc(n.title)}</h2>${n.when ? `<p class="when">${esc(n.when)}</p>` : ""}`);
    const page = CONTENT && CONTENT[n.id];
    const parts = [];
    if (n.hero && !(page && JSON.stringify(page).includes(n.hero))) parts.push(`<figure><img src="${esc(n.hero)}" alt="" loading="lazy"></figure>`);
    if (n.body) parts.push(`<p class="lede">${esc(n.body)}</p>`);
    if (n.contact) parts.push(contactHTML());
    if (page) parts.push(blocksHTML(page.head, n));
    if (n.inline) n.inline.forEach((s) => { if (s.h && s.h !== "Biography") parts.push(`<h3>${esc(s.h)}</h3>`); parts.push(blocksHTML(s.blocks, n)); });
    if (CONTENT.roles[n.id] && !sats.has(n.id)) parts.push(blocksHTML(CONTENT.roles[n.id].blocks, n));
    const key = { pico: "picoCTF 2026", cyberp: "CyberPatriot XVIII" }[n.id];
    if (key && CONTENT.comps[key]) parts.push(`<p>${esc(CONTENT.comps[key])}</p>`);
    if (n.widget) parts.push(`<div data-widget="${n.widget}"></div>`);
    if (n.actions) parts.push(`<div class="row">${n.actions.map(([l, u]) => `<a class="btn" href="${u}" target="_blank" rel="noopener">${esc(l)}</a>`).join("")}</div>`);
    out.push(`<div class="content">${parts.join("")}</div>`);
    if (n.sec && byId.get(n.sec) && byId.get(n.sec) !== n) {
      const s = byId.get(n.sec);
      out.push(`<p class="sec-h">The full story</p><ul class="links"><li><button type="button" data-go="${s.id}"><span class="swatch" style="background:${s.color}"></span>${esc(s.sat ? s.parent.title + " › " + s.title : s.title)}</button></li></ul>`);
    }
    const inside = sats.get(n.id);
    if (inside) out.push(`<p class="sec-h">Inside · ${inside.length} parts, each its own point on the map</p><ul class="inside">${inside.map((s) => `<li><button type="button" data-go="${s.id}"><span class="dot" style="background:${s.color}"></span>${esc(s.title)}</button></li>`).join("")}</ul>`);
    out.push(nnHTML(n));
    out.push(authoredHTML(n));
    return out.join("");
  }
  function contactHTML() {
    const R = "";
    return `<p class="lede">If you're working on machine learning, robotics, security, or technical education and there's overlap with what I do, I'd like to hear about it. I answer everything that isn't spam.</p>
      <dl><dt>Email</dt><dd><span class="email" id="email">jamalmammadzada13@gmail.com</span> <button class="copy" type="button" data-copy="email">Copy</button></dd>
      <dt>GitHub</dt><dd><a href="https://github.com/jam2342" target="_blank" rel="noopener">github.com/jam2342</a></dd>
      <dt>Course</dt><dd><a href="https://www.udemy.com/course/practical-cryptography-for-developers-and-qa-engineers/" target="_blank" rel="noopener">Practical Cryptography on Udemy</a></dd>
      <dt>Location</dt><dd>Allen, Texas. Remote, or in person around Dallas–Fort Worth.</dd>
      <dt>Résumé</dt><dd><a href="${R}Jamal_Mammadzada_Resume.pdf" target="_blank" rel="noopener">PDF</a> · <a href="${R}Jamal_Mammadzada_Resume_Visual.pdf" target="_blank" rel="noopener">visual PDF</a> · <a href="${R}Jamal_Mammadzada_Resume.docx" target="_blank" rel="noopener">Word</a></dd></dl>
      <h3>Worth writing about</h3>
      <p><strong>Research and internships.</strong> Programs, labs, or teams working on machine learning, computer vision, or applied mathematics. I'm a high school student, and I'm aware that narrows things. I'd still rather ask.</p>
      <p><strong>Robotics.</strong> Scouting and match analysis, or anything involving vision on a competition field. If you run an FRC team and want to talk about what FRCMOB does, I'm happy to.</p>
      <p><strong>Technical education.</strong> Curriculum, robot kits, or bringing a camp somewhere. Eaglets runs free programs for grades 3 to 8 and is always looking at partnerships.</p>
      <p><strong>Collaboration.</strong> Students or organizations working on something adjacent. The projects here are mostly solo, and that's not by preference.</p>`;
  }
  function methodHTML() {
    const m = ML.method, c = m.checks;
    const sens = Object.entries(c.leiden_sensitivity).map(([k, v]) => { const [kk, r] = k.split("_"); return `<tr><td>${kk.slice(1)}</td><td>${r.slice(1)}</td><td>${v.clusters}</td><td>${v.ari_vs_chosen.toFixed(2)}</td></tr>`; }).join("");
    return `<div class="chips"><span class="tchip">Methods</span></div><h2>How this map was made</h2>
      <div class="content">
      <p class="lede">Every dot is a piece of this site: a project, a section of a case study, a fact, a day in a season log. Each one's text was turned into a vector by a small language model, and the map is drawn from those vectors. Nobody placed the dots by hand.</p>
      <ul>
        <li><strong>Embedding.</strong> ${esc(m.model)}, run locally. ${m.docs} items, split into ${m.chunks} chunks of about ${m.chunk_tokens} tokens; a long item is the token-weighted mean of its chunks.</li>
        <li><strong>Position.</strong> UMAP from ${m.dims} dimensions to 2 (cosine, ${m.umap.n_neighbors} neighbours, min_dist ${m.umap.min_dist}, seed ${m.umap.seed}). Positions suggest local similarity. Distances between clusters don't mean much.</li>
        <li><strong>Colour.</strong> ${esc(m.clusters.algorithm)} communities on the ${esc(m.clusters.graph)} graph in the original ${m.dims}-D space, not on the 2-D picture.</li>
        <li><strong>Solid lines.</strong> Mutual nearest neighbours (k = 5) by cosine similarity in ${m.dims}-D. Hover a line for its score.</li>
        <li><strong>Dashed lines.</strong> Links I drew myself: sections of a project, timelines, and connections I think matter. They aren't used for layout or colour.</li>
        <li><strong>Cluster names.</strong> ${esc(m.naming)}. They are the words that set each cluster apart, not themes I chose.</li>
        <li><strong>Coordinate tags.</strong> Hover a dot to see its raw UMAP coordinates.</li>
      </ul>
      <h3>Checks</h3>
      <dl>
        <dt>Trustworthiness</dt><dd>${c.trustworthiness_k10.toFixed(3)} (k = 10; 1.0 means the 2-D picture adds no false neighbours)</dd>
        <dt>Neighbours kept</dt><dd>${Math.round(c.neighbour_preservation_k10 * 100)}% of each point's 10 nearest neighbours in ${m.dims}-D are also its 10 nearest on screen</dd>
        <dt>Seed stability</dt><dd>${Object.entries(c.umap_seed_overlap).map(([s, v]) => `seed ${s}: ${Math.round(v * 100)}%`).join(", ")} of on-screen neighbourhoods match seed ${m.umap.seed}</dd>
      </dl>
      <details><summary>Cluster sensitivity</summary><div class="content"><p>Leiden re-run with other neighbourhood sizes and resolutions, compared with the map's clustering by adjusted Rand index (1.0 = identical).</p><div class="tablewrap"><table><tr><th>k</th><th>Resolution</th><th>Clusters</th><th>ARI</th></tr>${sens}</table></div></div></details>
      <details><summary>Versions and corpus</summary><div class="content"><dl>${Object.entries(m.versions).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}<dt>Corpus hash</dt><dd><code>${esc(m.corpus_sha256_16)}</code></dd></dl></div></details>
      <h3>The clusters it found</h3>
      <ul class="links">${CL.map((cl) => `<li><button type="button" data-cluster="${cl.id}"><span class="swatch" style="background:${cl.color}"></span>${esc(cl.name)}</button><span class="why">${cl.size} items, most typical: ${cl.representative.map((id) => esc((byId.get(id) || {}).title || id)).join(", ")}</span></li>`).join("")}</ul>
      </div>`;
  }

  /* =================================================================
     Opening, closing, history
     ================================================================= */
  const card = $("card"), scroller = $("card-scroll");
  function crumbs(n) {
    const parts = [`<button type="button" data-home>Map</button>`];
    if (n && n.sat) parts.push("/", `<button type="button" data-go="${n.parent.id}">${esc(n.parent.title)}</button>`);
    parts.push("/", `<span class="here">${esc(n ? n.title : "How this map was made")}</span>`);
    return parts.join(" ");
  }
  // The original interactive figures are real Astro components rendered once into
  // an off-screen store (so their scripts initialise), then moved into a card
  // when needed and parked again before the card's content is replaced.
  const store = document.getElementById("legacy-store");
  function parkLegacy() { card.querySelectorAll("[data-legacy]").forEach((el) => store.append(el)); }
  $("expand").addEventListener("click", () => {
    const full = !card.classList.contains("full");
    card.classList.toggle("full", full);
    $("expand").setAttribute("aria-expanded", String(full));
    $("expand").textContent = full ? "Shrink" : "Expand";
    if (open) frameOn(open);
    draw();
  });
  function showCard(html, color, wide) {
    const was = !card.hidden;
    parkLegacy();
    card.style.setProperty("--node", color);
    card.classList.toggle("wide", !!wide);
    scroller.innerHTML = html; scroller.scrollTop = 0;
    mountWidgets(scroller);
    card.hidden = false; $("app").classList.add("has-card");
    if (!was) { card.classList.remove("opening"); void card.offsetWidth; card.classList.add("opening"); }
  }
  function openNode(n, opts) {
    opts = opts || {};
    if (typeof n === "string") n = byId.get(n);
    if (!n || !ready) return;
    hideHint();
    open = n; hover = null; tag.hidden = true;
    $("crumbs").innerHTML = crumbs(n);
    showCard(cardHTML(n), n.color, n.wide);
    updateTourBar();
    frameOn(n);
    pulse(n);
    if (!opts.noHistory) { try { history.pushState({ id: n.id }, "", "#" + n.id); } catch (e) {} }
    if (!opts.keepFocus) $("close").focus({ preventScroll: true });
    draw();
  }
  function openMethod(opts) {
    opts = opts || {};
    if (!ready) return;
    open = null; tour = -1; $("tourbar").hidden = true;
    $("crumbs").innerHTML = crumbs(null);
    showCard(methodHTML(), "#2a62e8", false);
    if (!opts.noHistory) { try { history.pushState({ id: "method" }, "", "#method"); } catch (e) {} }
    fit(650); draw();
  }
  function closeAll(opts) {
    opts = opts || {};
    parkLegacy();
    open = null; card.hidden = true; $("app").classList.remove("has-card");
    tour = -1;
    if (!opts.noHistory) { try { history.pushState({}, "", location.pathname + location.search); } catch (e) {} }
    if (!opts.stay) fit(650);
    draw();
  }
  $("close").addEventListener("click", () => closeAll());
  $("home").addEventListener("click", () => closeAll());
  window.addEventListener("popstate", () => route({ noHistory: true }));
  function route(opts) {
    const id = location.hash.slice(1);
    if (id === "method") openMethod(opts);
    else if (id && resolve(id)) openNode(resolve(id), opts);
    else closeAll(Object.assign({ stay: false }, opts));
  }
  card.addEventListener("click", (e) => {
    const goEl = e.target.closest("[data-go]"), nl = e.target.closest("a[data-node]"), home = e.target.closest("[data-home]"), cp = e.target.closest("[data-copy]");
    const meth = e.target.closest("[data-method]"), clu = e.target.closest("[data-cluster]");
    if (goEl) { e.preventDefault(); openNode(goEl.dataset.go); }
    else if (nl) { e.preventDefault(); const id = resolve(nl.dataset.node); if (id) openNode(id); }
    else if (home) closeAll();
    else if (meth) openMethod();
    else if (clu) { closeAll({ stay: true }); setCluster(+clu.dataset.cluster); fit(650); }
    else if (cp) {
      const text = $(cp.dataset.copy).textContent;
      const done = () => { cp.textContent = "Copied"; setTimeout(() => (cp.textContent = "Copy"), 1600); };
      try { navigator.clipboard.writeText(text).then(done, () => selectText(cp.dataset.copy)); } catch (err) { selectText(cp.dataset.copy); }
    }
  });
  function selectText(id) { const r = document.createRange(); r.selectNodeContents($(id)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  function resolve(id) {
    if (byId.has(id)) return id;
    const [hub, frag] = id.split("--");
    if (frag && sats.has(hub)) {
      const hit = sats.get(hub).find((s) => s.id === id || (s.blocks || []).some((b) => b.t === "h3" && b.text.toLowerCase().includes(frag)));
      if (hit) return hit.id;
    }
    return byId.has(hub) ? hub : null;
  }
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === "Escape") {
      if (!$("list").hidden) closeList();
      else if (open && open.sat) openNode(open.parent);
      else if (!card.hidden) closeAll();
    }
    if (e.key === "/" && !typing) { e.preventDefault(); $("q").focus(); }
    if (!typing && open && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const dir = e.key === "ArrowRight" ? 1 : -1;
      if (tour >= 0) { stepTour(dir); return; }
      if (open.sat) { const l = sats.get(open.parent.id)[open.idx + dir]; if (l) openNode(l); }
      else if (dir > 0 && sats.has(open.id)) openNode(sats.get(open.id)[0]);
    }
  });

  /* =================================================================
     Tour
     ================================================================= */
  const TOUR = ["frcmob", "spot", "frcmob--predictions", "hardening", "crypto", "eaglets", "ee", "notetaker", "avmac", "about", "contact"];
  let tour = -1;
  function stepTour(dir) {
    const next = tour + dir;
    if (next < 0) return;
    if (next >= TOUR.length) { closeAll(); return; }
    tour = next; openNode(resolve(TOUR[tour]));
  }
  function updateTourBar() {
    const bar = $("tourbar");
    if (tour < 0 || !open || resolve(TOUR[tour]) !== open.id) { if (open && tour >= 0 && resolve(TOUR[tour]) !== open.id) tour = -1; bar.hidden = true; return; }
    bar.hidden = false;
    $("t-step").textContent = `Tour · ${tour + 1} of ${TOUR.length}`;
    $("t-prev").disabled = tour === 0;
    $("t-next").textContent = tour === TOUR.length - 1 ? "Finish" : "Next";
  }
  $("tour").addEventListener("click", () => { tour = -1; stepTour(1); });
  $("t-next").addEventListener("click", () => stepTour(1));
  $("t-prev").addEventListener("click", () => stepTour(-1));
  $("t-end").addEventListener("click", () => { tour = -1; $("tourbar").hidden = true; });

  /* =================================================================
     Widgets that live inside nodes
     ================================================================= */
  function mountWidgets(root) {
    root.querySelectorAll("[data-legacy-slot]").forEach((slot) => {
      const el = store.querySelector(`[data-legacy="${slot.dataset.legacySlot}"]`);
      if (el) slot.replaceWith(el); else slot.remove();
    });
    root.querySelectorAll("[data-widget]").forEach((el) => {
      const w = el.dataset.widget;
      if (w === "spot") spotGame(el);
      if (w === "qv") qvWidget(el);
      if (w === "season") seasonWidget(el);
      if (w === "metrics") metricsWidget(el);
      if (w === "ctf") ctfWidget(el);
    });
  }

  // Spot the robots: real frames and boxes from the FRCMOB datasets.
  const SPOT = [
    { src: "img/frcmob/spot/frame-1.jpg", event: "2026txhou · Qualification 11", robots: [[50.31, 33.17, 3.12, 9.29, 1, 1], [21.09, 43.43, 5.47, 14.74, 1, 1], [25.27, 40.38, 3.28, 9.29, 1, 1], [67.5, 76.12, 5.86, 21.47, 1, 0], [70.32, 59.12, 5.56, 16.62, 0, 1], [10.14, 62.94, 4.95, 18.91, 0, 1]], extra: [] },
    { src: "img/frcmob/spot/frame-2.jpg", event: "2026txhou · Qualification 16", robots: [[39.45, 34.94, 3.67, 8.97, 1, 1], [69.8, 44.23, 7.58, 18.91, 1, 1], [54.02, 34.94, 4.38, 9.94, 1, 1], [69.69, 47.44, 4.77, 16.35, 1, 0], [54.86, 30.57, 6.32, 13.72, 0, 1], [14.02, 59.61, 5.06, 16.22, 0, 1]], extra: [] },
    { src: "img/frcmob/spot/frame-3.jpg", event: "2026txmca · Qualification 1", robots: [[44.69, 29.01, 5.08, 16.03, 1, 1], [72.42, 30.29, 4.3, 12.5, 1, 1], [60.35, 28.21, 2.58, 8.01, 1, 0], [24.9, 28.94, 3.47, 12.13, 0, 0], [25.49, 26.6, 5.78, 13.23, 0, 1], [37.89, 28.59, 4.84, 9.54, 0, 1]], extra: [] },
    { src: "img/frcmob/spot/frame-4.jpg", event: "2026txhou · Qualification 16", robots: [[44.77, 33.01, 3.59, 9.62, 1, 1], [70.74, 53.53, 5.0, 17.31, 1, 1], [24.02, 36.86, 3.36, 9.62, 1, 1], [56.13, 33.17, 4.92, 10.58, 1, 1], [18.92, 50.59, 6.1, 15.98, 0, 1], [36.79, 33.27, 5.35, 10.72, 0, 1]], extra: [] },
    { src: "img/frcmob/spot/frame-5.jpg", event: "2026txhou · Qualification 16", robots: [[30.94, 51.92, 5.78, 17.63, 1, 1], [40.98, 35.58, 3.52, 8.97, 1, 1], [71.21, 44.71, 6.02, 14.74, 1, 1], [22.11, 39.85, 4.46, 10.11, 0, 1], [37.53, 36.25, 3.65, 9.52, 0, 1], [69.44, 51.16, 4.99, 13.1, 0, 0]], extra: [[37.65, 35.63, 6.86, 10.28]] },
  ];
  const SECONDS = 20;
  function spotGame(el) {
    let fi = 0, taps = [], phase = "ready", t0 = 0, timer = 0, view = "you";
    const totals = { you: 0, label: 0, v4: 0, all: 0 };
    el.className = "w";
    el.innerHTML = `<div class="w-head"><b>Spot the robots</b><span data-k="count"></span></div>
      <p style="margin:0;color:var(--ink-2);font-size:.9rem">Real match frames from 2026 Texas events. You get ${SECONDS} seconds per frame: click every robot you can find.</p>
      <div class="spot-scroll"><div class="spot-stage" data-k="stage"><img data-k="img" alt="" draggable="false"><div data-k="layer"></div><div class="gate" data-k="gate"><button class="btn primary" type="button" data-k="start">Start · ${SECONDS} s</button></div></div></div>
      <p class="spot-pan">Swipe sideways to see the whole field.</p>
      <div class="timer"><i data-k="fill"></i></div>
      <div class="row" data-k="playrow"><span data-k="marks" style="color:var(--ink-3);font-size:.85rem">0 marked</span><button class="btn" type="button" data-k="done" disabled>Done</button></div>
      <div data-k="reveal" hidden style="display:grid;gap:10px">
        <div class="views" role="group" aria-label="Compare"><button type="button" data-view="you" aria-pressed="true">You</button><button type="button" data-view="label" aria-pressed="false">Training labels</button><button type="button" data-view="v4" aria-pressed="false">Detector v4</button></div>
        <div class="tally" data-k="tally"></div>
        <p data-k="legend" style="margin:0;color:var(--ink-2);font-size:.88rem"></p>
        <div class="row"><button class="btn primary" type="button" data-k="next">Next frame</button></div>
      </div>`;
    const q = (k) => el.querySelector(`[data-k="${k}"]`);
    const box = (b, cls) => `<span class="box ${cls}" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"></span>`;
    const inside = (p, b) => p[0] >= b[0] - 1.2 && p[0] <= b[0] + b[2] + 1.2 && p[1] >= b[1] - 2.5 && p[1] <= b[1] + b[3] + 2.5;
    function load() {
      const f = SPOT[fi];
      q("img").src = f.src; q("img").alt = "A broadcast frame from " + f.event + ", looking down the field.";
      q("count").textContent = `Frame ${fi + 1} of ${SPOT.length} · ${f.event}`;
      taps = []; phase = "ready"; view = "you"; render();
      q("gate").hidden = false; q("reveal").hidden = true; q("playrow").hidden = false; q("done").disabled = true; q("fill").style.width = "100%";
      q("start").textContent = fi ? `Start frame ${fi + 1}` : `Start · ${SECONDS} s`;
    }
    function render() {
      const f = SPOT[fi]; let h = "";
      if (phase === "reveal") {
        f.robots.forEach((r) => {
          const found = taps.some((p) => inside(p, r));
          if (view === "you") h += box(r, "truth" + (found ? " found" : ""));
          if (view === "label" && r[4]) h += box(r, "label");
          if (view === "v4" && r[5]) h += box(r, "v4");
        });
        if (view === "v4") f.extra.forEach((b) => (h += box(b, "extra")));
      }
      taps.forEach((p) => { const hit = phase === "reveal" && f.robots.some((r) => inside(p, r)); h += `<span class="tap ${phase === "reveal" ? (hit ? "hit" : "miss") : ""}" style="left:${p[0]}%;top:${p[1]}%"></span>`; });
      q("layer").innerHTML = h;
      q("marks").textContent = taps.length + " marked";
    }
    function finish() {
      if (phase !== "play") return;
      phase = "reveal"; cancelAnimationFrame(timer);
      const f = SPOT[fi];
      const you = f.robots.filter((r) => taps.some((p) => inside(p, r))).length;
      const lab = f.robots.filter((r) => r[4]).length, v4 = f.robots.filter((r) => r[5]).length;
      totals.you += you; totals.label += lab; totals.v4 += v4; totals.all += f.robots.length;
      q("tally").innerHTML = `<span><b>${f.robots.length}</b>robots in the frame</span><span><b>${you}</b>you found</span><span><b>${lab}</b>boxed by the training labels</span><span><b>${v4}</b>found by v4</span>`;
      q("legend").textContent = view === "you" ? "White boxes are every robot. Green rings are your hits; orange rings missed." : "";
      q("playrow").hidden = true; q("reveal").hidden = false;
      const last = fi === SPOT.length - 1;
      q("next").textContent = last ? "See the totals" : "Next frame";
      render();
    }
    function legend() {
      q("legend").textContent = view === "you" ? "White boxes are every robot. Green rings are your hits; orange rings missed."
        : view === "label" ? "Dashed boxes are what v2 learned from. Every robot without one taught the model that robots look like background."
        : "Solid boxes are v4 at its shipped 0.35 cutoff. A dotted box is something it called a robot that isn't one.";
    }
    el.addEventListener("click", (e) => {
      const v = e.target.closest("[data-view]");
      if (v) { view = v.dataset.view; el.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b === v))); legend(); render(); return; }
      const k = e.target.closest("[data-k]"); const key = k && k.dataset.k;
      if (key === "start") {
        phase = "play"; q("gate").hidden = true; q("done").disabled = false; t0 = performance.now();
        const loop = () => {
          const left = Math.max(0, SECONDS - (performance.now() - t0) / 1000);
          q("fill").style.width = (left / SECONDS) * 100 + "%";
          if (left <= 0) finish(); else timer = requestAnimationFrame(loop);
        };
        timer = requestAnimationFrame(loop);
      } else if (key === "done") finish();
      else if (key === "next") {
        if (fi < SPOT.length - 1) { fi++; load(); }
        else {
          q("tally").innerHTML = `<span><b>${totals.all}</b>robots across five frames</span><span><b>${totals.you}</b>you found</span><span><b>${totals.label}</b>boxed by the training labels</span><span><b>${totals.v4}</b>found by v4</span>`;
          q("legend").textContent = "You probably found more robots than the labels did. A model trained on those labels learned the rest were background, which is why recall stalled until the labels were fixed.";
          q("next").textContent = "Play again"; fi = -1;
          q("next").onclick = () => { q("next").onclick = null; fi = 0; Object.keys(totals).forEach((k) => (totals[k] = 0)); load(); };
        }
      } else if (k && key === "stage" || e.target.closest('[data-k="stage"]')) {
        if (phase !== "play") return;
        const r = q("stage").getBoundingClientRect();
        taps.push([((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100]);
        render();
      }
    });
    load();
  }

  // Quadratic variation: the same seeded Brownian path, cut into finer pieces.
  function qvWidget(el) {
    el.className = "w qv";
    el.innerHTML = `<div class="w-head"><b>Quadratic variation</b><span>T = 1</span></div>
      <canvas width="840" height="300" data-k="c" aria-label="A Brownian path and a smooth curve, each split into the chosen number of pieces"></canvas>
      <label style="display:grid;gap:4px;font-size:.86rem;color:var(--ink-2)">Pieces: <b data-k="n" style="color:var(--ink)"></b><input type="range" min="1" max="12" value="4" data-k="s" aria-label="Number of pieces, as a power of two"></label>
      <div class="readout"><span>Brownian path: Σ(ΔW)² = <b data-k="bw"></b></span><span>Smooth curve: Σ(Δf)² = <b data-k="sm"></b></span></div>
      <p style="margin:0;font-size:.86rem;color:var(--ink-3)">Slide right. The smooth curve's sum heads to zero; the Brownian path's settles near 1, the elapsed time.</p>`;
    const q = (k) => el.querySelector(`[data-k="${k}"]`);
    const M = 4096; let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const Wp = [0]; for (let i = 1; i <= M; i++) Wp.push(Wp[i - 1] + gauss() * Math.sqrt(1 / M));
    const fS = (u) => 0.55 * Math.sin(3 * u) + 0.25 * u;
    const c = q("c"), g = c.getContext("2d");
    function update() {
      const kexp = +q("s").value, n = 2 ** kexp, step = M / n;
      let bw = 0, sm = 0;
      for (let i = 0; i < n; i++) { bw += (Wp[(i + 1) * step] - Wp[i * step]) ** 2; sm += (fS((i + 1) / n) - fS(i / n)) ** 2; }
      q("n").textContent = n.toLocaleString(); q("bw").textContent = bw.toFixed(3); q("sm").textContent = sm < 0.001 ? sm.toExponential(1) : sm.toFixed(3);
      const w = c.width, h = c.height, lo = Math.min(...Wp, -0.6) - 0.1, hi = Math.max(...Wp, 0.8) + 0.1;
      const X = (u) => 10 + u * (w - 20), Y = (v) => h - 10 - ((v - lo) / (hi - lo)) * (h - 20);
      g.clearRect(0, 0, w, h);
      g.strokeStyle = "rgba(231,192,124,0.25)"; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= M; i += 2) g[i ? "lineTo" : "moveTo"](X(i / M), Y(Wp[i])); g.stroke();
      g.strokeStyle = "#e7c07c"; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= n; i++) g[i ? "lineTo" : "moveTo"](X(i / n), Y(Wp[i * step])); g.stroke();
      g.strokeStyle = "#86b2ff"; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= n; i++) g[i ? "lineTo" : "moveTo"](X(i / n), Y(fS(i / n))); g.stroke();
      g.fillStyle = "#e7c07c"; g.font = "22px 'Schibsted Grotesk', sans-serif"; g.fillText("Brownian path", 20, 30);
      g.fillStyle = "#86b2ff"; g.fillText("smooth curve", 200, 30);
    }
    q("s").addEventListener("input", update); update();
  }
  function seasonWidget(el) {
    el.className = "w";
    el.innerHTML = `<div class="w-head"><b>Season log</b><span>February to October 2026</span></div><ul class="timeline">${nodes.filter((n) => n.season).map((n) => `<li><button type="button" data-go="${n.id}"><span class="d">${esc(n.when)}</span><span class="t">${esc(n.title)}</span><span class="x">${esc(n.body)}</span></button></li>`).join("")}</ul>`;
  }
  function metricsWidget(el) {
    const rows = [["v1 on its own validation split", 98.0, true], ["v1 on the locked holdout", 69.9], ["v2 on the holdout", 71.7], ["v4 on the holdout", 77.9], ["v4-nano on the holdout", 74.0]];
    el.className = "w";
    el.innerHTML = `<div class="w-head"><b>Detector mAP@50</b><span>Holdout: Einstein 2026, 224 frames</span></div><div class="bars">${rows.map(([l, v, dim]) => `<div class="bar"><span>${esc(l)}</span><span class="track"><i class="${dim ? "dim" : ""}" style="width:${v}%"></i></span><span class="v">${v.toFixed(1)}%</span></div>`).join("")}</div><p style="margin:0;font-size:.84rem;color:var(--ink-3)">The grey bar is the number that looked finished. The others are the ones that decide whether a model ships.</p>`;
  }
  function ctfWidget(el) {
    el.className = "w";
    el.innerHTML = `<div class="w-head"><b>Solved, by category</b><span>70 of 70 · 14,500 points</span></div><div class="bars">${ctf.map(([c, n], i) => `<div class="bar"><button type="button" data-go="p${i}" style="background:none;border:0;padding:0;text-align:left;cursor:pointer;color:var(--ink-2)">${esc(c)}</button><span class="track"><i style="width:100%"></i></span><span class="v">${n}/${n}</span></div>`).join("")}</div>`;
  }

  /* =================================================================
     Cluster keys, hand-drawn toggle, search, list
     ================================================================= */
  const keys = $("keys");
  function setCluster(c) {
    focusCluster = focusCluster === c ? null : c;
    keys.querySelectorAll("[data-c]").forEach((k) => k.setAttribute("aria-pressed", String(+k.dataset.c === focusCluster)));
    draw();
  }
  const STRIP = ["frcmob", "spot", "hardening", "crypto", "eaglets", "frc5417", "notetaker", "avmac", "ee", "ia", "pico", "about", "contact"];
  function buildStrip() {
    $("strip").innerHTML = STRIP.map((id) => byId.get(id)).filter(Boolean).map((n) =>
      `<button type="button" data-go="${n.id}"><span class="swatch" style="background:${n.color}"></span><span class="s-t">${esc(n.title)}</span></button>`).join("");
    $("strip").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) openNode(b.dataset.go); });
  }
  function buildKeys() {
    keys.innerHTML = CL.map((c) => `<button type="button" class="tkey" data-c="${c.id}" aria-pressed="false" style="color:${c.color}"><span class="swatch" style="background:${c.color}"></span><span style="color:var(--ink)">${esc(c.name)}</span><span class="n">${c.size}</span></button>`).join("")
      + `<button type="button" class="tkey toggle" id="authored" aria-pressed="false"><span class="dash"></span><span style="color:var(--ink)">Hand-drawn links</span></button>`;
    keys.addEventListener("click", (e) => {
      const k = e.target.closest("[data-c]");
      if (k) { if (!card.hidden) closeAll({ stay: true }); setCluster(+k.dataset.c); return; }
      if (e.target.closest("#authored")) { showAuthored = !showAuthored; $("authored").setAttribute("aria-pressed", String(showAuthored)); draw(); }
    });
  }

  let index = [];
  function buildIndex() {
    const strip = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const flat = (bl) => (bl || []).map((b) => b.t === "details" ? b.s + " " + flat(b.blocks) : b.t === "ul" ? b.items.join(" ") : b.t === "kv" ? b.rows.flat().join(" ") : (b.html || b.text || b.cap || b.label || "")).join(" ");
    index = nodes.map((n) => {
      let txt = n.body || "";
      if (n.sat) txt += " " + flat(n.blocks);
      else if (CONTENT && CONTENT[n.id]) txt += " " + flat(CONTENT[n.id].head) + " " + (n.inline || []).map((s) => flat(s.blocks)).join(" ");
      return { n, title: n.title, text: strip(txt) };
    });
  }
  const q = $("q"), results = $("results");
  let active = 0, matches = [];
  function renderResults() {
    const s = q.value.trim().toLowerCase();
    matches = s.length < 2 || !ready ? [] : index.map((e) => {
      const ti = e.title.toLowerCase().indexOf(s), bi = e.text.toLowerCase().indexOf(s);
      return ti < 0 && bi < 0 ? null : Object.assign({ score: (ti >= 0 ? 10 : 0) + (e.n.sat ? 1 : e.n.size), bi }, e);
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8);
    active = 0;
    results.innerHTML = matches.map((m, i) => {
      let snip = "";
      if (m.bi >= 0) { const a = Math.max(0, m.bi - 40); snip = (a ? "…" : "") + esc(m.text.slice(a, m.bi)) + "<mark>" + esc(m.text.slice(m.bi, m.bi + s.length)) + "</mark>" + esc(m.text.slice(m.bi + s.length, m.bi + 90)) + "…"; }
      const where = m.n.sat ? m.n.parent.title : CL[m.n.cluster].name;
      return `<li><button type="button" role="option" aria-selected="${i === active}" data-i="${i}"><span class="r-title"><span class="swatch" style="background:${m.n.color}"></span>${esc(m.title)}</span><span class="r-where">${esc(where)}</span>${snip ? `<span class="r-snip">${snip}</span>` : ""}</button></li>`;
    }).join("");
    results.hidden = !matches.length;
  }
  function choose(i) { const m = matches[i]; if (!m) return; q.value = ""; results.hidden = true; openNode(m.n); }
  q.addEventListener("input", renderResults);
  q.addEventListener("focus", renderResults);
  q.addEventListener("keydown", (e) => {
    if (!matches.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); active = (active + (e.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length; results.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-selected", String(i === active))); }
    if (e.key === "Enter") { e.preventDefault(); choose(active); }
  });
  results.addEventListener("mousedown", (e) => { const b = e.target.closest("[data-i]"); if (b) { e.preventDefault(); choose(+b.dataset.i); } });
  q.addEventListener("blur", () => setTimeout(() => (results.hidden = true), 120));

  function openList() {
    if (!ready) return;
    $("list-cols").innerHTML = CL.map((c) => {
      const items = nodes.filter((n) => n.cluster === c.id && !n.sat).sort((a, b) => b.size - a.size || (a.seq || "").localeCompare(b.seq || ""));
      const looseSats = nodes.filter((n) => n.cluster === c.id && n.sat);
      return `<div><h3><span class="swatch" style="background:${c.color}"></span>${esc(c.name)}</h3><ul>${items.map((n) => `<li><button type="button" data-go="${n.id}" class="${n.size >= 3 ? "hub" : ""}">${esc(n.title)}</button></li>`).join("")}${looseSats.map((s) => `<li><button type="button" data-go="${s.id}">${esc(s.parent.title)} › ${esc(s.title)}</button></li>`).join("")}</ul></div>`;
    }).join("");
    $("list").hidden = false; $("close-list").focus();
  }
  function closeList() { $("list").hidden = true; $("open-list").focus(); }
  $("open-list").addEventListener("click", openList);
  $("skip-list").addEventListener("click", (e) => { e.preventDefault(); openList(); });
  $("close-list").addEventListener("click", closeList);
  $("list").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) { $("list").hidden = true; openNode(b.dataset.go); } });
  document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => (b.dataset.open === "method" ? openMethod() : openNode(b.dataset.open))));

  let hinted = false;
  function hideHint() { if (hinted || !ready) return; hinted = true; $("hint").style.opacity = "0"; }

  /* =================================================================
     Boot: draw the empty field, then plot once both files arrive.
     ================================================================= */
  window.addEventListener("resize", () => { resize(); if (open) frameOn(open); else fit(0); });
  resize();
  CONTENT = CONTENT_JSON; ML = ML_JSON;
  addSatellites(); applyML(); buildIndex(); buildKeys(); buildStrip();
  ready = true;
  fit(0);
  if (location.hash.length > 1) route({ noHistory: true, keepFocus: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
