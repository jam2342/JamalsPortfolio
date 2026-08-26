/**
 * Experience, leadership, competitions, and skills.
 *
 * Every date here has been confirmed by Jamal. If a future entry is uncertain,
 * mark it with datesUnconfirmed rather than guessing at it.
 */

export type Role = {
  org: string;
  title: string;
  dates: string;
  /** Set when the date range still needs Jamal's confirmation. */
  datesUnconfirmed?: boolean;
  location?: string;
  points: string[];
  /** Achievements earned by a team Jamal was part of, worded as such. */
  teamCredits?: string[];
};

export const roles: Role[] = [
  {
    org: "Eaglets: Robot Kits for Kids",
    title: "President; former camp coordinator",
    dates: "2024 – present",
    location: "Allen, Texas",
    points: [
      "Lead a student-run robotics program that designs its own robot kits and curriculum for students in grades 3–8.",
      "Rebuilding the 2026–27 leadership team, recruiting and training new officers, and preparing Kit V6 for testing and summer 2027 production.",
      "Run grant planning and partnership work alongside the technical side.",
      "Helped build the beginner-facing programming libraries and taught Python, C++, and applied robotics at camps.",
    ],
  },
  {
    org: "CyberPatriot, Team Bravo Prime",
    title: "Windows security and automation",
    dates: "June 2025 – present",
    points: [
      "Wrote an ~11,900-line PowerShell framework for Windows and Windows Server hardening, auditing, compliance validation, and remediation.",
      "Automated authentication controls, account and privilege management, service integrity checks, firewall rules, Defender policy, audit logging, and rollback-safe configuration changes.",
      "Designed the tool around evidence first: a simulate mode produces findings before anything is changed.",
    ],
    teamCredits: [
      "CyberPatriot XVIII Open Division National Semifinalist (January 2026)",
      "15th nationally in Open Division, Platinum tier, after the opening day of the CyberPatriot XVIII National Semifinals. That was a first-day standing only; it is not where the team finished.",
    ],
  },
  {
    org: "Allen Eagle Robotics, FRC Team 5417",
    title: "Fabrication and pit crew",
    dates: "August 2024 – present",
    location: "Allen, Texas",
    points: [
      "Fabrication work on the competition robot, building and assembling parts through the build season.",
      "Pit crew during events: battery swaps, between-match turnaround, and keeping the robot ready to play.",
      "Built and deployed FRCMOB, a full-stack scouting and match-analysis platform Team 5417 has used at a real competition.",
    ],
    teamCredits: [
      "Member of the team that won the 2025 FIRST Impact Award at the Fort Worth District Event",
      "Member of the team that won the 2025 Tomball District Event",
    ],
  },
  {
    org: "FIRST Global Team Tunisia",
    title: "Technical mentor",
    dates: "2025 season",
    points: [
      "Provided general technical mentoring to the team through the season.",
      "Supported parts of the robot-design process and helped the team reason through engineering tradeoffs.",
    ],
  },
  {
    org: "United Stream Foundation Camp",
    title: "Programming instructor",
    dates: "December 2024 – June 2025",
    points: [
      "Taught Java and object-oriented programming to students across several age groups.",
      "Introduced data structures and control flow, and wrote exercises aimed at algorithmic reasoning rather than syntax drills.",
    ],
  },
  {
    org: "iCode",
    title: "Programming and AI instructor",
    dates: "March 2026 – present",
    points: [
      "Teach programming fundamentals to children and introduce practical uses of machine learning.",
      "Run hands-on technical exercises and guide students through their own projects.",
    ],
  },
];

export type Competition = {
  name: string;
  result: string;
  year: string;
  detail: string;
  areas?: string[];
  /** Optional category breakdown, rendered as a solve table. */
  breakdown?: { area: string; solved: number; total: number }[];
  score?: string;
};

export const competitions: Competition[] = [
  {
    name: "picoCTF 2026",
    result: "#68 worldwide",
    year: "March 2026",
    score: "14,500 / 14,500, every challenge solved",
    detail:
      "A two-person team that cleared the whole competition: all 70 challenges across all seven categories, for a perfect score. I solved 60 of them, worth 13,500 of the 14,500 points, and all 22 of the challenges rated 300 points or higher. Working every category instead of specializing is the part I'd do again.",
    breakdown: [
      { area: "General skills", solved: 17, total: 17 },
      { area: "Cryptography", solved: 12, total: 12 },
      { area: "Reverse engineering", solved: 11, total: 11 },
      { area: "Web exploitation", solved: 10, total: 10 },
      { area: "Binary exploitation", solved: 8, total: 8 },
      { area: "Forensics", solved: 8, total: 8 },
      { area: "Blockchain", solved: 4, total: 4 },
    ],
  },
  {
    name: "CyberPatriot XVIII",
    result: "National Semifinalist",
    year: "2026",
    detail:
      "Open Division National Semifinals, held online 22 to 24 January 2026, with team Bravo Prime. Windows and Windows Server hardening against the clock. After the opening day we sat 15th nationally within Open Division, Platinum tier, though that was a first-day standing rather than a final placement. This is where the automation framework came from.",
  },
  {
    name: "Stanford Math Tournament",
    result: "Participant",
    year: "2026",
    detail:
      "Competed in the 2026 tournament, an invitational contest run by Stanford students covering algebra, geometry, number theory, and combinatorics.",
  },
];

export const skillGroups = [
  {
    group: "Machine learning and computer vision",
    items: [
      "YOLO",
      "ByteTrack",
      "ONNX Runtime Web",
      "OpenCV",
      "OCR",
      "Optical flow",
      "Feature engineering",
      "Model evaluation",
      "Calibration",
      "Shadow deployment",
    ],
  },
  {
    group: "Software engineering",
    items: [
      "Python",
      "Java",
      "TypeScript",
      "JavaScript",
      "C++",
      "C",
      "C#",
      "PHP",
      "PowerShell",
      "FastAPI",
      "React",
      "REST APIs",
      "Git",
      "Docker",
    ],
  },
  {
    group: "Data and infrastructure",
    items: [
      "PostgreSQL",
      "Redis",
      "MongoDB",
      "Offline-first web workflows",
      "Background workers",
      "Windows Server 2019/2022",
    ],
  },
  {
    group: "Robotics and embedded systems",
    items: [
      "Raspberry Pi Pico",
      "Arduino",
      "Sensor integration",
      "Actuator control",
      "Robot fabrication and assembly",
      "Hardware–software debugging",
    ],
  },
  {
    group: "Mathematics and modeling",
    items: [
      "Advanced calculus",
      "Stochastic calculus",
      "Stochastic differential equations",
      "Numerical simulation",
      "Probabilistic modeling",
    ],
  },
];
