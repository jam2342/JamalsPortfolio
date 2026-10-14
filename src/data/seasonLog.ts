/**
 * The FRCMOB season log: one stop per moment that changed the project.
 *
 * Sources: the FRCMOB git history and merged pull requests (dates in Texas
 * time), Team 5417's 2026 event list from the FRCMOB database, and the project
 * docs already cited on the case study. Commit counts are unique commits across
 * all branches, `git log --all`, counted per Monday-start week.
 */

export type Stop = {
  /** ISO date the stop is placed at. */
  date: string;
  /** Date as shown, e.g. "Mar 8–9". */
  when: string;
  title: string;
  text: string;
  /** The one number worth remembering, if there is one. */
  stat?: string;
};

/** Commits per week, starting Monday 9 February 2026. Last week is partial. */
export const weeksStart = "2026-02-09";
export const commitsPerWeek = [
  17, 18, 13, 88, 5, 5, 0, 5, 1, 6, 11, 2, 1, 8, 1, 2, 0, 2, 17, 5, 0, 3, 0, 0, 0,
  0, 3, 61, 4, 11, 0, 0, 80, 141, 71, 54,
];

export const stops: Stop[] = [
  {
    date: "2026-02-10",
    when: "Feb 10",
    title: "Started for Team 5417",
    text: "First commit: a React frontend and a Dockerized FastAPI backend pulling match data from The Blue Alliance.",
    stat: "Day 1",
  },
  {
    date: "2026-02-11",
    when: "Feb 11",
    title: "The game, as data",
    text: "The 2026 rules went into a per-season config, and the field's CAD model was lined up with its AprilTags to place everything on the field.",
  },
  {
    date: "2026-02-12",
    when: "Feb 12",
    title: "First detector",
    text: "A YOLO model found robots for the first time. The commit message was “working yolo.”",
  },
  {
    date: "2026-02-20",
    when: "Feb 20",
    title: "Week 0",
    text: "The first 2026 matches were played in Nashua, New Hampshire. I ran the pipeline on them the same day.",
  },
  {
    date: "2026-02-25",
    when: "Feb 25",
    title: "Live scouting rooms",
    text: "Several scouts in one room, joined with a room key and synced live over WebSockets.",
  },
  {
    date: "2026-02-26",
    when: "Feb 26",
    title: "Cycle time, fixed",
    text: "It didn't match the game, so I re-derived it from the manual: collect fuel, drive back, score during your alliance's active window.",
    stat: "48 commits in February",
  },
  {
    date: "2026-03-04",
    when: "Mar 4",
    title: "Final before comp",
    text: "Match video pulled straight from YouTube and broken down automatically, with nobody touching it.",
    stat: "Every 12 h",
  },
  {
    date: "2026-03-07",
    when: "Mar 7",
    title: "Live on Oracle Cloud",
    text: "The backend went to a cloud container for the first time, and the rest of the day went to keeping room creation alive through database errors.",
    stat: "29 commits that day",
  },
  {
    date: "2026-03-08",
    when: "Mar 8–9",
    title: "League City",
    text: "First event of the season, FIT District Space City @ League City. “Version 1.0” landed on the first afternoon, and fixes to rooms, search and alliances kept landing all weekend.",
    stat: "29 commits over the event",
  },
  {
    date: "2026-03-20",
    when: "Mar 20–21",
    title: "Waco",
    text: "Second event, FIT District Waco. March ended as the busiest month until August.",
    stat: "102 commits in March",
  },
  {
    date: "2026-04-05",
    when: "Apr 5",
    title: "Heat maps",
    text: "Where each robot spends its match, drawn on the field instead of summarized in a number.",
  },
  {
    date: "2026-04-13",
    when: "Apr 11–13",
    title: "Auto-scout drafts",
    text: "Video findings became draft scouting forms for a person to review, and the first machine-learning models went in behind them.",
  },
  {
    date: "2026-04-17",
    when: "Apr 16–18",
    title: "District Championship",
    text: "FIRST In Texas District Championship, Mercury Division. The frontend moved to Vercel the same week.",
  },
  {
    date: "2026-04-21",
    when: "Apr 21",
    title: "Bigger than Texas",
    text: "Breakdowns opened up to events outside Texas.",
  },
  {
    date: "2026-05-15",
    when: "May 15",
    title: "Secrets out of git",
    text: "Environment files came out of tracking and the history was rewritten without them. The cleanup that was lost in the rewrite got redone the same day.",
  },
  {
    date: "2026-05-26",
    when: "May 26",
    title: "v2 ships",
    text: "v1's 98% met the locked holdout and became 70%. v2 shipped at 71.7%, behind a holdout tripwire.",
    stat: "71.7%",
  },
  {
    date: "2026-06-20",
    when: "Jun 20",
    title: "Four taps",
    text: "AprilTags were unreadable from the stands, so calibration became four taps on the field corners.",
  },
  {
    date: "2026-08-21",
    when: "Aug 21",
    title: "Remodel merged",
    text: "The on-device match breakdown and a full frontend remodel merged together.",
  },
  {
    date: "2026-09-24",
    when: "Sep 24",
    title: "Backend revived",
    text: "Back up on a free Oracle VM after months switched off.",
    stat: "$0 a month",
  },
  {
    date: "2026-09-25",
    when: "Sep 25",
    title: "First full video run",
    text: "The broadcast pipeline ran end to end in production for the first time.",
  },
  {
    date: "2026-09-26",
    when: "Sep 26",
    title: "HTTPS and workspaces",
    text: "The API went HTTPS-only, and team workspaces made each team's scouting private.",
  },
  {
    date: "2026-09-27",
    when: "Sep 27",
    title: "Database moves in",
    text: "Postgres and Redis moved onto the same VM as the API.",
    stat: "911 → 18 ms",
  },
  {
    date: "2026-09-28",
    when: "Sep 28",
    title: "Broadcast video retired",
    text: "Broadcasts couldn't tell robots apart, so vision moved onto the scout's phone.",
    stat: "11 GB → 1.65 GB",
  },
  {
    date: "2026-09-29",
    when: "Sep 29",
    title: "Phone breakdown speed",
    text: "Uploads decoded straight from the file instead of played back in real time.",
    stat: "85 s → 33 s",
  },
  {
    date: "2026-09-30",
    when: "Sep 30",
    title: "Detector v4",
    text: "The labels were the bug. Training only on complete frames lifted the holdout score.",
    stat: "77.9%",
  },
  {
    date: "2026-10-01",
    when: "Oct 1",
    title: "Offline and native",
    text: "Event packs for venues with no signal, and the first iOS and Android shells.",
  },
  {
    date: "2026-10-04",
    when: "Oct 4",
    title: "The formula beats ML",
    text: "On an as-of replay a fuel-rate formula beat the model, so the formula shipped.",
    stat: "74.9%",
  },
  {
    date: "2026-10-05",
    when: "Oct 5",
    title: "Rooms without keys",
    text: "Leads assign scouts to robots inside their team, no room key needed. Also a new logo, and a full re-ingest of the season.",
    stat: "299 of 299 events",
  },
  {
    date: "2026-10-12",
    when: "Oct 12",
    title: "Speed round",
    text: "Fewer requests, edge caching, and real-user timings to measure the next round against.",
    stat: "31 → 9 requests",
  },
  {
    date: "2026-10-13",
    when: "Oct 13",
    title: "Polish and cleanup",
    text: "A phone-width consistency guard, and a sweep that removed dead code and a job rewriting the same rows every 3 hours.",
    stat: "1,662 rows, every 3 h",
  },
];
