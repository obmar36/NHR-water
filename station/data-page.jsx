// data-page.jsx — 資料整合與來源 (Data Integration) for the motor station.

const DATA_SOURCES = [
  { id: 'OPC UA', icon: '◈', addr: 'opc.tcp://10.20.1.5:4840', status: '連線中', sc: '#22C55E', tag: 18, rate: '1s', note: '讀取現場 SCADA / PLC 即時 Tag：馬達功率、頻率、轉速、壓力、流量等高可靠度點位。' },
  { id: 'MQTT', icon: '⇄', addr: 'mqtt://10.20.1.6:1883', status: '訂閱中', sc: '#22C55E', tag: 12, rate: '1s', note: '訂閱邊緣感測：軸承溫度、振動、流量計推送資料。' },
  { id: 'SQL Server', icon: '▤', addr: 'WTP2_HIST.dbo.History', status: '同步中', sc: '#22D3EE', tag: '—', rate: '5m', note: '歷史庫，供報表與基準線計算；定時批次同步。' },
  { id: 'CSV 匯入', icon: '⤓', addr: 'pump_history_export.csv', status: '已匯入', sc: '#22C55E', tag: 286, rate: '手動', note: '客戶測試資料 / 歷史匯出，用於模型訓練與校正。' },
];

const TAG_DICT = [
  ['POWER_KW', '即時功率', 'kW', '0–600', '1s', 'OPC UA'],
  ['FREQ_HZ', 'VFD 變頻器頻率', 'Hz', '0–50', '1s', 'OPC UA'],
  ['SPEED_RPM', '轉速', 'rpm', '0–1500', '1s', 'OPC UA'],
  ['FLOW_M3H', '出水流量', 'm³/h', '0–5000', '1s', 'MQTT'],
  ['PRESS_BAR', '出口壓力', 'bar', '0–10', '1s', 'OPC UA'],
  ['CURR_A', '電流', 'A', '0–800', '1s', 'OPC UA'],
  ['EFF_PCT', '泵效率（計算）', '%', '0–100', '5s', '計算'],
  ['BEARING_C', '軸承溫度', '°C', '0–120', '5s', 'MQTT'],
  ['VIB_MMS', '振動速度', 'mm/s', '0–20', '1s', 'MQTT'],
];

function buildRawRows() {
  const rows = [];
  const stamp = (s) => `2026-06-05T09:14:${String(s).padStart(2, '0')}+08:00`;
  const fields = [
    ['POWER_KW', 'kW', m => m.power_kw],
    ['FREQ_HZ', 'Hz', m => m.freq],
    ['SPEED_RPM', 'rpm', m => m.rpm],
    ['FLOW_M3H', 'm³/h', m => m.flow_m3h],
    ['PRESS_BAR', 'bar', m => m.pressure_bar],
    ['CURR_A', 'A', m => m.current_a],
    ['EFF_PCT', '%', m => m.eff_pct],
    ['BEARING_C', '°C', m => m.bearing_c],
    ['VIB_MMS', 'mm/s', m => m.vib_mm_s],
  ];
  let s = 0;
  (window.MOTORS || []).forEach(m => {
    fields.forEach(([f, unit, get]) => {
      const q = m.status === 'standby' && (f === 'FLOW_M3H' || f === 'EFF_PCT' || f === 'PRESS_BAR') ? '64 · Uncertain' : '192 · Good';
      rows.push({ t: stamp(s % 60), site: 'WTP2', asset: m.id, tag: `WTP2.DIST.${m.id}.${f}`, val: get(m), unit, q });
    });
    s += 2;
  });
  rows.push({ t: stamp(0), site: 'WTP2', asset: 'PT-201', tag: 'WTP2.DIST.HDR.PRESS_BAR', val: 4.6, unit: 'bar', q: '192 · Good' });
  rows.push({ t: stamp(0), site: 'WTP2', asset: 'LIT-201', tag: 'WTP2.CLEARWELL.LIT201.LEVEL_PCT', val: 87, unit: '%', q: '192 · Good' });
  return rows;
}

function DataIntegration() {
  const BP = window.BP;
  const vp = window.useVP ? window.useVP() : { isMobile: false };
  const [active, setActive] = React.useState('OPC UA');
  const [tab, setTab] = React.useState('raw');
  const rows = React.useMemo(buildRawRows, []);
  const src = DATA_SOURCES.find(s => s.id === active) || DATA_SOURCES[0];
  const th = (c) => ({ textAlign: 'left', padding: '9px 13px', fontSize: 10.5, color: BP.textDim, fontFamily: BP.mono, borderBottom: `1px solid ${BP.borderDim}`, whiteSpace: 'nowrap', ...c });
  const td = (c) => ({ padding: '7px 13px', fontSize: 11.5, color: BP.text, fontFamily: BP.mono, borderBottom: `1px solid ${BP.borderDim}`, whiteSpace: 'nowrap', ...c });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, height: '100%', overflow: 'auto' }}>
      {/* source cards */}
      <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10, flexShrink: 0 }}>
        {DATA_SOURCES.map(s => {
          const sel = s.id === active;
          return (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              all: 'unset', cursor: 'pointer', borderRadius: 10, padding: '12px 14px',
              background: BP.card, border: `1px solid ${sel ? BP.accent : BP.borderDim}`,
              boxShadow: sel ? `0 0 0 1px ${BP.accent}55` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(65,166,255,.12)', color: BP.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: BP.label }}>{s.id}</span>
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: BP.mono, fontSize: 10.5, color: s.sc }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: s.sc, boxShadow: `0 0 6px ${s.sc}` }} />{s.status}</span>
              </div>
              <div style={{ fontFamily: BP.mono, fontSize: 11, color: BP.text, marginTop: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.addr}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontFamily: BP.mono, fontSize: 11, color: BP.textDim }}>
                <span>Tag <b style={{ color: BP.accent }}>{s.tag}</b></span>
                <span>取樣 <b style={{ color: BP.label }}>{s.rate}</b></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* selected source detail + format mapping */}
      <window.BPCard glow style={{ flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? '1fr' : 'minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr)', gap: 0 }}>
          <div style={{ padding: 14, borderRight: `1px solid ${BP.borderDim}` }}>
            <span style={{ fontFamily: BP.mono, fontSize: 10.5, fontWeight: 700, color: BP.accent, background: 'rgba(65,166,255,.14)', padding: '2px 8px', borderRadius: 4 }}>{src.id}</span>
            <span style={{ fontSize: 10.5, color: BP.textDim, marginLeft: 8 }}>點擊上方卡片切換來源</span>
            <div style={{ fontSize: 12.5, color: BP.label, lineHeight: 1.6, marginTop: 9 }}>{src.note}</div>
          </div>
          <div style={{ padding: 14, borderRight: `1px solid ${BP.borderDim}` }}>
            <div style={{ fontSize: 10.5, color: BP.textDim, fontFamily: BP.mono }}>後端對應 ACTION</div>
            <div style={{ fontFamily: BP.mono, fontSize: 12, color: BP.accent, marginTop: 8, lineHeight: 1.8 }}>get_pump_tag_latest<br />get_pump_tag_history</div>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 10.5, color: BP.textDim, fontFamily: BP.mono }}>欄位與品質</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {['timestamp', 'site_id', 'asset_id', 'tag_name', 'value', 'unit', 'quality'].map(f => (
                <span key={f} style={{ fontFamily: BP.mono, fontSize: 10, color: BP.text, border: `1px solid ${BP.borderDim}`, borderRadius: 4, padding: '2px 6px' }}>{f}</span>
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: BP.textDim, marginTop: 8, lineHeight: 1.5 }}>quality 採 OPC HDA 標準（192=Good / 64=Uncertain / 0=Bad）。</div>
          </div>
        </div>
      </window.BPCard>

      {/* raw data browse */}
      <window.BPCard title="原始資料瀏覽" en={`SCADA Historian · ${rows.length} 筆`} glow style={{ flex: 1, minHeight: 360 }}
        right={
          <span style={{ display: 'flex', gap: 8 }}>
            <span style={{ display: 'inline-flex', gap: 2, background: 'rgba(8,21,44,.6)', borderRadius: 7, padding: 2, border: `1px solid ${BP.borderDim}` }}>
              {[['raw', '原始時序'], ['dict', 'Tag 字典']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} style={{ all: 'unset', cursor: 'pointer', padding: '4px 11px', borderRadius: 5, fontSize: 11, fontFamily: BP.mono, fontWeight: 600, color: tab === k ? '#06223f' : BP.text, background: tab === k ? BP.accent : 'transparent' }}>{l}</button>
              ))}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: BP.mono, fontSize: 11, color: BP.accent, border: `1px solid ${BP.border}`, borderRadius: 6, padding: '4px 10px' }}>⤓ 下載 CSV</span>
          </span>
        }>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {tab === 'raw' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#0a1b34', zIndex: 1 }}>
                <tr>{['timestamp', 'site_id', 'asset_id', 'tag_name', 'value', 'unit', 'quality'].map((h, i) => <th key={i} style={th(i === 4 ? { textAlign: 'right' } : {})}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={td()}>{r.t}</td>
                    <td style={td({ color: BP.textDim })}>{r.site}</td>
                    <td style={td({ color: BP.label })}>{r.asset}</td>
                    <td style={td({ color: BP.accent })}>{r.tag}</td>
                    <td style={td({ textAlign: 'right', color: BP.label, fontWeight: 700 })}>{Number(r.val).toLocaleString()}</td>
                    <td style={td({ color: BP.textDim })}>{r.unit}</td>
                    <td style={td()}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: r.q[0] === '1' ? '#22C55E' : '#F59E0B' }} />{r.q}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#0a1b34', zIndex: 1 }}>
                <tr>{['Tag 後綴', '說明', '單位', '量程', '取樣', '來源協定'].map((h, i) => <th key={i} style={th()}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {TAG_DICT.map((r, i) => (
                  <tr key={i}>
                    <td style={td({ color: BP.accent })}>{r[0]}</td>
                    <td style={td({ color: BP.label, fontFamily: 'inherit' })}>{r[1]}</td>
                    <td style={td({ color: BP.textDim })}>{r[2]}</td>
                    <td style={td()}>{r[3]}</td>
                    <td style={td()}>{r[4]}</td>
                    <td style={td({ color: BP.text })}>{r[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </window.BPCard>
    </div>
  );
}

window.DataIntegration = DataIntegration;
