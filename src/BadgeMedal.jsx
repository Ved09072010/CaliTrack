const MEDAL_MARKS = {
  seed: <path d="M20 33c-7-5-7-13 0-17 7 4 7 12 0 17Zm0-3v-9m0 4 4-3m-4 5-4-3" />,
  ten: <><path d="M16 21v12m-2-10 2-2 2 2m4 0h4a3 3 0 0 1 0 6h-4m0 0h4a3 3 0 0 1 0 6h-4" /></>,
  branch: <><path d="M20 34V19m0 5-6-5m6 2 6-5" /><circle cx="14" cy="18" r="2" /><circle cx="26" cy="16" r="2" /><circle cx="20" cy="35" r="2" /></>,
  pull: <><path d="M13 19v5m14-5v5M11 24h18M15 24v8m10-8v8m-10 0h10" /><path d="m17 16 3-3 3 3" /></>,
  pistol: <><path d="M15 19c4-3 8-1 9 3l-2 4m-7-7-3 7 7 2 4-3m-4-1 5 7m-5-7-5 7" /><circle cx="20" cy="15" r="2" /></>,
  handstand: <><path d="M20 20v13m-5 0h10m-5-13-7-4m7 4 7-4m-7 4-4 9m4-9 4 9" /><circle cx="20" cy="16" r="2" /></>,
  lsit: <path d="M14 19v13h14M14 25h10" />,
  streak: <><path d="M20 13c4 5 8 8 5 15a6 6 0 0 1-11 0c-2-5 1-8 3-11 0 4 2 5 3 6 2-4 1-7 0-10Z" /><path d="M18 29a2 2 0 0 0 4 0" /></>,
  workout: <><path d="M12 23v9m16-9v9m-19-6h22m-15-5h6m-6 14h6" /><path d="M16 20h8v16h-8z" /></>,
  volume: <><path d="M13 32V22m14 10V22m-17 5h20m-13-5v10m6-10v10" /><path d="M18 17h4m-2-2v4" /></>,
  variety: <><circle cx="20" cy="25" r="8" /><path d="M20 17v-5m-8 13H7m21 0h5M20 33v4m-6-18-3-3m15 3 3-3m-14 3h10v10H15z" /></>,
  record: <><path d="m20 15 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8Z" /></>,
  rank: <><path d="m13 34 2-14 5 5 5-5 2 14Zm2-18 5-4 5 4" /><circle cx="20" cy="26" r="2" /></>,
};

export default function BadgeMedal({ kind = "seed", earned = false }) {
  return <svg
    className={`badge-medal${earned ? " is-earned" : " is-locked"}`}
    viewBox="0 0 40 46"
    aria-hidden="true"
    focusable="false"
  >
    <path className="badge-medal-ribbon" d="M11 3h7l2 9 2-9h7l-4 14H15Z" />
    <circle className="badge-medal-face" cx="20" cy="27" r="12" />
    {MEDAL_MARKS[kind] || MEDAL_MARKS.seed}
  </svg>;
}
