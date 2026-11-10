import { useState } from 'react';
import { useApp } from '../context.jsx';
import { supabase, IS_MOCK } from '../lib/supabase.js';

export function AuthScreen({ langToggle }) {
  const { t } = useApp();
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState(IS_MOCK ? 'demo@pcu.test' : '');
  const [password, setPassword] = useState(IS_MOCK ? 'demo1234' : '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (mode === 'up' && password.length < 8) { setError(t('passwordShort')); return; }
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) setError(t('authFailed'));
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
        if (err) setError(err.message);
        else if (!data.session) { setInfo(t('checkEmail')); setMode('in'); }
      }
    } catch (ex) {
      setError(ex.message);
    }
    setBusy(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-lang">{langToggle}</div>
      <form className="card auth-card" onSubmit={submit} noValidate>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">PCU</div>
          <div>
            <div className="hd brand-name dark">{t('appName')}</div>
            <div className="muted small">{t('appSub')}</div>
          </div>
        </div>
        <h1 className="hd auth-title">{mode === 'in' ? t('signIn') : t('signUp')}</h1>
        <p className="muted">{t('signInHint')}</p>
        {mode === 'up' ? (
          <label className="field"><span>{t('fullName')}</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
        ) : null}
        <label className="field"><span>{t('email')}</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label className="field"><span>{t('password')}</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required /></label>
        {error ? <div className="notice error" role="alert">{error}</div> : null}
        {info ? <div className="notice" role="status">{info}</div> : null}
        <button type="submit" className="btn wide" disabled={busy}>{mode === 'in' ? t('signIn') : t('signUp')}</button>
        <button type="button" className="link center" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); }}>
          {mode === 'in' ? t('noAccount') : t('haveAccount')}
        </button>
      </form>
    </div>
  );
}

export function Pending({ onCheck, onSignOut, langToggle }) {
  const { t } = useApp();
  return (
    <div className="auth-wrap">
      <div className="auth-lang">{langToggle}</div>
      <div className="card auth-card">
        <h1 className="hd auth-title">{t('pendingTitle')}</h1>
        <p>{t('pendingBody')}</p>
        <button type="button" className="btn wide" onClick={onCheck}>{t('checkAgain')}</button>
        <button type="button" className="link center" onClick={onSignOut}>{t('signOut')}</button>
      </div>
    </div>
  );
}
