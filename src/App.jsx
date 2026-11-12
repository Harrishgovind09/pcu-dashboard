import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppContext } from './context.jsx';
import { supabase, CONFIG_OK, IS_MOCK } from './lib/supabase.js';
import { makeT, trv } from './lib/i18n.js';
import { ORDER, ICONS } from './lib/constants.js';
import { loadLookups } from './lib/data.js';
import Icon from './components/Icon.jsx';
import { AuthScreen, Pending } from './pages/Auth.jsx';
import Overview from './pages/Overview.jsx';
import ModulePage from './pages/Module.jsx';
import Entry from './pages/Entry.jsx';
import ImportExport from './pages/ImportExport.jsx';
import Admin from './pages/Admin.jsx';

const ROUTES = ['overview', ...ORDER, 'entry', 'import', 'admin'];
const readRoute = () => {
  const r = (window.location.hash || '').replace(/^#\/?/, '');
  return ROUTES.includes(r) ? r : 'overview';
};

function useLang() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('pcu-lang') || 'ms'; } catch { return 'ms'; }
  });
  const update = (l) => {
    setLang(l);
    try { localStorage.setItem('pcu-lang', l); } catch { /* ignore */ }
    document.documentElement.lang = l === 'en' ? 'en' : 'ms';
  };
  useEffect(() => { document.documentElement.lang = lang === 'en' ? 'en' : 'ms'; }, [lang]);
  return [lang, update];
}

function LangToggle({ lang, setLang }) {
  return (
    <div className="seg-group" role="group" aria-label="Bahasa / Language">
      <button type="button" className={'seg' + (lang === 'ms' ? ' on' : '')} aria-pressed={lang === 'ms'} onClick={() => setLang('ms')}>BM</button>
      <button type="button" className={'seg' + (lang === 'en' ? ' on' : '')} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useLang();
  const t = useMemo(() => makeT(lang), [lang]);
  const tv = useCallback((v) => trv(lang, v), [lang]);
  const ctx = useMemo(() => ({ t, tv, lang }), [t, tv, lang]);

  const [boot, setBoot] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lookups, setLookups] = useState({});
  const [route, setRoute] = useState(readRoute());
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);

  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    if (!CONFIG_OK) { setBoot(false); return undefined; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setBoot(false); } });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (alive) setSession(s); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session) { setProfile(null); return; }
    const { data } = await supabase.from('profiles').select('id,email,full_name,role').eq('id', session.user.id).maybeSingle();
    setProfile(data || { id: session.user.id, email: session.user.email, full_name: '', role: 'pending' });
  }, [session]);
  useEffect(() => { loadProfile(); }, [loadProfile]);

  const reloadLookups = useCallback(() => loadLookups().then(setLookups).catch(() => setLookups({})), []);
  const staff = profile && (profile.role === 'staff' || profile.role === 'admin');
  useEffect(() => { if (staff) reloadLookups(); }, [staff, reloadLookups]);

  const signOut = () => supabase.auth.signOut();
  const toggle = <LangToggle lang={lang} setLang={setLang} />;

  let body;
  if (!CONFIG_OK) {
    body = (
      <div className="auth-wrap"><div className="card auth-card">
        <h1 className="hd auth-title">Setup needed</h1>
        <p>Copy <code>.env.example</code> to <code>.env.local</code> and set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then rebuild.</p>
      </div></div>
    );
  } else if (boot) {
    body = <div className="auth-wrap"><div className="notice" role="status">{t('loading')}</div></div>;
  } else if (!session) {
    body = <AuthScreen langToggle={toggle} />;
  } else if (!profile) {
    body = <div className="auth-wrap"><div className="notice" role="status">{t('loading')}</div></div>;
  } else if (!staff) {
    body = <Pending onCheck={loadProfile} onSignOut={signOut} langToggle={toggle} />;
  } else {
    const isModule = ORDER.includes(route);
    const showYear = route === 'overview' || isModule;
    const title = route === 'overview' ? t('overallSummary') : isModule ? t(route) : t(route === 'entry' ? 'entryTitle' : route === 'import' ? 'importTitle' : 'adminTitle');
    const desc = route === 'overview' ? t('overallDesc') : isModule ? t('desc_' + route) : t(route === 'entry' ? 'entryDesc' : route === 'import' ? 'importDesc' : 'adminDesc');
    const go = (r) => { window.location.hash = '#/' + r; };
    const navItem = (id, label, icon) => (
      <a key={id} href={'#/' + id} data-mod={ORDER.includes(id) ? id : undefined} className={'nav' + (route === id ? ' on' : '')} aria-current={route === id ? 'page' : undefined}>
        <Icon d={ICONS[icon]} /><span>{label}</span>
      </a>
    );
    const initials = (profile.full_name || profile.email || '?').split(/[\s@]+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('');
    body = (
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">PCU</div>
            <div>
              <div className="hd brand-name">{t('appName')}</div>
            </div>
          </div>
          <div className="nav-group">
            <div className="nav-heading">{t('modules')}</div>
            <nav aria-label={t('modules')} className="nav-list">
              {navItem('overview', t('overview'), 'home')}
              {ORDER.map((id) => navItem(id, t(id), id))}
            </nav>
          </div>
          <div className="nav-group">
            <div className="nav-heading">{t('system')}</div>
            <nav aria-label={t('system')} className="nav-list">
              {navItem('entry', t('entry'), 'entry')}
              {navItem('import', t('import'), 'import')}
              {profile.role === 'admin' ? navItem('admin', t('admin'), 'admin') : null}
            </nav>
          </div>
          <div className="side-note">{t('footer')}</div>
        </aside>
        <main className="main" data-mod={isModule ? route : undefined}>
          {IS_MOCK ? <div className="notice demo" role="note">{t('demoBanner')}</div> : null}
          <div className="topbar">
            <div className="crumbs"><span>{t('dashboard')}</span><span aria-hidden="true">/</span><b>{title}</b></div>
            <div className="topbar-right">
              {toggle}
              <span className="user"><span className="avatar" aria-hidden="true">{initials}</span><span className="user-name">{profile.full_name || profile.email}</span></span>
              <button type="button" className="link" onClick={signOut}><Icon d={ICONS.logout} size={16} stroke={2} />{t('signOut')}</button>
            </div>
          </div>
          <header className="page-head">
            <div className="page-head-text">
              <div className="kicker">{isModule ? t('menu') : route === 'overview' ? t('dashboard') : t('system')}</div>
              <h1 className="hd page-title">{title}</h1>
              <p className="muted">{desc}</p>
            </div>
            {showYear ? (
              <label className="chip year-chip">
                <span className="muted">{t('f_year')}</span>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label={t('f_year')}>
                  {[thisYear + 1, thisYear, thisYear - 1, thisYear - 2, thisYear - 3].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <Icon d={ICONS.chevron} size={16} stroke={2} />
              </label>
            ) : null}
          </header>
          {route === 'overview' ? <Overview key={year} year={year} go={go} /> : null}
          {isModule ? <ModulePage key={route} id={route} year={year} lookups={lookups} /> : null}
          {route === 'entry' ? <Entry lookups={lookups} /> : null}
          {route === 'import' ? <ImportExport lookups={lookups} year={year} /> : null}
          {route === 'admin' ? <Admin profile={profile} lookups={lookups} reloadLookups={reloadLookups} /> : null}
        </main>
      </div>
    );
  }
  return <AppContext.Provider value={ctx}>{body}</AppContext.Provider>;
}
