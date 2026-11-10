import { useApp } from '../context.jsx';

export default function KpiCard({ card, year }) {
  const { t } = useApp();
  const d = card.delta;
  let tone = 'flat';
  let text = null;
  if (d) {
    const v = d.value;
    text = (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + (d.type === 'pct' ? '%' : ' ' + t('pts')) + ' ' + t('vsYear', { year: year - 1 });
    tone = card.good === 'up' ? (v >= 0 ? 'good' : 'bad') : card.good === 'down' ? (v <= 0 ? 'good' : 'bad') : 'flat';
  }
  return (
    <div className="card kpi">
      <div className="kpi-label">{t(card.label)}</div>
      <div className="kpi-value-row">
        <span className={'kpi-value num' + (card.severe ? ' severe' : '')}>{card.value}</span>
        {card.unit ? <span className="kpi-unit">{card.unit}</span> : null}
      </div>
      {card.bar !== undefined ? (
        <div className="track" aria-hidden="true"><div className="track-fill" style={{ width: Math.min(100, card.bar) + '%' }} /></div>
      ) : null}
      <div className="kpi-foot">
        {text ? <span className={'pill ' + tone}>{text}</span> : null}
        {card.sub ? <span>{t(card.sub.key, card.sub.vars)}</span> : null}
      </div>
    </div>
  );
}
