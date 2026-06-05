// stationData.jsx — single-station mock data + pump physics model.
// All numbers are SIMULATED for the demo; swap with real historian/test data later.

// ---- pump physics (affinity laws) -------------------------------------------
// Head-flow at 50Hz:  H(Q) = H0 - k*Q^2 ;  at ratio r=f/50:  H_r(Q) = r^2*H0 - k*Q^2
// System curve:       Hsys(Q) = Hstat + Rsys*Q^2
// Operating point:    intersection of pump curve (ratio r) and system curve
function operatingPoint(p, freq) {
  const r = freq / 50;
  if (r <= 0.01) return { freq: 0, r: 0, Q: 0, H: p.Hstat, eta: 0, P: 0, rpm: 0, current: 0 };
  const Q2 = (r * r * p.H0 - p.Hstat) / (p.k + p.Rsys);
  const Q = Q2 > 0 ? Math.sqrt(Q2) : 0;                 // m³/h
  const H = p.Hstat + p.Rsys * Q * Q;                   // m
  const qb = r * p.Qbep;
  let eta = p.etaMax * (1 - 0.95 * Math.pow((Q - qb) / (p.Qspread), 2));
  eta = Math.max(0.25, Math.min(p.etaMax, eta));        // pump hydraulic efficiency
  const Qs = Q / 3600;
  const Phyd = 9810 * Qs * H;                            // W
  const P = Phyd / (eta * p.etaMotor) / 1000;           // kW (electrical)
  const rpm = Math.round(p.rpm50 * r);
  const current = P > 0 ? P * 1000 / (Math.sqrt(3) * p.voltage * 0.88) : 0;
  return { freq, r, Q: Math.round(Q), H: +H.toFixed(1), eta: +(eta * 100).toFixed(1), P: Math.round(P), rpm, current: Math.round(current) };
}
window.operatingPoint = operatingPoint;

// curve sampling for the pump-curve chart (returns arrays in flow order)
function pumpCurve(p, freq, nMax) {
  const r = freq / 50;
  const Qmax = nMax || Math.sqrt(Math.max(1, (r * r * p.H0) / (p.k))) * 1.02;
  const pts = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const Q = (i / N) * Qmax;
    const H = r * r * p.H0 - p.k * Q * Q;
    const qb = r * p.Qbep;
    let eta = p.etaMax * (1 - 0.95 * Math.pow((Q - qb) / p.Qspread, 2));
    eta = Math.max(0, Math.min(p.etaMax, eta));
    pts.push({ Q, H, eta: eta * 100 });
  }
  return pts;
}
window.pumpCurve = pumpCurve;

// ---- base pump parameter set (≈400 kW MV distribution pump) ------------------
const BASE_PUMP = { H0: 62, k: 0.0000019, Hstat: 34, Rsys: 0.0000011, Qbep: 3000, Qspread: 2050, etaMax: 0.84, etaMotor: 0.93, rpm50: 1485, voltage: 3300 };

// per-motor definition: current operating frequency, recommended frequency, tuned saving%
const MOTOR_DEFS = [
  { id: 'P-301', name: '配水加壓泵 #1', status: 'run',     freq: 50, recFreq: 46, save: 8.4, bearing: 58, vib: 2.4, runtime: 18240, pump: { ...BASE_PUMP, Qbep: 2950 } },
  { id: 'P-302', name: '配水加壓泵 #2', status: 'run',     freq: 48, recFreq: 47, save: 2.1, bearing: 55, vib: 2.0, runtime: 16920, pump: { ...BASE_PUMP, Qbep: 3050, etaMax: 0.845 } },
  { id: 'P-303', name: '配水加壓泵 #3', status: 'warn',    freq: 50, recFreq: 45, save: 10.6, bearing: 71, vib: 4.3, runtime: 21110, pump: { ...BASE_PUMP, Qbep: 2880, etaMax: 0.82 } },
  { id: 'P-304', name: '配水加壓泵 #4', status: 'standby', freq: 0,  recFreq: 46, save: 0,    bearing: 33, vib: 0.2, runtime: 9430,  pump: { ...BASE_PUMP } },
];

function buildMotor(def, idx) {
  const op = operatingPoint(def.pump, def.freq);
  const running = def.status !== 'standby';
  const power = running ? op.P : 0;
  const baseline = running ? Math.round(power / (1 - def.save / 100)) : 0;
  const flow = running ? op.Q : 0;
  return {
    ...def, idx,
    power_kw: power,
    baseline_kw: baseline,
    flow_m3h: flow,
    head_m: running ? op.H : 0,
    pressure_bar: running ? +(op.H / 10.197).toFixed(2) : 0,
    eff_pct: running ? op.eta : 0,
    rpm: running ? op.rpm : 0,
    current_a: running ? op.current : 0,
    voltage_v: def.pump.voltage,
    sec_kwh_m3: running && flow ? +(power / flow).toFixed(3) : 0,
    bearing_c: def.bearing,
    vib_mm_s: def.vib,
    runtime_h: def.runtime,
  };
}

const MOTORS = MOTOR_DEFS.map(buildMotor);

// template used by the "add motor" action in the UI
function newMotorTemplate(n) {
  const def = { id: 'P-30' + n, name: '配水加壓泵 #' + n, status: 'standby', freq: 0, recFreq: 46, save: 0, bearing: 32, vib: 0.2, runtime: 0, pump: { ...BASE_PUMP } };
  return buildMotor(def, n - 1);
}
window.newMotorTemplate = newMotorTemplate;

// ---- station-level summary (tuned, believable) ------------------------------
const TARIFF = 3.05;       // NT$/kWh (industrial)
const CO2 = 0.495;         // kgCO₂/kWh

function stationSummary(motors) {
  const running = motors.filter(m => m.status !== 'standby');
  const total_power = running.reduce((s, m) => s + m.power_kw, 0);
  const total_flow = running.reduce((s, m) => s + m.flow_m3h, 0);
  const total_base = running.reduce((s, m) => s + m.baseline_kw, 0);
  const saving_pct = total_base ? +(((total_base - total_power) / total_base) * 100).toFixed(1) : 0;
  const sec = total_flow ? +(total_power / total_flow).toFixed(3) : 0;
  // monthly accumulation (24h × 30d at current load profile)
  const month_actual = Math.round(total_power * 24 * 30);
  const month_base = Math.round(total_base * 24 * 30);
  const month_saved = month_base - month_actual;
  return {
    total_power, total_flow, sec, saving_pct,
    running: running.length, total: motors.length,
    header_bar: 4.6, header_target: 4.5, clearwell_pct: 87, clearwell_m: 4.2,
    month_saved_kwh: month_saved,
    month_saved_cost: Math.round(month_saved * TARIFF),
    month_saved_co2: +(month_saved * CO2 / 1000).toFixed(1),
    month_base, month_actual,
    co2: CO2, tariff: TARIFF,
  };
}
window.stationSummary = stationSummary;

const STATION = {
  name: '示範配水加壓站',
  code: 'WTP2-DPS01',
  district: '北區自來水廠 · 第二淨水場',
  section: '清水池 → 配水加壓',
};

// daily actual-vs-baseline series for the savings chart (kWh/day, last 30d)
function savingsSeries(range) {
  const n = range === '7D' ? 7 : range === '30D' ? 30 : 24;
  const out = { actual: [], baseline: [], ticks: [] };
  for (let i = 0; i < n; i++) {
    const phase = i / n * Math.PI * 2;
    const base = (range === '24H' ? 1180 : 26500) * (1 + 0.06 * Math.sin(phase) + 0.02 * Math.cos(i * 1.3));
    const savePct = 0.066 + 0.012 * Math.sin(phase * 0.7) + (i > n * 0.6 ? 0.02 : 0); // savings improve after rollout
    out.baseline.push(base);
    out.actual.push(base * (1 - savePct));
    out.ticks.push(range === '24H' ? (i % 4 === 0 ? String(i).padStart(2, '0') : '') : range === '7D' ? 'D-' + (n - i) : (i % 6 === 0 ? 'D-' + (n - i) : ''));
  }
  return out;
}
window.savingsSeries = savingsSeries;

Object.assign(window, { MOTORS, STATION, TARIFF, CO2 });
