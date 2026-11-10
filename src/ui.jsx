import { useEffect, useRef } from "react";

export function Icon({ name, size = 20 }) {
  const paths = {
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9z" /></>,
    plus: <path d="M12 5v14m-7-7h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="m9 18 6-6-6-6" />,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function IconButton({ label, onClick, children, className = "" }) {
  return <button className={`icon-button ${className}`.trim()} type="button" aria-label={label} onClick={onClick}>{children}</button>;
}

export function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="screen-segments" role="group" aria-label={label}>
      {options.map((option) => (
        <button className={value === option ? "is-selected" : ""} type="button" aria-pressed={value === option} key={option} onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

export function QuickChips({ label, items, onSelect, getLabel = (item) => item, emptyText }) {
  if (!items.length && !emptyText) return null;
  return (
    <section className="quick-chip-section" aria-label={label}>
      <div className="quick-chip-list">
        {items.map((item, index) => (
          <button className="quick-chip" type="button" key={item.id || `${getLabel(item)}-${index}`} onClick={() => onSelect(item)}>
            {getLabel(item)}
          </button>
        ))}
        {!items.length && <span className="muted">{emptyText}</span>}
      </div>
    </section>
  );
}

export function BottomSheet({ open, title, onClose, children, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      className={`bottom-sheet ${className}`.trim()}
      ref={ref}
      aria-labelledby="bottom-sheet-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="bottom-sheet-content">
        <div className="bottom-sheet-heading">
          <span className="sheet-handle" aria-hidden="true" />
          <h2 id="bottom-sheet-title">{title}</h2>
          <IconButton label="Close panel" onClick={onClose}><Icon name="close" /></IconButton>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function ProgressRing({ label, value, total, color, size = 92 }) {
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  return (
    <div className="progress-ring" role="img" aria-label={`${label}: ${value} of ${total}`}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ "--ring-color": color, "--ring-offset": circumference * (1 - progress) }}>
        <circle className="ring-track" cx="50" cy="50" r={radius} />
        <circle className="ring-value" cx="50" cy="50" r={radius} />
      </svg>
      <span className="ring-number">{value}<small> / {total}</small></span>
      <span className="ring-label">{label}</span>
    </div>
  );
}

export function SectionHeading({ title, action, onAction }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {action && <button className="quiet-link" type="button" onClick={onAction}>{action}</button>}
    </div>
  );
}
