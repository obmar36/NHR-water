// blueprint-ui.jsx — blueprint-styled HTML chrome + live data panels for Style A.

const BP = {
  page: '#08152c',
  card: 'linear-gradient(180deg, rgba(14,34,68,.55), rgba(8,21,44,.5))',
  cardSolid: 'rgba(10,26,52,.6)',
  border: '#1f5b9c',
  borderDim: 'rgba(31,91,156,.5)',
  line: '#41a6ff',
  accent: '#7cd4ff',
  label: '#cfe6ff',
  text: '#6fa8dc',
  textDim: '#43689a',
  mono: 'var(--font-mono)',
};
const SCOL = () => window.STATUS_COLOR;
const statusZh = (s) => s === 'warn' ? '警告' : s === 'standby' ? '備援' : s === 'fault' ? '故障' : '運轉';

function BPCard({ title, en, right, children, style, glow }) {
  return (
    <div style={{
      background: BP.card, border: `1px solid ${BP.borderDim}`, borderRadius: 10,
      boxShadow: glow ? '0 0 0 1px rgba(65,166,255,.12), inset 0 1px 0 rgba(124,212,255,.08)' : 'inset 0 1px 0 rgba(124,212,255,.06)',
      display: 'flex', flexDirection: 'column', minHeight: 0, ...style,
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 13px', borderBottom: `1px solid ${BP.borderDim}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: BP.label, letterSpacing: .5, fontFamily: BP.mono, whiteSpace: 'nowrap' }}>{title}</span>
            {en && <span style={{ fontSize: 9.5, color: BP.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>{en}</span>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// leader-dot row: label .... value
function BPRow({ label, value, vColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
      <span style={{ fontSize: 11, color: BP.text, whiteSpace: 'nowrap', fontFamily: BP.mono }}>{label}</span>
      <span style={{ flex: 1, borderBottom: `1px dashed ${BP.borderDim}`, marginBottom: 3 }} />
      <span style={{ fontSize: 11.5, color: vColor || BP.label, fontWeight: 700, fontFamily: BP.mono, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function BPStat({ label, value, unit, tone }) {
  return (
    <div style={{ background: 'rgba(8,21,44,.5)', border: `1px solid ${BP.borderDim}`, borderRadius: 7, padding: '8px 9px' }}>
      <div style={{ fontSize: 9.5, color: BP.textDim, letterSpacing: .3 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 3 }}>
        <span style={{ fontFamily: BP.mono, fontSize: 17, fontWeight: 700, color: tone || BP.label, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 9.5, color: BP.text }}>{unit}</span>}
      </div>
    </div>
  );
}

// ---- responsive viewport hook ---------------------------------------------
function useVP() {
  const read = () => (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [w, setW] = React.useState(read);
  React.useEffect(() => {
    const on = () => setW(read());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return { width: w, isMobile: w < 760, isTablet: w >= 760 && w < 1140 };
}
window.useVP = useVP;

function BPIco({ name, s = 14 }) {
  const P = {
    overview: <><circle cx="12" cy="12" r="8.5" /><path d="M12 12l4-3M12 5v1.6" /></>,
    analysis: <><path d="M3 17l5-5 4 3 7-8" /><path d="M16 7h5v5" /></>,
    data: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.6 3.6 3 8 3s8-1.4 8-3V5M4 11v6c0 1.6 3.6 3 8 3s8-1.4 8-3v-6" /></>,
    reports: <><path d="M7 2h7l4 4v16H7z" /><path d="M14 2v5h5" /><path d="M10 12h5M10 16h5" /></>,
    ai: <><path d="M4 5h16v11H9l-4 4V5z" /><path d="M8 10h8M8 13h5" /></>,
    alerts: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    access: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>{P[name]}</svg>;
}

// ---- header ----------------------------------------------------------------
function BPHeader({ clock, summary, tab, setTab }) {
  const vp = window.useVP ? window.useVP() : { isMobile: false, isTablet: false };
  const dot = (c) => <span style={{ width: 6, height: 6, borderRadius: 999, background: c, boxShadow: `0 0 6px ${c}`, display: 'inline-block' }} />;
  const tabs = [['overview', '監控總覽'], ['analysis', '節能分析'], ['data', '資料整合'], ['reports', '報表'], ['ai', 'AI 助理'], ['alerts', '操作建議'], ['access', '權限設定']];
  const tabStrip = (
    <div className="bp-tabs" style={{ display: 'flex', gap: 3, background: 'rgba(8,21,44,.6)', border: `1px solid ${BP.borderDim}`, borderRadius: 8, padding: 3, overflowX: 'auto', minWidth: 0 }}>
      {tabs.map(([k, lbl]) => (
        <button key={k} onClick={() => setTab(k)} style={{
          all: 'unset', cursor: 'pointer', padding: vp.isMobile ? '8px 13px' : '6px 11px', borderRadius: 6, fontSize: vp.isMobile ? 12.5 : 11.5, fontWeight: 600,
          color: tab === k ? '#06223f' : BP.text, background: tab === k ? BP.accent : 'transparent', fontFamily: BP.mono, whiteSpace: 'nowrap', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}><BPIco name={k} s={vp.isMobile ? 15 : 14} />{lbl}</button>
      ))}
    </div>
  );
  if (vp.isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '9px 12px', background: 'rgba(8,18,38,.94)', borderBottom: `1px solid ${BP.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="app/assets/NHR_Logo.png" alt="NHR" style={{ height: 18 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BP.label, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{window.STATION.name} <span style={{ fontFamily: BP.mono, fontSize: 10, color: BP.accent }}>{window.STATION.code}</span></div>
            <div style={{ fontSize: 9.5, color: BP.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{window.STATION.section}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BP.mono, fontSize: 9.5, color: '#22C55E', whiteSpace: 'nowrap' }}>{dot('#22C55E')} 線上</span>
        </div>
        {tabStrip}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', height: 54, background: 'rgba(8,18,38,.85)', borderBottom: `1px solid ${BP.border}`, flexShrink: 0 }}>
      <img src="app/assets/NHR_Logo.png" alt="NHR" style={{ height: 22 }} />
      <div style={{ width: 1, height: 26, background: BP.borderDim }} />
      <div style={{ minWidth: 0, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: BP.label, whiteSpace: 'nowrap' }}>{window.STATION.name}
          <span style={{ fontFamily: BP.mono, fontSize: 11, color: BP.accent, marginLeft: 8 }}>{window.STATION.code}</span>
        </div>
        <div style={{ display: vp.isTablet ? 'none' : 'block', fontSize: 10.5, color: BP.text, whiteSpace: 'nowrap' }}>{window.STATION.district} · <span style={{ color: BP.accent }}>{window.STATION.section}</span></div>
      </div>
      <div style={{ marginLeft: 6, minWidth: 0, flex: 1 }}>{tabStrip}</div>
      {!vp.isTablet && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontFamily: BP.mono, color: BP.text, flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{dot('#22C55E')} OPC UA</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{dot('#22C55E')} MQTT</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{dot('#22D3EE')} SQL</span>
          <span style={{ color: BP.borderDim }}>|</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#22C55E' }}>{dot('#22C55E')} 邊緣節點 線上</span>
        </div>
      )}
      <span style={{ color: BP.borderDim, flexShrink: 0 }}>|</span>
      <div style={{ fontFamily: BP.mono, fontSize: 12, color: BP.label, whiteSpace: 'nowrap', flexShrink: 0 }}>{clock}</div>
    </div>
  );
}

// ---- KPI strip -------------------------------------------------------------
function BPKpiStrip({ summary }) {
  const vp = window.useVP ? window.useVP() : { isMobile: false, isTablet: false };
  const cards = [
    ['即時總用電', 'REAL-TIME POWER', summary.total_power.toLocaleString(), 'kW', BP.accent],
    ['即時出水量', 'WATER OUTPUT', summary.total_flow.toLocaleString(), 'm³/h', BP.label],
    ['噸水電耗', 'SPECIFIC ENERGY', summary.sec.toFixed(3), 'kWh/m³', '#22C55E'],
    ['節能率 vs 基準', 'SAVING RATE', summary.saving_pct.toFixed(1), '%', '#22C55E'],
    ['本月累計節省', 'SAVED THIS MONTH', (summary.month_saved_kwh / 1000).toFixed(1), 'MWh', '#7cd4ff'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? 'repeat(2,1fr)' : vp.isTablet ? 'repeat(3,1fr)' : 'repeat(5,1fr)', gap: vp.isMobile ? 8 : 10 }}>
      {cards.map((c, i) => (
        <BPCard key={i} style={{ padding: '10px 13px' }}>
          <div style={{ fontSize: 11.5, color: BP.label, fontWeight: 600 }}>{c[0]}</div>
          <div style={{ fontSize: 9, color: BP.textDim, letterSpacing: .6, textTransform: 'uppercase' }}>{c[1]}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <span style={{ fontFamily: BP.mono, fontSize: 24, fontWeight: 700, color: c[4], lineHeight: 1 }}>{c[2]}</span>
            <span style={{ fontSize: 11, color: BP.text }}>{c[3]}</span>
          </div>
        </BPCard>
      ))}
    </div>
  );
}

// ---- motor list ------------------------------------------------------------
function BPMotorList({ motors, selectedId, onSelect }) {
  return (
    <BPCard title="機組清單" en="Pump Units" right={<span style={{ fontFamily: BP.mono, fontSize: 11, color: BP.text }}>{motors.filter(m => m.status !== 'standby').length}/{motors.length} 運轉</span>}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {motors.map((m) => {
          const sel = m.id === selectedId; const col = SCOL()[m.status];
          return (
            <button key={m.id} onClick={() => onSelect(m.id)} style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
              borderBottom: `1px solid ${BP.borderDim}`, background: sel ? 'rgba(65,166,255,.12)' : 'transparent',
              borderLeft: `2px solid ${sel ? BP.accent : 'transparent'}`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: col, boxShadow: `0 0 6px ${col}` }} />
              <span style={{ fontFamily: BP.mono, fontSize: 12.5, fontWeight: 700, color: BP.label, width: 52 }}>{m.id}</span>
              <span style={{ fontSize: 11.5, color: BP.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <span style={{ fontFamily: BP.mono, fontSize: 12, color: m.status === 'standby' ? BP.textDim : BP.accent }}>{m.status === 'standby' ? '—' : `${m.power_kw} kW`}</span>
              <span style={{ fontFamily: BP.mono, fontSize: 11, color: col, width: 32, textAlign: 'right' }}>{statusZh(m.status)}</span>
            </button>
          );
        })}
      </div>
    </BPCard>
  );
}

// ---- selected motor live readouts + AI recommendation ----------------------
function BPMotorDetail({ motor }) {
  if (!motor) return null;
  const col = SCOL()[motor.status];
  const running = motor.status !== 'standby';
  const stats = running ? [
    ['功率', motor.power_kw.toLocaleString(), 'kW', BP.accent],
    ['VFD 頻率', motor.freq, 'Hz', BP.label],
    ['轉速', motor.rpm.toLocaleString(), 'rpm', BP.label],
    ['流量', motor.flow_m3h.toLocaleString(), 'm³/h', BP.label],
    ['出口揚程', motor.head_m, 'm', BP.label],
    ['出口壓力', motor.pressure_bar, 'bar', BP.label],
    ['泵效率', motor.eff_pct, '%', motor.eff_pct >= 80 ? '#22C55E' : '#F59E0B'],
    ['噸水電耗', motor.sec_kwh_m3, 'kWh/m³', '#22C55E'],
    ['電流', motor.current_a, 'A', BP.label],
    ['軸承溫度', motor.bearing_c, '°C', motor.bearing_c >= 70 ? '#F59E0B' : BP.label],
    ['振動', motor.vib_mm_s, 'mm/s', motor.vib_mm_s >= 4 ? '#F59E0B' : BP.label],
    ['運轉時數', motor.runtime_h.toLocaleString(), 'h', BP.text],
  ] : [['狀態', '備援待命', '', BP.text], ['軸承溫度', motor.bearing_c, '°C', BP.label], ['運轉時數', motor.runtime_h.toLocaleString(), 'h', BP.text]];

  const advise = running && motor.recFreq < motor.freq;
  return (
    <BPCard title={`機組即時數據 · ${motor.id}`} en="Live Telemetry" glow
      right={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: BP.mono, color: col }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: col, boxShadow: `0 0 6px ${col}` }} />{statusZh(motor.status)}</span>}>
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {stats.map((s, i) => <BPStat key={i} label={s[0]} value={s[1]} unit={s[2]} tone={s[3]} />)}
      </div>
      {/* AI recommendation */}
      <div style={{ margin: '0 12px 12px', borderRadius: 9, border: `1px solid ${advise ? 'rgba(245,158,11,.5)' : BP.borderDim}`, background: advise ? 'rgba(245,158,11,.08)' : 'rgba(34,197,94,.07)', padding: '11px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: .5, color: advise ? '#F59E0B' : '#22C55E', fontFamily: BP.mono }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: advise ? '#F59E0B' : '#22C55E', boxShadow: `0 0 6px ${advise ? '#F59E0B' : '#22C55E'}` }} />
            AI 節能建議
          </span>
        </div>
        {advise ? (
          <>
            <div style={{ fontSize: 12.5, color: BP.label, lineHeight: 1.5 }}>
              建議將 <b style={{ fontFamily: BP.mono }}>{motor.id}</b> 變頻 <b style={{ fontFamily: BP.mono, color: '#F59E0B' }}>{motor.freq} → {motor.recFreq} Hz</b>，運轉點更靠近最佳效率區，仍可滿足配水壓力需求。
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 9 }}>
              <span style={{ fontFamily: BP.mono, fontSize: 13, fontWeight: 700, color: '#22C55E' }}>預估節省 {motor.save}%</span>
              <span style={{ fontFamily: BP.mono, fontSize: 11.5, color: BP.text }}>≈ {Math.round(motor.baseline_kw - motor.power_kw)} kW</span>
              <button style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', fontFamily: BP.mono, fontSize: 11.5, color: BP.accent, border: `1px solid ${BP.border}`, padding: '5px 11px', borderRadius: 6 }}>套用建議 →</button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: BP.label, lineHeight: 1.5 }}>
            {running ? '目前運轉點已接近最佳效率區，維持監控即可。' : '機組待命中，啟動後將自動評估最佳運轉頻率。'}
          </div>
        )}
      </div>
    </BPCard>
  );
}

Object.assign(window, { BP, BPCard, BPRow, BPStat, BPHeader, BPKpiStrip, BPMotorList, BPMotorDetail, statusZh });
