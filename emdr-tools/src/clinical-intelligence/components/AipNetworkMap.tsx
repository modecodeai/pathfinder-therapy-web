import { useMemo } from 'react';
import type { AipEdge, AipNode } from '../lib/formulation';

const TYPE_COLORS: Record<string, string> = {
  'presenting-problem': '#0f766e',
  trigger: '#b45309',
  memory: '#1d4ed8',
  'touchstone-candidate': '#7c3aed',
  nc: '#b91c1c',
  'clinical-theme': '#334155',
  pc: '#15803d',
  resource: '#0e7490',
  'future-template': '#a16207',
  target: '#9f1239',
};

function layoutNodes(nodes: AipNode[]): Array<AipNode & { x: number; y: number }> {
  const cols = Math.max(3, Math.ceil(Math.sqrt(nodes.length)));
  return nodes.map((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...n,
      x: 80 + col * 160,
      y: 60 + row * 100,
    };
  });
}

export function AipNetworkMap({
  nodes,
  edges,
}: {
  nodes: AipNode[];
  edges: AipEdge[];
}) {
  const laid = useMemo(() => layoutNodes(nodes), [nodes]);
  const byId = useMemo(() => new Map(laid.map((n) => [n.id, n])), [laid]);
  const width = Math.max(640, ...laid.map((n) => n.x + 120));
  const height = Math.max(320, ...laid.map((n) => n.y + 80));

  if (!nodes.length) {
    return <p className="hint">Network map appears once approved formulation data exists.</p>;
  }

  return (
    <div className="ci-network-map">
      <p className="hint">
        Approved data only. Nodes are never auto-marked Resolved — resolution remains
        therapist-confirmed.
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="AIP network map">
        {edges.map((e) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          return (
            <g key={e.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#94a3b8"
                strokeWidth={1.5}
              />
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 4}
                className="ci-network-edge-label"
              >
                {e.relation.replace(/-/g, ' ')}
              </text>
            </g>
          );
        })}
        {laid.map((n) => (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
            <rect
              x={-70}
              y={-28}
              width={140}
              height={56}
              rx={8}
              fill="#fff"
              stroke={TYPE_COLORS[n.type] ?? '#64748b'}
              strokeWidth={2}
            />
            <text y={-6} textAnchor="middle" className="ci-network-type">
              {n.type.replace(/-/g, ' ')}
            </text>
            <text y={14} textAnchor="middle" className="ci-network-label">
              {n.label.length > 22 ? `${n.label.slice(0, 20)}…` : n.label}
            </text>
          </g>
        ))}
      </svg>
      <ul className="ci-network-legend">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <li key={type}>
            <span style={{ background: color }} />
            {type.replace(/-/g, ' ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
