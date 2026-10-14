"""One-time migration: turn the old multi-page Astro site into src/map/content.json.

Kept for the record. It ran on 2026-10-14 against the last build of the old site
(commit 3abe2b4 plus the av-mac work on branch archive/pre-map-wip). Since then
src/map/content.json is the source of truth: edit it directly.

Usage (needs the old site built into dist/): python3 -I extract.py <repo> <out.json>
Each page's own prose is told apart from component internals by Astro's
per-component data-astro-cid-* attribute.
"""
import json, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag

REPO = Path(sys.argv[1])
OUT = Path(sys.argv[2])
DIST = REPO / "dist"

PAGES = {
    "frcmob": "work/frcmob", "hardening": "work/hardening", "crypto": "work/cryptography",
    "eaglets": "work/eaglets", "frc5417": "work/frc5417", "notetaker": "work/notetaker",
    "avmac": "work/avmac", "about": "about",
}
ROUTES = {"/work/frcmob/": "frcmob", "/work/hardening/": "hardening", "/work/cryptography/": "crypto",
          "/work/eaglets/": "eaglets", "/work/frc5417/": "frc5417", "/work/notetaker/": "notetaker",
          "/work/avmac/": "avmac", "/research/": "ee", "/about/": "about", "/contact/": "contact",
          "/experience/": "experience", "/work/": "frcmob", "/": "frcmob"}
WIDGETS = {"spot": "spot", "qv": "qv", "field": "Field tracker", "recall": "Recall grid",
           "season": "Season log", "metrics": "Model metrics", "lab": "Hardening lab",
           "flow": "Meeting flow", "logic": "Robot logic lab", "solv": "Solvability map",
           "sde": "SDE simulator", "bands": "Route bands", "ctf": "picoCTF breakdown"}
images = set()

def cid(tag):
    for k in tag.attrs:
        if k.startswith("data-astro-cid-"):
            return k
    return None

def node_href(href, page):
    if href.startswith("#"):
        return f"{page}--{href[1:]}"
    path, _, frag = href.partition("#")
    target = ROUTES.get(path)
    if not target:
        return None
    return f"{target}--{frag}" if frag and target not in ("ee",) else target

def clean(tag, page):
    """Inner HTML reduced to a safe inline subset; internal links become node links."""
    out = []
    for c in tag.children:
        if isinstance(c, NavigableString):
            out.append(str(c).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            continue
        if not isinstance(c, Tag):
            continue
        name = c.name
        inner = clean(c, page)
        if name == "a":
            href = c.get("href", "")
            nid = node_href(href, page) if not href.startswith(("http", "mailto:")) else None
            if nid:
                out.append(f'<a href="#" data-node="{nid}">{inner}</a>')
            elif href.startswith(("http", "mailto:")):
                out.append(f'<a href="{href}" target="_blank" rel="noopener">{inner}</a>')
            elif href.endswith((".pdf", ".docx")):
                out.append(f'<a href="https://portfolio-wine-three-iox2jn0bx6.vercel.app{href}" target="_blank" rel="noopener">{inner}</a>')
            else:
                out.append(inner)
        elif name in ("em", "strong", "code", "sub", "sup", "b", "i", "small"):
            out.append(f"<{name}>{inner}</{name}>")
        elif name == "br":
            out.append("<br>")
        elif name == "span":
            cls = [k for k in c.get("class", []) if k in ("math", "math-body", "frac", "op", "sqrt")]
            out.append(f'<span class="{" ".join(cls)}">{inner}</span>' if cls else inner)
        else:
            out.append(inner)
    return re.sub(r"\s+", " ", "".join(out)).strip()

def text(tag):
    return re.sub(r"\s+", " ", tag.get_text(" ", strip=True)).strip()

def figure(tag):
    img = tag.find("img")
    if not img:
        return None
    src = img.get("src", "")
    images.add(src)
    cap = tag.find("figcaption")
    label = cap.find(class_=re.compile("fig-label|mono")) if cap else None
    label_text = text(label) if label else ""
    if label:
        label.extract()
    return {"t": "fig", "src": src.lstrip("/"), "alt": img.get("alt", ""), "label": label_text,
            "cap": text(cap) if cap else ""}

ATTR_WIDGETS = {"data-spot": "spot", "data-qv": "qv", "data-tracker": "field", "data-recall-grid": "recall",
                "data-log": "season", "data-hardening-lab": "lab", "data-logic-lab": "logic", "data-solv": "solv",
                "data-sde": "sde", "data-bands": "bands", "data-meeting-lab": "flow"}
CLASS_WIDGETS = {"metrics": "metrics", "ctf": "ctf", "flow": "flow", "spot": "spot"}

def widget_for(tag):
    """Identify an interactive component by its root's data attribute (or class as a fallback)."""
    for a, name in ATTR_WIDGETS.items():
        if tag.has_attr(a):
            return name
    for c in tag.get("class", []):
        if c in CLASS_WIDGETS:
            return CLASS_WIDGETS[c]
    return None

def blocks(container, page, pcid):
    out = []
    for el in container.children:
        if not isinstance(el, Tag):
            continue
        own = cid(el) == pcid
        cls = el.get("class", [])
        if el.name in ("style", "script", "nav") or (el.name == "h2" and el.has_attr("data-title")):
            continue
        if el.name == "h2":
            out.append({"t": "h3", "text": text(el)})
            continue
        if "math-display" in cls:
            out.append({"t": "math", "html": clean(el, page)})
            continue
        if el.name == "figure" and not widget_for(el):
            f = figure(el)
            if f:
                out.append(f)
            continue
        if not own:
            if "pipeline" in cls:
                out.append({"t": "pipeline", "id": el.get("id", "")})
                continue
            if el.name == "section" and "evidence" in cls:
                continue
            w = widget_for(el) or widget_for(el.find(True) or el)
            if w:
                out.append({"t": "widget", "name": w})
                continue
            if el.name in ("p", "ul", "ol", "details", "dl", "table", "h3", "div", "section", "aside", "a"):
                pass  # component-free markup with a foreign cid (e.g. Figure); fall through
            else:
                continue
        if el.name == "h3":
            out.append({"t": "h3", "text": text(el)})
        elif el.name == "p":
            if "mono" in cls:
                out.append({"t": "label", "text": text(el)})
            elif "note" in cls:
                out.append({"t": "note", "html": clean(el, page)})
            elif text(el):
                out.append({"t": "p", "html": clean(el, page), "lede": "lede" in cls})
        elif el.name in ("ul", "ol"):
            items = [clean(li, page) for li in el.find_all("li", recursive=False)]
            if items:
                out.append({"t": "ul", "items": items})
        elif el.name == "details":
            s = el.find("summary")
            body = BeautifulSoup("<div></div>", "html.parser").div
            for c in list(el.children):
                if c is not s:
                    body.append(c.__copy__() if isinstance(c, Tag) else NavigableString(str(c)))
            out.append({"t": "details", "s": text(s) if s else "", "blocks": blocks(body, page, pcid)})
        elif el.name == "dl":
            rows = []
            for d in el.find_all(["div"], recursive=False) or [el]:
                for dt in d.find_all("dt"):
                    dd = dt.find_next_sibling("dd")
                    rows.append([text(dt), clean(dd, page) if dd else ""])
            if rows:
                out.append({"t": "kv", "rows": rows})
        elif el.name == "table":
            cap = el.find("caption")
            rows = [[text(c) for c in tr.find_all(["th", "td"])] for tr in el.find_all("tr")]
            out.append({"t": "table", "cap": text(cap) if cap else "", "rows": rows})
        elif el.name == "img":
            images.add(el.get("src", ""))
            out.append({"t": "fig", "src": el.get("src", "").lstrip("/"), "alt": el.get("alt", ""), "label": "", "cap": ""})
        else:
            out.extend(blocks(el, page, pcid))
    return out

def page_content(key, path):
    soup = BeautifulSoup((DIST / path / "index.html").read_text(), "html.parser")
    main = soup.select_one("main")
    root = main.find(["article"]) or main
    pcid = cid(root.find("section") or root)
    head = root.find("header")
    data = {"head": [], "sections": []}
    if head:
        hc = cid(head)
        data["head"] = [b for b in blocks(head, key, hc) if not (b["t"] == "label")]
    for sec in root.find_all(["section", "nav"], recursive=True):
        if sec.find_parent("section"):
            continue
        h2 = sec.find("h2")
        if not h2 or sec.name == "nav":
            continue
        sid = h2.get("id") or sec.get("aria-labelledby") or re.sub(r"\W+", "-", text(h2).lower())
        h2["data-title"] = "1"
        bl = blocks(sec, key, cid(sec))
        # sections whose h2 sits inside a wrapper div
        data["sections"].append({"id": sid, "h": text(h2), "blocks": bl})
    return data

content = {k: page_content(k, p) for k, p in PAGES.items()}

# Research: two papers plus two closing sections.
rs = BeautifulSoup((DIST / "research/index.html").read_text(), "html.parser").select_one("main")
papers = rs.select("article.paper")
for key, art in zip(("ee", "ia"), papers):
    header = art.find("header")
    kicker = header.find(class_="paper-kicker")
    status = header.find(class_="status")
    header.extract()
    data = {"head": [{"t": "kv", "rows": [["Paper", text(kicker)], ["Status", text(status)]]}], "sections": []}
    data["head"].extend(blocks(art, "ee", cid(art)))
    content[key] = data
for sec in rs.find_all("section", recursive=False) or rs.find_all("section"):
    lab = sec.get("aria-labelledby")
    if lab == "math":
        content["smt"] = {"head": blocks(sec, "ee", cid(sec)), "sections": []}
    if lab == "where":
        content["ee"]["sections"].append({"id": "where", "h": "Where this connects", "blocks": blocks(sec, "ee", cid(sec))})

# Experience: roles attach to existing nodes; education and skills get their own.
ex = BeautifulSoup((DIST / "experience/index.html").read_text(), "html.parser").select_one("main")
ROLE_NODE = {"Eaglets": "eaglets", "CyberPatriot": "cyberp", "Allen Eagle Robotics": "frc5417",
             "FIRST Global": "tunisia", "United Stream": "usf", "iCode": "icode"}
roles = {}
for li in ex.select("li.role"):
    org = text(li.find(class_="role-org"))
    nid = next((v for k, v in ROLE_NODE.items() if org.startswith(k)), None)
    if not nid:
        continue
    pts = [clean(p, "experience") for p in li.select(".role-points > li")]
    credits = [text(c) for c in li.select(".credits > li")]
    dates = " · ".join(text(d) for d in li.select(".role-side p"))
    bl = [{"t": "kv", "rows": [["Role", text(li.find(class_="role-title"))], ["Dates", dates]]}, {"t": "ul", "items": pts}]
    if credits:
        bl.append({"t": "label", "text": "Team results"})
        bl.append({"t": "ul", "items": credits})
    roles[nid] = {"id": "role", "h": "Role", "blocks": bl}
content["roles"] = roles
edu = ex.select_one("section[aria-labelledby=edu]")
content["school"] = {"head": [b for b in blocks(edu, "experience", cid(edu))], "sections": []}
sk = ex.select_one("section[aria-labelledby=skills]")
content["skills"] = {"head": [b for b in blocks(sk, "experience", cid(sk))], "sections": []}
comps = ex.select("section[aria-labelledby=comps] li.comp")
content["comps"] = {text(c.find("h2")): text(c.find(class_="comp-detail")) for c in comps}

# Pipelines live in each page's frontmatter, so read them from source.
def stages(src):
    s = (REPO / src).read_text()
    out = []
    for m in re.finditer(r'n: "(\d+)",\s*title: "([^"]+)",\s*detail:\s*"((?:[^"\\]|\\.)*)"(?:,\s*note:\s*(["`])((?:[^"`\\]|\\.)*)\4)?', s):
        out.append({"n": m.group(1), "title": m.group(2), "detail": m.group(3), "note": m.group(5) or ""})
    return out
content["pipelines"] = {"vision-pipeline": stages("src/pages/work/frcmob.astro"),
                        "avmac-pipeline": stages("src/pages/work/avmac.astro")}
for st in content["pipelines"]["vision-pipeline"]:
    st["note"] = (st["note"].replace("${detector.v4.cutoff}", "0.35").replace("${detector.v4n.cutoff}", "0.25")
                  .replace("${pct(detector.v4.map50)}", "77.9%").replace("${pct(detector.v4n.map50)}", "74.0%"))

src = (REPO / "src/pages/work/eaglets.astro").read_text()
kit_blocks = [{"t": "p", "html": "Each version came out of something that went wrong at a camp."}]
for m in re.finditer(r'v: "([^"]+)",\s*title: "([^"]+)",(?:\s*image: "([^"]+)",\s*alt:\s*"([^"]+)",)?\s*detail:\s*"([^"]+)"', src):
    v, title, img, alt, detail = m.groups()
    kit_blocks.append({"t": "h3", "text": f"{v} · {title}"})
    if img:
        images.add(img)
        kit_blocks.append({"t": "fig", "src": img.lstrip("/"), "alt": alt, "label": "", "cap": ""})
    kit_blocks.append({"t": "p", "html": detail})
lin = next(x for x in content["eaglets"]["sections"] if x["id"] == "lineage")
lin["blocks"] = kit_blocks + [b for b in lin["blocks"] if b["t"] == "note"]

content["images"] = sorted(i.lstrip("/") for i in images if i.startswith("/img/"))
OUT.write_text(json.dumps(content, ensure_ascii=False))
print("pages:", {k: (len(v["head"]), [s["h"] for s in v["sections"]]) for k, v in content.items() if isinstance(v, dict) and "head" in v})
print("roles:", list(roles)); print("pipelines:", {k: len(v) for k, v in content["pipelines"].items()})
print("images:", len(content["images"]), "bytes:", OUT.stat().st_size)
