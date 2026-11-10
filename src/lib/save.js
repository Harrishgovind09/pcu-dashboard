// Save a generated file. Inside the claude.ai artifact viewer plain downloads are blocked,
// so use its `downloads` capability when present; otherwise a normal browser download.
export async function saveFile(filename, blob) {
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) {
      try { await dl.save({ filename, data: blob }); return; } catch (e) { if (e && e.code === 'declined') return; }
    }
  } catch (e) { /* fall through */ }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
