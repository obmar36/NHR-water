// reports.jsx — 報表中心: 日/週/月 report export + AI analysis summary.

const PERIOD_META = {
  '日': { label: '日報表', en: 'Daily Report', hours: 24, span: '2026-06-05（單日）', short: '今日' },
  '週': { label: '週報表', en: 'Weekly Report', hours: 168, span: '2026 第 23 週（05/30–06/05）', short: '本週' },
  '月': { label: '月報總結', en: 'Monthly Summary', hours: 720, span: '2026 年 6 月', short: '本月' },
};

function reportData(motors, summary, period) {
  const h = PERIOD_META[period].hours;
  const running = motors.filter(m => m.status !== 'standby');
  const totalKwh = Math.round(summary.total_power * h);
  const baseKwh = running.reduce((s, m) => s + m.baseline_kw, 0) * h;
  const savedKwh = Math.round(baseKwh - totalKwh);
  const waterM3 = Math.round(summary.total_flow * h);
  const cost = Math.round(savedKwh * (summary.tariff || 3.05));
  const co2 = +((savedKwh * (summary.co2 || 0.495)) / 1000).toFixed(1);
  const rows = running.map(m => ({
    id: m.id, name: m.name, kwh: Math.round(m.power_kw * h),
    share: summary.total_power ? (m.power_kw / summary.total_power * 100) : 0,
    eff: m.eff_pct, sec: m.sec_kwh_m3, status: m.status,
  })).sort((a, b) => b.kwh - a.kwh);
  return { h, totalKwh, baseKwh: Math.round(baseKwh), savedKwh, waterM3, cost, co2, rows };
}

function downloadCSV(name, matrix) {
  const csv = matrix.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1200);
}

function DlIcon({ s = 12, c = 'currentColor' }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-2px' }}><path d="M12 3v11M7 10l5 5 5-5M5 21h14" /></svg>;
}

function ReportsPage({ motors, summary }) {
  const BP = window.BP;
  const vp = window.useVP ? window.useVP() : { isMobile: false, isTablet: false };
  const [period, setPeriod] = React.useState('月');
  const [stamp] = React.useState('2026-06-05 09:14');
  const meta = PERIOD_META[period];
  const d = reportData(motors, summary, period);
  const savePct = d.baseKwh ? (d.savedKwh / d.baseKwh * 100).toFixed(1) : '0';

  const aiSummary = `${meta.short}全站總用電約 ${(d.totalKwh / 1000).toFixed(1)} MWh、出水 ${(d.waterM3 / 10000).toFixed(1)} 萬噸，平均噸水電耗 ${summary.sec.toFixed(3)} kWh/m³。透過 AI 變頻優化，較固定轉速基準節省 ${savePct}%（≈ ${d.savedKwh.toLocaleString()} kWh、約 NT$${d.cost.toLocaleString()}、減碳 ${d.co2} 公噸）。期間 P-303 出現能耗偏高與軸承溫度告警，已提出降頻 45Hz 建議；其餘機組運轉點接近最佳效率，整體系統健康、邊緣節點線上。`;
  const recos = [
    'P-303 降頻 50→45 Hz，使運轉點靠近 BEP，預估再省 10.6%（並安排軸承巡檢）。',
    'P-301 離峰時段（22:00–06:00）降頻至 46 Hz，預估省 8.4%。',
    '維持配水母管壓力 ≥ 4.5 bar；尖峰時段暫緩降頻。',
    '建議將本期節能成效納入管理週報，作為向其他自來水站推廣之佐證。',
  ];

  const doExport = (fmt) => {
    const matrix = [
      [`${meta.label} · 示範配水加壓站`, meta.span],
      [],
      ['關鍵指標', '數值', '單位'],
      ['總用電', d.totalKwh, 'kWh'],
      ['出水量', d.waterM3, 'm³'],
      ['噸水電耗', summary.sec, 'kWh/m³'],
      ['節能率', savePct, '%'],
      ['節省電量', d.savedKwh, 'kWh'],
      ['節省電費', d.cost, 'NT$'],
      ['減碳量', d.co2, 't CO2'],
      [],
      ['機組', '名稱', '用電(kWh)', '占比(%)', '泵效率(%)', '噸水電耗', '狀態'],
      ...d.rows.map(r => [r.id, r.name, r.kwh, r.share.toFixed(1), r.eff, r.sec, r.status === 'warn' ? '警告' : '運轉']),
    ];
    downloadCSV(`${meta.en.replace(/ /g, '_')}_WTP2-DPS01.csv`, matrix);
  };

  const archiveDownload = (label, p) => {
    const dd = reportData(motors, summary, p);
    const sp = dd.baseKwh ? (dd.savedKwh / dd.baseKwh * 100).toFixed(1) : '0';
    const matrix = [
      [label, '示範配水加壓站 · WTP2-DPS01'],
      [],
      ['關鍵指標', '數值', '單位'],
      ['總用電', dd.totalKwh, 'kWh'],
      ['出水量', dd.waterM3, 'm³'],
      ['噸水電耗', summary.sec, 'kWh/m³'],
      ['節能率', sp, '%'],
      ['節省電量', dd.savedKwh, 'kWh'],
      ['節省電費', dd.cost, 'NT$'],
      ['減碳量', dd.co2, 't CO2'],
      [],
      ['機組', '名稱', '用電(kWh)', '占比(%)', '泵效率(%)', '噸水電耗', '狀態'],
      ...dd.rows.map(r => [r.id, r.name, r.kwh, r.share.toFixed(1), r.eff, r.sec, r.status === 'warn' ? '警告' : '運轉']),
    ];
    downloadCSV(label.replace(/[ \/]/g, '_') + '_WTP2-DPS01.csv', matrix);
  };

  const kpis = [
    ['總用電', (d.totalKwh / 1000).toFixed(1), 'MWh', BP.accent],
    ['出水量', (d.waterM3 / 10000).toFixed(1), '萬 m³', BP.label],
    ['噸水電耗', summary.sec.toFixed(3), 'kWh/m³', '#22C55E'],
    ['節能率', savePct, '%', '#22C55E'],
    ['節省電費', '$' + (d.cost / 10000).toFixed(1) + '萬', 'NT$', '#7cd4ff'],
    ['減碳量', d.co2, 't CO₂', '#22C55E'],
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? '1fr' : 'minmax(0,1fr) 300px', gap: 12, padding: vp.isMobile ? 10 : 14, height: '100%', minHeight: 0 }}>
      {/* report document */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <window.BPCard glow style={{ flex: 1, minHeight: 0 }}>
          {/* doc toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BP.borderDim}`, flexShrink: 0, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', gap: 2, background: 'rgba(8,21,44,.6)', borderRadius: 7, padding: 2, border: `1px solid ${BP.borderDim}` }}>
              {['日', '週', '月'].map(p => <button key={p} onClick={() => setPeriod(p)} style={{ all: 'unset', cursor: 'pointer', padding: '5px 14px', borderRadius: 5, fontSize: 12, fontFamily: BP.mono, fontWeight: 600, color: period === p ? '#06223f' : BP.text, background: period === p ? BP.accent : 'transparent' }}>{PERIOD_META[p].label}</button>)}
            </span>
            <div style={{ flex: 1 }} />
            {['PDF', 'Excel', 'CSV'].map((f) => (
              <button key={f} onClick={() => doExport(f)} style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: BP.mono, fontSize: 11.5, color: f === 'CSV' ? '#06223f' : BP.accent, background: f === 'CSV' ? BP.accent : 'transparent', border: `1px solid ${BP.border}`, borderRadius: 6, padding: '6px 12px' }}><DlIcon c={f === 'CSV' ? '#06223f' : BP.accent} /> 匯出 {f}</button>
            ))}
          </div>
          {/* doc body */}
          <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `2px solid ${BP.border}`, paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: BP.label }}>{meta.label}</div>
                <div style={{ fontSize: 12, color: BP.text, marginTop: 3 }}>示範配水加壓站 · WTP2-DPS01 · 清水池 → 配水加壓</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: BP.mono, fontSize: 11, color: BP.textDim }}>
                <div>期間 {meta.span}</div>
                <div>AI 彙整 {stamp}</div>
              </div>
            </div>

            {/* AI executive summary */}
            <div style={{ borderRadius: 10, border: '1px solid rgba(65,166,255,.4)', background: 'rgba(65,166,255,.07)', padding: '13px 15px', marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: BP.accent, boxShadow: `0 0 6px ${BP.accent}` }} className="md-pulse" />
                <span style={{ fontFamily: BP.mono, fontSize: 11, fontWeight: 700, color: BP.accent, letterSpacing: .5 }}>AI 執行摘要 · EXECUTIVE SUMMARY</span>
              </div>
              <div style={{ fontSize: 13, color: BP.label, lineHeight: 1.7 }}>{aiSummary}</div>
            </div>

            {/* KPIs */}
            <SectionTitle BP={BP} t="關鍵指標" e="Key Metrics" />
            <div style={{ display: 'grid', gridTemplateColumns: vp.isMobile ? 'repeat(2,1fr)' : vp.isTablet ? 'repeat(3,1fr)' : 'repeat(6,1fr)', gap: 8, marginBottom: 18 }}>
              {kpis.map((k, i) => (
                <div key={i} style={{ background: 'rgba(8,21,44,.5)', border: `1px solid ${BP.borderDim}`, borderRadius: 8, padding: '9px 10px' }}>
                  <div style={{ fontSize: 10, color: BP.textDim }}>{k[0]}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
                    <span style={{ fontFamily: BP.mono, fontSize: 16, fontWeight: 700, color: k[3] }}>{k[1]}</span>
                    <span style={{ fontSize: 8.5, color: BP.text }}>{k[2]}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* energy breakdown table */}
            <SectionTitle BP={BP} t="機組能耗明細" e="Energy by Unit" />
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
              <thead><tr>{['機組', '名稱', '用電 (kWh)', '占比', '泵效率', '噸水電耗', '狀態'].map((hd, i) => <th key={i} style={{ textAlign: i >= 2 && i <= 5 ? 'right' : 'left', padding: '8px 10px', fontSize: 10.5, color: BP.textDim, fontFamily: BP.mono, borderBottom: `1px solid ${BP.borderDim}`, whiteSpace: 'nowrap' }}>{hd}</th>)}</tr></thead>
              <tbody>
                {d.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px 10px', fontFamily: BP.mono, fontSize: 12, fontWeight: 700, color: BP.accent, borderBottom: `1px solid ${BP.borderDim}` }}>{r.id}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: BP.label, borderBottom: `1px solid ${BP.borderDim}`, whiteSpace: 'nowrap' }}>{r.name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: BP.mono, fontSize: 12, color: BP.label, fontWeight: 700, borderBottom: `1px solid ${BP.borderDim}` }}>{r.kwh.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: BP.mono, fontSize: 11.5, color: BP.text, borderBottom: `1px solid ${BP.borderDim}` }}>{r.share.toFixed(1)}%</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: BP.mono, fontSize: 11.5, color: r.eff >= 80 ? '#22C55E' : '#F59E0B', borderBottom: `1px solid ${BP.borderDim}` }}>{r.eff}%</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: BP.mono, fontSize: 11.5, color: BP.text, borderBottom: `1px solid ${BP.borderDim}` }}>{r.sec}</td>
                    <td style={{ padding: '8px 10px', borderBottom: `1px solid ${BP.borderDim}` }}><span style={{ fontFamily: BP.mono, fontSize: 10.5, fontWeight: 700, color: r.status === 'warn' ? '#F59E0B' : '#22C55E' }}>{r.status === 'warn' ? '警告' : '運轉'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* AI recommendations */}
            <SectionTitle BP={BP} t="AI 分析與建議事項" e="Findings & Actions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recos.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 12px', borderRadius: 8, background: 'rgba(8,21,44,.5)', border: `1px solid ${BP.borderDim}` }}>
                  <span style={{ fontFamily: BP.mono, fontSize: 11, fontWeight: 700, color: '#06223f', background: BP.accent, width: 18, height: 18, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12.5, color: BP.label, lineHeight: 1.55 }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 10.5, color: BP.textDim, fontFamily: BP.mono }}>※ 本報表由 AI 依即時/歷史資料自動彙整；數據為模擬，正式版接 historian 後自動產生並可排程推送。</div>
          </div>
        </window.BPCard>
      </div>

      {/* right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'auto' }}>
        <window.BPCard title="匯出與排程" en="Export & Schedule" glow>
          <div style={{ padding: 13 }}>
            <window.BPRow label="報表格式" value="PDF / Excel / CSV" />
            <window.BPRow label="日報" value="每日 08:00 自動產生" />
            <window.BPRow label="週報" value="每週一 08:00" />
            <window.BPRow label="月報" value="每月 1 日 08:00" />
            <window.BPRow label="推送對象" value="管理者 · LINE 群組" />
            <button onClick={() => doExport('CSV')} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 11, fontFamily: BP.mono, fontSize: 12.5, fontWeight: 700, color: '#06223f', background: BP.accent, borderRadius: 7, padding: '10px 0' }}><DlIcon c="#06223f" /> 立即下載本期 CSV</button>
          </div>
        </window.BPCard>
        <window.BPCard title="歷史報表" en="Archive">
          <div>
            {[['2026-06 月報總結', '月', '06-01'], ['2026 第 22 週週報', '週', '05-26'], ['2026-06-04 日報', '日', '06-04'], ['2026-06-03 日報', '日', '06-03'], ['2026-05 月報總結', '月', '05-01']].map((r, i) => (
              <div key={i} onClick={() => archiveDownload(r[0], r[1])} title="下載範例資料 (CSV)" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderBottom: `1px solid ${BP.borderDim}`, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,166,255,.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(65,166,255,.12)', color: BP.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: BP.mono }}>{r[1]}</span>
                <span style={{ flex: 1, fontSize: 11.5, color: BP.label }}>{r[0]}</span>
                <span style={{ fontFamily: BP.mono, fontSize: 10, color: BP.textDim }}>{r[2]}</span>
                <span style={{ cursor: 'pointer', color: BP.accent, display: 'inline-flex' }}><DlIcon c={BP.accent} /></span>
              </div>
            ))}
          </div>
        </window.BPCard>
      </div>
    </div>
  );
}

function SectionTitle({ BP, t, e }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ width: 3, height: 14, background: BP.accent, borderRadius: 2 }} />
      <span style={{ fontSize: 13.5, fontWeight: 700, color: BP.label }}>{t}</span>
      <span style={{ fontFamily: BP.mono, fontSize: 9.5, color: BP.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>{e}</span>
    </div>
  );
}

window.ReportsPage = ReportsPage;
