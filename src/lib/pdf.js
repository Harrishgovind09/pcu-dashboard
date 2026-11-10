import { saveFile } from './save.js';

const clean = (v) => String(v ?? '').replace(/[−–—]/g, '-').replace(/≥/g, '>=').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, '');
const NAVY = [27, 58, 107];

// Build a one-module report PDF from the same rows the CSV uses (lazy-loads jsPDF).
export async function downloadPdf({ filename, title, subtitle, filtersText, computed, t, tv, months, year }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 64, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('PCU One Stop Centre', M, 30);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(clean(subtitle), M, 48);

  doc.setTextColor(20, 30, 50); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text(clean(title + ' ' + year), M, 98);
  let y = 114;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 100, 120);
  if (filtersText) { const l = doc.splitTextToSize(clean(t('by') + ': ' + filtersText), W - 2 * M); doc.text(l, M, y); y += l.length * 12; }
  doc.text(clean(new Date().toLocaleDateString()), M, y); y += 16;

  const table = (head, body, extra = {}) => {
    autoTable(doc, {
      startY: y, margin: { left: M, right: M }, head: [head], body: body.map((r) => r.map(clean)),
      styles: { fontSize: 9, cellPadding: 4, textColor: [30, 40, 60] },
      headStyles: { fillColor: NAVY, textColor: 255 }, alternateRowStyles: { fillColor: [243, 245, 249] }, ...extra
    });
    y = doc.lastAutoTable.finalY + 16;
  };
  const delta = (d) => (d ? (d.value >= 0 ? '+' : '-') + Math.abs(d.value).toFixed(1) + (d.type === 'pct' ? '%' : ' ' + t('pts')) + ' ' + t('vsYear', { year: year - 1 }) : '');

  computed.groups.forEach((g) => {
    table([g.titleKey ? t(g.titleKey) : t('dashboard'), '', '', ''],
      g.cards.map((c) => [t(c.label), c.value + (c.unit || ''), c.sub ? t(c.sub.key, c.sub.vars) : '', delta(c.delta)]));
  });

  // monthly bar chart
  const vals = computed.monthly.values; const max = Math.max(1, ...vals);
  if (y > 640) { doc.addPage(); y = 50; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 30, 50);
  doc.text(clean(t(computed.monthly.titleKey)), M, y); y += 10;
  const ch = 110, bw = (W - 2 * M) / 12;
  vals.forEach((v, i) => {
    const h = (v / max) * ch;
    doc.setFillColor(...NAVY); doc.rect(M + i * bw + 4, y + ch - h, bw - 8, h, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90, 100, 120);
    doc.text(clean(months[i]), M + i * bw + bw / 2, y + ch + 11, { align: 'center' });
    if (v) doc.text(String(v), M + i * bw + bw / 2, y + ch - h - 3, { align: 'center' });
  });
  y += ch + 28;

  table([t('c_byGender'), ''], computed.gender.map((g) => [tv(g.label), g.value]));
  computed.panels.forEach((p) => {
    if (p.kind === 'bars') table([t(p.titleKey), ''], p.rows.map((r) => [tv(r.label), r.value]));
    else table([t(p.titleKey), ...[0, 1, 2, 3, 4].map((i) => t('sev' + i))], p.rows.map((r) => [t(r.labelKey), ...r.counts]));
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120);
    doc.text(clean(`PCU One Stop Centre  |  ${i}/${n}`), W / 2, 820, { align: 'center' });
  }
  await saveFile(filename, doc.output('blob'));
}
