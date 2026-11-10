import { useEffect, useMemo, useState, useCallback } from 'react';
import { useApp } from '../context.jsx';
import { loadModule } from '../lib/data.js';
import { computeModule, FILTERS } from '../lib/compute.js';
import { downloadCsv, reportRows } from '../lib/csv.js';
import { downloadPdf } from '../lib/pdf.js';
import { MONTHS, MONTHS_FULL, ICONS } from '../lib/constants.js';
import FilterBar from '../components/FilterBar.jsx';
import KpiCard from '../components/Kpi.jsx';
import { MonthlyChart, GenderCard, Panel } from '../components/Charts.jsx';
import Icon from '../components/Icon.jsx';
import { Loading, ErrorBox } from '../components/Status.jsx';

export default function ModulePage({ id, year, lookups }) {
  const { t, tv, lang } = useApp();
  const [state, setState] = useState({ status: 'loading' });
  const [sel, setSel] = useState({});

  const load = useCallback(() => {
    let alive = true;
    setState({ status: 'loading' });
    loadModule(id, year).then((data) => alive && setState({ status: 'ok', data })).catch((e) => alive && setState({ status: 'error', message: e.message }));
    return () => { alive = false; };
  }, [id, year]);
  useEffect(() => load(), [load]);
  useEffect(() => setSel({}), [id]);

  const defs = FILTERS[id];
  const computed = useMemo(() => (state.status === 'ok' ? computeModule(id, state.data, sel, year) : null), [state, sel, id, year]);
  const names = useMemo(() => (state.status === 'ok' && state.data.programs ? [...new Set(state.data.programs.filter((p) => p.year === year).map((p) => p.name))].sort() : []), [state, year]);

  const filtersText = () => defs.filter((d) => sel[d.key]).map((d) => {
      const v = sel[d.key];
      const shown = d.type === 'month' ? MONTHS_FULL[lang][Number(v)] : d.type === 'level' ? t('sev' + v) : tv(v);
      return t(d.labelKey) + ': ' + shown;
    }).join('; ');
  const download = () => downloadCsv(`pcu-${id}-${year}.csv`, reportRows({ t, tv, computed, year, moduleLabel: t(id), filtersText: filtersText(), months: MONTHS[lang] }));
  const downloadPdfReport = () => downloadPdf({ filename: `pcu-${id}-${year}.pdf`, title: t(id), subtitle: t('dashboard'), filtersText: filtersText(), computed, t, tv, months: MONTHS[lang], year });

  return (
    <div className="stack">
      <FilterBar defs={defs} sel={sel} onChange={(k, v) => setSel((s) => ({ ...s, [k]: v }))} onReset={() => setSel({})} lookups={lookups} names={names}
        extra={(
          <>
            <button type="button" className="btn secondary" onClick={download} disabled={!computed}>
              <Icon d={ICONS.import} size={18} stroke={2} />{t('downloadCsv')}
            </button>
            <button type="button" className="btn" onClick={downloadPdfReport} disabled={!computed}>
              <Icon d={ICONS.import} size={18} stroke={2} />{t('downloadPdf')}
            </button>
          </>
        )} />
      {state.status === 'loading' ? <Loading /> : null}
      {state.status === 'error' ? <ErrorBox message={state.message} onRetry={load} /> : null}
      {computed ? (
        <>
          {computed.empty ? <div className="notice" role="status">{t('noData')}</div> : null}
          {computed.groups.map((g, gi) => (
            <section key={gi} className="stack tight">
              {g.titleKey ? <h2 className="group-title">{t(g.titleKey)}</h2> : null}
              <div className="flex-wrap">
                {g.cards.map((c) => <KpiCard key={c.label} card={c} year={year} />)}
              </div>
            </section>
          ))}
          <div className="flex-wrap stretch">
            <MonthlyChart monthly={computed.monthly} year={year} />
            <GenderCard gender={computed.gender} />
          </div>
          <div className="flex-wrap stretch">
            {computed.panels.map((p, i) => <Panel key={i} panel={p} />)}
          </div>
        </>
      ) : null}
    </div>
  );
}
