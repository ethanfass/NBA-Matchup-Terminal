export default function WindowBar({ title, color, colors }) {
  const primary = color || colors?.primary;
  const secondary = color || colors?.secondary;
  const style = (primary || secondary)
    ? { '--bar-icon-primary': primary, '--bar-icon-secondary': secondary }
    : undefined;

  return (
    <div className="window-bar" style={style}>
      <span className="title-icon" />
      <span>{title}</span>
      <div className="window-buttons">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
