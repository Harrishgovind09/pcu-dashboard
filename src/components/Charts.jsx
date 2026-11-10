import { useApp } from '../context.jsx';
import { MONTHS, SEV_COLORS, SEV_KEYS } from '../lib/constants.js';
import { fmt, pct } from '../lib/i18n.js';

export function MonthlyChart({ monthly, year }) {
  const { t, lang } = useApp();
  const values = monthly.values;
  const max = Math.max(...values, 0);
  const total = values.reduce((a, b) => a + b, 0);
  const peakIdx = max > 0 ? values.indexOf(max) : -1;
  const labels = MONTHS[lang];
  const aria = t(monthly.titleKey) + ': ' + values.map((v, i) => labels[i] + ' ' + v).join(', ');
  return (
    <section className="card chart-card">
      <div className="card-head">
        <div>
          <h2 className="h2">{t(monthly.titleKey)}</h2>
          <div className="sub">{t('totalFor', { n: fmt(total), unit: t(monthly.unitKey), year })}</div>
        </div>
        {peakIdx >= 0 ? <span className="pill good">{t('peak', { m: labels[peakIdx], n: fmt(max) })}</span> : null}
      </div>
      <div className="bars" role="img" aria-label={aria}>
        {values.map((v, i) => (
          <div className="bar-col" key={i}>
            <span className="bar-val num">{v > 0 ? fmt(v) : ''}</span>
            <div className="bar" style={{ height: max ? Math.max(v > 0 ? 3 : 0, Math.round((v / max) * 150)) + 'px' : '0px', opacity: i === peakIdx ? 1 : 0.42 }} />
          </div>
        ))}
      </div>
      <div className="bar-labels" aria-hidden="true">
        {labels.map((m) => <span key={m}>{m}</span>)}
      </div>
    </section>
  );
}

export function GenderCard({ gender }) {
  const { t, tv } = useApp();
  const total = gender.reduce((a, g) => a + g.value, 0);
  const a = total ? (gender[0].value / total) * 100 : 0;
  const colors = ['var(--accent)', '#E3A33C'];
  const bg = total ? `conic-gradient(${colors[0]} 0 ${a.toFixed(2)}%, ${colors[1]} ${a.toFixed(2)}% 100%)` : '#E6EBF2';
  return (
    <section className="card donut-card">
      <div>
        <h2 className="h2">{t('c_byGender')}</h2>
        <div className="sub">{t('shareOf', { n: fmt(total) })}</div>
      </div>
      <div className="donut-wrap">
        <div className="donut" role="img" aria-label={gender.map((g) => tv(g.label) + ' ' + g.value).join(', ')} style={{ background: bg }}>
          <div className="donut-hole">
            <span className="hd num donut-total">{fmt(total)}</span>
            <span className="muted small">{t('total')}</span>
          </div>
        </div>
        <div className="legend-col">
          {gender.map((g, i) => (
            <div className="legend-item" key={g.label}>
              <span className="swatch" style={{ background: colors[i] }} aria-hidden="true" />
              <div>
                <div className="muted small">{tv(g.label)}</div>
                <div className="num legend-num">{fmt(g.value)} <span className="muted small">· {pct(g.value, total)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SevLegend() {
  const { t } = useApp();
  return (
    <div className="legend-row">
      {SEV_KEYS.map((k, i) => (
        <span key={k} className="legend-chip"><span className="swatch sm" style={{ background: SEV_COLORS[i] }} aria-hidden="true" />{t(k)}</span>
      ))}
    </div>
  );
}

export function SevBar({ counts, label, height = 16 }) {
  const { t } = useApp();
  const total = counts.reduce((a, b) => a + b, 0);
  const aria = label + ': ' + counts.map((n, i) => t(SEV_KEYS[i]) + ' ' + n).join(', ');
  return (
    <div className="sevbar" role="img" aria-label={aria} style={{ height }}>
      {counts.map((n, i) => (
        <div key={i} title={t(SEV_KEYS[i]) + ': ' + fmt(n) + ' (' + pct(n, total) + ')'} style={{ flex: `${n} 1 0`, background: SEV_COLORS[i] }} />
      ))}
    </div>
  );
}

export function Panel({ panel }) {
  const { t, tv } = useApp();
  return (
    <section className="card panel">
      <div>
        <h2 className="h2">{t(panel.titleKey)}</h2>
        {panel.subKey ? <div className="sub">{t(panel.subKey)}</div> : null}
        {panel.kind === 'stack' ? <div className="sub">{fmt(panel.count)} {t(panel.titleKey === 'c_dassStaff' ? 's_staff' : 's_students')}</div> : null}
      </div>
      {panel.kind === 'bars' ? (
        panel.rows.length === 0 ? <div className="muted small">{t('noData')}</div> : (
          <div className="rows">
            {(() => {
              const max = Math.max(...panel.rows.map((r) => r.value));
              const tot = panel.rows.reduce((a, r) => a + r.value, 0);
              return panel.rows.map((r) => (
                <div key={r.label}>
                  <div className="row-top">
                    <span>{tv(r.label)}</span>
                    <span className="num strong">{fmt(r.value)} <span className="muted normal">· {pct(r.value, tot)}</span></span>
                  </div>
                  <div className="track thin" aria-hidden="true"><div className="track-fill" style={{ width: (max ? (r.value / max) * 100 : 0) + '%' }} /></div>
                </div>
              ));
            })()}
          </div>
        )
      ) : (
        <div className="rows">
          <SevLegend />
          {panel.rows.map((r) => {
            const hi = r.counts[3] + r.counts[4];
            const total = r.counts.reduce((a, b) => a + b, 0);
            return (
              <div key={r.labelKey}>
                <div className="row-top wrap">
                  <span className="strong">{t(r.labelKey)}</span>
                  <span className="muted small">{t('c_severeUp')} <b className="num ink">{fmt(hi)} ({pct(hi, total)})</b></span>
                </div>
                <SevBar counts={r.counts} label={t(r.labelKey)} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
