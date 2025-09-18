'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupInfo, setSignupInfo] = useState('');
  const [supabaseState] = useState(() => {
    try {
      return { client: getSupabaseBrowserClient(), error: null };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Okänt fel vid initiering av Supabase-klienten.';
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Supabase-konfiguration saknas:', err);
      }
      return { client: null, error: message };
    }
  });
  const supabase = supabaseState.client;
  const supabaseError = supabaseState.error;

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isMounted = true;
    let authSubscription = null;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data.session?.user) {
        router.replace('/app');
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace('/app');
      }
    });
    authSubscription = data?.subscription ?? null;

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [router, supabase]);

  const handleLogin = async (event) => {
    event?.preventDefault?.();
    setLoginError('');
    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      setLoginError('Fyll i e-post och lösenord.');
      return;
    }

    if (!supabase) {
      setLoginError('Supabase är inte konfigurerat. Lägg till miljövariablerna och försök igen.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
      return;
    }

    router.replace('/app');
  };

  const handleSignup = async (event) => {
    event?.preventDefault?.();
    setSignupError('');
    setSignupInfo('');

    const email = signupEmail.trim();
    const password = signupPassword;

    if (!email || !password) {
      setSignupError('Fyll i e-post och lösenord.');
      return;
    }

    if (!supabase) {
      setSignupError('Supabase är inte konfigurerat. Lägg till miljövariablerna och försök igen.');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
      },
    });

    if (error) {
      setSignupError(error.message);
      return;
    }

    setSignupInfo('Konto skapat. Du kan nu logga in.');
  };

  if (supabaseError) {
    return (
      <main className={styles.shell}>
        <div className={styles.errorCard}>
          <h1>Konfigurationsfel</h1>
          <p>
            Inloggningen är beroende av Supabase. Lägg till{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din
            miljö tillsammans med server-variablerna <code>SUPABASE_URL</code> och{' '}
            <code>SUPABASE_SERVICE_ROLE</code>, deploya på nytt och försök igen.
          </p>
          <p className={styles.errorDetails}>{supabaseError}</p>
          <p className={styles.errorHelp}>
            När variablerna är satta laddar sidan om automatiskt och du kan logga in.
          </p>
          <Link href="/" className={styles.backHomeLink}>
            ← Till startsidan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.brandPanel}>
          <Link href="/" className={styles.logo}>
            BetSpread
          </Link>
          <h2>Kontrollera dina projekt med precision</h2>
          <p>
            Följ varje spel, bygg upp ROI och hantera prenumerationer på ett och samma ställe. Logga in
            eller registrera dig för att fortsätta arbetet.
          </p>
          <ul className={styles.featureList}>
            <li>Projektöversikter och månadsvyn synkade med Supabase.</li>
            <li>Premiumflöden via Stripe med full kundhistorik.</li>
            <li>Säkra, GDPR-anpassade verktyg för ditt bettingteam.</li>
          </ul>
          <Link href="/" className={styles.backHomeLink}>
            ← Till startsidan
          </Link>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.tabList} role="tablist" aria-label="Autentisering">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              className={`${styles.tabButton} ${tab === 'login' ? styles.activeTab : ''}`}
              onClick={() => setTab('login')}
            >
              Logga in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`${styles.tabButton} ${tab === 'signup' ? styles.activeTab : ''}`}
              onClick={() => setTab('signup')}
            >
              Skapa konto
            </button>
          </div>

          {tab === 'login' ? (
            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.formField}>
                <label htmlFor="loginEmail">E-post</label>
                <input
                  id="loginEmail"
                  type="email"
                  placeholder="din@mail.se"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="loginPassword">Lösenord</label>
                <input
                  id="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              {loginError ? (
                <p className={styles.formError} role="alert">
                  {loginError}
                </p>
              ) : null}
              <button type="submit" className={styles.primaryButton}>
                Logga in
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleSignup}>
              <div className={styles.formField}>
                <label htmlFor="signupEmail">E-post</label>
                <input
                  id="signupEmail"
                  type="email"
                  placeholder="din@mail.se"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="signupPassword">Lösenord</label>
                <input
                  id="signupPassword"
                  type="password"
                  placeholder="Minst 6 tecken"
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>
              {signupInfo ? (
                <p className={styles.formSuccess} role="status">
                  {signupInfo}
                </p>
              ) : null}
              {signupError ? (
                <p className={styles.formError} role="alert">
                  {signupError}
                </p>
              ) : null}
              <button type="submit" className={styles.primaryButton}>
                Skapa konto
              </button>
            </form>
          )}

          <p className={styles.supportText}>
            Problem att logga in? Kontakta <a href="mailto:support@betspread.se">support@betspread.se</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
