import { supabase } from './supabase.js';

const PAGE = 1000;

// Supabase returns at most 1,000 rows per request, so page through until the end.
export async function fetchAll(build) {
  let all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    all = all.concat(data || []);
    if (!data || data.length < PAGE) break;
  }
  return all;
}

const dateParts = (d) => ({ date: d, year: Number(d.slice(0, 4)), month: Number(d.slice(5, 7)) - 1 });

export async function loadLookups() {
  const { data, error } = await supabase.from('lookups').select('id,kind,value,sort').order('sort').order('value');
  if (error) throw new Error(error.message);
  const by = {};
  (data || []).forEach((r) => { (by[r.kind] = by[r.kind] || []).push(r); });
  return by;
}

// One table per module; each loader returns rows for `year` and `year - 1` (for year-on-year change).
const LOADERS = {
  kaunseling: async (a, b) => {
    const rows = await fetchAll((f, t) => supabase.from('counselling_sessions').select('id,session_date,ptj,gender,source,case_type,attended').gte('session_date', a).lte('session_date', b).order('id').range(f, t));
    return { rows: rows.map((r) => ({ ...dateParts(r.session_date), id: r.id, ptj: r.ptj, gender: r.gender, source: r.source, caseType: r.case_type, attended: r.attended })) };
  },
  tatatertib: async (a, b) => {
    const rows = await fetchAll((f, t) => supabase.from('discipline_sessions').select('id,session_date,ptj,gender,case_type').gte('session_date', a).lte('session_date', b).order('id').range(f, t));
    return { rows: rows.map((r) => ({ ...dateParts(r.session_date), id: r.id, ptj: r.ptj, gender: r.gender, caseType: r.case_type })) };
  },
  ujian: async (a, b) => {
    const rows = await fetchAll((f, t) => supabase.from('psych_tests').select('id,test_date,ptj,gender,source,test_name,person_code').gte('test_date', a).lte('test_date', b).order('id').range(f, t));
    return { rows: rows.map((r) => ({ ...dateParts(r.test_date), id: r.id, ptj: r.ptj, gender: r.gender, source: r.source, test: r.test_name, person: r.person_code || 'id:' + r.id })) };
  },
  dass: async (a, b) => {
    const rows = await fetchAll((f, t) => supabase.from('dass_results').select('id,test_date,respondent,ptj,gender,campus,depression_level,anxiety_level,stress_level').gte('test_date', a).lte('test_date', b).order('id').range(f, t));
    return { rows: rows.map((r) => ({ ...dateParts(r.test_date), id: r.id, respondent: r.respondent, ptj: r.ptj, gender: r.gender, campus: r.campus, dl: r.depression_level, al: r.anxiety_level, sl: r.stress_level })) };
  },
  intervensi: async (a, b) => {
    const rows = await fetchAll((f, t) => supabase.from('interventions').select('id,intervention_date,respondent,ptj,gender,campus,intervention_type').gte('intervention_date', a).lte('intervention_date', b).order('id').range(f, t));
    return { rows: rows.map((r) => ({ ...dateParts(r.intervention_date), id: r.id, respondent: r.respondent, ptj: r.ptj, gender: r.gender, campus: r.campus, type: r.intervention_type })) };
  },
  program: async (a, b) => {
    const [part, progs] = await Promise.all([
      fetchAll((f, t) => supabase.from('program_participation').select('id,program_id,ptj,gender,category,participants,programs!inner(name,jabatan,held_on,budget)').gte('programs.held_on', a).lte('programs.held_on', b).order('id').range(f, t)),
      fetchAll((f, t) => supabase.from('programs').select('id,name,jabatan,held_on,budget').gte('held_on', a).lte('held_on', b).order('id').range(f, t))
    ]);
    return {
      rows: part.map((r) => ({ ...dateParts(r.programs.held_on), id: r.id, programId: r.program_id, ptj: r.ptj, gender: r.gender, category: r.category, participants: r.participants, name: r.programs.name, jabatan: r.programs.jabatan })),
      programs: progs.map((p) => ({ ...dateParts(p.held_on), id: p.id, name: p.name, jabatan: p.jabatan, budget: Number(p.budget) }))
    };
  }
};

export async function loadModule(id, year) {
  return LOADERS[id](`${year - 1}-01-01`, `${year}-12-31`);
}

// Overview needs a slice of every module at once.
export async function loadAll(year, ids) {
  const out = {};
  await Promise.all(ids.map(async (id) => { out[id] = await loadModule(id, year); }));
  return out;
}

export const TABLES = {
  kaunseling: { table: 'counselling_sessions', dateCol: 'session_date' },
  program: { table: 'programs', dateCol: 'held_on' },
  ujian: { table: 'psych_tests', dateCol: 'test_date' },
  tatatertib: { table: 'discipline_sessions', dateCol: 'session_date' },
  dass: { table: 'dass_results', dateCol: 'test_date' },
  intervensi: { table: 'interventions', dateCol: 'intervention_date' }
};

export async function loadRecent(id, limit = 12) {
  const { table } = TABLES[id];
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteRecord(id, recordId) {
  const { error } = await supabase.from(TABLES[id].table).delete().eq('id', recordId);
  if (error) throw new Error(error.message);
}

export async function exportRaw(id, year) {
  const { table, dateCol } = TABLES[id];
  const rows = await fetchAll((f, t) => supabase.from(table).select('*').gte(dateCol, `${year}-01-01`).lte(dateCol, `${year}-12-31`).order('id').range(f, t));
  if (id === 'program') {
    const part = await fetchAll((f, t) => supabase.from('program_participation').select('*').order('id').range(f, t));
    const ids = new Set(rows.map((r) => r.id));
    const byProg = Object.fromEntries(rows.map((r) => [r.id, r]));
    return part.filter((p) => ids.has(p.program_id)).map((p) => ({
      program: byProg[p.program_id].name, jabatan: byProg[p.program_id].jabatan, tarikh: byProg[p.program_id].held_on, bajet_program: byProg[p.program_id].budget,
      ptj: p.ptj, jantina: p.gender, kategori: p.category, peserta: p.participants
    }));
  }
  return rows.map(({ id: _i, batch_id: _b, created_by: _c, ...rest }) => rest);
}
