"""Lay the map out the way an ML pipeline would: src/map/ml.json.

    scripts/map/docs.json (from `npm run map:docs`) + src/map/content.json -> src/map/ml.json

  MiniLM (all-MiniLM-L6-v2) embeddings, ~200-token chunks, token-weighted mean
  -> union kNN k=10 (cosine, 384-D)  -> Leiden communities (colours)
  -> mutual kNN k=5                  -> solid similarity edges
  -> UMAP 2-D                        -> positions (display only)
  -> document-normalised c-TF-IDF    -> cluster names

Method reviewed with GPT-6.1 Sol. Deterministic: sorted ids, fixed seeds, CPU.
Setup and usage: see scripts/map/README.md.
"""
import hashlib, json, re, sys, platform
import numpy as np

ROOT = __import__("pathlib").Path(__file__).resolve().parents[2]
DOCS, CONTENT, OUT = (sys.argv[1:4] if len(sys.argv) == 4 else
                      (ROOT / "scripts/map/docs.json", ROOT / "src/map/content.json", ROOT / "src/map/ml.json"))
SEED = 42
MODEL = "sentence-transformers/all-MiniLM-L6-v2"

docs = sorted(json.load(open(DOCS)), key=lambda d: d["id"])
content = json.load(open(CONTENT))
by_id = {d["id"]: d for d in docs}

# ---------- 1. the text each node is embedded from (source-supported context only) ----------
def flat(blocks):
    out = []
    for b in blocks or []:
        t = b["t"]
        if t == "details": out += [b["s"], flat(b["blocks"])]
        elif t == "ul": out += b["items"]
        elif t == "kv": out += [" ".join(r) for r in b["rows"]]
        else: out.append(b.get("html") or b.get("text") or b.get("cap") or "")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", " ".join(out))).strip()

EXTRA = {
    "pico": content["comps"].get("picoCTF 2026", ""),
    "cyberp": content["comps"].get("CyberPatriot XVIII", "") + " " + flat(content["roles"].get("cyberp", {}).get("blocks")),
    "icode": flat(content["roles"].get("icode", {}).get("blocks")),
    "usf": flat(content["roles"].get("usf", {}).get("blocks")),
    "tunisia": flat(content["roles"].get("tunisia", {}).get("blocks")),
    "contact": ("Contact. If you're working on machine learning, robotics, security, or technical education and there's overlap, "
                "I'd like to hear about it. Email, GitHub, the Udemy course, résumé. Research and internships in machine learning, "
                "computer vision, or applied mathematics. Robotics scouting and match analysis. Technical education, curriculum, "
                "robot kits, camps. Collaboration with students or organizations."),
}

def doc_text(d):
    i, title, text = d["id"], d["title"], d["text"] or ""
    text = (text + " " + EXTRA.get(i, "")).strip()
    if d["sat"]:
        return f"{by_id[d['parent']]['title']}: {title}", text
    if re.fullmatch(r"s\d+", i): return title, text  # the entry's own words; no shared prefix
    if re.fullmatch(r"a\d+", i):  # titles like "Break the pattern" need their format and subject, not the shared boilerplate
        return f"{title}", text.split(" Runs locally")[0] + " A cryptography exercise."
    if re.fullmatch(r"p\d+", i): return f"{title.split(' ')[0]} {title.split(' ')[1] if title.count(' ') > 1 else ''} challenges", f"picoCTF 2026. {text}"
    if re.fullmatch(r"k\d+", i): return f"Eaglets robot kit: {title}", text
    if d["size"] < 3 and d["when"] and not re.match(r"^[A-Z][a-z]{2} \d", d["when"]):
        return f"{title} ({d['when']})", text  # e.g. "Simulate first (Hardening framework)"
    return title, text

# ---------- 2. embeddings: ~200-token chunks, token-weighted mean, L2 normalised ----------
from sentence_transformers import SentenceTransformer
import torch
torch.manual_seed(SEED)
model = SentenceTransformer(MODEL, device="cpu")
tok = model.tokenizer

def chunks(head, body):
    sents = re.split(r"(?<=[.!?])\s+", body) if body else []
    budget = 200
    out, cur, n = [], [], 0
    for s in sents:
        k = len(tok.tokenize(s))
        if cur and n + k > budget:
            out.append((" ".join(cur), n)); cur, n = [], 0
        cur.append(s); n += k
    if cur: out.append((" ".join(cur), n))
    if not out: out = [("", 1)]
    return [(f"{head}. {c}".strip(), max(w, 1)) for c, w in out]

texts, owners, weights = [], [], []
for idx, d in enumerate(docs):
    head, body = doc_text(d)
    for c, w in chunks(head, body):
        texts.append(c); owners.append(idx); weights.append(w)
E = model.encode(texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False)
X = np.zeros((len(docs), E.shape[1]))
for e, o, w in zip(E, owners, weights): X[o] += w * e
X /= np.linalg.norm(X, axis=1, keepdims=True)
S = X @ X.T
np.fill_diagonal(S, -1)

# ---------- 3. graphs in the original 384-D space ----------
def knn(k): return np.argsort(-S, axis=1)[:, :k]
def union_edges(k):
    nb = knn(k); E_ = {}
    for i in range(len(docs)):
        for j in nb[i]:
            a, b = min(i, j), max(i, j)
            E_[(a, b)] = max(S[a, b], 0.0)
    return E_
nb5 = knn(5)
mutual = sorted({(min(i, j), max(i, j)) for i in range(len(docs)) for j in nb5[i] if i in nb5[j]})

# ---------- 4. Leiden communities on the union kNN graph ----------
import igraph as ig, leidenalg as la
from sklearn.metrics import adjusted_rand_score
def leiden(k, res):
    E_ = union_edges(k)
    g = ig.Graph(n=len(docs), edges=list(E_.keys()))
    g.es["weight"] = list(E_.values())
    p = la.find_partition(g, la.RBConfigurationVertexPartition, weights="weight",
                          resolution_parameter=res, seed=SEED, n_iterations=-1)
    return np.array(p.membership)
labels = leiden(10, 1.0)
stability = {}
for k in (8, 10, 15):
    for res in (0.8, 1.0, 1.2):
        m = leiden(k, res)
        stability[f"k{k}_r{res}"] = {"clusters": int(m.max() + 1), "ari_vs_chosen": round(float(adjusted_rand_score(labels, m)), 3)}

# ---------- 5. UMAP for display ----------
import umap
def project(seed):
    return umap.UMAP(n_components=2, metric="cosine", n_neighbors=15, min_dist=0.25, spread=1.0,
                     init="spectral", n_epochs=1000, random_state=seed, transform_seed=seed, n_jobs=1).fit_transform(X)
Y = project(SEED)
from sklearn.manifold import trustworthiness
trust = float(trustworthiness(X, Y, n_neighbors=10, metric="cosine"))
def nn_sets(P, k=10):
    D = ((P[:, None, :] - P[None, :, :]) ** 2).sum(-1); np.fill_diagonal(D, np.inf)
    return [set(r) for r in np.argsort(D, axis=1)[:, :k]]
hd = [set(r) for r in knn(10)]
ld = nn_sets(Y)
preserve = float(np.mean([len(hd[i] & ld[i]) / 10 for i in range(len(docs))]))
seed_overlap = {}
for s in (7, 2026):
    o = nn_sets(project(s))
    seed_overlap[str(s)] = round(float(np.mean([len(ld[i] & o[i]) / 10 for i in range(len(docs))])), 3)

# ---------- 5b. keep the map's orientation stable between runs ----------
# UMAP's rotation and reflection are arbitrary, so a one-word edit can flip the
# whole picture. Align to the previous layout with an orthogonal Procrustes fit
# (rotation/reflection only, plus centring): no distance changes, so every
# check above still holds.
aligned = None
try:
    prev = json.load(open(OUT))["nodes"]
    common = [i for i, d in enumerate(docs) if d["id"] in prev]
    if len(common) >= 10:
        A = np.array([prev[docs[i]["id"]]["u"] for i in common]); B = Y[common]
        ma, mb = A.mean(0), B.mean(0)
        U_, _, Vt = np.linalg.svd((B - mb).T @ (A - ma))
        R = U_ @ Vt
        Y = (Y - mb) @ R + ma
        aligned = {"to_previous": True, "shared_nodes": len(common),
                   "rms_shift": round(float(np.sqrt(((Y[common] - A) ** 2).sum(1).mean())), 3)}
except FileNotFoundError:
    pass

# ---------- 6. names: doc-normalised c-TF-IDF, terms in >= 2 member docs ----------
from sklearn.feature_extraction.text import CountVectorizer, ENGLISH_STOP_WORDS
stop = set(ENGLISH_STOP_WORDS) | {"jamal", "page", "case", "study", "section", "ve", "don", "isn", "doesn", "didn", "wasn", "won", "ll", "s", "t",
                                  "just", "like", "way", "thing", "things", "got", "make", "makes", "used", "use", "one", "two", "time"}
docs_txt = [" ".join(doc_text(d)) for d in docs]
cv = CountVectorizer(ngram_range=(1, 2), stop_words=list(stop), min_df=2, token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z0-9\-]+\b")
C = cv.fit_transform(docs_txt).toarray().astype(float)
Cn = C / np.maximum(C.sum(1, keepdims=True), 1)
vocab = np.array(cv.get_feature_names_out())
K = labels.max() + 1
tf = np.vstack([Cn[labels == c].sum(0) for c in range(K)])
A = tf.sum(1).mean()
ctfidf = tf * np.log(1 + A / np.maximum(tf.sum(0), 1e-12))
clusters = []
for c in range(K):
    members = np.where(labels == c)[0]
    present = (C[members] > 0).sum(0) >= 2
    order = [j for j in np.argsort(-ctfidf[c]) if present[j]]
    terms = []
    for j in order:
        t = vocab[j]
        if any(t in u or u in t for u in terms): continue
        terms.append(t)
        if len(terms) == 3: break
    cy = Y[members].mean(0)
    rep = members[np.argsort(-(X[members] @ X[members].mean(0)))][:3]
    clusters.append({"id": int(c), "terms": terms, "size": int(len(members)), "centroid": [round(float(cy[0]), 3), round(float(cy[1]), 3)],
                     "representative": [docs[i]["id"] for i in rep]})

# ---------- 7. write ----------
corpus_hash = hashlib.sha256("\n".join(docs_txt).encode()).hexdigest()[:16]
import sentence_transformers, sklearn
out = {
    "method": {
        "model": MODEL, "dims": int(X.shape[1]), "chunk_tokens": 200, "docs": len(docs), "chunks": len(texts),
        "umap": {"n_neighbors": 15, "min_dist": 0.25, "metric": "cosine", "n_epochs": 1000, "init": "spectral", "seed": SEED},
        "clusters": {"algorithm": "Leiden, RBConfiguration", "graph": "union kNN, k=10, cosine weights", "resolution": 1.0, "seed": SEED},
        "edges": "mutual kNN, k=5, cosine in 384-D", "naming": "c-TF-IDF on document-normalised counts, uni/bigrams, terms in 2+ member docs",
        "checks": {"trustworthiness_k10": round(trust, 3), "neighbour_preservation_k10": round(preserve, 3),
                   "umap_seed_overlap": seed_overlap, "leiden_sensitivity": stability},
        "corpus_sha256_16": corpus_hash,
        "alignment": aligned or {"to_previous": False},
        "versions": {"sentence_transformers": sentence_transformers.__version__, "umap": umap.__version__, "sklearn": sklearn.__version__,
                     "leidenalg": la.version, "torch": torch.__version__, "python": platform.python_version()},
    },
    "clusters": clusters,
    "nodes": {d["id"]: {"u": [round(float(Y[i, 0]), 3), round(float(Y[i, 1]), 3)], "c": int(labels[i]),
                        "nn": [[docs[j]["id"], round(float(S[i, j]), 3)] for j in nb5[i]]} for i, d in enumerate(docs)},
    "edges": [[docs[a]["id"], docs[b]["id"], round(float(S[a, b]), 3)] for a, b in mutual],
}
json.dump(out, open(OUT, "w"))
print(json.dumps(out["method"]["checks"], indent=1))
for c in clusters: print(c["id"], c["size"], " · ".join(c["terms"]), "|", ", ".join(by_id[r]["title"] for r in c["representative"]))
print("edges:", len(out["edges"]), "isolated:", sum(1 for i in range(len(docs)) if not any(i in e for e in mutual)))
