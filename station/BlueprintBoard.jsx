// BlueprintBoard.jsx — interactive blueprint motor diagram.
// Clickable units, selection highlight, add / remove motors. Reuses PumpMotorUnit.

function BlueprintBoard({ motors, selectedId, onSelect, onAdd, onRemove, animated = true, canAdd = true }) {
  const t = window.SCHEMATIC_THEMES.blueprint;
  const SC = window.STATUS_COLOR;
  const gx = 70, gy = 60, unitH = 200, gap = 20;
  const VW = 980;
  const leftX = 52, rightX = 912;
  const bodyH = motors.length * (unitH + gap);
  const addH = canAdd ? 92 : 16;
  const VH = gy + bodyH + addH + 30;
  const manifoldBot = gy + (motors.length - 1) * (unitH + gap) + 150;

  const fontMono = 'var(--font-mono)';

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }} preserveAspectRatio="xMidYMin meet">
      <defs>
        <pattern id="bb-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M 26 0 L 0 0 0 26" fill="none" stroke={t.grid} strokeWidth="1" />
        </pattern>
        <filter id="bb-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width={VW} height={VH} fill="#08152c" />
      <rect x="0" y="0" width={VW} height={VH} fill="url(#bb-grid)" />

      {/* enclosure */}
      <g stroke={t.dim} strokeWidth={t.sw} fill="none" opacity=".7">
        <rect x={24} y={28} width={VW - 48} height={VH - 56} rx={6} />
        <line x1={24} y1={52} x2={VW - 24} y2={52} strokeDasharray="2 6" opacity=".5" />
      </g>

      {/* selection highlight (behind machinery, no bounding box) */}
      {motors.map((m, i) => {
        if (m.id !== selectedId) return null;
        const oy = gy + i * (unitH + gap);
        return (
          <g key={m.id}>
            <rect x={30} y={oy + 4} width={VW - 60} height={unitH + 14} rx={12} fill="rgba(124,212,255,.07)" stroke="rgba(124,212,255,.22)" strokeWidth="1" />
            <rect x={30} y={oy + 4} width={4} height={unitH + 14} rx={2} fill={t.accent} />
          </g>
        );
      })}

      {/* manifolds + machinery (glow) */}
      <g style={{ filter: `url(#bb-glow)` }}>
        <line x1={leftX} y1={gy + 26} x2={leftX} y2={manifoldBot} stroke={t.stroke} strokeWidth={t.sw * 1.7} />
        <line x1={rightX} y1={gy} x2={rightX} y2={manifoldBot - 20} stroke={t.stroke} strokeWidth={t.sw * 1.7} />

        {motors.map((m, i) => {
          const oy = gy + i * (unitH + gap);
          return (
            <g key={m.id}>
              <line x1={gx + 200} y1={oy + 40} x2={rightX} y2={oy + 40} stroke={t.stroke} strokeWidth={t.sw}
                className={animated && m.status !== 'standby' ? 'md-flow' : ''} strokeDasharray={animated && m.status !== 'standby' ? '8 7' : undefined} opacity={m.status === 'standby' ? 0.4 : 1} />
              <line x1={leftX} y1={oy + 116} x2={gx + 6} y2={oy + 116} stroke={t.stroke} strokeWidth={t.sw}
                className={animated && m.status !== 'standby' ? 'md-flow' : ''} strokeDasharray={animated && m.status !== 'standby' ? '8 7' : undefined} opacity={m.status === 'standby' ? 0.4 : 1} />
              <g transform={`translate(${gx},${oy})`} opacity={m.status === 'standby' ? 0.4 : (m.id === selectedId ? 1 : 0.5)}>
                <window.PumpMotorUnit t={t} status={m.status} animated={animated} />
              </g>
            </g>
          );
        })}
      </g>

      {/* labels + selection + click targets */}
      {motors.map((m, i) => {
        const oy = gy + i * (unitH + gap);
        const sel = m.id === selectedId;
        const col = SC[m.status] || t.stroke;
        const x0 = 36, x1 = 928, y0 = oy + 8, y1 = oy + 214;
        return (
          <g key={m.id}>
            {/* tag + name + chip */}
            <text x={gx + 400} y={oy + 198} textAnchor="middle" fontSize="13" fontWeight="700" fill={sel ? t.accent : t.label} fontFamily={fontMono}>{m.id}</text>
            <text x={gx + 540} y={oy + 198} textAnchor="middle" fontSize="11" fill={t.text}>{m.name}</text>
            <g transform={`translate(${gx + 4},${oy + 26})`}>
              <rect x={0} y={-14} width={66} height={20} rx={4} fill={`${col}22`} />
              <circle cx={11} cy={-4} r={3} fill={col} />
              <text x={38} y={0} textAnchor="middle" fontSize="11" fontWeight="700" fill={col} fontFamily={fontMono}>
                {m.status === 'warn' ? '警告' : m.status === 'standby' ? '備援' : m.status === 'fault' ? '故障' : '運轉'}
              </text>
            </g>
            {/* live readout chip on the motor */}
            {m.status !== 'standby' && (
              <text x={gx + 440} y={oy + 50} textAnchor="middle" fontSize="12" fontFamily={fontMono} fill={t.accent}>
                {m.power_kw} kW · {m.freq} Hz
              </text>
            )}

            {/* click target */}
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="transparent" style={{ cursor: 'pointer' }}
              onClick={() => onSelect && onSelect(m.id)} />
          </g>
        );
      })}

      {/* endpoint labels */}
      <g fontFamily={fontMono}>
        <text x={leftX} y={gy + 12} textAnchor="middle" fontSize="14" fontWeight="700" fill={t.label}>清水池</text>
        <text x={leftX} y={manifoldBot + 18} textAnchor="middle" fontSize="10" fill={t.text}>CLEAR WELL</text>
        <text x={rightX} y={gy - 14} textAnchor="middle" fontSize="14" fontWeight="700" fill={t.label}>配水加壓</text>
        <text x={rightX} y={manifoldBot} textAnchor="middle" fontSize="10" fill={t.text}>DISTRIBUTION</text>
      </g>

      {/* add-motor tile */}
      {canAdd && (
        <g transform={`translate(0,${gy + bodyH - 4})`} style={{ cursor: 'pointer' }} onClick={() => onAdd && onAdd()}>
          <rect x={36} y={0} width={892} height={72} rx={10} fill="rgba(65,166,255,.05)" stroke={t.stroke} strokeWidth="1.2" strokeDasharray="7 6" />
          <g transform="translate(482,36)" stroke={t.accent} strokeWidth="2" fill="none">
            <circle r={13} />
            <line x1={-6} y1={0} x2={6} y2={0} /><line x1={0} y1={-6} x2={0} y2={6} />
          </g>
          <text x={500} y={41} fontSize="14" fontWeight="700" fill={t.label} fontFamily={fontMono}>新增馬達機組</text>
          <text x={500} y={41} dy={0} />
        </g>
      )}
    </svg>
  );
}

window.BlueprintBoard = BlueprintBoard;
