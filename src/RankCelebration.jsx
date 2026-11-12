import { BottomSheet } from "./ui.jsx";
import RankCrest from "./RankCrest.jsx";

export default function RankCelebration({ notice, rank, onClose }) {
  const progress = notice?.rankProgress;
  const percent = progress?.needed ? Math.min(100, (progress.earned / progress.needed) * 100) : 100;
  return <BottomSheet
    open={Boolean(notice)}
    title="Rank reached"
    onClose={onClose}
    className="rank-celebration-sheet"
  >
    {notice && <div className="rank-celebration">
      <span className="rank-celebration-crest-wrap">
        <RankCrest rank={rank} size={86} className="rank-celebration-crest" />
      </span>
      <h3>{notice.rank}</h3>
      <span>Level {notice.level} · {notice.totalXP.toLocaleString()} XP</span>
      <div className="rank-celebration-progress">
        <div className="rank-celebration-xp-track" role="progressbar" aria-label="Rank XP progress" aria-valuemin="0" aria-valuemax={progress?.needed || 1} aria-valuenow={Math.min(progress?.earned || 0, progress?.needed || 1)}>
          <i style={{ "--xp-progress": `${percent}%` }} />
        </div>
        <small>{progress?.nextRank ? `${notice.xpToNextRank.toLocaleString()} XP to ${progress.nextRank}` : "Highest rank"}</small>
      </div>
      <button className="primary-button" type="button" onClick={onClose}>Continue</button>
    </div>}
  </BottomSheet>;
}
