import BadgeMedal from "./BadgeMedal.jsx";
import { Icon, IconButton } from "./ui.jsx";

export default function BadgeGrid({ badges, onBack }) {
  const earned = badges.filter((badge) => badge.earned).length;
  return <>
    <header className="skill-branch-header">
      <IconButton label="Back to skill overview" onClick={onBack}><Icon name="back" /></IconButton>
      <div><h2>Badges</h2><span>{earned} / {badges.length} earned</span></div>
    </header>
    <div className="skill-badge-grid">
      {badges.map((badge) => <article className={`skill-badge-card${badge.earned ? " is-earned" : " is-locked"}`} key={badge.id}>
        <BadgeMedal kind={badge.medal} earned={badge.earned} />
        <span><strong>{badge.name}</strong><small>{badge.requirement}</small></span>
      </article>)}
    </div>
  </>;
}
