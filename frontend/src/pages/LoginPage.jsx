import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import styles from './LoginPage.module.css';

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function validate(email, password) {
  const e = {};
  if (!email.trim())                                   e.email    = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email    = 'Enter a valid email address.';
  if (!password)                                       e.password = 'Password is required.';
  return e;
}

export default function LoginPage() {
  const [fields, setFields]   = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set  = k => e => setFields(f => ({ ...f, [k]: e.target.value }));
  const blur = k => () => setTouched(t => ({ ...t, [k]: true }));

  const errors   = validate(fields.email, fields.password);
  const hasError = k => touched[k] && errors[k];

  const handleSubmit = async e => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length) return;
    setServerErr('');
    setLoading(true);
    try {
      await authService.login(fields.email, fields.password);
      navigate('/');
    } catch (err) {
      const d = err?.response?.data;
      setServerErr(d?.detail || d?.non_field_errors?.[0] || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>

        <header className={styles.header}>
          <h1 className={styles.logo}>Skill<span className={styles.accent}>Swap</span></h1>
          <p className={styles.tagline}>Sign in to your account</p>
        </header>

        {serverErr && (
          <div role="alert" aria-live="assertive" className={styles.serverError}>
            <AlertIcon /><span>{serverErr}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email address</label>
            <input
              id="email" type="email" autoComplete="email" placeholder="you@uwm.edu"
              value={fields.email} onChange={set('email')} onBlur={blur('email')}
              aria-required="true" aria-invalid={!!hasError('email')}
              aria-describedby={hasError('email') ? 'email-err' : undefined}
              className={`${styles.input} ${hasError('email') ? styles.inputInvalid : ''}`}
            />
            {hasError('email') && (
              <p id="email-err" role="alert" className={styles.fieldError}>
                <AlertIcon />{errors.email}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.pwWrap}>
              <input
                id="password" type={showPw ? 'text' : 'password'}
                autoComplete="current-password" placeholder="••••••••"
                value={fields.password} onChange={set('password')} onBlur={blur('password')}
                aria-required="true" aria-invalid={!!hasError('password')}
                aria-describedby={hasError('password') ? 'pw-err' : undefined}
                className={`${styles.input} ${styles.inputPw} ${hasError('password') ? styles.inputInvalid : ''}`}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                aria-pressed={showPw} className={styles.eyeBtn}>
                {showPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            {hasError('password') && (
              <p id="pw-err" role="alert" className={styles.fieldError}>
                <AlertIcon />{errors.password}
              </p>
            )}
          </div>

          <div className={styles.meta}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={remember}
                onChange={e => setRemember(e.target.checked)} className={styles.checkbox} />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" disabled={loading} aria-busy={loading} className={styles.submitBtn}>
            {loading ? <><span className={styles.spinner} aria-hidden="true" />Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.footerLink}>Create one</Link>
        </p>
      </div>
    </main>
  );
}
