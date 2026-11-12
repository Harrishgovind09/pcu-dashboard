import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context.jsx';
import { supabase } from '../lib/supabase.js';
import { loadRecent, deleteRecord } from '../lib/data.js';
import { ORDER, GENDERS, SOURCES, RESPONDENTS, dassLevel, SEV_COLORS } from '../lib/constants.js';

const pad = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

const F = (name, labelKey, type, extra = {}) => ({ name, labelKey, type, ...extra });
const who = [F('person_name', 'personName', 'text', { max: 200 }), F('person_id', 'personId', 'text', { max: 40 })];
const officer = F('officer', 'officer', 'text', { max: 200 });
const letter = F('letter_received_date', 'letterDate', 'date', { optional: true });
const common = [F('ptj', 'ptj', 'lookup', { kind: 'ptj' }), F('gender', 'gender', 'list', { values: GENDERS })];

const FORMS = {
  kaunseling: { table: 'counselling_sessions', init: { attended: true }, fields: [F('session_date', 'date', 'date'), ...common, F('source', 'source', 'list', { values: SOURCES }), F('case_type', 'caseType', 'lookup', { kind: 'kes_kaunseling' }), F('attended', 'attendedQ', 'bool')] },
  tatatertib: { table: 'discipline_sessions', init: {}, fields: [F('session_date', 'date', 'date'), letter, ...who, ...common, F('case_type', 'caseType', 'lookup', { kind: 'kes_tatatertib' }), officer] },
  ujian: { table: 'psych_tests', init: {}, fields: [F('test_date', 'date', 'date'), ...common, F('source', 'source', 'list', { values: SOURCES }), F('test_name', 'testName', 'lookup', { kind: 'ujian' }), F('person_code', 'personCode', 'text', { optional: true, hint: 'personCodeHint' })] },
  dass: { table: 'dass_results', init: {}, fields: [F('test_date', 'date', 'date'), F('respondent', 'respondent', 'list', { values: RESPONDENTS }), ...who, ...common, F('campus', 'campus', 'lookup', { kind: 'kampus' }), officer, F('depression', 'score_depression', 'score', { scale: 'depression' }), F('anxiety', 'score_anxiety', 'score', { scale: 'anxiety' }), F('stress', 'score_stress', 'score', { scale: 'stress' })] },
  intervensi: { table: 'interventions', init: {}, fields: [F('intervention_date', 'date', 'date'), letter, F('respondent', 'respondent', 'list', { values: RESPONDENTS }), ...who, ...common, F('campus', 'campus', 'lookup', { kind: 'kampus' }), F('intervention_type', 'intervType', 'lookup', { kind: 'intervensi' }), officer] },
  program: { table: 'programs', init: {}, fields: [F('name', 'programName', 'text'), F('jabatan', 'department', 'lookup', { kind: 'jabatan' }), F('held_on', 'heldOn', 'date'), F('budget', 'budget', 'money', { optional: true })] }
};

const emptyLine = () => ({ ptj: '', gender: '', category: '', participants: '' });

function FieldInput({ f, value, error, onChange, lookups }) {
  const { t, tv } = useApp();
  const id = 'f-' + f.name;
  let control;
  if (f.type === 'lookup' || f.type === 'list') {
    const opts = f.type === 'lookup' ? (lookups[f.kind] || []).map((l) => l.value) : f.values;
    control = (
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
        <option value="">—</option>
        {opts.map((o) => <option key={o} value={o}>{tv(o)}</option>)}
      </select>
    );
  } else if (f.type === 'bool') {
    control = (
      <select id={id} value={value === false ? 'no' : 'yes'} onChange={(e) => onChange(e.target.value === 'yes')}>
        <option value="yes">{t('yes')}</option>
        <option value="no">{t('no')}</option>
      </select>
    );
  } else if (f.type === 'date') {
    control = <input id={id} type="date" min="2000-01-01" max="2100-12-31" value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />;
  } else if (f.type === 'score' || f.type === 'money') {
    control = <input id={id} type="number" inputMode="numeric" min="0" max={f.type === 'score' ? 42 : undefined} step={f.type === 'score' ? 1 : '0.01'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />;
  } else {
    control = <input id={id} type="text" maxLength={f.max || 80} value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />;
  }
  const lvl = f.type === 'score' && value !== '' && value != null && Number(value) >= 0 && Number(value) <= 42 ? dassLevel(f.scale, Number(value)) : null;
  return (
    <div className="field">
      <label htmlFor={id}>{t(f.labelKey)}</label>
      {control}
      {lvl !== null ? <span className="level-note"><span className="swatch sm" style={{ background: SEV_COLORS[lvl] }} aria-hidden="true" />{t('level')}: {t('sev' + lvl)}</span> : null}
      {f.hint ? <span className="muted small">{t(f.hint)}</span> : null}
      {error ? <span className="field-error" role="alert">{error}</span> : null}
    </div>
  );
}

export default function Entry({ lookups }) {
  const { t, tv } = useApp();
  const [mod, setMod] = useState('kaunseling');
  const form = FORMS[mod];
  const fresh = useCallback(() => ({ ...form.init }), [form]);
  const [values, setValues] = useState(() => ({ ...FORMS.kaunseling.init }));
  const [lines, setLines] = useState([emptyLine()]);
  const [errors, setErrors] = useState({});
  const [lineErrors, setLineErrors] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  const refresh = useCallback(() => loadRecent(mod).then(setRecent).catch(() => setRecent([])), [mod]);
  useEffect(() => { setValues(fresh()); setLines([emptyLine()]); setErrors({}); setLineErrors([]); setMsg(null); setConfirmId(null); refresh(); }, [mod]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (name, v) => { setValues((s) => ({ ...s, [name]: v })); setErrors((e) => ({ ...e, [name]: undefined })); };

  const validate = () => {
    const e = {};
    form.fields.forEach((f) => {
      const v = values[f.name];
      const blank = v === undefined || v === null || String(v).trim() === '';
      if (f.type === 'bool') return;
      if (blank) { if (!f.optional) e[f.name] = t('required'); return; }
      if (f.type === 'score') { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 42) e[f.name] = t('scoreRange'); }
      if (f.type === 'money' && !(Number(v) >= 0)) e[f.name] = t('positiveNumber');
    });
    let le = [];
    if (mod === 'program') {
      le = lines.map((l) => {
        const x = {};
        if (!l.ptj) x.ptj = t('required');
        if (!l.gender) x.gender = t('required');
        if (!l.category) x.category = t('required');
        if (!(Number.isInteger(Number(l.participants)) && Number(l.participants) > 0)) x.participants = t('positiveNumber');
        return x;
      });
    }
    setErrors(e); setLineErrors(le);
    return Object.keys(e).length === 0 && le.every((x) => Object.keys(x).length === 0);
  };

  const payload = () => {
    const p = {};
    form.fields.forEach((f) => {
      const v = values[f.name];
      if (f.type === 'bool') p[f.name] = v !== false;
      else if (f.type === 'score') p[f.name] = Number(v);
      else if (f.type === 'money') p[f.name] = v === '' || v == null ? 0 : Number(v);
      else p[f.name] = v === '' || v == null ? null : String(v).trim();
    });
    return p;
  };

  const save = async (keep) => {
    setMsg(null);
    if (!validate()) return;
    setBusy(true);
    try {
      if (mod === 'program') {
        const { data, error } = await supabase.from('programs').insert(payload()).select('id').single();
        if (error) throw new Error(error.message);
        const pid = Array.isArray(data) ? data[0].id : data.id;
        const { error: e2 } = await supabase.from('program_participation').insert(lines.map((l) => ({ program_id: pid, ptj: l.ptj, gender: l.gender, category: l.category, participants: Number(l.participants) })));
        if (e2) { await supabase.from('programs').delete().eq('id', pid); throw new Error(e2.message); }
      } else {
        const { error } = await supabase.from(form.table).insert(payload());
        if (error) throw new Error(error.message);
      }
      setMsg({ ok: true, text: t('saved') });
      if (!keep) { setValues(fresh()); setLines([emptyLine()]); }
      else if (mod !== 'program') setValues((s) => ({ ...s, ...(form.fields.some((f) => f.type === 'score') ? { depression: '', anxiety: '', stress: '' } : {}) }));
      refresh();
    } catch (ex) {
      setMsg({ ok: false, text: t('saveFailed', { e: ex.message }) });
    }
    setBusy(false);
  };

  const remove = async (rid) => {
    try { await deleteRecord(mod, rid); setConfirmId(null); setMsg({ ok: true, text: t('deleted') }); refresh(); }
    catch (ex) { setMsg({ ok: false, text: ex.message }); }
  };

  const cols = mod === 'program' ? ['name', 'jabatan', 'held_on', 'budget'] : form.fields.map((f) => f.name).filter((n) => n !== 'person_code');
  const labelOf = (n) => t((form.fields.find((f) => f.name === n) || {}).labelKey || n);
  const show = (n, v) => (v === true ? t('yes') : v === false ? t('no') : v === null || v === undefined ? '' : typeof v === 'string' ? tv(v) : v);
  const lookupsFor = (kind) => (lookups[kind] || []).map((l) => l.value);

  return (
    <div className="stack">
      <div className="notice" role="note">{t('anonNote')}</div>
      <div className="tabs" role="tablist" aria-label={t('modules')}>
        {ORDER.map((id) => (
          <button key={id} type="button" role="tab" aria-selected={mod === id} className={'tab' + (mod === id ? ' on' : '')} onClick={() => setMod(id)}>{t(id)}</button>
        ))}
      </div>

      <form className="card form" onSubmit={(e) => { e.preventDefault(); save(false); }} noValidate>
        <div className="form-grid">
          {form.fields.map((f) => <FieldInput key={mod + f.name} f={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} lookups={lookups} />)}
        </div>

        {mod === 'program' ? (
          <fieldset className="lines">
            <legend className="h2">{t('participationLines')}</legend>
            {lines.map((l, i) => {
              const le = lineErrors[i] || {};
              const upd = (k, v) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
              return (
                <div className="line-row" key={i}>
                  <div className="field"><label htmlFor={'l-ptj-' + i}>{t('ptj')}</label>
                    <select id={'l-ptj-' + i} value={l.ptj} onChange={(e) => upd('ptj', e.target.value)} aria-invalid={!!le.ptj}><option value="">—</option>{lookupsFor('ptj').map((o) => <option key={o} value={o}>{tv(o)}</option>)}</select>
                    {le.ptj ? <span className="field-error" role="alert">{le.ptj}</span> : null}</div>
                  <div className="field"><label htmlFor={'l-g-' + i}>{t('gender')}</label>
                    <select id={'l-g-' + i} value={l.gender} onChange={(e) => upd('gender', e.target.value)} aria-invalid={!!le.gender}><option value="">—</option>{GENDERS.map((o) => <option key={o} value={o}>{tv(o)}</option>)}</select>
                    {le.gender ? <span className="field-error" role="alert">{le.gender}</span> : null}</div>
                  <div className="field"><label htmlFor={'l-c-' + i}>{t('category')}</label>
                    <select id={'l-c-' + i} value={l.category} onChange={(e) => upd('category', e.target.value)} aria-invalid={!!le.category}><option value="">—</option>{lookupsFor('kategori_penyertaan').map((o) => <option key={o} value={o}>{tv(o)}</option>)}</select>
                    {le.category ? <span className="field-error" role="alert">{le.category}</span> : null}</div>
                  <div className="field"><label htmlFor={'l-n-' + i}>{t('participantsN')}</label>
                    <input id={'l-n-' + i} type="number" min="1" step="1" inputMode="numeric" value={l.participants} onChange={(e) => upd('participants', e.target.value)} aria-invalid={!!le.participants} />
                    {le.participants ? <span className="field-error" role="alert">{le.participants}</span> : null}</div>
                  {lines.length > 1 ? <button type="button" className="link" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>{t('removeLine')}</button> : <span />}
                </div>
              );
            })}
            <button type="button" className="btn secondary" onClick={() => setLines((ls) => [...ls, emptyLine()])}>{t('addLine')}</button>
          </fieldset>
        ) : null}

        {msg ? <div className={'notice' + (msg.ok ? ' ok' : ' error')} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div> : null}
        <div className="form-actions">
          <button type="submit" className="btn" disabled={busy}>{busy ? t('saving') : t('save')}</button>
          <button type="button" className="btn secondary" disabled={busy} onClick={() => save(true)}>{t('saveAnother')}</button>
        </div>
      </form>

      <section className="card">
        <h2 className="h2">{t('recentRecords')}</h2>
        {recent.length === 0 ? <p className="muted">{t('noRecords')}</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>{cols.map((c) => <th key={c} scope="col">{labelOf(c)}</th>)}<th scope="col"><span className="sr-only">{t('delete')}</span></th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    {cols.map((c) => <td key={c} data-label={labelOf(c)}>{show(c, r[c])}</td>)}
                    <td className="actions">
                      {confirmId === r.id ? (
                        <>
                          <button type="button" className="link danger" onClick={() => remove(r.id)}>{t('confirmDelete')}</button>
                          <button type="button" className="link" onClick={() => setConfirmId(null)}>{t('cancel')}</button>
                        </>
                      ) : <button type="button" className="link" onClick={() => setConfirmId(r.id)}>{t('delete')}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
