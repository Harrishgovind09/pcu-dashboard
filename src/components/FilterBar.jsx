import { useApp } from '../context.jsx';
import { MONTHS_FULL } from '../lib/constants.js';
import Icon from './Icon.jsx';
import { ICONS } from '../lib/constants.js';

export default function FilterBar({ defs, sel, onChange, onReset, lookups, names, extra }) {
  const { t, tv, lang } = useApp();
  const optionsFor = (d) => {
    if (d.type === 'month') return MONTHS_FULL[lang].map((m, i) => ({ value: String(i), label: m }));
    if (d.type === 'lookup') return (lookups[d.kind] || []).map((l) => ({ value: l.value, label: tv(l.value) }));
    if (d.type === 'list') return d.values.map((v) => ({ value: v, label: tv(v) }));
    if (d.type === 'level') return [0, 1, 2, 3, 4].map((i) => ({ value: String(i), label: t('sev' + i) }));
    if (d.type === 'names') return (names || []).map((n) => ({ value: n, label: tv(n) }));
    return [];
  };
  const active = defs.some((d) => sel[d.key]);
  return (
    <section aria-label={t('by')} className="card filterbar">
      <span className="strong small">{t('by')}</span>
      {defs.map((d) => (
        <label key={d.key} className={'chip' + (sel[d.key] ? ' on' : '')}>
          <span className="muted">{t(d.labelKey)}</span>
          <select value={sel[d.key] || ''} onChange={(e) => onChange(d.key, e.target.value)} aria-label={t(d.labelKey)}>
            <option value="">{t(d.allKey)}</option>
            {optionsFor(d).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Icon d={ICONS.chevron} size={16} stroke={2} />
        </label>
      ))}
      {active ? <button type="button" className="link" onClick={onReset}>{t('reset')}</button> : null}
      {extra ? <div className="filter-extra">{extra}</div> : null}
    </section>
  );
}
