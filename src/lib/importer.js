import Papa from 'papaparse';
import { supabase } from './supabase.js';

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[\s_\/\-.]+/g, '');

const C = (key, header, aliases, type, extra = {}) => ({ key, header, aliases: aliases.map(norm), type, ...extra });

export const SPEC = {
  kaunseling: {
    table: 'counselling_sessions',
    cols: [
      C('session_date', 'tarikh', ['date', 'tarikh sesi', 'session date'], 'date'),
      C('ptj', 'ptj', [], 'lookup', { kind: 'ptj' }),
      C('gender', 'jantina', ['gender'], 'gender'),
      C('source', 'rujukan_sukarela', ['source', 'rujukan/sukarela', 'referral', 'jenis kedatangan'], 'source'),
      C('case_type', 'kes', ['case', 'case type', 'jenis kes'], 'lookup', { kind: 'kes_kaunseling' }),
      C('attended', 'hadir', ['attended', 'kehadiran'], 'bool', { optional: true, def: true })
    ],
    example: ['2026-03-15', 'FSKTM', 'Perempuan', 'sukarela', 'Akademik', 'ya']
  },
  tatatertib: {
    table: 'discipline_sessions',
    cols: [
      C('session_date', 'tarikh', ['date', 'tarikh sesi', 'session date'], 'date'),
      C('letter_received_date', 'tarikh_surat_diterima', ['tarikh surat', 'letter received date', 'letter date'], 'date', { optional: true }),
      C('person_name', 'nama', ['name', 'nama pelajar', 'nama staf', 'nama pelajar/staf'], 'name'),
      C('person_id', 'no_matrik_staf', ['no matrik', 'no. matrik', 'no matrik/staf', 'matric no', 'matric number', 'staff no', 'no staf', 'id'], 'text40'),
      C('ptj', 'ptj', [], 'lookup', { kind: 'ptj' }),
      C('gender', 'jantina', ['gender'], 'gender'),
      C('case_type', 'kes', ['case', 'case type', 'jenis kes'], 'lookup', { kind: 'kes_tatatertib' }),
      C('officer', 'pegawai_bertanggungjawab', ['pegawai', 'pegawai yang bertanggungjawab', 'officer', 'officer in charge'], 'name'),
    ],
    example: ['2026-03-15', '2026-03-10', 'Nama Contoh', 'AI230001', 'FKEE', 'Lelaki', 'Ponteng kelas', 'Pegawai A']
  },
  ujian: {
    table: 'psych_tests',
    cols: [
      C('test_date', 'tarikh', ['date', 'tarikh ujian', 'test date'], 'date'),
      C('ptj', 'ptj', [], 'lookup', { kind: 'ptj' }),
      C('gender', 'jantina', ['gender'], 'gender'),
      C('source', 'rujukan_sukarela', ['source', 'rujukan/sukarela', 'referral'], 'source'),
      C('test_name', 'nama_ujian', ['test', 'test name', 'nama ujian psikologi'], 'lookup', { kind: 'ujian' }),
      C('person_code', 'kod_peserta', ['person code', 'participant code', 'kod'], 'text', { optional: true })
    ],
    example: ['2026-03-15', 'FKAAB', 'Perempuan', 'sukarela', 'DASS-21', 'P0001']
  },
  dass: {
    table: 'dass_results',
    cols: [
      C('test_date', 'tarikh', ['date', 'tarikh ujian', 'test date'], 'date'),
      C('respondent', 'kategori', ['respondent', 'responden'], 'respondent'),
      C('person_name', 'nama', ['name', 'nama pelajar', 'nama staf', 'nama pelajar/staf'], 'name'),
      C('person_id', 'no_matrik_staf', ['no matrik', 'no. matrik', 'no matrik/staf', 'matric no', 'matric number', 'staff no', 'no staf', 'id'], 'text40'),
      C('ptj', 'ptj', [], 'lookup', { kind: 'ptj' }),
      C('gender', 'jantina', ['gender'], 'gender'),
      C('campus', 'kampus', ['campus'], 'lookup', { kind: 'kampus' }),
      C('officer', 'pegawai_bertanggungjawab', ['pegawai', 'pegawai yang bertanggungjawab', 'officer', 'officer in charge'], 'name'),
      C('depression', 'skor_kemurungan', ['depression', 'depression score', 'kemurungan'], 'score'),
      C('anxiety', 'skor_kebimbangan', ['anxiety', 'anxiety score', 'kebimbangan'], 'score'),
      C('stress', 'skor_tekanan', ['stress', 'stress score', 'tekanan'], 'score')
    ],
    example: ['2026-03-15', 'pelajar', 'Nama Contoh', 'AI230001', 'FSKTM', 'Perempuan', 'Parit Raja', 'Pegawai A', 10, 12, 18]
  },
  intervensi: {
    table: 'interventions',
    cols: [
      C('intervention_date', 'tarikh', ['date', 'tarikh intervensi'], 'date'),
      C('letter_received_date', 'tarikh_surat_diterima', ['tarikh surat', 'letter received date', 'letter date'], 'date', { optional: true }),
      C('respondent', 'kategori', ['respondent', 'responden'], 'respondent'),
      C('person_name', 'nama', ['name', 'nama pelajar', 'nama staf', 'nama pelajar/staf'], 'name'),
      C('person_id', 'no_matrik_staf', ['no matrik', 'no. matrik', 'no matrik/staf', 'matric no', 'matric number', 'staff no', 'no staf', 'id'], 'text40'),
      C('ptj', 'ptj', [], 'lookup', { kind: 'ptj' }),
      C('gender', 'jantina', ['gender'], 'gender'),
      C('campus', 'kampus', ['campus'], 'lookup', { kind: 'kampus' }),
      C('intervention_type', 'jenis_intervensi', ['intervention type', 'type', 'jenis'], 'lookup', { kind: 'intervensi' }),
      C('officer', 'pegawai_bertanggungjawab', ['pegawai', 'pegawai yang bertanggungjawab', 'officer', 'officer in charge'], 'name'),
    ],
    example: ['2026-03-15', '2026-03-10', 'pelajar', 'Nama Contoh', 'AI230001', 'FKMP', 'Lelaki', 'Pagoh', 'Kaunseling individu', 'Pegawai A']
  },
  program: {
    table: 'programs',
    cols: [
      C('name', 'nama_program', ['program name', 'programme name', 'nama program', 'program'], 'name'),
      C('jabatan', 'jabatan', ['department'], 'lookup', { kind: 'jabatan' }),
      C('held_on', 'tarikh', ['date', 'tarikh program', 'held on'], 'date'),
      C('budget', 'bajet', ['budget', 'bajet program'], 'money', { optional: true, def: 0 }),
      C('ptj', 'ptj', [], 'lookup', { kind: 'ptj' }),
      C('gender', 'jantina', ['gender'], 'gender'),
      C('category', 'kategori', ['category', 'kategori penyertaan'], 'lookup', { kind: 'kategori_penyertaan' }),
      C('participants', 'peserta', ['participants', 'bilangan peserta'], 'posint')
    ],
    example: ['Bengkel Pengurusan Stres', 'PCU', '2026-03-15', 1500, 'FSKTM', 'Perempuan', 'Pelajar', 25]
  }
};

export const templateRows = (id) => [SPEC[id].cols.map((c) => c.header), SPEC[id].example];

// ---------- reading the file ----------
export async function readTable(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('File too large (max 5 MB)');
  const name = file.name.toLowerCase();
  let grid;
  if (name.endsWith('.csv')) {
    const text = await file.text();
    const res = Papa.parse(text.replace(/^﻿/, ''), { skipEmptyLines: 'greedy' });
    grid = res.data;
  } else if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    grid = await readSheet(file);
  } else {
    throw new Error('Unsupported file type');
  }
  grid = grid.filter((r) => r.some((c) => c !== null && c !== '' && c !== undefined));
  if (grid.length < 2) return { headers: [], rows: [] };
  if (grid.length > 20001) throw new Error('Too many rows (max 20,000)');
  return { headers: grid[0].map((h) => String(h == null ? '' : h)), rows: grid.slice(1) };
}

// ---------- validating ----------
const GENDER_MAP = { perempuan: 'Perempuan', female: 'Perempuan', p: 'Perempuan', f: 'Perempuan', wanita: 'Perempuan', lelaki: 'Lelaki', male: 'Lelaki', l: 'Lelaki', m: 'Lelaki', lelakilaki: 'Lelaki' };
const SOURCE_MAP = { rujukan: 'rujukan', referral: 'rujukan', referred: 'rujukan', sukarela: 'sukarela', voluntary: 'sukarela', walkin: 'sukarela' };
const WHO_MAP = { pelajar: 'pelajar', student: 'pelajar', students: 'pelajar', staf: 'staf', staff: 'staf' };
const STATUS_MAP = { stabil: 'stabil', stable: 'stabil', sederhana: 'sederhana', moderate: 'sederhana', teruk: 'teruk', severe: 'teruk' };
const BOOL_MAP = { ya: true, yes: true, y: true, '1': true, true: true, hadir: true, attended: true, tidak: false, no: false, n: false, '0': false, false: false, tidakhadir: false };

const pad = (n) => String(n).padStart(2, '0');
function parseDate(v) {
  if (v instanceof Date && !isNaN(v)) {
    // Excel dates are normally UTC midnight; if the library gave local midnight instead, use local parts.
    const utcMidnight = v.getUTCHours() === 0 && v.getUTCMinutes() === 0;
    return utcMidnight
      ? `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`
      : `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else {
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (!m) return null;
    d = +m[1]; mo = +m[2]; y = +m[3];
  }
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || y < 2000 || y > 2100) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

function convert(col, raw, lookups) {
  const empty = raw === null || raw === undefined || String(raw).trim() === '';
  if (empty) {
    if (col.optional) return { v: col.def !== undefined ? col.def : null };
    return { e: 'err_required' };
  }
  const s = String(raw).trim();
  switch (col.type) {
    case 'date': { const d = parseDate(raw); return d ? { v: d } : { e: 'err_date' }; }
    case 'gender': { const g = GENDER_MAP[norm(s)]; return g ? { v: g } : { e: 'err_gender' }; }
    case 'source': { const g = SOURCE_MAP[norm(s)]; return g ? { v: g } : { e: 'err_source' }; }
    case 'respondent': { const g = WHO_MAP[norm(s)]; return g ? { v: g } : { e: 'err_respondent' }; }
    case 'status': { const g = STATUS_MAP[norm(s)]; return g ? { v: g } : { e: 'err_status' }; }
    case 'bool': { const g = BOOL_MAP[norm(s)]; return g === undefined ? { e: 'err_bool' } : { v: g }; }
    case 'lookup': {
      const list = (lookups[col.kind] || []).map((x) => x.value);
      const hit = list.find((x) => norm(x) === norm(s));
      return hit ? { v: hit } : { e: 'err_lookup', vars: { v: s.slice(0, 40), k: col.kind } };
    }
    case 'score': { const n = Number(s); return Number.isInteger(n) && n >= 0 && n <= 42 ? { v: n } : { e: 'err_score' }; }
    case 'money': { const n = Number(String(raw).replace(/,/g, '')); return Number.isFinite(n) && n >= 0 ? { v: n } : { e: 'err_number' }; }
    case 'posint': { const n = Number(s); return Number.isInteger(n) && n > 0 ? { v: n } : { e: 'err_int' }; }
    case 'name': return s.length <= 200 ? { v: s } : { e: 'err_required' };
    case 'text40': return { v: s.slice(0, 40) };
    default: return { v: s.slice(0, 80) };
  }
}

export function validate(moduleId, table, lookups) {
  const spec = SPEC[moduleId];
  const idx = {};
  const missing = [];
  spec.cols.forEach((c) => {
    const i = table.headers.findIndex((h) => norm(h) === norm(c.header) || c.aliases.includes(norm(h)));
    if (i >= 0) idx[c.key] = i;
    else if (!c.optional) missing.push(c.header);
  });
  if (missing.length) return { missing, valid: [], errors: [] };
  const valid = [], errors = [];
  table.rows.forEach((row, n) => {
    const rec = {}, msgs = [];
    spec.cols.forEach((c) => {
      const raw = idx[c.key] === undefined ? undefined : row[idx[c.key]];
      const r = convert(c, raw, lookups);
      if (r.e) msgs.push({ col: c.header, key: r.e, vars: r.vars });
      else rec[c.key] = r.v;
    });
    if (msgs.length) errors.push({ rowNum: n + 2, msgs });
    else valid.push(rec);
  });
  return { missing: [], valid, errors };
}

// ---------- writing ----------
const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };

export async function runImport(moduleId, valid, filename) {
  const spec = SPEC[moduleId];
  const { data: b, error: be } = await supabase.from('import_batches').insert({ module: moduleId, filename: filename.slice(0, 200), row_count: valid.length }).select('id').single();
  if (be) throw new Error(be.message);
  const batchId = Array.isArray(b) ? b[0].id : b.id;
  const undo = async () => { await supabase.from('import_batches').delete().eq('id', batchId); };
  try {
    if (moduleId === 'program') {
      const groups = new Map();
      valid.forEach((r) => {
        const k = [r.name, r.jabatan, r.held_on].join('|');
        if (!groups.has(k)) groups.set(k, { name: r.name, jabatan: r.jabatan, held_on: r.held_on, budget: r.budget || 0, lines: [] });
        groups.get(k).lines.push({ ptj: r.ptj, gender: r.gender, category: r.category, participants: r.participants });
      });
      const list = [...groups.values()];
      const idByKey = new Map();
      for (const part of chunk(list, 200)) {
        const { data, error } = await supabase.from('programs').insert(part.map((g) => ({ name: g.name, jabatan: g.jabatan, held_on: g.held_on, budget: g.budget, batch_id: batchId }))).select('id,name,jabatan,held_on');
        if (error) throw new Error(error.message);
        data.forEach((p) => idByKey.set([p.name, p.jabatan, p.held_on].join('|'), p.id));
      }
      const lines = [];
      groups.forEach((g, k) => g.lines.forEach((l) => lines.push({ ...l, program_id: idByKey.get(k) })));
      for (const part of chunk(lines, 500)) {
        const { error } = await supabase.from('program_participation').insert(part);
        if (error) throw new Error(error.message);
      }
    } else {
      for (const part of chunk(valid, 500)) {
        const { error } = await supabase.from(spec.table).insert(part.map((r) => ({ ...r, batch_id: batchId })));
        if (error) throw new Error(error.message);
      }
    }
  } catch (e) {
    await undo();
    throw e;
  }
  return valid.length;
}

export async function loadBatches() {
  const { data, error } = await supabase.from('import_batches').select('id,module,filename,row_count,created_at').order('created_at', { ascending: false }).limit(30);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function undoBatch(id) {
  const { error } = await supabase.from('import_batches').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
