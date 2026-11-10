import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context.jsx';
import { supabase } from '../lib/supabase.js';
import { LOOKUP_KINDS } from '../lib/constants.js';

export default function Admin({ profile, lookups, reloadLookups }) {
  const { t, tv } = useApp();
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState(null);
  const [drafts, setDrafts] = useState({});

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('id,email,full_name,role,created_at').order('created_at');
    if (error) setMsg({ ok: false, text: error.message }); else setUsers(data || []);
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  if (profile.role !== 'admin') return <div className="notice error" role="alert">{t('onlyAdmin')}</div>;

  const setRole = async (u, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', u.id);
    if (error) setMsg({ ok: false, text: error.message });
    else { setMsg({ ok: true, text: t('roleUpdated') }); loadUsers(); }
  };
  const addValue = async (kind) => {
    const value = (drafts[kind] || '').trim();
    if (!value) return;
    const list = lookups[kind] || [];
    const sort = list.length ? Math.max(...list.map((l) => l.sort)) + 1 : 1;
    const { error } = await supabase.from('lookups').insert({ kind, value, sort });
    if (error) setMsg({ ok: false, text: error.message });
    else { setDrafts((d) => ({ ...d, [kind]: '' })); setMsg(null); reloadLookups(); }
  };
  const removeValue = async (row) => {
    const { error } = await supabase.from('lookups').delete().eq('id', row.id);
    if (error) setMsg({ ok: false, text: error.message }); else reloadLookups();
  };

  return (
    <div className="stack">
      {msg ? <div className={'notice' + (msg.ok ? ' ok' : ' error')} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div> : null}
      <section className="card">
        <h2 className="h2">{t('users')}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">{t('userName')}</th><th scope="col">{t('userEmail')}</th><th scope="col">{t('userRole')}</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label={t('userName')}>{u.full_name || '—'} {u.id === profile.id ? <span className="muted small">{t('youLabel')}</span> : null}</td>
                  <td data-label={t('userEmail')}>{u.email}</td>
                  <td data-label={t('userRole')}>
                    <select aria-label={t('userRole') + ': ' + u.email} value={u.role} disabled={u.id === profile.id} onChange={(e) => setRole(u, e.target.value)}>
                      {['pending', 'staff', 'admin'].map((r) => <option key={r} value={r}>{t('role_' + r)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="h2">{t('lists')}</h2>
        <div className="lookup-grid">
          {LOOKUP_KINDS.map((kind) => (
            <div key={kind} className="lookup-box">
              <h3 className="group-title">{t('kind_' + kind)}</h3>
              <ul className="taglist">
                {(lookups[kind] || []).map((row) => (
                  <li key={row.id}><span>{tv(row.value)}</span><button type="button" className="x" aria-label={t('remove') + ': ' + row.value} onClick={() => removeValue(row)}>×</button></li>
                ))}
              </ul>
              <div className="add-row">
                <input aria-label={t('addValue') + ': ' + t('kind_' + kind)} placeholder={t('addValue')} maxLength={80} value={drafts[kind] || ''} onChange={(e) => setDrafts((d) => ({ ...d, [kind]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue(kind); } }} />
                <button type="button" className="btn secondary" onClick={() => addValue(kind)}>{t('add')}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
