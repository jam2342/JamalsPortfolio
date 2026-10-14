/**
 * The map's nodes and hand-drawn links.
 *
 * Every node is a real project, fact, milestone or page. Long-form page text
 * lives in content.json (keyed by node id); layout, colour and similarity edges
 * come from ml.json, which scripts/map computes from this file plus content.json.
 * After editing anything here or in content.json, re-run the pipeline:
 *   npm run map:docs && scripts/map/.venv/bin/python scripts/map/ml.py
 *
 * Imported by the page script and by scripts/map/export_docs.mjs, so it must
 * stay free of DOM or browser APIs.
 */
export function buildGraph() {
  const TOPICS = {
    vision:   { name: "Vision & ML",     color: "#cfe08a", x: 560, y: 160 },
    robotics: { name: "Robotics",        color: "#e8485f", x: 110, y: 380 },
    teaching: { name: "Teaching",        color: "#f2896b", x: 300, y: 215 },
    security: { name: "Security",        color: "#38b7da", x: 880, y: 300 },
    math:     { name: "Math & research", color: "#e7c07c", x: 380, y: 570 },
    tools:    { name: "Mac tools",       color: "#86b2ff", x: 790, y: 590 },
    me:       { name: "About me",        color: "#e9edf3", x: 600, y: 430 },
  };
  const nodes = [], links = [], byId = new Map();
  function N(id, title, topics, size, when, body, extra) {
    const n = Object.assign({ id, title, topics, size, when, body }, extra || {});
    nodes.push(n); byId.set(id, n); return n;
  }
  function L(a, b) { links.push({ source: a, target: b, kind: "link" }); }

  // ----- projects, pages and roles (hubs carry full page content) -----
  N("frcmob", "FRCMOB", ["vision", "robotics"], 3, "February 2026 to now", "", { page: true, hero: "img/frcmob/roboflow-detections-wide.png",
    actions: [["Source on GitHub", "https://github.com/jam2342/FRCMOB"], ["Open the live app", "https://scouting-app-iryg.vercel.app/#/home"]] });
  N("spot", "Spot the robots", ["vision", "teaching"], 3, "Play it here",
    "A labeling game built from real training frames. Find every robot, then see which ones the original training labels boxed and which ones detector v4 finds. It's the fastest way to feel why recall stalled.", { widget: "spot", wide: true });
  N("frc5417", "FRC Team 5417", ["robotics"], 3, "August 2024 to now", "", { page: true, hero: "img/jamal-frc-pit.jpg" });
  N("eaglets", "Eaglets Robotics", ["teaching", "robotics"], 3, "2024 to now", "", { page: true, hero: "img/eaglets/kit-deck-and-chassis.jpg" });
  N("hardening", "Windows hardening framework", ["security"], 3, "2025 to now", "", { page: true });
  N("crypto", "Practical Cryptography", ["teaching", "security"], 3, "2026", "", { page: true,
    actions: [["View the course on Udemy", "https://www.udemy.com/course/practical-cryptography-for-developers-and-qa-engineers/"]] });
  N("pico", "picoCTF 2026", ["security"], 3, "March 2026 · #68 worldwide", "", { widget: "ctf" });
  N("cyberp", "CyberPatriot XVIII", ["security"], 2, "January 2026 · National Semifinalist", "");
  N("ee", "Extended essay: solvable SDEs", ["math"], 3, "IB Extended Essay · started 2025", "", { page: true });
  N("ia", "Warm capacitors", ["math", "robotics"], 3, "IB Physics IA · submitted and graded", "", { page: true });
  N("notetaker", "Notetaker", ["tools"], 3, "2026", "", { page: true });
  N("avmac", "av-mac", ["tools", "vision"], 3, "September 2026", "", { page: true,
    actions: [["Source on GitHub", "https://github.com/jam2342/av-mac"]] });
  N("smt", "Stanford Math Tournament", ["math"], 2, "2026", "", { page: true });
  N("icode", "iCode", ["teaching"], 2, "March 2026 to now", "");
  N("usf", "United Stream Foundation", ["teaching"], 2, "December 2024 to June 2025", "");
  N("tunisia", "FIRST Global Team Tunisia", ["robotics", "teaching"], 2, "2025 season", "");
  N("about", "About me", ["me"], 3, "Allen High School, class of 2027", "", { page: true });
  N("contact", "Contact", ["me"], 3, "Email is the best way to reach me", "", { contact: true });
  N("skills", "Skills", ["me"], 2, "Grouped by the work they support", "", { page: true });
  N("school", "Allen High School", ["me"], 2, "IB Diploma Programme · expected June 2027", "", { page: true });

  // ----- FRCMOB detail -----
  const F = (id, t, size, when, body, sec, seq, topics) => N(id, t, topics || ["vision"], size, when, body, { sec, seq });
  F("v4", "Detector v4", 2, "Sep 30, 2026", "The labels were the bug. Training only on 798 frames with near-complete labels, plus 45 robots I confirmed by eye, lifted the locked-holdout mAP@50 from 71.9% to 77.9%.", "frcmob--model", "2026-09-30");
  F("holdout", "The locked holdout", 2, "May 2026", "v1 scored 98% on its own validation split and 70% on Einstein 2026, an event it never saw. Every model since has been judged on that one event.", "frcmob--model", "2026-05-26");
  F("predict", "Predicting without hindsight", 2, "Oct 4, 2026", "The ML model scored 82% in training and 49.8% once each match was predicted only from earlier results. A fuel-rate formula called 74.9% of 2,507 held-out matches, so the formula shipped.", "frcmob--predictions", "2026-10-04", ["vision", "math"]);
  F("tracking", "Tracking in field space", 2, "2026", "Paths join only when a robot reappears within 2 seconds, close by, in its own alliance colour. One match went from 126 fragments to 81, with 95.7% of hand labels on the right team.", "frcmob--phone");
  F("ondevice", "Breakdown on the phone", 2, "2026", "A full match takes 33 seconds on a GPU and 55 on a CPU, in the browser. The first version took about seven minutes.", "frcmob--phone");
  F("ocr", "Bumper OCR, abandoned", 1, "2026", "Reading team numbers off bumpers looked tractable until the digits turned out to be a handful of pixels tall. Identity is now one tap per robot.", "frcmob--pipeline");
  F("review", "Review, not trust", 2, "2026", "Every automatic result arrives as a draft with per-field confidence. A scout approves it, corrects fields, or rejects it.", "frcmob--review", null, ["vision", "security"]);
  F("vm", "One free VM", 1, "Sep 2026", "The backend runs on one free Oracle Cloud VM. Moving Postgres and Redis onto it took a schedule request from 911 ms to 18 ms.", "frcmob--prod", null, ["vision", "tools"]);
  const season = [
    ["2026-02-10", "Started for Team 5417", "First commit: a React frontend and a Dockerized FastAPI backend pulling match data from The Blue Alliance."],
    ["2026-02-11", "The game, as data", "The 2026 rules went into a per-season config, and the field's CAD model was lined up with its AprilTags."],
    ["2026-02-12", "First detector", "A YOLO model found robots for the first time. The commit message was “working yolo.”"],
    ["2026-02-20", "Week 0", "The first 2026 matches were played in Nashua, New Hampshire. I ran the pipeline on them the same day.", "robotics"],
    ["2026-02-25", "Live scouting rooms", "Several scouts in one room, synced live over WebSockets."],
    ["2026-02-26", "Cycle time, fixed", "Re-derived from the game manual: collect fuel, drive back, score during your alliance's active window."],
    ["2026-03-04", "Final before comp", "Match video pulled straight from YouTube and broken down automatically."],
    ["2026-03-07", "Live on Oracle Cloud", "The backend went to a cloud container for the first time."],
    ["2026-03-08", "League City", "First event of the season. “Version 1.0” landed on the first afternoon, and fixes kept landing all weekend.", "robotics"],
    ["2026-03-20", "Waco", "Second event of the season.", "robotics"],
    ["2026-04-05", "Heat maps", "Where each robot spends its match, drawn on the field instead of summarized in a number."],
    ["2026-04-13", "Auto-scout drafts", "Video findings became draft scouting forms for a person to review."],
    ["2026-04-17", "District Championship", "FIRST In Texas District Championship, Mercury Division.", "robotics"],
    ["2026-04-21", "Bigger than Texas", "Breakdowns opened up to events outside Texas."],
    ["2026-05-15", "Secrets out of git", "Environment files came out of tracking and the history was rewritten without them.", "security"],
    ["2026-06-20", "Four taps", "AprilTags were unreadable from the stands, so calibration became four taps on the field corners."],
    ["2026-08-21", "Remodel merged", "The on-device breakdown and a full frontend remodel merged together."],
    ["2026-09-24", "Backend revived", "Back up on a free Oracle VM after months switched off."],
    ["2026-09-25", "First full video run", "The broadcast pipeline ran end to end in production for the first time."],
    ["2026-09-26", "HTTPS and workspaces", "The API went HTTPS-only, and team workspaces made each team's scouting private.", "security"],
    ["2026-09-28", "Broadcast video retired", "Broadcasts couldn't tell robots apart, so vision moved onto the scout's phone."],
    ["2026-09-29", "Decode, don't play", "Uploads decoded straight from the file instead of played back in real time."],
    ["2026-10-01", "Offline and native", "Event packs for venues with no signal, and the first iOS and Android shells."],
    ["2026-10-05", "Rooms without keys", "Leads assign scouts to robots inside their team."],
    ["2026-10-12", "Speed round", "Fewer requests, edge caching, and real-user timings to measure against."],
  ];
  const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const fmt = (d) => DATE.format(d);
  season.forEach(([date, t, b, extra], i) => N("s" + i, t, extra ? ["vision", extra] : ["vision"], 0, fmt(new Date(date + "T12:00:00Z")), b, { seq: date, sec: "frcmob--season", season: true }));

  // ----- robotics and Eaglets -----
  N("pit", "Pit crew", ["robotics"], 1, "Events", "Battery swaps, checking the robot over, fixing whatever came loose, and getting it back out in time for the next match.", { sec: "frc5417--what" });
  N("fab", "Fabrication", ["robotics"], 1, "Build seasons", "Making and assembling parts through a six-week build where the design keeps changing around you.", { sec: "frc5417--what" });
  N("impact", "2025 FIRST Impact Award", ["robotics"], 1, "2025, Fort Worth District", "Won by the team; I was a member of it.", { sec: "frc5417--team" });
  N("tomball", "2025 Tomball District winners", ["robotics"], 1, "2025", "Won by the team; I was a member of it.", { sec: "frc5417--team" });
  const kits = [
    ["V1", "The proof the idea worked: a younger student could build and program it in one session.", "img/eaglets/evolution/v1.jpg"],
    ["V2", "Rebuilt around the exact steps where students got stuck in the early camps.", "img/eaglets/evolution/v2.jpg"],
    ["V3.2", "An ultrasonic sensor and a photoresistor, so students start writing conditions instead of fixed sequences.", "img/eaglets/evolution/v3-2.jpg"],
    ["V3.6", "The kit that ran the 2025 camp season, with the revision silkscreened on the chassis.", "img/eaglets/evolution/v3-6.jpg"],
    ["2025 breadboards", "The PCBs broke mid-season with camps booked across Texas. The team rebuilt on breadboards and kept teaching."],
    ["V4", "The first generation with a proper KiCad design and a schematic on file."],
    ["V6", "Being prepared for testing and summer 2027 production. Not finished yet."],
  ];
  kits.forEach(([v, b, img], i) => N("k" + i, "Kit " + v, ["robotics", "teaching"], 0, "Eaglets kit lineage", b, { sec: "eaglets--lineage", hero: img }));
  N("boards", "The summer the boards broke", ["teaching", "robotics"], 1, "Summer 2025", "The PCBs failed mid-season. The team improvised under a deadline, and the camps ran anyway.", { sec: "eaglets--failure" });
  N("registers", "Hide the registers, expose the logic", ["teaching"], 1, "Eaglets libraries", "Students don't write ultrasonic timing code, but they write the condition that decides what the robot does when something gets close.", { sec: "eaglets--software" });
  N("turnover", "New leadership every year", ["teaching"], 1, "2026 to 27", "Eaglets turns over its whole leadership every year, so the real technical work is writing things down for the next officer team.", { sec: "eaglets--leading" });

  // ----- security -----
  N("simulate", "Simulate first", ["security"], 2, "Hardening framework", "Every check can report without fixing. Simulate is the default, and changes have to be asked for and confirmed.", { sec: "hardening--approach" });
  N("undo", "Every run writes its own undo", ["security"], 1, "Hardening framework", "Before a run modifies anything it captures the current state and generates a revert script from it.", { sec: "hardening--safety" });
  N("accounts", "Accounts need a declared list", ["security"], 1, "Hardening framework", "The tool won't guess who belongs. Authorized accounts are listed explicitly, and the simulate pass shows exactly which ones a run would touch.", { sec: "hardening--safety" });
  N("e1753", "Error 1753", ["security"], 1, "Dec 14, 2025", "Set-NetFirewallProfile failing over and over because the endpoint mapper had been tampered with. The run logs it and keeps going.", { sec: "hardening--problem", hero: "img/hardening/powershell-firewall-errors.jpg" });
  const ctf = [["General skills", 17], ["Cryptography", 12], ["Reverse engineering", 11], ["Web exploitation", 10], ["Binary exploitation", 8], ["Forensics", 8], ["Blockchain", 4]];
  ctf.forEach(([cat, n], i) => N("p" + i, cat + " " + n + "/" + n, ["security"], 0, "picoCTF 2026", "Every " + cat.toLowerCase() + " challenge solved: " + n + " of " + n + ".", { sec: "pico" }));
  N("planted", "Planted defects", ["security", "teaching"], 1, "Course capstone", "Because I know every defect in the application, a student's audit is measured against what's there, not against how confident the report sounds.", { sec: "crypto--capstone" });
  N("decision", "The release decision", ["teaching", "security"], 1, "Course capstone", "The last deliverable is a judgment: does this ship, and why?", { sec: "crypto--decision" });
  const acts = [
    ["Crypto threat map", "Security design review", 25], ["Math and randomness playground", "Incident investigation", 35],
    ["Break the pattern", "Mini challenge", 40], ["Authenticated encryption", "Debug and repair", 55],
    ["File integrity", "Chain of custody", 40], ["Password reset audit", "State-machine race lab", 60],
    ["Private key lifecycle", "Key ceremony tabletop", 55], ["Signature verification", "Release policy challenge", 50],
    ["TLS evidence pack", "Protocol investigation", 60], ["JWT mutation matrix", "Cross-token confusion", 60],
    ["Crypto code review", "Patch and regression", 60], ["Incident regression tests", "Timed tabletop", 45],
    ["Crypto test framework", "Standards traceability", 60], ["Negative test pack", "Mutation test design", 60],
    ["Capstone validation", "Red-team release gate", 90], ["PQC migration inventory", "Crypto agility board", 45],
  ];
  acts.forEach(([t, f, m], i) => N("a" + i, t, ["security", "teaching"], 0, "Course activity " + (i + 1) + " of 16", f + ", about " + m + " minutes. Runs locally from a folder with its own Python environment.", { sec: "crypto--range" }));

  // ----- research -----
  [["gbm", "Geometric Brownian motion", "Multiplicative noise that turns additive under a log. Explicit path, known distribution, closed moments."],
   ["ou", "Ornstein–Uhlenbeck", "Linear drift, constant diffusion, Gaussian at every fixed time. Solvable on all three counts."],
   ["cir", "Cox–Ingersoll–Ross", "Loses the elementary path formula but keeps an exact transition law, a noncentral chi-square."],
   ["sl", "Stochastic logistic", "An explicit path after a reciprocal substitution, but no comparably simple finite-time distribution."]]
    .forEach(([id, t, b]) => N(id, t, ["math"], 1, "Extended essay model", b, { sec: "ee" }));
  N("qv", "Quadratic variation", ["math"], 2, "Try it", "Subdivide a Brownian path and add up the squared increments. For a smooth curve the sum vanishes; for Brownian motion it converges to the elapsed time. That is why Itô's formula keeps a second-order term.", { widget: "qv", sec: "ee" });
  N("tau", "τ from 46.7 s to 36.8 s", ["math"], 1, "10 °C to 50 °C", "The time constant fell 21% over 40 °C, with every linearized fit above R² = 0.9995.", { sec: "ia" });
  N("linear", "Linear, not Arrhenius", ["math"], 1, "The surprise", "I predicted the drop would accelerate with temperature. It didn't: a straight line fits the whole range, and I reported that.", { sec: "ia" });

  // ----- mac tools -----
  N("consent", "Detection may prompt, never record", ["tools", "security"], 1, "Notetaker", "Seeing a meeting can raise a dialog. Only the menu item or the dialog's button can start capture.", { sec: "notetaker--boundary-first" });
  N("amp", "The 0.78 → 0.0 bug", ["tools"], 1, "Notetaker", "One ScreenCaptureKit flag silently killed system audio. The file still looked fine; every other participant was gone.", { sec: "notetaker--verified" });
  N("whisper", "Transcribed on-device", ["tools"], 1, "Notetaker", "whisper.cpp keeps transcription on the Mac. Only one text-only pass leaves it, after recording stops.", { sec: "notetaker--system-shape" });
  N("leak", "The 83 GB leak", ["tools"], 1, "av-mac", "One Core Graphics call pinned a 5.2 MB buffer per OCR pass. It only showed up after running overnight.", { sec: "avmac--hours" });
  N("captures", "79 of 79 captures", ["tools", "vision"], 1, "av-mac", "Every recorded screen classifies correctly, and an unknown screen is saved to disk instead of clicked.", { sec: "avmac--verified" });
  N("atlas", "Reading a map by colour", ["tools", "vision"], 1, "av-mac", "The Route Atlas has no text, so floors are told apart by measured hue and saturation. Red is hue 1, not 178.", { sec: "avmac--colour", hero: "img/avmac/route-atlas.png" });

  // ----- meaningful links -----
  [["frcmob", "frc5417"], ["frcmob", "spot"], ["spot", "v4"], ["spot", "holdout"], ["spot", "eaglets"],
   ["frcmob", "v4"], ["frcmob", "holdout"], ["frcmob", "predict"], ["frcmob", "tracking"], ["frcmob", "ondevice"],
   ["frcmob", "ocr"], ["frcmob", "review"], ["frcmob", "vm"], ["v4", "holdout"], ["tracking", "ondevice"],
   ["predict", "ee"], ["review", "simulate"], ["review", "decision"], ["ocr", "avmac"], ["v4", "avmac"],
   ["ia", "frc5417"], ["ia", "tau"], ["ia", "linear"], ["frc5417", "pit"], ["frc5417", "fab"], ["frc5417", "impact"], ["frc5417", "tomball"],
   ["frc5417", "tunisia"], ["eaglets", "tunisia"], ["eaglets", "boards"], ["eaglets", "registers"], ["eaglets", "turnover"],
   ["eaglets", "icode"], ["icode", "usf"], ["icode", "crypto"], ["boards", "k4"], ["registers", "k2"],
   ["hardening", "cyberp"], ["hardening", "simulate"], ["hardening", "undo"], ["hardening", "accounts"], ["hardening", "e1753"],
   ["cyberp", "e1753"], ["crypto", "pico"], ["crypto", "planted"], ["crypto", "decision"], ["planted", "a14"], ["decision", "a14"],
   ["pico", "p1"], ["crypto", "p1"], ["ee", "gbm"], ["ee", "ou"], ["ee", "cir"], ["ee", "sl"], ["ee", "qv"], ["ee", "smt"],
   ["notetaker", "consent"], ["notetaker", "amp"], ["notetaker", "whisper"], ["notetaker", "avmac"], ["consent", "simulate"],
   ["avmac", "leak"], ["avmac", "captures"], ["avmac", "atlas"], ["vm", "s17"], ["v4", "s20"], ["s14", "hardening"], ["s19", "consent"],
   ["about", "contact"], ["about", "skills"], ["about", "school"], ["about", "frcmob"], ["about", "eaglets"], ["about", "ee"], ["school", "ia"], ["school", "ee"]]
    .forEach(([a, b]) => L(a, b));
  const WHY = {
    "frcmob|frc5417": "Built for this team and used at competition.",
    "frcmob|spot": "The labeling problem behind the detector, as a game.",
    "spot|v4": "The game shows the gap v4 closed: labels that skipped robots.",
    "spot|eaglets": "Both teach by letting you try it first, then showing what happened.",
    "predict|ee": "Both ask how much a small, noisy sample can tell you.",
    "review|simulate": "Same rule: findings come first, a person decides.",
    "review|decision": "An automated result is evidence for a decision, not the decision.",
    "ocr|avmac": "OCR failed on tiny bumper digits; av-mac reads large UI text instead.",
    "v4|avmac": "Both read a screen they were never given an API for.",
    "ia|frc5417": "Looking after warm batteries and electronics prompted the question.",
    "crypto|pico": "The course and the competition share the cryptography.",
    "crypto|p1": "All 12 picoCTF cryptography challenges solved.",
    "hardening|cyberp": "The competition is why the framework exists.",
    "consent|simulate": "Both refuse to act until a person says yes.",
    "notetaker|avmac": "Both are macOS apps fighting the same permission system.",
    "eaglets|icode": "Teaching kids, in two different rooms.",
    "icode|crypto": "Teaching, from fourth graders to working engineers.",
    "frc5417|tunisia": "FIRST robotics, on two teams.",
    "eaglets|tunisia": "Mentoring other people's robots.",
    "s14|hardening": "The same discipline applied to my own repository.",
    "s19|consent": "Privacy by default, in two apps.",
    "ee|smt": "Slow math and fast math.",
    "school|ia": "Both papers are IB work.",
  };
  links.forEach((l) => { l.why = WHY[l.source + "|" + l.target] || WHY[l.target + "|" + l.source]; });
  const timeline = nodes.filter((n) => n.seq).sort((a, b) => a.seq.localeCompare(b.seq));
  timeline.forEach((n, i) => { if (i) L(timeline[i - 1].id, n.id); });
  L("frcmob", timeline[0].id);
  kits.forEach((_, i) => L(i ? "k" + (i - 1) : "eaglets", "k" + i));
  acts.forEach((_, i) => L(i ? "a" + (i - 1) : "crypto", "a" + i));
  for (let i = 0; i < 7; i++) L("pico", "p" + i);

  // ----- question-led routes (drafts: Jamal to confirm the wording) -----
  const ROUTES = [
    { id: "highlights", title: "The highlights", blurb: "Eleven stops across everything.",
      stops: ["frcmob", "spot", "frcmob--predictions", "hardening", "crypto", "eaglets", "ee", "notetaker", "avmac", "about", "contact"].map((id) => [id, ""]) },
    { id: "changed", title: "Where I changed my mind", blurb: "Five times the evidence said I was wrong, and what I did next.",
      stops: [
        ["ocr", "The first plan was to read team numbers off bumpers. The digits turned out to be a handful of pixels, so it went."],
        ["frcmob--pivot", "Then the whole broadcast pipeline. It ran end to end, but it mixed up robots, so I retired months of work."],
        ["holdout", "98% on the validation split looked finished. On an event the model had never seen, it was 70%."],
        ["predict", "My ML predictor scored 82% in training and 49.8% without hindsight. A simpler formula shipped instead."],
        ["linear", "In physics, the data disagreed with my hypothesis, and that's what I reported."],
      ] },
    { id: "people", title: "Building for people who aren't me", blurb: "Nine-year-olds, scouts in a loud venue, and engineers deciding whether to ship.",
      stops: [
        ["eaglets", "The user here is a nine-year-old with forty minutes and a bag of parts."],
        ["registers", "The hard design call: hide enough that the robot moves, not so much that nothing is learned."],
        ["boards", "When the boards broke mid-season, the camps ran anyway."],
        ["frcmob--product", "For scouts: venue wifi fails, phones get swapped, and the data still has to arrive."],
        ["spot", "Try the labeling job yourself before reading why it was hard."],
        ["crypto--decision", "For working engineers, the course ends on a decision, not a quiz."],
      ] },
    { id: "stop", title: "When automation should stop and ask", blurb: "The same rule in four projects: the tool reports, a person decides.",
      stops: [
        ["simulate", "The hardening framework reports what it would change before it changes anything."],
        ["review", "FRCMOB's model output stays a draft until a scout approves it."],
        ["consent", "Notetaker can notice a meeting, but only you can start the recording."],
        ["avmac--refuse", "av-mac won't click on a screen it can't name."],
        ["crypto--decision", "In the course: an automated finding is evidence for a decision, not the decision."],
      ] },
  ];

  // ----- evidence receipts for headline numbers (drafts: Jamal to confirm) -----
  const RECEIPTS = [
    { nodes: ["v4", "frcmob--model"], claim: "77.9%", what: "Detector v4, mAP@50 on the locked holdout",
      rows: [["Measured", "mAP@50 77.9%, precision 90.5%, recall 67.8% at the shipped 0.35 cutoff"],
             ["Test set", "224 frames from Einstein 2026, an event never used in training"],
             ["Compared with", "v2 scored 71.9% on the same frames, re-measured at 1280 px"],
             ["Trained on", "798 frames with near-complete labels (156 for validation), plus 45 robots confirmed by eye"],
             ["My part", "Sole developer: label audit, training runs, evaluation"],
             ["Source", "FRCMOB repository (public, AGPL-3.0). Weights and training data are private"],
             ["Limits", "One held-out event. It still misses about a third of the robots it isn't sure about"]] },
    { nodes: ["predict", "frcmob--predictions"], claim: "74.9%", what: "Match outcomes called correctly, without hindsight",
      rows: [["Measured", "74.9% of 2,507 matches, Brier score 0.173"],
             ["Test set", "The 56 newest events of the 2026 season"],
             ["Conditions", "As-of replay: each match predicted only from what was known before it"],
             ["Compared with", "Rating formula 69.2%. With leaked end-of-event inputs it looked like 81.5%"],
             ["My part", "Sole developer: replay harness, predictor, evaluation"],
             ["Source", "FRCMOB repository (public, AGPL-3.0)"],
             ["Limits", "One season. The ML model reached 72.6% and stays off until it beats this"]] },
    { nodes: ["pico"], claim: "70 / 70", what: "picoCTF 2026, every challenge, #68 worldwide",
      rows: [["Result", "All 70 challenges, 14,500 of 14,500 points, #68 worldwide"],
             ["My part", "60 of the 70 (13,500 points), including all 22 rated 300 points or more"],
             ["Team", "Two people"],
             ["Source", "picoCTF 2026 scoreboard (link to add)"]] },
    { nodes: ["hardening", "hardening--scale"], claim: "~11,900", what: "Lines of PowerShell in the hardening framework",
      rows: [["Measured", "About 11,900 lines across roughly 170 functions"],
             ["What it covers", "Hundreds of checks, each in an audit form and a fix form, for three Windows targets"],
             ["My part", "Sole developer"],
             ["Source", "Private repository; available to review on request"],
             ["Limits", "Size reflects coverage, not quality"]] },
    { nodes: ["ondevice", "frcmob--phone"], claim: "33 s", what: "Full-match breakdown time on device",
      rows: [["Measured", "33 s on a GPU (Chrome, WebGPU, full v4); 55 s on a CPU (WebKit, v4-nano). It started at about 7 minutes"],
             ["Conditions", "On a laptop, in Chrome and in WebKit, the engine Safari and every iPhone browser use"],
             ["My part", "Sole developer"],
             ["Source", "FRCMOB repository (public, AGPL-3.0)"],
             ["Limits", "Not yet run on a real phone at a real event"]] },
    { nodes: ["captures", "avmac--verified"], claim: "79 / 79", what: "av-mac screens classified from real captures",
      rows: [["Measured", "All 79 recorded captures classified, zero unknown; 200 tests"],
             ["Conditions", "Recorded captures replayed offline, no game running"],
             ["Source", "av-mac repository (public, MIT)"],
             ["Limits", "One machine, one macOS version, one window size. The card handler has never clicked a card live"]] },
    { nodes: ["tau", "ia"], claim: "\u221221%", what: "Capacitor time constant from 10 \u00b0C to 50 \u00b0C",
      rows: [["Measured", "\u03c4 = 46.7 \u00b1 0.4 s at 10 \u00b0C and 36.8 \u00b1 0.4 s at 50 \u00b0C"],
             ["Method", "Five temperatures, a fixed 47 k\u03a9 resistor, log-linear fits with R\u00b2 above 0.9995"],
             ["Uncertainty", "Extreme gradients still consistent with \u00b10.01 V on every reading"],
             ["Source", "IB Physics internal assessment, submitted and graded in summer 2026; available on request"],
             ["Limits", "Only tested from 10 \u00b0C to 50 \u00b0C"]] },
  ];

  return { TOPICS, nodes, links, byId, ctf, kits, acts, season, ROUTES, RECEIPTS };
}
