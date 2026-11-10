import { useEffect, useMemo, useState, useCallback } from 'react';
import { useApp } from '../context.jsx';
import { loadAll } from '../lib/data.js';
import { computeModule } from '../lib/compute.js';
import { ORDER, ICONS, MONTHS_FULL } from '../lib/constants.js';
import { fmt, pct } from '../lib/i18n.js';
import Icon from '../components/Icon.jsx';
import { SevLegend, SevBar } from '../components/Charts.jsx';
import { Loading, ErrorBox } from '../components/Status.jsx';

const sparkOf = (vals) => {
  const max = Math.max(...vals, 0);
  return vals.map((v) => ({ h: max ? Math.round((v / max) * 32) + 3 : 3, peak: v === max && max > 0 }));
};
const valueOf = (id, c) => {
  if (id === 'kaunseling' || id === 'tatatertib') return c.groups[0].cards[0].value;
  if (id === 'program' || id === 'ujian') return c.groups[0].cards[0].value;
  if (id === 'dass' || id === 'intervensi') return fmt(c.groups.reduce((a, g) => a + Number(g.cards[0].value.replace(/,/g, '')), 0));
  return '0';
};

export default function Overview({ year, go }) {
  const { t, lang } = useApp();
  const [state, setState] = useState({ status: 'loading' });
  const load = useCallback(() => {
    let alive = true;
    setState({ status: 'loading' });
    loadAll(year, ORDER).then((data) => alive && setState({ status: 'ok', data })).catch((e) => alive && setState({ status: 'error', message: e.message }));
    return () => { alive = false; };
  }, [year]);
  useEffect(() => load(), [load]);

  const all = useMemo(() => {
    if (state.status !== 'ok') return null;
    const out = {};
    ORDER.forEach((id) => { out[id] = computeModule(id, state.data[id], {}, year); });
    return out;
  }, [state, year]);

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <ErrorBox message={state.message} onRetry={load} />;

  const k = all.kaunseling, p = all.program, d = all.dass;
  const kv = k.monthly.values, pv = p.monthly.values;
  const kTotal = kv.reduce((a, b) => a + b, 0);
  const busiest = kTotal > 0 ? kv.indexOf(Math.max(...kv)) : -1;
  const num = (s) => Number(String(s).replace(/,/g, ''));
  const sevS = num(d.groups[0].cards[2].value), sevT = num(d.groups[1].cards[2].value);
  const att = num(k.groups[0].cards[0].value), ref = num(k.groups[0].cards[2].value);
  const highlights = [];
  if (busiest >= 0) highlights.push({ c: '#1B3A6B', text: t('h_busiest', { m: MONTHS_FULL[lang][busiest], a: fmt(kv[busiest]), b: fmt(pv[busiest]) }), label: t('viewProgram'), to: 'program' });
  if (sevS + sevT > 0) highlights.push({ c: '#DD6A2C', text: t('h_severe', { a: fmt(sevS), b: fmt(sevT) }), label: t('viewDass'), to: 'dass' });
  if (att > 0) highlights.push({ c: '#E3A33C', text: t('h_referral', { a: fmt(ref), p: pct(ref, att) }), label: t('viewCounselling'), to: 'kaunseling' });

  const stress = d.panels[0].rows.find((r) => r.labelKey === 'd_stress').counts;
  const sTotal = stress.reduce((a, b) => a + b, 0);

  return (
    <div className="stack">
      <div className="flex-wrap">
        {ORDER.map((id) => (
          <button key={id} type="button" className="card tile" onClick={() => go(id)}>
            <span className="tile-top">
              <span className="tile-icon" aria-hidden="true"><Icon d={ICONS[id]} /></span>
              <span className="tile-name">{t(id)}</span>
              <Icon d={ICONS.arrow} size={18} stroke={2} />
            </span>
            <span className="block">
              <span className="hd num tile-value">{valueOf(id, all[id])}</span>
              <span className="block muted small tile-sub">{t('tile_' + id)}</span>
            </span>
            <span className="spark" aria-hidden="true">
              {sparkOf(all[id].monthly.values).map((b, i) => <span key={i} style={{ height: b.h, opacity: b.peak ? 1 : 0.4 }} />)}
            </span>
          </button>
        ))}
      </div>
      <div className="flex-wrap stretch">
        <section className="card panel">
          <div>
            <h2 className="h2">{t('highlights')} {year}</h2>
            <div className="sub">{t('highlightsSub')}</div>
          </div>
          {highlights.length === 0 ? <div className="muted">{t('h_none')}</div> : highlights.map((h) => (
            <div className="hl-row" key={h.to}>
              <span className="dot" style={{ background: h.c }} aria-hidden="true" />
              <p>{h.text}</p>
              <button type="button" className="link" onClick={() => go(h.to)}>{h.label}<Icon d={ICONS.arrow} size={16} stroke={2} /></button>
            </div>
          ))}
        </section>
        <section className="card panel">
          <div>
            <h2 className="h2">{t('c_stressStudents')}</h2>
            <div className="sub">{t('c_stressStudentsSub', { n: fmt(sTotal) })}</div>
          </div>
          <SevLegend />
          <SevBar counts={stress} label={t('c_stressStudents')} height={22} />
          <div className="flex-wrap tight">
            {[
              [t('stabilLabel'), stress[0] + stress[1], t('ofStudentsShort', { p: pct(stress[0] + stress[1], sTotal) })],
              [t('moderateLabel'), stress[2], t('needsMonitor')],
              [t('severeUpLabel'), stress[3] + stress[4], t('ofStudentsShort', { p: pct(stress[3] + stress[4], sTotal) })]
            ].map(([l, v, s]) => (
              <div className="statbox" key={l}>
                <div className="muted small">{l}</div>
                <div className="hd num stat-num">{fmt(v)}</div>
                <div className="muted small num">{s}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
