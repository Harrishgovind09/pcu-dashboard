import Papa from 'papaparse';
import { saveFile } from './save.js';

// Stop spreadsheet formula injection: a cell starting with = + - @ is treated as text by Excel.
const PLAIN_SIGNED = /^[+-]\d+(\.\d+)?%?( [^=+\-@]*)?$/; // e.g. "+5.0%" or "-1.2 mata": harmless
const safe = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) && !PLAIN_SIGNED.test(v) ? "'" + v : v);

export function downloadCsv(filename, rows) {
  const clean = rows.map((r) => (Array.isArray(r) ? r.map(safe) : Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safe(v)]))));
  const csv = Papa.unparse(clean);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  saveFile(filename, blob);
}

// Flatten a computed module into rows for the "Download report" button.
export function reportRows({ t, tv, computed, year, moduleLabel, filtersText, months }) {
  const rows = [[t('dashboard'), moduleLabel], [t('f_year'), year]];
  if (filtersText) rows.push([t('by'), filtersText]);
  rows.push([]);
  const fmtDelta = (d) => (d ? (d.value >= 0 ? '+' : '') + d.value.toFixed(1) + (d.type === 'pct' ? '%' : ' ' + t('pts')) : '');
  computed.groups.forEach((g) => {
    if (g.titleKey) rows.push([t(g.titleKey)]);
    g.cards.forEach((c) => rows.push([t(c.label), c.value + (c.unit || ''), c.sub ? t(c.sub.key, c.sub.vars) : '', fmtDelta(c.delta)]));
    rows.push([]);
  });
  const MONTHS = months;
  rows.push([t(computed.monthly.titleKey)]);
  computed.monthly.values.forEach((v, i) => rows.push([Array.isArray(MONTHS) ? MONTHS[i] : i + 1, v]));
  rows.push([]);
  rows.push([t('c_byGender')]);
  computed.gender.forEach((g) => rows.push([tv(g.label), g.value]));
  rows.push([]);
  computed.panels.forEach((p) => {
    rows.push([t(p.titleKey)]);
    if (p.kind === 'bars') p.rows.forEach((r) => rows.push([tv(r.label), r.value]));
    else p.rows.forEach((r) => rows.push([t(r.labelKey), ...r.counts.map((n, i) => t('sev' + i) + ': ' + n)]));
    rows.push([]);
  });
  return rows;
}
