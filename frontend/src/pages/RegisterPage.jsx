import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import styles from './RegisterPage.module.css';

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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const STRENGTH_LEVELS = [
  { label: 'Too short',   mod: styles.weak   },
  { label: 'Weak',        mod: styles.weak   },
  { label: 'Fair',        mod: styles.fair   },
  { label: 'Good',        mod: styles.good   },
  { label: 'Strong',      mod: styles.strong },
  { label: 'Very strong', mod: styles.max    },
];

function calcStrength(pw) {
  if (!pw || pw.length < 6) return 0;
  let s = 1;
  if (pw.length >= 8)            s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 5);
}

function StrengthMeter({ password }) {
  if (!password) return null;
  const score = calcStrength(password);
  const level = STRENGTH_LEVELS[score];
  return (
    <div className={styles.strengthWrap} aria-live="polite" aria-atomic="true">
      <div className={styles.strengthBar} role="presentation">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`${styles.seg} ${i <= score ? level.mod : styles.segEmpty}`} />
        ))}
      </div>
      <span className={`${styles.strengthLabel} ${level.mod}`}>{level.label}</span>
    </div>
  );
}

function validate({ firstName, lastName, email, password, confirmPassword }) {
  const e = {};
  if (!firstName.trim())  e.firstName = 'First name is required.';
  if (!lastName.trim())   e.lastName  = 'Last name is required.';
  if (!email.trim())      e.email     = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
  if (!password)          e.password  = 'Password is required.';
  else if (password.length < 8) e.password = 'Must be at least 8 characters.';
  if (!confirmPassword)         e.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
  return e;
}

function Field({ id, label, error, children }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className={styles.fieldError}>
          <AlertIcon />{error}
        </p>
      )}
    </div>
  );
}

function PwInput({ id, name, value, onChange, onBlur, placeholder, autoComplete, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.pwWrap}>
      <input
        id={id} name={name} type={show ? 'text' : 'password'}
        autoComplete={autoComplete} placeholder={placeholder}
        value={value} onChange={onChange} onBlur={onBlur}
        aria-required="true" aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-err` : undefined}
        className={`${styles.input} ${styles.inputPw} ${invalid ? styles.inputInvalid : ''}`}
      />
      <button type="button" onClick={() => setShow(v => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show} className={styles.eyeBtn}>
        {show ? <EyeOff /> : <EyeOpen />}
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const [fields, setFields] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [touched, setTouched]     = useState({});
  const [serverErr, setServerErr] = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const set  = k => e => setFields(f => ({ ...f, [k]: e.target.value }));
  const blur = k => () => setTouched(t => ({ ...t, [k]: true }));

  const onConfirmChange = e => {
    setFields(f => ({ ...f, confirmPassword: e.target.value }));
    setTouched(t => ({ ...t, confirmPassword: true }));
  };

  const errors   = validate(fields);
  const hasError = k => touched[k] && errors[k];
  const pwsMatch = fields.confirmPassword && !errors.confirmPassword;

  const handleSubmit = async e => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(errors).length) return;
    setServerErr('');
    setLoading(true);
    try {
      await authService.register(
        fields.email, fields.firstName, fields.lastName,
        fields.password, fields.confirmPassword,
      );
      navigate('/');
    } catch (err) {
      const d = err?.response?.data;
      setServerErr(d?.detail || d?.email?.[0] || d?.non_field_errors?.[0] || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>

        <header className={styles.header}>
          <h1 className={styles.logo}>Skill<span className={styles.accent}>Swap</span></h1>
          <p className={styles.tagline}>Create your account</p>
        </header>

        {serverErr && (
          <div role="alert" aria-live="assertive" className={styles.serverError}>
            <AlertIcon /><span>{serverErr}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>

          <div className={styles.nameRow}>
            <Field id="firstName" label="First name" error={hasError('firstName') && errors.firstName}>
              <input id="firstName" name="firstName" type="text" autoComplete="given-name"
                value={fields.firstName} onChange={set('firstName')} onBlur={blur('firstName')}
                aria-required="true" aria-invalid={!!hasError('firstName')}
                aria-describedby={hasError('firstName') ? 'firstName-err' : undefined}
                className={`${styles.input} ${hasError('firstName') ? styles.inputInvalid : ''}`} />
            </Field>
            <Field id="lastName" label="Last name" error={hasError('lastName') && errors.lastName}>
              <input id="lastName" name="lastName" type="text" autoComplete="family-name"
                value={fields.lastName} onChange={set('lastName')} onBlur={blur('lastName')}
                aria-required="true" aria-invalid={!!hasError('lastName')}
                aria-describedby={hasError('lastName') ? 'lastName-err' : undefined}
                className={`${styles.input} ${hasError('lastName') ? styles.inputInvalid : ''}`} />
            </Field>
          </div>

          <Field id="email" label="Email address" error={hasError('email') && errors.email}>
            <input id="email" name="email" type="email" autoComplete="email"
              placeholder="you@uwm.edu"
              value={fields.email} onChange={set('email')} onBlur={blur('email')}
              aria-required="true" aria-invalid={!!hasError('email')}
              aria-describedby={hasError('email') ? 'email-err' : undefined}
              className={`${styles.input} ${hasError('email') ? styles.inputInvalid : ''}`} />
          </Field>

          <Field id="password" label="Password" error={hasError('password') && errors.password}>
            <PwInput id="password" name="password" autoComplete="new-password"
              placeholder="At least 8 characters"
              value={fields.password}
              onChange={e => { set('password')(e); if (fields.confirmPassword) setTouched(t => ({ ...t, confirmPassword: true })); }}
              onBlur={blur('password')}
              invalid={!!hasError('password')} />
            <StrengthMeter password={fields.password} />
          </Field>

          <Field id="confirmPassword" label="Confirm password" error={hasError('confirmPassword') && errors.confirmPassword}>
            <PwInput id="confirmPassword" name="confirmPassword"
              autoComplete="new-password" placeholder="••••••••"
              value={fields.confirmPassword}
              onChange={onConfirmChange} onBlur={blur('confirmPassword')}
              invalid={!!hasError('confirmPassword')} />
            {pwsMatch && (
              <p className={styles.matchOk} aria-live="polite">
                <CheckIcon />Passwords match
              </p>
            )}
          </Field>

          <button type="submit" disabled={loading} aria-busy={loading} className={styles.submitBtn}>
            {loading ? <><span className={styles.spinner} aria-hidden="true" />Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
