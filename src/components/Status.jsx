import { useApp } from '../context.jsx';

export function Loading() {
  const { t } = useApp();
  return <div className="notice" role="status" aria-live="polite">{t('loading')}</div>;
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useApp();
  return (
    <div className="notice error" role="alert">
      <div>{t('loadError')}</div>
      {message ? <div className="small muted">{message}</div> : null}
      {onRetry ? <button type="button" className="btn secondary" onClick={onRetry}>{t('retry')}</button> : null}
    </div>
  );
}
