/**
 * Project records.
 *
 * Every technical claim here was checked against the actual repository or
 * against material Jamal supplied. If a fact could not be verified it is not
 * in this file. Add new projects by appending to `projects`. Pages derive
 * their listings from this array.
 */

export type Project = {
  /** Stable slug; also the URL segment for projects with a case study. */
  id: string;
  /** Display index, e.g. "01". */
  index: string;
  title: string;
  /** Short kicker under the title. */
  kind: string;
  /** One-line summary used in listings. */
  summary: string;
  /** Two or three sentences for the homepage card. */
  blurb: string;
  years: string;
  /** Filter facets used by the work index. */
  tags: string[];
  /** Small metadata rows rendered as a definition grid. */
  meta: { label: string; value: string }[];
  /** Technologies, grouped so they read as a system rather than a badge wall. */
  stack: { group: string; items: string[] }[];
  /** Route to the case study, if one exists. */
  href?: string;
  /** Public source repository, when the project is open source. */
  repoUrl?: string;
  /** True when the repository is private and must not be linked. */
  privateRepo: boolean;
  featured: boolean;
};

export const projects: Project[] = [
  {
    id: "frcmob",
    index: "01",
    title: "FRCMOB",
    kind: "Scouting and match-analysis platform",
    summary:
      "A full scouting platform for FIRST Robotics teams: team workspaces and live rooms, offline event packs, honestly tested match predictions, and a match breakdown that runs on the scout's phone.",
    blurb:
      "Built and deployed for FRC Team 5417, this full-stack, open-source platform supports team workspaces, live multi-scout rooms, offline event packs, match predictions, and a computer-vision breakdown that runs in the browser on the scout's phone. I began it in February 2026 and keep working on on-device analysis, native apps, and readiness for the 2027 season.",
    years: "February 2026–present",
    tags: ["Machine learning", "Computer vision", "Full-stack", "Robotics"],
    meta: [
      { label: "Role", value: "Sole developer" },
      { label: "Status", value: "Active development" },
      { label: "Deployment", value: "Used by FRC Team 5417 at competition" },
      { label: "Repository", value: "Open source · AGPL-3.0" },
    ],
    stack: [
      { group: "Backend", items: ["Python", "FastAPI", "PostgreSQL", "Redis", "WebSockets with Redis pub/sub", "Docker"] },
      { group: "Vision", items: ["In-browser detector (ONNX Runtime Web: WebGPU/WASM)", "WebCodecs decoding", "4-tap homography", "Field-space tracking", "Path stitching"] },
      { group: "Frontend", items: ["React", "TypeScript", "Vite", "Offline-first PWA", "Capacitor iOS and Android shells"] },
      { group: "Modeling", items: ["As-of replay evaluation", "Fuel-rate win probability", "Alliance synergy", "Shadow deployment", "Feature engineering"] },
      { group: "Infrastructure", items: ["Single OCI VM", "Caddy HTTPS", "Postgres and Redis on the VM", "Neon backup", "Vercel edge cache"] },
    ],
    href: "/work/frcmob/",
    repoUrl: "https://github.com/jam2342/FRCMOB",
    privateRepo: false,
    featured: true,
  },
  {
    id: "cyberpatriot",
    index: "02",
    title: "Windows Hardening Framework",
    kind: "Security automation",
    summary:
      "An 11,900-line PowerShell system that audits, hardens, and remediates Windows and Windows Server images with rollback safety.",
    blurb:
      "Built for CyberPatriot, this is an auditing and remediation engine rather than a pile of commands. It inspects system state, reports findings as evidence before it changes anything, applies policy against CIS-style baselines, and writes a revert script before every destructive operation.",
    years: "2025–present",
    tags: ["Security", "Automation", "Systems"],
    meta: [
      { label: "Role", value: "Sole developer" },
      { label: "Scale", value: "~11,900 lines of PowerShell" },
      { label: "Repository", value: "Private" },
    ],
    stack: [
      { group: "Platform", items: ["PowerShell 5.1", "Windows 11", "Windows Server 2019", "Windows Server 2022"] },
      { group: "Controls", items: ["Authentication policy", "Account lockout", "Privilege management", "Service integrity"] },
      { group: "Defense", items: ["Firewall rules", "Microsoft Defender", "Audit policy", "Persistence detection"] },
      { group: "Safety", items: ["Simulate mode", "Backups", "Generated revert script", "Evidence logging"] },
    ],
    href: "/work/hardening/",
    privateRepo: true,
    featured: true,
  },
  {
    id: "cryptography",
    index: "03",
    title: "Practical Cryptography",
    kind: "Course and assessment design",
    summary:
      "A 43-lecture cryptography course built around a deliberately broken application students must audit and decide whether to release.",
    blurb:
      "Most cryptography courses stop at definitions. This one ends with a release-candidate application that has real defects planted in it. Students build a testing framework, find what's wrong, preserve evidence, and write a defensible decision about whether the software ships.",
    years: "2026",
    tags: ["Security", "Education", "Software engineering"],
    meta: [
      { label: "Role", value: "Instructor and curriculum author" },
      { label: "Scope", value: "43 lectures across 16 sections" },
      { label: "Platform", value: "Udemy" },
    ],
    stack: [
      { group: "Topics", items: ["AES and block modes", "Authenticated encryption", "Hashing", "Password storage", "RSA and ECC", "TLS and PKI", "JWTs"] },
      { group: "Capstone", items: ["Python", "FastAPI", "TLS gateway", "Planted defects", "Hidden assessment tests", "Mutation-based evaluation"] },
    ],
    href: "/work/cryptography/",
    privateRepo: true,
    featured: true,
  },
  {
    id: "eaglets",
    index: "04",
    title: "Eaglets Robotics",
    kind: "Free robotics camps, grades 3–8",
    summary:
      "A student-run program running free robotics camps for grades 3–8. I run the program; the kits are the club's own design lineage.",
    blurb:
      "Eaglets teaches free build-and-program camps for grades 3–8, using robot kits the club has developed across several revisions. I did not design those kits. I run the program: camps, curriculum, officer training, and the logistics that keep the sessions free. Right now that means rebuilding the 2026–27 leadership team and getting the current kit ready for the summer run.",
    years: "2024–present",
    tags: ["Robotics", "Embedded", "Education", "Leadership"],
    meta: [
      { label: "Role", value: "President — camps, curriculum, officer training" },
      { label: "Kit design", value: "Club lineage; not my work" },
      { label: "Audience", value: "Grades 3–8" },
      { label: "Hardware", value: "Raspberry Pi Pico; earlier Arduino" },
    ],
    stack: [
      { group: "Kit hardware (club design)", items: ["Raspberry Pi Pico", "Arduino Uno", "HC-SR04 ultrasonic", "Photoresistor", "Motor drivers"] },
      { group: "Kit software (club design)", items: ["Python", "C++", "Beginner-facing libraries"] },
      { group: "What I run", items: ["Curriculum design", "Camp operations", "Officer training", "Leadership recruiting", "Grants and partnerships"] },
    ],
    href: "/work/eaglets/",
    privateRepo: false,
    featured: true,
  },
  {
    id: "frc5417",
    index: "05",
    title: "FRC Team 5417",
    kind: "Fabrication and pit crew",
    summary:
      "Fabrication and pit work for Allen Eagle Robotics, plus competition deployment of FRCMOB with Team 5417.",
    blurb:
      "I joined Allen Eagle Robotics in 2024 on the fabrication side, building parts through the season and working the pit at events. In February 2026 I began FRCMOB, and Team 5417 later used the platform at a real competition for scouting and match analysis.",
    years: "2024–present",
    tags: ["Robotics", "Hardware"],
    meta: [
      { label: "Role", value: "Fabrication and pit crew" },
      { label: "Team", value: "FRC 5417, Allen Eagle Robotics" },
      { label: "Since", value: "August 2024" },
    ],
    stack: [
      { group: "Build season", items: ["Fabrication", "Assembly", "Part production"] },
      { group: "Competition", items: ["Pit crew", "Battery management", "Between-match turnaround"] },
      { group: "Software", items: ["FRCMOB", "Competition scouting deployment", "Offline data collection"] },
    ],
    href: "/work/frc5417/",
    privateRepo: false,
    featured: false,
  },
  {
    id: "notetaker",
    index: "06",
    title: "Notetaker",
    kind: "Consent-first meeting capture",
    summary:
      "A macOS menu-bar app that captures meeting audio, transcribes it on-device, and turns the transcript into structured Markdown notes.",
    blurb:
      "A small native macOS app built around a strict boundary: detecting a meeting may prompt, but never starts recording. ScreenCaptureKit combines system and microphone audio, whisper.cpp keeps transcription on-device, and one text-only summarization pass produces decisions and action items.",
    years: "2026",
    tags: ["macOS", "Audio", "Privacy", "AI"],
    meta: [
      { label: "Role", value: "Sole developer" },
      { label: "Interface", value: "Native macOS menu-bar app" },
      { label: "Repository", value: "Private" },
    ],
    stack: [
      { group: "Capture", items: ["Swift", "ScreenCaptureKit", "System audio", "Microphone", "16 kHz mono WAV"] },
      { group: "Processing", items: ["whisper.cpp", "On-device transcription", "Claude CLI", "Markdown"] },
      { group: "Safety", items: ["Explicit recording prompt", "Local audio", "Sanitized filenames", "No silent auto-recording"] },
    ],
    href: "/work/notetaker/",
    privateRepo: true,
    featured: true,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export const allTags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort();
