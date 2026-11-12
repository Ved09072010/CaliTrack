const CREST_PATHS = {
  round: "M28 5a21 21 0 1 0 0 42 21 21 0 0 0 0-42Z",
  shield: "M28 4 46 11v14c0 12-7 21-18 27C17 46 10 37 10 25V11Z",
  hex: "m17 5 22 0 12 20-12 20H17L5 25Z",
  diamond: "M28 4 49 27 28 51 7 27Z",
  crown: "m7 15 11 9 10-15 10 15 11-9-4 28H11Z",
  star: "m28 4 6 16 17 1-13 11 4 17-14-9-14 9 4-17L5 21l17-1Z",
  laurel: "M28 5v44M22 10c-12 2-17 13-13 25 3 8 9 12 19 14M34 10c12 2 17 13 13 25-3 8-9 12-19 14M13 18l9 5m-11 5 10 3m-7 7 9 1m21-21-9 5m11 5-10 3m7 7-9 1",
  octagon: "m19 4 18 0 13 13v18L37 48H19L6 35V17Z",
};

const CREST_MARKS = {
  round: "M20 28h16m-8-8v16",
  shield: "m19 28 6 6 12-13",
  hex: "M20 18h16v16H20zM24 25h8",
  diamond: "M28 18v19m-8-10h16",
  crown: "M19 30h18m-15 6h12",
  star: "M28 20v17m-7-8h14",
  laurel: "M21 27h14m-11 7h8",
  octagon: "M21 20h14v14H21zM24 27h8",
};

export default function RankCrest({ rank, size = 56, className = "" }) {
  const shape = rank?.crest || "round";
  return <svg
    className={`rank-crest ${className}`.trim()}
    viewBox="0 0 56 56"
    width={size}
    height={size}
    role="img"
    aria-label={`${rank?.name || "Rookie"} rank crest`}
    style={{ "--crest-metal": rank?.metal || "#9b8067" }}
  >
    <path className="rank-crest-frame" d={CREST_PATHS[shape]} />
    <path className="rank-crest-mark" d={CREST_MARKS[shape]} />
  </svg>;
}
