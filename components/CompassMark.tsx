export function CompassMark() {
  return (
    <div className="compass-mark" aria-label="Compass showing north, east, south and west">
      <span className="compass-n">N</span>
      <span className="compass-e">E</span>
      <span className="compass-s">S</span>
      <span className="compass-w">W</span>
      <div className="compass-circle" />
      <div className="compass-line compass-line-v" />
      <div className="compass-line compass-line-h" />
      <div className="compass-dot" />
    </div>
  );
}
