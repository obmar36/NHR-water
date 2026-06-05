// stationData2.jsx — operations data: alerts/guidance, AI chat, RBAC, live series.

// ---- proactive alerts & operator guidance ----------------------------------
const GUIDANCE = [
  {
    id: 'A-2640', level: 'warn', dev: 'P-303', t: '09:11', status: '待處理',
    title: '能耗偏高 · 偏離最佳效率區',
    detail: 'P-303 軸功率較黃金曲線高 9.4%，運轉點落在泵浦效率曲線右側（過量揚送）。',
    action: '降頻 50 → 45 Hz', rec: 45, save: 10.6, savekw: 51,
    steps: ['將 P-303 變頻器頻率由 50Hz 調降至 45Hz，使運轉點靠近 BEP', '確認配水母管壓力維持 ≥ 4.5 bar', '若 30 分鐘內未改善，改由 P-301 分攤流量'],
  },
  {
    id: 'A-2638', level: 'warn', dev: 'P-303', t: '08:52', status: '處理中',
    title: '軸承溫度偏高',
    detail: '非驅動端軸承 71°C，高於 65°C 預警值；振動 4.3 mm/s 亦偏高。',
    action: '安排巡檢 · 潤滑', save: 0, savekw: 0,
    steps: ['檢查軸承潤滑狀態與冷卻風扇運轉', '持續監測振動趨勢，超過 7 mm/s 應停機檢修'],
  },
  {
    id: 'A-2631', level: 'info', dev: 'P-301', t: '08:30', status: '待處理',
    title: '節能機會 · 離峰可降頻',
    detail: '離峰時段用水需求下降，P-301 維持 50Hz 屬過量揚送。',
    action: '降頻 50 → 46 Hz', rec: 46, save: 8.4, savekw: 43,
    steps: ['離峰時段（22:00–06:00）降頻至 46Hz', '預估單機節省 8.4% ≈ 43 kW'],
  },
  {
    id: 'A-2625', level: 'crit', dev: '系統', t: '07:58', status: '已解除',
    title: '配水壓力逼近下限',
    detail: '用水尖峰時配水母管壓力降至 4.51 bar，接近 4.5 bar 下限。',
    action: '維持轉速 · 暫緩降頻', save: 0, savekw: 0,
    steps: ['尖峰時段暫緩任何降頻動作', '待尖峰過後再評估節能空間'],
  },
  {
    id: 'A-2610', level: 'info', dev: 'P-304', t: '07:20', status: '已確認',
    title: '備援機組待命正常',
    detail: 'P-304 備援待命中，機組健康度 100%，可隨時投入。',
    action: '—', save: 0, savekw: 0, steps: [],
  },
];
const GUIDE_LEVELS = { crit: { zh: '嚴重', c: '#EF4444' }, warn: { zh: '警告', c: '#F59E0B' }, info: { zh: '建議', c: '#22D3EE' } };

// ---- AI assistant: suggestion chips + canned answers ------------------------
const CHAT_SUGGEST = ['今天哪一台馬達最耗能？', 'P-303 為什麼能耗偏高？', '現在可以降頻省電嗎？', '本月總共省了多少電費？', '配水壓力還有降頻空間嗎？'];
const CHAT_CANNED = {
  '今天哪一台馬達最耗能？': {
    a: '目前 P-303 單位出水電耗最高（約 0.160 kWh/m³），軸功率較最佳效率曲線高 9.4%，建議優先檢視。其次為 P-301，可於離峰時段降頻 46Hz 取得約 8.4% 節能。',
    src: [{ doc: '即時製程資料', loc: 'P-301~304 Tag' }, { doc: '能效模型', loc: 'M-015' }],
  },
  'P-303 為什麼能耗偏高？': {
    a: 'P-303 運轉點落在泵浦效率曲線右側（過量揚送），泵效率僅 82%；同時非驅動端軸承 71°C、振動 4.3 mm/s 偏高。建議降頻 50→45Hz 使運轉點靠近 BEP，預估節省 10.6%（≈51 kW），並安排軸承潤滑巡檢。',
    src: [{ doc: '泵浦效率曲線', loc: 'P-303' }, { doc: '維護 SOP', loc: '軸承巡檢' }],
  },
  '現在可以降頻省電嗎？': {
    a: '可以。目前配水母管壓力 4.6 bar、高於 4.5 bar 下限，且非用水尖峰。建議 P-301 降至 46Hz、P-303 降至 45Hz，全站預估再省約 7~9%。降頻後請確認壓力維持 ≥4.5 bar。',
    src: [{ doc: '即時製程資料', loc: '配水母管壓力' }],
  },
  '本月總共省了多少電費？': {
    a: '本月累計節省約 79.2 MWh，依工業電價 NT$3.05/kWh 估算約節省 NT$24.2 萬，相當於減碳 39.2 公噸 CO₂。全站節能率 7.4%。',
    src: [{ doc: '能源日報', loc: '本月彙總' }],
  },
  '配水壓力還有降頻空間嗎？': {
    a: '尖峰時段（早 7–9 點、晚 6–8 點）壓力會逼近 4.5 bar 下限，不建議降頻；離峰時段壓力裕度約 0.2 bar，P-301、P-303 仍有降頻空間。系統會在尖峰自動暫緩降頻建議。',
    src: [{ doc: '壓力趨勢', loc: '24H' }],
  },
};
function aiAnswer(q) {
  if (CHAT_CANNED[q]) return CHAT_CANNED[q];
  const key = Object.keys(CHAT_CANNED).find(k => q && (q.includes(k.slice(0, 3)) || k.includes(q.slice(0, 3))));
  if (key) return CHAT_CANNED[key];
  return { a: '依目前即時資料，全站運作正常。如需特定機組的能耗、效率或降頻建議，請指定設備編號（如 P-303）或時間範圍。', src: [{ doc: '系統操作手冊', loc: '即時資料' }] };
}
window.aiAnswer = aiAnswer;

// ---- RBAC: permissions, roles, users, audit --------------------------------
const PERMISSIONS = ['檢視即時監控', '檢視節能分析', '操作 VFD 頻率', '套用 AI 建議', '確認 / 處理告警', '管理通知規則', '設定使用者權限', '匯出報表 / 資料'];
// cell values: true / false / 'mfa' / 'approve'
const ROLES = [
  { id: 'admin', name: '廠長 / 管理者', en: 'Manager', perms: [true, true, 'approve', true, true, true, true, true] },
  { id: 'engineer', name: '節能工程師', en: 'Engineer', perms: [true, true, 'approve', true, true, true, false, true] },
  { id: 'operator', name: '值班操作員', en: 'Operator', perms: [true, true, 'mfa', false, true, false, false, false] },
  { id: 'viewer', name: '檢視者 / 稽核', en: 'Auditor', perms: [true, true, false, false, false, false, false, true] },
];
const USERS = [
  { name: '王廠長', role: '管理者', roleId: 'admin', mfa: true, status: '線上', last: '今天 09:12' },
  { name: '李工程師', role: '節能工程師', roleId: 'engineer', mfa: true, status: '線上', last: '今天 09:05' },
  { name: '陳操作員', role: '值班操作員', roleId: 'operator', mfa: true, status: '值班中', last: '今天 09:14' },
  { name: '林操作員', role: '值班操作員', roleId: 'operator', mfa: true, status: '離線', last: '昨天 22:40' },
  { name: '稽核帳號', role: '檢視者', roleId: 'viewer', mfa: false, status: '離線', last: '2 天前' },
];
const AUDIT = [
  { t: '09:11', user: '李工程師', act: '套用 AI 建議：P-301 降頻 50→46 Hz', tone: 'ok' },
  { t: '08:55', user: '陳操作員', act: '確認告警 A-2638（P-303 軸承溫度偏高）', tone: 'info' },
  { t: '08:30', user: '系統', act: 'AI 自動產生節能建議 ×3', tone: 'info' },
  { t: '08:12', user: '陳操作員', act: 'MFA 驗證 · 操作員登入', tone: 'info' },
  { t: '07:59', user: '王廠長', act: '核准 P-303 降頻操作申請', tone: 'ok' },
  { t: '昨天 18:20', user: '王廠長', act: '調整通知規則：嚴重告警改推 LINE 群組', tone: 'warn' },
];

// ---- live series helper (seed + tick) ---------------------------------------
function seedSeries(n, base, amp, noise) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(base + Math.sin(i / n * Math.PI * 4) * amp + (Math.random() - 0.5) * noise);
  return out;
}
window.seedSeries = seedSeries;

Object.assign(window, { GUIDANCE, GUIDE_LEVELS, CHAT_SUGGEST, CHAT_CANNED, PERMISSIONS, ROLES, USERS, AUDIT });
