import { GENDERS, SOURCES } from './constants.js';
import { fmt, pct } from './i18n.js';

// ---------- filter definitions (what the "Mengikut" chips offer) ----------
const month = { key: 'month', labelKey: 'f_month', allKey: 'allMonths', type: 'month', test: (r, v) => r.month === Number(v) };
const ptj = { key: 'ptj', labelKey: 'f_ptj', allKey: 'allPtj', type: 'lookup', kind: 'ptj', test: (r, v) => r.ptj === v };
const gender = { key: 'gender', labelKey: 'f_gender', allKey: 'all', type: 'list', values: GENDERS, test: (r, v) => r.gender === v };
const source = { key: 'source', labelKey: 'f_source', allKey: 'all', type: 'list', values: SOURCES, test: (r, v) => r.source === v };
const campus = { key: 'campus', labelKey: 'f_campus', allKey: 'allKampus', type: 'lookup', kind: 'kampus', test: (r, v) => r.campus === v };
const level = (key, labelKey, field) => ({ key, labelKey, allKey: 'allLevels', type: 'level', test: (r, v) => r[field] === Number(v) });

export const FILTERS = {
  kaunseling: [month, ptj, gender, source, { key: 'caseType', labelKey: 'f_case', allKey: 'allKes', type: 'lookup', kind: 'kes_kaunseling', test: (r, v) => r.caseType === v }],
  program: [
    month,
    { key: 'jabatan', labelKey: 'f_jabatan', allKey: 'allJabatan', type: 'lookup', kind: 'jabatan', test: (r, v) => r.jabatan === v },
    { key: 'category', labelKey: 'f_kategori', allKey: 'allKategori', type: 'lookup', kind: 'kategori_penyertaan', test: (r, v) => r.category === v },
    ptj, gender,
    { key: 'name', labelKey: 'f_program', allKey: 'allNama', type: 'names', test: (r, v) => r.name === v }
  ],
  ujian: [month, ptj, gender, source, { key: 'test', labelKey: 'f_test', allKey: 'allNama', type: 'lookup', kind: 'ujian', test: (r, v) => r.test === v }],
  tatatertib: [month, ptj, gender, { key: 'caseType', labelKey: 'f_case', allKey: 'allKes', type: 'lookup', kind: 'kes_tatatertib', test: (r, v) => r.caseType === v }],
  dass: [month, ptj, gender, campus, level('sl', 'f_stress', 'sl'), level('al', 'f_anxiety', 'al'), level('dl', 'f_depression', 'dl')],
  intervensi: [month, ptj, gender, campus, { key: 'type', labelKey: 'f_type', allKey: 'allJenis', type: 'lookup', kind: 'intervensi', test: (r, v) => r.type === v }]
};

// ---------- small helpers ----------
const sum = (a) => a.reduce((x, y) => x + y, 0);
const monthly = (rows, weight = () => 1) => {
  const v = Array(12).fill(0);
  rows.forEach((r) => { v[r.month] += weight(r); });
  return v;
};
const tally = (rows, keyFn, weight = () => 1) => {
  const m = new Map();
  rows.forEach((r) => m.set(keyFn(r), (m.get(keyFn(r)) || 0) + weight(r)));
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};
const people = (rows) => {
  const m = new Map();
  rows.forEach((r) => { if (!m.has(r.person)) m.set(r.person, r); });
  return [...m.values()];
};
const pctD = (c, p) => (p > 0 ? { type: 'pct', value: ((c - p) / p) * 100 } : null);
const ptsD = (c, p, ok) => (ok ? { type: 'pts', value: c - p } : null);
const genderPair = (rows, weight = () => 1) => GENDERS.map((g) => ({ label: g, value: sum(rows.filter((r) => r.gender === g).map(weight)) }));
const bars = (titleKey, rows, subKey) => ({ kind: 'bars', titleKey, subKey, rows });

export const DASS_SCALES = [['depression', 'dl', 'd_depression'], ['anxiety', 'al', 'd_anxiety'], ['stress', 'sl', 'd_stress']];

export function computeModule(id, data, sel, year) {
  const defs = FILTERS[id];
  const ok = (r, skip) => defs.every((d) => d.key === skip || !sel[d.key] || d.test(r, sel[d.key]));
  const rowsOf = (y, skip) => data.rows.filter((r) => r.year === y && ok(r, skip));
  const cur = rowsOf(year);
  const prev = rowsOf(year - 1);
  const curNoMonth = rowsOf(year, 'month');
  const base = { id, empty: cur.length === 0 };

  if (id === 'kaunseling' || id === 'tatatertib') {
    const isK = id === 'kaunseling';
    const att = cur.filter((r) => r.attended);
    const attP = prev.filter((r) => r.attended);
    const rate = cur.length ? (att.length / cur.length) * 100 : 0;
    const rateP = prev.length ? (attP.length / prev.length) * 100 : 0;
    const cards = [
      { label: 'k_attended', value: fmt(att.length), sub: { key: 's_ofAppointments', vars: { n: fmt(cur.length) } }, delta: pctD(att.length, attP.length), good: 'flat' },
      { label: 'k_rate', value: rate.toFixed(1), unit: '%', bar: rate, sub: { key: 's_sessionRate' }, delta: ptsD(rate, rateP, prev.length > 0), good: 'up' }
    ];
    if (isK) {
      const ref = att.filter((r) => r.source === 'rujukan');
      const refP = attP.filter((r) => r.source === 'rujukan');
      cards.push({ label: 'k_referral', value: fmt(ref.length), sub: { key: 's_ofAttendance', vars: { p: pct(ref.length, att.length) } }, delta: pctD(ref.length, refP.length), good: 'flat' });
    }
    const attNoMonth = curNoMonth.filter((r) => r.attended);
    return {
      ...base,
      groups: [{ cards }],
      monthly: { titleKey: 'c_attendanceMonth', unitKey: 'sessions', values: monthly(attNoMonth) },
      gender: genderPair(att),
      panels: isK
        ? [
            bars('c_byPtj', tally(att, (r) => r.ptj)),
            bars('c_bySource', tally(att, (r) => r.source), 'c_bySourceSub'),
            bars('c_byCase', tally(att, (r) => r.caseType))
          ]
        : [bars('c_byCase', tally(att, (r) => r.caseType)), bars('c_byPtj', tally(att, (r) => r.ptj))]
    };
  }

  if (id === 'program') {
    const partActive = ['ptj', 'gender', 'category'].some((k) => sel[k]);
    const progsOf = (y, rows) => {
      const baseP = data.programs.filter((p) => p.year === y && ['month', 'jabatan', 'name'].every((k) => {
        const d = defs.find((x) => x.key === k);
        return !sel[k] || d.test(p, sel[k]);
      }));
      if (!partActive) return baseP;
      const ids = new Set(rows.map((r) => r.programId));
      return baseP.filter((p) => ids.has(p.id));
    };
    const pc = progsOf(year, cur), pp = progsOf(year - 1, prev);
    const n = sum(cur.map((r) => r.participants)), nP = sum(prev.map((r) => r.participants));
    const budget = sum(pc.map((p) => p.budget)), budgetP = sum(pp.map((p) => p.budget));
    return {
      ...base,
      empty: cur.length === 0 && pc.length === 0,
      groups: [{
        cards: [
          { label: 'k_participation', value: fmt(n), sub: { key: 's_participants' }, delta: pctD(n, nP), good: 'up' },
          { label: 'k_programs', value: fmt(pc.length), sub: { key: 's_programsDone' }, delta: pctD(pc.length, pp.length), good: 'up' },
          { label: 'k_budget', value: fmt(Math.round(budget)), sub: { key: 's_perParticipant', vars: { n: n > 0 ? (budget / n).toFixed(2) : '0.00' } }, delta: pctD(budget, budgetP), good: 'flat' }
        ]
      }],
      monthly: { titleKey: 'c_participationMonth', unitKey: 'participants', values: monthly(rowsOf(year, 'month'), (r) => r.participants) },
      gender: genderPair(cur, (r) => r.participants),
      panels: [
        bars('c_byCategory', tally(cur, (r) => r.category, (r) => r.participants)),
        bars('c_byPtj', tally(cur, (r) => r.ptj, (r) => r.participants)),
        bars('c_byProgram', tally(cur, (r) => r.name, (r) => r.participants))
      ]
    };
  }

  if (id === 'ujian') {
    const pe = people(cur), peP = people(prev);
    const ratio = pe.length ? (cur.length / pe.length).toFixed(1) : '0.0';
    return {
      ...base,
      groups: [{
        cards: [
          { label: 'k_takers', value: fmt(pe.length), sub: { key: 's_people' }, delta: pctD(pe.length, peP.length), good: 'up' },
          { label: 'k_tests', value: fmt(cur.length), sub: { key: 's_testsPerPerson', vars: { n: ratio } }, delta: pctD(cur.length, prev.length), good: 'up' }
        ]
      }],
      monthly: { titleKey: 'c_testsMonth', unitKey: 'tests', values: monthly(curNoMonth) },
      gender: genderPair(pe),
      panels: [
        bars('c_byTest', tally(cur, (r) => r.test), 'c_testsAdmin'),
        bars('c_byPtj', tally(pe, (r) => r.ptj), 'c_takersCount'),
        bars('c_bySource', tally(pe, (r) => r.source))
      ]
    };
  }

  if (id === 'dass' || id === 'intervensi') {
    const isD = id === 'dass';
    const stableOf = (r) => (isD ? r.sl <= 1 : r.status === 'stabil');
    const severeOf = (r) => (isD ? r.sl >= 3 : r.status === 'teruk');
    const groups = ['pelajar', 'staf'].map((who) => {
      const g = cur.filter((r) => r.respondent === who), gp = prev.filter((r) => r.respondent === who);
      const st = g.filter(stableOf).length, stP = gp.filter(stableOf).length;
      const sv = g.filter(severeOf).length, svP = gp.filter(severeOf).length;
      const isS = who === 'pelajar';
      const shareKey = isS ? 's_ofStudents' : 's_ofStaff';
      return {
        titleKey: isS ? 'groupStudents' : 'groupStaff',
        cards: [
          { label: isS ? 'k_studentsTaking' : 'k_staffTaking', value: fmt(g.length), sub: { key: isS ? 's_students' : 's_staff' }, delta: pctD(g.length, gp.length), good: 'flat' },
          { label: 'k_stable', value: fmt(st), sub: { key: shareKey, vars: { p: pct(st, g.length) } }, delta: ptsD(g.length ? (st / g.length) * 100 : 0, gp.length ? (stP / gp.length) * 100 : 0, gp.length > 0), good: 'up' },
          { label: 'k_severe', value: fmt(sv), sub: { key: shareKey, vars: { p: pct(sv, g.length) } }, delta: ptsD(g.length ? (sv / g.length) * 100 : 0, gp.length ? (svP / gp.length) * 100 : 0, gp.length > 0), good: 'down', severe: true }
        ]
      };
    });
    const mon = { titleKey: isD ? 'c_takersMonth' : 'c_intervMonth', unitKey: 'people', values: monthly(curNoMonth) };
    if (isD) {
      const stackFor = (who, titleKey) => {
        const g = cur.filter((r) => r.respondent === who);
        return {
          kind: 'stack', titleKey, count: g.length,
          rows: DASS_SCALES.map(([, field, labelKey]) => {
            const counts = [0, 0, 0, 0, 0];
            g.forEach((r) => { counts[r[field]]++; });
            return { labelKey, counts };
          })
        };
      };
      return {
        ...base, groups, monthly: mon, gender: genderPair(cur),
        panels: [stackFor('pelajar', 'c_dassStudents'), stackFor('staf', 'c_dassStaff'), bars('c_byCampus', tally(cur, (r) => r.campus))]
      };
    }
    return {
      ...base, groups, monthly: mon, gender: genderPair(cur),
      panels: [bars('c_byType', tally(cur, (r) => r.type)), bars('c_byPtj', tally(cur, (r) => r.ptj)), bars('c_byCampus', tally(cur, (r) => r.campus))]
    };
  }
  return { ...base, groups: [], monthly: { titleKey: '', unitKey: '', values: Array(12).fill(0) }, gender: [], panels: [] };
}
