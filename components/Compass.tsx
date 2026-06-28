export function Compass() {
  return (
    <div className="compass" aria-label="Compass showing north, east, south and west">
      <span className="compass-n">N</span>
      <span className="compass-e">E</span>
      <span className="compass-s">S</span>
      <span className="compass-w">W</span>
      <span className="compass-ring" />
      <span className="compass-needle compass-needle-vertical" />
      <span className="compass-needle compass-needle-horizontal" />
      <span className="compass-dot" />
    </div>
  );
}
