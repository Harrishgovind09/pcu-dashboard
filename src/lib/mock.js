// In-memory stand-in for Supabase, used only when the app is built with VITE_MOCK=1
// (demo mode, automated UI tests). It mimics the small part of the Supabase API the app uses.
import { dassLevel } from './constants.js';

const KEY = 'pcu-mock-db-v1';
const SESSION_KEY = 'pcu-mock-session-v1';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seed() {
  const rnd = mulberry32(2026);
  let n = 0;
  const id = () => 'm' + ++n;
  const pick = (vals, w) => {
    const tot = w.reduce((a, b) => a + b, 0);
    let r = rnd() * tot;
    for (let i = 0; i < vals.length; i++) { r -= w[i]; if (r <= 0) return vals[i]; }
    return vals[vals.length - 1];
  };
  const PTJ = ['FSKTM', 'FKEE', 'FKAAB', 'FKMP', 'FPTV', 'FAST', 'Lain-lain'];
  const PTJW = [268, 214, 196, 171, 152, 131, 116];
  const G = ['Perempuan', 'Lelaki'];
  const day = () => 1 + Math.floor(rnd() * 27);
  const date = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}-${String(day()).padStart(2, '0')}`;
  // 12-month arrays. 2026 runs to November; 2025 is a full year at ~88%.
  const months = (base, y) => (y === 2026 ? [...base, 0] : [...base.map((v) => Math.round(v * 0.88)), Math.round((base.reduce((a, b) => a + b, 0) / base.length) * 0.8)]);
  const expand = (arr) => arr.flatMap((c, m) => Array(c).fill(m));

  const t = {
    profiles: [], lookups: [], import_batches: [], counselling_sessions: [], programs: [], program_participation: [],
    psych_tests: [], discipline_sessions: [], dass_results: [], interventions: []
  };
  const L = (kind, values) => values.forEach((v, i) => t.lookups.push({ id: id(), kind, value: v, sort: i + 1 }));
  L('ptj', PTJ);
  L('kampus', ['Parit Raja', 'Pagoh']);
  L('kes_kaunseling', ['Emosi dan tekanan', 'Akademik', 'Hubungan', 'Keluarga', 'Kewangan', 'Lain-lain']);
  L('kes_tatatertib', ['Ponteng kelas', 'Salah laku kampus', 'Ketidakjujuran akademik', 'Pelanggaran kod pakaian', 'Penyalahgunaan ICT', 'Lain-lain']);
  L('ujian', ['DASS-21', 'Inventori Minat Kerjaya', 'Inventori Personaliti', 'Ujian Gaya Pembelajaran', 'Lain-lain']);
  L('intervensi', ['Kaunseling individu', 'Kaunseling kelompok', 'Bengkel pengurusan stres', 'Rujukan klinikal', 'Susulan berkala']);
  L('jabatan', ['PCU', 'HEPA', 'Fakulti', 'Lain-lain']);
  L('kategori_penyertaan', ['Pelajar', 'Staf', 'Komuniti luar']);

  const batch = (module, count) => {
    const b = { id: id(), module, filename: 'DATA CONTOH (demo)', row_count: count, created_by: null, created_at: '2026-11-10T07:00:00Z' };
    t.import_batches.push(b);
    return b.id;
  };
  const common = (b) => ({ batch_id: b, created_by: null, created_at: '2026-11-10T07:00:00Z' });

  [2026, 2025].forEach((y) => {
    const sc = y === 2026 ? 1 : 0.88;
    // Kaunseling
    let b = batch('kaunseling', 0);
    expand(months([74, 98, 81, 120, 132, 118, 96, 140, 151, 127, 111], y)).forEach((m) =>
      t.counselling_sessions.push({ id: id(), session_date: date(y, m), ptj: pick(PTJ, PTJW), gender: pick(G, [742, 506]), source: pick(['rujukan', 'sukarela'], [389, 859]),
        case_type: pick(['Emosi dan tekanan', 'Akademik', 'Hubungan', 'Keluarga', 'Kewangan', 'Lain-lain'], [371, 302, 228, 147, 112, 88]), attended: true, ...common(b) }));
    expand(months([10, 14, 12, 20, 22, 20, 16, 24, 24, 18, 16], y)).forEach((m) =>
      t.counselling_sessions.push({ id: id(), session_date: date(y, m), ptj: pick(PTJ, PTJW), gender: pick(G, [742, 506]), source: pick(['rujukan', 'sukarela'], [389, 859]),
        case_type: pick(['Emosi dan tekanan', 'Akademik', 'Hubungan', 'Keluarga', 'Kewangan', 'Lain-lain'], [371, 302, 228, 147, 112, 88]), attended: false, ...common(b) }));
    // Tatatertib
    b = batch('tatatertib', 0);
    [[true, [18, 22, 20, 31, 36, 28, 24, 38, 41, 29, 25]], [false, [2, 2, 2, 3, 3, 2, 2, 3, 3, 2, 2]]].forEach(([att, arr]) =>
      expand(months(arr, y)).forEach((m) =>
        t.discipline_sessions.push({ id: id(), session_date: date(y, m), ptj: pick(PTJ, [58, 54, 49, 47, 40, 36, 28]), gender: pick(G, [114, 198]),
          case_type: pick(['Ponteng kelas', 'Salah laku kampus', 'Ketidakjujuran akademik', 'Pelanggaran kod pakaian', 'Penyalahgunaan ICT', 'Lain-lain'], [84, 72, 61, 38, 33, 24]), attended: att, ...common(b) })));
    // Ujian psikologi (about 1,400 tests so the demo stays light)
    b = batch('ujian', 0);
    const tests = expand(months([90, 120, 105, 145, 165, 150, 110, 180, 190, 95, 140], y));
    const people = Math.round(tests.length * 0.72);
    tests.forEach((m, i) =>
      t.psych_tests.push({ id: id(), test_date: date(y, m), ptj: pick(PTJ, [468, 402, 366, 318, 246, 204, 130]), gender: pick(G, [1290, 844]), source: pick(['rujukan', 'sukarela'], [1056, 1078]),
        test_name: pick(['DASS-21', 'Inventori Minat Kerjaya', 'Inventori Personaliti', 'Ujian Gaya Pembelajaran', 'Lain-lain'], [1120, 640, 512, 388, 320]),
        person_code: i < people ? `${y}-${i}` : `${y}-${Math.floor(rnd() * people)}`, ...common(b) }));
    // Program
    b = batch('program', 0);
    const progNames = ['Minggu Kesedaran Kesihatan Mental', 'Kem Motivasi Pelajar Baharu', 'Bengkel Pengurusan Stres', 'Sesi Sokongan Rakan Sebaya', 'Program lain'];
    expand(months([3, 4, 3, 5, 5, 5, 4, 6, 6, 4, 3], y)).forEach((m) => {
      const p = { id: id(), name: pick(progNames, [4, 6, 8, 10, 20]), jabatan: pick(['PCU', 'HEPA', 'Fakulti', 'Lain-lain'], [40, 30, 25, 5]), held_on: date(y, m), budget: Math.round(1802 * (0.5 + rnd()) * sc), ...common(b) };
      t.programs.push(p);
      for (let k = 0; k < 8; k++)
        t.program_participation.push({ id: id(), program_id: p.id, ptj: pick(PTJ, [1180, 1020, 940, 860, 780, 690, 950]), gender: pick(G, [3690, 2730]),
          category: pick(['Pelajar', 'Staf', 'Komuniti luar'], [5210, 890, 320]), participants: 1 + Math.floor(rnd() * 26), created_by: null, created_at: '2026-11-10T07:00:00Z' });
    });
    // DASS
    b = batch('dass', 0);
    const lv = (cum) => { const r = rnd() * cum[cum.length - 1]; let i = 0; while (i < cum.length - 1 && r > cum[i]) i++; return i; };
    const rng = { depression: [[0, 8], [10, 12], [14, 20], [22, 26], [28, 42]], anxiety: [[0, 6], [8, 8], [10, 14], [16, 18], [20, 42]], stress: [[0, 14], [16, 18], [20, 24], [26, 32], [34, 42]] };
    const sc2 = (scale, l) => { const [lo, hi] = rng[scale][l]; return lo + 2 * Math.floor(rnd() * ((hi - lo) / 2 + 1)); };
    const cumP = { depression: [598, 774, 988, 1076, 1120], anxiety: [452, 570, 836, 978, 1120], stress: [640, 842, 1024, 1090, 1120] };
    const cumS = { depression: [140, 174, 200, 210, 214], anxiety: [108, 144, 184, 202, 214], stress: [128, 171, 200, 210, 214] };
    expand(months([82, 104, 92, 128, 146, 128, 98, 150, 160, 118, 128], y)).forEach((m) => {
      const staff = rnd() < 214 / 1334;
      const c = staff ? cumS : cumP;
      const d = sc2('depression', lv(c.depression)), a = sc2('anxiety', lv(c.anxiety)), s = sc2('stress', lv(c.stress));
      t.dass_results.push({ id: id(), test_date: date(y, m), respondent: staff ? 'staf' : 'pelajar', ptj: pick(PTJ, PTJW), gender: pick(G, [818, 516]), campus: pick(['Parit Raja', 'Pagoh'], [1052, 282]),
        depression: d, anxiety: a, stress: s, depression_level: dassLevel('depression', d), anxiety_level: dassLevel('anxiety', a), stress_level: dassLevel('stress', s), ...common(b) });
    });
    // Intervensi
    b = batch('intervensi', 0);
    expand(months([9, 14, 12, 19, 24, 21, 15, 28, 30, 23, 24], y)).forEach((m) => {
      const staff = rnd() < 31 / 219;
      t.interventions.push({ id: id(), intervention_date: date(y, m), respondent: staff ? 'staf' : 'pelajar', ptj: pick(PTJ, [46, 38, 36, 32, 27, 22, 18]), gender: pick(G, [131, 88]), campus: pick(['Parit Raja', 'Pagoh'], [187, 32]),
        intervention_type: pick(['Kaunseling individu', 'Kaunseling kelompok', 'Bengkel pengurusan stres', 'Rujukan klinikal', 'Susulan berkala'], [71, 48, 36, 34, 30]),
        stress_status: pick(['stabil', 'sederhana', 'teruk'], [121, 38, 29]), ...common(b) });
    });
  });
  t.import_batches.forEach((b) => {
    const tb = { kaunseling: 'counselling_sessions', tatatertib: 'discipline_sessions', ujian: 'psych_tests', program: 'programs', dass: 'dass_results', intervensi: 'interventions' }[b.module];
    b.row_count = t[tb].filter((r) => r.batch_id === b.id).length;
  });
  t.profiles.push({ id: 'u-demo', email: 'demo@pcu.test', full_name: 'Pentadbir Demo', role: 'admin', created_at: '2026-11-10T07:00:00Z' });
  t.users = [{ id: 'u-demo', email: 'demo@pcu.test', password: 'demo1234' }];
  t.counter = n;
  return t;
}

const CASCADE = {
  import_batches: [['counselling_sessions', 'batch_id'], ['programs', 'batch_id'], ['psych_tests', 'batch_id'], ['discipline_sessions', 'batch_id'], ['dass_results', 'batch_id'], ['interventions', 'batch_id']],
  programs: [['program_participation', 'program_id']]
};

export function createMock() {
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { db = null; }
  if (!db) db = seed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full: demo keeps working in memory */ } };
  save();

  const listeners = new Set();
  let session = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { session = null; }
  const emit = (ev) => listeners.forEach((fn) => fn(ev, session));
  const setSession = (u) => {
    session = u ? { user: { id: u.id, email: u.email } } : null;
    try { if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  };
  const me = () => (session ? db.profiles.find((p) => p.id === session.user.id) : null);
  const uid = () => 'm' + ++db.counter;

  const getPath = (row, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), row);

  class Q {
    constructor(table) { this.table = table; this.op = 'select'; this.filters = []; this.orders = []; this.rangeV = null; this.limitV = null; this.sel = '*'; this.payload = null; this.wantSingle = false; this.returning = false; }
    select(cols) { if (this.op === 'insert' || this.op === 'update') this.returning = true; this.sel = cols || '*'; return this; }
    insert(rows) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
    update(p) { this.op = 'update'; this.payload = p; return this; }
    delete() { this.op = 'delete'; return this; }
    eq(c, v) { this.filters.push((r) => getPath(r, c) === v); return this; }
    in(c, vs) { this.filters.push((r) => vs.includes(getPath(r, c))); return this; }
    gte(c, v) { this.filters.push((r) => getPath(r, c) >= v); return this; }
    lte(c, v) { this.filters.push((r) => getPath(r, c) <= v); return this; }
    order(c, o) { this.orders.push([c, !(o && o.ascending === false)]); return this; }
    range(a, b) { this.rangeV = [a, b]; return this; }
    limit(n) { this.limitV = n; return this; }
    single() { this.wantSingle = true; return this; }
    maybeSingle() { this.wantSingle = true; return this; }
    then(res, rej) { return Promise.resolve().then(() => this.exec()).then(res, rej); }

    shape(rows) {
      let out = rows;
      if (this.table === 'program_participation' && /programs/.test(this.sel)) {
        out = rows.map((r) => ({ ...r, programs: db.programs.find((p) => p.id === r.program_id) || null }));
      }
      return out;
    }
    exec() {
      const role = me() ? me().role : null;
      if (!session) return { data: null, error: { message: 'Not signed in' } };
      const staff = role === 'staff' || role === 'admin';
      let rows = db[this.table];
      if (!rows) return { data: null, error: { message: 'Unknown table ' + this.table } };
      if (this.table === 'profiles') {
        if (this.op === 'select') rows = role === 'admin' ? rows : rows.filter((r) => r.id === session.user.id);
        if (this.op === 'update' && role !== 'admin') return { data: null, error: { message: 'Not allowed' } };
      } else if (!staff) {
        return this.op === 'select' ? { data: [], error: null } : { data: null, error: { message: 'new row violates row-level security policy' } };
      }
      if (this.op === 'insert') {
        if (['lookups'].includes(this.table) && role !== 'admin') return { data: null, error: { message: 'new row violates row-level security policy' } };
        const made = this.payload.map((p) => {
          const r = { id: uid(), created_by: session.user.id, created_at: new Date().toISOString(), batch_id: null, ...p };
          if (this.table === 'lookups' && db.lookups.some((l) => l.kind === r.kind && l.value === r.value)) r.__dup = true;
          if (this.table === 'dass_results') {
            for (const s of ['depression', 'anxiety', 'stress']) {
              if (!(r[s] >= 0 && r[s] <= 42)) r.__bad = s + ' out of range';
              r[s + '_level'] = dassLevel(s, r[s]);
            }
          }
          return r;
        });
        const bad = made.find((r) => r.__dup || r.__bad);
        if (bad) return { data: null, error: { message: bad.__dup ? 'duplicate key value violates unique constraint' : 'check constraint failed: ' + bad.__bad } };
        db[this.table].push(...made);
        save();
        const shaped = this.shape(made);
        return { data: this.returning ? (this.wantSingle ? shaped[0] : shaped) : null, error: null };
      }
      const matched = rows.filter((r) => this.filters.every((f) => f(this.table === 'program_participation' ? { ...r, programs: db.programs.find((p) => p.id === r.program_id) } : r)));
      if (this.op === 'update') {
        const canEdit = (r) => role === 'admin' || r.created_by === session.user.id || this.table === 'profiles';
        matched.filter(canEdit).forEach((r) => Object.assign(r, this.payload));
        save();
        return { data: this.returning ? matched : null, error: null };
      }
      if (this.op === 'delete') {
        const del = matched.filter((r) => role === 'admin' || r.created_by === session.user.id);
        const rm = (table, pred) => { db[table] = db[table].filter((r) => !pred(r)); };
        const ids = new Set(del.map((r) => r.id));
        rm(this.table, (r) => ids.has(r.id));
        (CASCADE[this.table] || []).forEach(([child, col]) => {
          if (child === 'program_participation') return;
          rm(child, (r) => ids.has(r[col]));
        });
        const gone = new Set([...ids]);
        rm('program_participation', (r) => gone.has(r.program_id) || !db.programs.some((p) => p.id === r.program_id));
        save();
        return { data: null, error: null };
      }
      let out = this.shape(matched);
      for (const [c, asc] of [...this.orders].reverse()) {
        out = [...out].sort((a, b) => (getPath(a, c) > getPath(b, c) ? 1 : getPath(a, c) < getPath(b, c) ? -1 : 0) * (asc ? 1 : -1));
      }
      if (this.rangeV) out = out.slice(this.rangeV[0], this.rangeV[1] + 1);
      if (this.limitV != null) out = out.slice(0, this.limitV);
      if (this.wantSingle) return { data: out[0] || null, error: null };
      return { data: out, error: null };
    }
  }

  return {
    isMock: true,
    from: (table) => new Q(table),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: (fn) => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } }; },
      signInWithPassword: async ({ email, password }) => {
        const u = db.users.find((x) => x.email === email.toLowerCase() && x.password === password);
        if (!u) return { data: null, error: { message: 'Invalid login credentials' } };
        setSession(u); emit('SIGNED_IN');
        return { data: { session }, error: null };
      },
      signUp: async ({ email, password, options }) => {
        if (db.users.some((x) => x.email === email.toLowerCase())) return { data: null, error: { message: 'User already registered' } };
        const u = { id: uid(), email: email.toLowerCase(), password };
        db.users.push(u);
        db.profiles.push({ id: u.id, email: u.email, full_name: (options && options.data && options.data.full_name) || '', role: db.profiles.length === 0 ? 'admin' : 'pending', created_at: new Date().toISOString() });
        save();
        return { data: { session: null, user: { id: u.id } }, error: null };
      },
      signOut: async () => { setSession(null); emit('SIGNED_OUT'); return { error: null }; }
    }
  };
}
