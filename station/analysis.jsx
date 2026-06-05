// analysis.jsx — pump efficiency curve + energy-saving analysis (Style A page 2).

const BPx = () => window.BP;

// ---- pump efficiency curve: H-Q family + efficiency + operating points ------
function PumpCurve({ motor, height = 320 }) {
  const BP = BPx();
  const wrapRef = React.useRef(null);
  const [w, setW] = React.useState(680);
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(wrapRef.current); return () => ro.disconnect();
  }, []);
  const p = motor.pump;
  const padL = 44, padR = 48, padT = 16, padB = 34;
  const innerW = Math.max(10, w - padL - padR), innerH = height - padT - padB;
  const Qmax = Math.sqrt(p.H0 / p.k) * 1.02;
  const Hmax = Math.ceil(p.H0 / 10) * 10 + 4;
  const X = (Q) => padL + (Q / Qmax) * innerW;
  const Yh = (H) => padT + innerH - (H / Hmax) * innerH;
  const Ye = (e) => padT + innerH - (e / 100) * innerH;

  const headPath = (freq) => {
    const r = freq / 50; const pts = [];
    for (let i = 0; i <= 40; i++) { const Q = (i / 40) * Qmax; const H = r * r * p.H0 - p.k * Q * Q; if (H < 0) break; pts.push(`${i === 0 ? 'M' : 'L'} ${X(Q).toFixed(1)} ${Yh(H).toFixed(1)}`); }
    return pts.join(' ');
  };
  const sysPath = () => { const pts = []; for (let i = 0; i <= 40; i++) { const Q = (i / 40) * Qmax; const H = p.Hstat + p.Rsys * Q * Q; if (H > Hmax) break; pts.push(`${i === 0 ? 'M' : 'L'} ${X(Q).toFixed(1)} ${Yh(H).toFixed(1)}`); } return pts.join(' '); };
  const effPath = () => { const c = window.pumpCurve(p, 50, Qmax); return c.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${X(pt.Q).toFixed(1)} ${Ye(pt.eta).toFixed(1)}`).join(' '); };

  const opNow = window.operatingPoint(p, motor.freq);
  const opRec = window.operatingPoint(p, motor.recFreq);
  const bepH = p.H0 - p.k * p.Qbep * p.Qbep;

  const freqs = [50, 48, 46, 44].filter(f => f <= 50);
  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ display: 'block', fontFamily: BP.mono }}>
        {/* grid + axes */}
        {[0, .25, .5, .75, 1].map((f, i) => {
          const y = padT + innerH * (1 - f);
          return <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={BP.borderDim} strokeWidth="1" strokeDasharray={f === 0 ? '' : '2 4'} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9.5" fill={BP.text}>{Math.round(Hmax * f)}</text>
            <text x={w - padR + 6} y={y + 3} textAnchor="start" fontSize="9.5" fill="#22C55E">{Math.round(100 * f)}</text>
          </g>;
        })}
        {[0, .25, .5, .75, 1].map((f, i) => (
          <text key={i} x={padL + innerW * f} y={height - 8} textAnchor="middle" fontSize="9.5" fill={BP.text}>{Math.round(Qmax * f).toLocaleString()}</text>
        ))}
        <text x={padL - 6} y={11} textAnchor="end" fontSize="9.5" fill={BP.label}>揚程 m</text>
        <text x={w - padR + 6} y={11} textAnchor="start" fontSize="9.5" fill="#22C55E">效率 %</text>
        <text x={padL + innerW / 2} y={height - 8} textAnchor="middle" fontSize="9.5" fill={BP.label} dx="120">流量 Q (m³/h) →</text>

        {/* head-flow family */}
        {freqs.map((f, i) => (
          <path key={f} d={headPath(f)} fill="none" stroke={f === 50 ? BP.line : BP.borderDim}
            strokeWidth={f === 50 ? 2 : 1.2} strokeDasharray={f === 50 ? '' : '4 4'} opacity={f === 50 ? 1 : .8} />
        ))}
        {freqs.filter(f => f < 50).map((f) => { const o = window.operatingPoint(p, f); return <text key={f} x={X(o.Q) - 6} y={Yh(r2(f, p)) } fontSize="8.5" fill={BP.textDim} textAnchor="end">{f}Hz</text>; })}
        {/* system curve */}
        <path d={sysPath()} fill="none" stroke="#F59E0B" strokeWidth="1.6" strokeDasharray="6 4" opacity=".9" />
        {/* efficiency curve */}
        <path d={effPath()} fill="none" stroke="#22C55E" strokeWidth="1.6" strokeDasharray="2 3" />

        {/* BEP */}
        <g>
          <circle cx={X(p.Qbep)} cy={Yh(bepH)} r="4" fill="none" stroke="#22C55E" strokeWidth="1.4" />
          <text x={X(p.Qbep)} y={Yh(bepH) - 9} textAnchor="middle" fontSize="9" fill="#22C55E">BEP</text>
        </g>
        {/* recommended operating point */}
        <g>
          <line x1={X(opRec.Q)} y1={Yh(opRec.H)} x2={X(opRec.Q)} y2={padT + innerH} stroke="#22C55E" strokeWidth="1" strokeDasharray="2 3" opacity=".6" />
          <circle cx={X(opRec.Q)} cy={Yh(opRec.H)} r="6" fill="#22C55E" stroke="#06210f" strokeWidth="1.5" />
          <text x={X(opRec.Q)} y={Yh(opRec.H) + 20} textAnchor="middle" fontSize="9.5" fill="#22C55E" fontWeight="700">建議 {motor.recFreq}Hz</text>
        </g>
        {/* current operating point */}
        <g>
          <line x1={X(opNow.Q)} y1={Yh(opNow.H)} x2={X(opNow.Q)} y2={padT + innerH} stroke={BP.accent} strokeWidth="1" strokeDasharray="2 3" opacity=".6" />
          <circle cx={X(opNow.Q)} cy={Yh(opNow.H)} r="6" fill={BP.accent} stroke="#06223f" strokeWidth="1.5" className="md-pulse" />
          <text x={X(opNow.Q)} y={Yh(opNow.H) - 11} textAnchor="middle" fontSize="9.5" fill={BP.accent} fontWeight="700">目前 {motor.freq}Hz</text>
        </g>
      </svg>
      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, padding: '4px 6px 0', fontSize: 10.5, color: BP.text, fontFamily: BP.mono }}>
        <Leg c={BP.line} t="泵浦揚程曲線 (50Hz)" />
        <Leg c={BP.borderDim} t="降頻曲線 (48/46/44Hz)" dash />
        <Leg c="#F59E0B" t="系統需求曲線" dash />
        <Leg c="#22C55E" t="效率曲線 / BEP" dash />
      </div>
    </div>
  );
}
function r2(f, p) { const o = window.operatingPoint(p, f); return o.H; }
function Leg({ c, t, dash }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span style={{ width: 16, height: 0, borderTop: `2px ${dash ? 'dashed' : 'solid'} ${c}` }} />{t}</span>;
}

// ---- actual vs baseline savings trend --------------------------------------
function SavingsTrend({ range, height = 200 }) {
  const BP = BPx();
  const wrapRef = React.useRef(null);
  const [w, setW] = React.useState(680);
  React.useEffect(() => { if (!wrapRef.current) return; const ro = new ResizeObserver(es => setW(es[0].contentRect.width)); ro.observe(wrapRef.current); return () => ro.disconnect(); }, []);
  const s = window.savingsSeries(range);
  const padL = 46, padR = 12, padT = 12, padB = 24;
  const innerW = Math.max(10, w - padL - padR), innerH = height - padT - padB;
  const all = s.baseline.concat(s.actual);
  const hi = Math.max(...all) * 1.04, lo = Math.min(...all) * 0.9;
  const X = (i, n) => padL + (i / (n - 1)) * innerW;
  const Y = (v) => padT + innerH - ((v - lo) / (hi - lo)) * innerH;
  const path = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${X(i, arr.length).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const area = `${path(s.baseline)} L ${X(s.actual.length - 1, s.actual.length)} ${Y(s.actual[s.actual.length - 1])} ${s.actual.slice().reverse().map((v, i) => `L ${X(s.actual.length - 1 - i, s.actual.length)} ${Y(v)}`).join(' ')} Z`;
  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ display: 'block', fontFamily: BP.mono }}>
        {[0, .5, 1].map((f, i) => { const y = padT + innerH * (1 - f); return <g key={i}><line x1={padL} y1={y} x2={w - padR} y2={y} stroke={BP.borderDim} strokeDasharray={f === 0 ? '' : '2 4'} /><text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill={BP.text}>{Math.round((lo + (hi - lo) * f) / 1000)}k</text></g>; })}
        {s.ticks.map((tk, i) => tk ? <text key={i} x={X(i, s.ticks.length)} y={height - 7} textAnchor="middle" fontSize="9" fill={BP.text}>{tk}</text> : null)}
        <path d={area} fill="rgba(34,197,94,.14)" stroke="none" />
        <path d={path(s.baseline)} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="5 4" />
        <path d={path(s.actual)} fill="none" stroke="#22C55E" strokeWidth="2.2" style={{ filter: 'drop-shadow(0 0 3px rgba(34,197,94,.5))' }} />
      </svg>
      <div style={{ display: 'flex', gap: 16, padding: '2px 6px 0', fontSize: 10.5, color: BP.text, fontFamily: BP.mono }}>
        <Leg c="#F59E0B" t="基準線（固定轉速 / 未優化）" dash />
        <Leg c="#22C55E" t="實際（AI 變頻優化）" />
      </div>
    </div>
  );
}

function PageAnalysis({ motor, summary, motors }) {
  const BP = BPx();
  const vp = window.useVP ? window.useVP() : { isMobile: false };
  const [range, setRange] = React.useState('30D');
  const saved = Math.round(motor.baseline_kw - motor.power_kw);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      {/* row 1: pump curve + recommendation */}
      <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? '1fr' : 'minmax(0,1.55fr) minmax(0,1fr)', gap: 12 }}>
        <window.BPCard title={`泵浦效率曲線 · ${motor.id}`} en="Pump Curve · Operating Point" glow
          right={<span style={{ fontFamily: BP.mono, fontSize: 11, color: BP.text }}>{motor.name}</span>}>
          <div style={{ padding: '12px 14px' }}>
            {motor.status === 'standby'
              ? <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BP.textDim, fontFamily: BP.mono }}>機組待命中 — 啟動後顯示運轉點</div>
              : <PumpCurve motor={motor} />}
          </div>
        </window.BPCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <window.BPCard title="最佳運轉建議" en="Optimization">
            <div style={{ padding: 13 }}>
              {motor.status !== 'standby' && motor.recFreq < motor.freq ? (
                <>
                  <div style={{ fontSize: 13, color: BP.label, lineHeight: 1.55 }}>
                    {motor.id} 目前運轉點偏離最佳效率區右側（過量揚送）。降頻可使運轉點左移、更接近 BEP，於滿足配水壓力下降低軸功率。
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                    <FreqBox label="目前頻率" v={`${motor.freq} Hz`} sub={`${motor.power_kw} kW`} tone={BP.accent} />
                    <FreqBox label="建議頻率" v={`${motor.recFreq} Hz`} sub={`${motor.power_kw - saved} kW`} tone="#22C55E" />
                  </div>
                  <div style={{ marginTop: 12, padding: '11px 12px', borderRadius: 9, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: BP.mono, fontSize: 26, fontWeight: 700, color: '#22C55E' }}>{motor.save}%</span>
                      <span style={{ fontSize: 12, color: BP.text }}>單機預估節能 ≈ {saved} kW</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: BP.label, lineHeight: 1.6 }}>
                  {motor.status === 'standby' ? '機組待命中，啟動後系統會自動找出最節能的運轉頻率。' : '運轉點已接近最佳效率區，維持目前頻率即可，持續監控即時數據。'}
                </div>
              )}
            </div>
          </window.BPCard>
          <window.BPCard title="降頻前後對照" en="Before / After">
            <div style={{ padding: 13, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              <window.BPStat label="效率變化" value={motor.status === 'standby' ? '—' : `+${(motor.eff_pct ? 1.6 : 0).toFixed(1)}`} unit="%" tone="#22C55E" />
              <window.BPStat label="軸功率" value={motor.status === 'standby' ? '—' : `-${saved}`} unit="kW" tone="#22C55E" />
              <window.BPStat label="配水壓力" value={summary.header_bar} unit="bar" tone={BP.label} />
            </div>
          </window.BPCard>
        </div>
      </div>

      {/* row 2: savings proof */}
      <window.BPCard title="實際 vs 基準線 能耗" en="Verified Savings" glow
        right={<Seg range={range} setRange={setRange} />}>
        <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? '1fr' : 'minmax(0,1.7fr) minmax(0,1fr)', gap: 14, padding: 14 }}>
          <SavingsTrend range={range} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <window.BPStat label="本月累計節省" value={(summary.month_saved_kwh / 1000).toFixed(1)} unit="MWh" tone="#22C55E" />
              <window.BPStat label="節省電費" value={`$${(summary.month_saved_cost / 10000).toFixed(1)}萬`} unit="NT$" tone="#7cd4ff" />
              <window.BPStat label="減碳量" value={summary.month_saved_co2} unit="t CO₂" tone="#22C55E" />
              <window.BPStat label="站台節能率" value={summary.saving_pct} unit="%" tone="#22C55E" />
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(8,21,44,.5)', border: `1px solid ${BP.borderDim}`, fontSize: 11.5, color: BP.text, lineHeight: 1.6 }}>
              與導入前同期相比，全站噸水電耗下降 <b style={{ color: '#22C55E', fontFamily: BP.mono }}>{summary.saving_pct}%</b>。基準線採固定轉速＋閥門節流之歷史耗能推估。
              <div style={{ marginTop: 5, color: BP.textDim, fontSize: 10.5 }}>※ 模擬數據，待客戶測試資料替換後重新校正。</div>
            </div>
          </div>
        </div>
      </window.BPCard>

      <ProjectionPanel motors={motors} summary={summary} />
    </div>
  );
}

function ProjectionPanel({ motors, summary }) {
  const BP = BPx();
  const vp = window.useVP ? window.useVP() : { isMobile: false };
  const [period, setPeriod] = React.useState('月');
  const hours = { '日': 24, '週': 168, '月': 720 }[period];
  const running = (motors || []).filter(m => m.status !== 'standby');
  const base = running.reduce((s, m) => s + (m.baseline_kw || 0), 0) || 0.001;
  const now = running.reduce((s, m) => s + (m.power_kw || 0), 0);
  const opt = running.reduce((s, m) => { const o = window.operatingPoint(m.pump, Math.min(m.freq, m.recFreq)); return s + (o.P || 0); }, 0);
  const kwh = v => Math.round(v * hours);
  const pct = (a, b) => b ? ((b - a) / b * 100) : 0;
  const nowPct = pct(now, base), extraPct = now ? ((now - opt) / now * 100) : 0;
  const extraKwh = Math.round((now - opt) * hours);
  const extraCost = Math.round(extraKwh * (summary.tariff || 3.05));
  const extraCo2 = +((extraKwh * (summary.co2 || 0.495)) / 1000).toFixed(1);
  const bars = [['基準線（未優化）', base, '#F59E0B'], ['目前（已優化）', now, BP.accent], ['套用全部建議（預估）', opt, '#22C55E']];
  const max = base * 1.04;
  const pseg = ['日', '週', '月'];
  return (
    <window.BPCard title="參數調整節能預估" en="Projected Savings · What-if" glow
      right={
        <span style={{ display: 'inline-flex', gap: 2, background: 'rgba(8,21,44,.6)', borderRadius: 7, padding: 2, border: `1px solid ${BP.borderDim}` }}>
          {pseg.map(p => <button key={p} onClick={() => setPeriod(p)} style={{ all: 'unset', cursor: 'pointer', padding: '4px 13px', borderRadius: 5, fontSize: 11.5, fontFamily: BP.mono, fontWeight: 600, color: period === p ? '#06223f' : BP.text, background: period === p ? BP.accent : 'transparent' }}>{p}報</button>)}
        </span>
      }>
      <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? '1fr' : 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16, padding: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: BP.textDim, fontFamily: BP.mono, marginBottom: 12 }}>本{period}用電量比較（kWh）</div>
          {bars.map(([lbl, kw, c], i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
                <span style={{ color: BP.label }}>{lbl}</span>
                <span style={{ fontFamily: BP.mono, color: c, fontWeight: 700 }}>{kwh(kw).toLocaleString()} kWh</span>
              </div>
              <div style={{ height: 16, borderRadius: 4, background: 'rgba(8,21,44,.6)', border: `1px solid ${BP.borderDim}`, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, kw / max * 100)}%`, background: c, borderRadius: 4, transition: 'width .5s' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ padding: '12px 13px', borderRadius: 10, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.4)' }}>
            <div style={{ fontSize: 11, color: BP.text }}>若套用全部建議參數，本{period}預估再節能</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: BP.mono, fontSize: 30, fontWeight: 700, color: '#22C55E' }}>{extraPct.toFixed(1)}%</span>
              <span style={{ fontFamily: BP.mono, fontSize: 12, color: BP.text }}>≈ {extraKwh.toLocaleString()} kWh</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <window.BPStat label="目前節能率" value={nowPct.toFixed(1)} unit="%" tone="#22C55E" />
            <window.BPStat label="可再節電費" value={`$${extraCost.toLocaleString()}`} unit="NT$" tone="#7cd4ff" />
            <window.BPStat label="可再減碳" value={extraCo2} unit="t CO₂" tone="#22C55E" />
            <window.BPStat label="涵蓋機組" value={running.length} unit="台" tone={BP.label} />
          </div>
          <div style={{ fontSize: 10.5, color: BP.textDim, lineHeight: 1.5 }}>依各泵浦效率曲線與親和定律推估；切換日/週/月可見不同期間累計成效。※ 模擬數據。</div>
        </div>
      </div>
    </window.BPCard>
  );
}

function FreqBox({ label, v, sub, tone }) {
  const BP = BPx();
  return <div style={{ padding: '9px 11px', borderRadius: 8, background: 'rgba(8,21,44,.5)', border: `1px solid ${BP.borderDim}` }}>
    <div style={{ fontSize: 10, color: BP.textDim }}>{label}</div>
    <div style={{ fontFamily: BP.mono, fontSize: 20, fontWeight: 700, color: tone, marginTop: 2 }}>{v}</div>
    <div style={{ fontFamily: BP.mono, fontSize: 10.5, color: BP.text }}>{sub}</div>
  </div>;
}
function Seg({ range, setRange }) {
  const BP = BPx();
  return <div style={{ display: 'inline-flex', gap: 2, background: 'rgba(8,21,44,.6)', borderRadius: 7, padding: 2, border: `1px solid ${BP.borderDim}` }}>
    {['7D', '30D'].map(r => <button key={r} onClick={() => setRange(r)} style={{ all: 'unset', cursor: 'pointer', padding: '4px 11px', borderRadius: 5, fontSize: 11, fontFamily: BP.mono, fontWeight: 600, color: range === r ? '#06223f' : BP.text, background: range === r ? BP.accent : 'transparent' }}>{r}</button>)}
  </div>;
}

Object.assign(window, { PumpCurve, SavingsTrend, PageAnalysis, ProjectionPanel });
