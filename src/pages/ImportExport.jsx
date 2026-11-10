import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context.jsx';
import { ORDER } from '../lib/constants.js';
import { SPEC, templateRows, readTable, validate, runImport, loadBatches, undoBatch } from '../lib/importer.js';
import { downloadCsv } from '../lib/csv.js';
import { exportRaw } from '../lib/data.js';
import { fmt } from '../lib/i18n.js';

export default function ImportExport({ lookups, year }) {
  const { t } = useApp();
  const [mod, setMod] = useState('kaunseling');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null); // {missing, valid, errors, total}
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [batches, setBatches] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const [expYear, setExpYear] = useState(year);
  const [expMod, setExpMod] = useState('kaunseling');
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(() => loadBatches().then(setBatches).catch(() => setBatches([])), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setFile(null); setResult(null); setMsg(null); }, [mod]);

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    setMsg(null); setResult(null);
    if (!f) return;
    setFile(f);
    try {
      const table = await readTable(f);
      const r = validate(mod, table, lookups);
      setResult({ ...r, total: table.rows.length });
    } catch (ex) {
      setFile(null);
      setMsg({ ok: false, text: ex.message === 'Unsupported file type' ? t('fileReadFailed') : ex.message });
    }
  };

  const doImport = async () => {
    setBusy(true); setMsg(null);
    try {
      const n = await runImport(mod, result.valid, file.name);
      setMsg({ ok: true, text: t('importDone', { n: fmt(n) }) });
      setResult(null); setFile(null);
      refresh();
    } catch (ex) {
      setMsg({ ok: false, text: t('importFailed', { e: ex.message }) });
    }
    setBusy(false);
  };

  const undo = async (id) => {
    try { await undoBatch(id); setConfirmId(null); refresh(); } catch (ex) { setMsg({ ok: false, text: ex.message }); }
  };

  const doExport = async () => {
    setExporting(true); setMsg(null);
    try {
      const rows = await exportRaw(expMod, expYear);
      downloadCsv(`pcu-${expMod}-${expYear}-data.csv`, rows.length ? rows : [{}]);
    } catch (ex) { setMsg({ ok: false, text: ex.message }); }
    setExporting(false);
  };

  const years = [year + 1, year, year - 1, year - 2, year - 3];

  return (
    <div className="stack">
      <section className="card form">
        <h2 className="h2">{t('importTitle')}</h2>
        <p className="muted">{t('importDesc')}</p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="imp-mod">{t('chooseModule')}</label>
            <select id="imp-mod" value={mod} onChange={(e) => setMod(e.target.value)}>
              {ORDER.map((id) => <option key={id} value={id}>{t(id)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="imp-file">{t('chooseFile')}</label>
            <input id="imp-file" type="file" accept=".csv,.xlsx" onChange={onFile} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={() => downloadCsv(`templat-${mod}.csv`, templateRows(mod))}>{t('downloadTemplate')}</button>
        </div>
        <p className="muted small">{SPEC[mod].cols.map((c) => c.header + (c.optional ? ' (opt)' : '')).join(' · ')}</p>

        {result && result.missing.length ? <div className="notice error" role="alert">{t('missingColumns', { c: result.missing.join(', ') })}</div> : null}
        {result && !result.missing.length ? (
          <div className="stack tight">
            <div className="muted">{t('fileParsed', { n: fmt(result.total), f: file.name })}</div>
            <div className="flex-wrap tight">
              <span className="pill good">{t('rowsOk', { n: fmt(result.valid.length) })}</span>
              {result.errors.length ? <span className="pill bad">{t('rowsBad', { n: fmt(result.errors.length) })}</span> : null}
            </div>
            {result.errors.length ? (
              <>
                <p className="muted small">{t('onlyValid')}</p>
                <div className="table-wrap short">
                  <table className="table">
                    <thead><tr><th scope="col">{t('rowCol')}</th><th scope="col">{t('errorCol')}</th></tr></thead>
                    <tbody>
                      {result.errors.slice(0, 50).map((er) => (
                        <tr key={er.rowNum}>
                          <td data-label={t('rowCol')}>{er.rowNum}</td>
                          <td data-label={t('errorCol')}>{er.msgs.map((m) => `${m.col}: ${t(m.key, m.vars)}`).join(' · ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
            {result.valid.length === 0 ? <div className="notice error" role="alert">{t('noValidRows')}</div> : (
              <div className="form-actions">
                <button type="button" className="btn" onClick={doImport} disabled={busy}>{busy ? t('importing') : t('importNow', { n: fmt(result.valid.length) })}</button>
              </div>
            )}
          </div>
        ) : null}
        {msg ? <div className={'notice' + (msg.ok ? ' ok' : ' error')} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div> : null}
      </section>

      <section className="card form">
        <h2 className="h2">{t('importHistory')}</h2>
        {batches.length === 0 ? <p className="muted">{t('noImports')}</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">{t('module')}</th><th scope="col">{t('file')}</th><th scope="col">{t('rows')}</th><th scope="col">{t('when')}</th><th scope="col"><span className="sr-only">{t('undoImport')}</span></th></tr></thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td data-label={t('module')}>{t(b.module)}</td>
                    <td data-label={t('file')}>{b.filename}</td>
                    <td data-label={t('rows')} className="num">{fmt(b.row_count)}</td>
                    <td data-label={t('when')}>{String(b.created_at).slice(0, 16).replace('T', ' ')}</td>
                    <td className="actions">
                      {confirmId === b.id ? (
                        <>
                          <button type="button" className="link danger" onClick={() => undo(b.id)}>{t('confirmDelete')}</button>
                          <button type="button" className="link" onClick={() => setConfirmId(null)}>{t('cancel')}</button>
                        </>
                      ) : <button type="button" className="link" onClick={() => setConfirmId(b.id)}>{t('undoImport')}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card form">
        <h2 className="h2">{t('exportTitle')}</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="exp-mod">{t('chooseModule')}</label>
            <select id="exp-mod" value={expMod} onChange={(e) => setExpMod(e.target.value)}>{ORDER.map((id) => <option key={id} value={id}>{t(id)}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="exp-year">{t('exportYear')}</label>
            <select id="exp-year" value={expYear} onChange={(e) => setExpYear(Number(e.target.value))}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={doExport} disabled={exporting}>{exporting ? t('exporting') : t('exportBtn')}</button>
        </div>
      </section>
    </div>
  );
}
