'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupInfo, setSignupInfo] = useState('');
  const [supabaseState] = useState(() => {
    try {
      return { client: getSupabaseBrowserClient(), error: null };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Okänt fel vid initiering av Supabase-klienten.';
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

  const handleLogin = async () => {
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

  const handleSignup = async () => {
    setSignupError('');
    setSignupInfo('');

    const email = signupEmail.trim();
    const password = signupPassword;
    const confirmPassword = signupConfirmPassword;

    if (!email || !password) {
      setSignupError('Fyll i e-post och lösenord.');
      return;
    }

    if (password !== confirmPassword) {
      setSignupError('Lösenorden matchar inte.');
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
          typeof window !== 'undefined'
            ? `${window.location.origin}/confirm-email`
            : undefined,
      },
    });

    if (error) {
      setSignupError(error.message);
      return;
    }

    setSignupInfo('Konto skapat. Kontrollera din e-post för att bekräfta kontot.');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
  };

  if (supabaseError) {
    return (
      <div className={styles.fallback}>
        <div className={styles.fallbackCard}>
          <h1>Konfigurationsfel</h1>
          <p>
            Inloggningen är beroende av Supabase. Lägg till{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din miljö tillsammans med
            server-variablerna <code>SUPABASE_URL</code> och <code>SUPABASE_SERVICE_ROLE</code>, deploya på nytt och försök
            igen.
          </p>
          <p className={styles.fallbackError}>{supabaseError}</p>
          <p className={styles.fallbackHint}>
            När variablerna är satta laddar sidan om automatiskt och du kan logga in.
          </p>
          <Link href="/" className={styles.inlineLink}>
            Till startsida
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="BetSpread startsida">
          <Logo className={styles.brandLogo} priority />
        </Link>
        <Link href="/" className={styles.topbarLink}>
          Till startsida
        </Link>
      </header>

      <main className={styles.shell}>
        <div className={styles.content}>
          <section className={styles.introPanel}>
            <span className={styles.tag}>Din speljournal</span>
            <h1>Logga in för att fortsätta bygga ditt övertag.</h1>
            <p>
              BetSpread ger dig en strukturerad arbetsyta för projekt, registrering och analys av sportspel. Ditt konto håller
              ordning på varje spel och räknar ut ROI, nettoresultat och träffsäkerhet åt dig.
            </p>
            <ul className={styles.featureList}>
              <li>Registrera matcher med odds, insats, spelbolag och egna noteringar.</li>
              <li>Följ upp resultat med snabbknappar för Win, Loss, Pending och Void.</li>
              <li>Analysera månadssummeringar och projektstatistik utan manuella kalkylblad.</li>
            </ul>
            <div className={styles.showcaseGrid}>
              <div className={styles.showcaseCard}>
                <p>Aktivt projekt</p>
                <strong>Ditt Projekt</strong>
                <span>+12,4% ROI</span>
              </div>
              <div className={styles.showcaseCard}>
                <p>Snabbstatus</p>
                <div className={styles.badgeRow}>
                  <span className={`${styles.badge} ${styles.badgeWin}`}>Win</span>
                  <span className={`${styles.badge} ${styles.badgeLoss}`}>Loss</span>
                  <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>
                  <span className={`${styles.badge} ${styles.badgeVoid}`}>Void</span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.authPanel}>
            <div className={styles.cardHeader}>
              <h2>{tab === 'login' ? 'Välkommen tillbaka' : 'Skapa ditt konto'}</h2>
              <p>
                {tab === 'login'
                  ? 'Fyll i dina uppgifter för att öppna din kontrollpanel, uppdatera spelstatus och granska månadssummeringar.'
                  : 'Skapa ett konto för att spara dina projekt, registrera spel och låta BetSpread sköta dina nyckeltal.'}
              </p>
            </div>

            <div className={styles.tabButtons} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                className={`${styles.tabButton} ${tab === 'login' ? styles.tabButtonActive : ''}`}
                onClick={() => setTab('login')}
              >
                Logga in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'signup'}
                className={`${styles.tabButton} ${tab === 'signup' ? styles.tabButtonActive : ''}`}
                onClick={() => setTab('signup')}
              >
                Skapa konto
              </button>
            </div>

            {tab === 'login' ? (
              <div className={styles.formBlock}>
                <label htmlFor="loginEmail" className={styles.label}>
                  E-postadress
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  className={styles.input}
                  placeholder="din@mail.se"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <label htmlFor="loginPassword" className={styles.label}>
                  Lösenord
                </label>
                <input
                  id="loginPassword"
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <div className={styles.actions}>
                  <button type="button" className={styles.primaryButton} onClick={handleLogin}>
                    Logga in
                  </button>
                  <Link href="/reset-password" className={styles.inlineLink}>
                    Glömt lösenord?
                  </Link>
                </div>
                {loginError ? <p className={`${styles.message} ${styles.error}`}>{loginError}</p> : null}
                <p className={styles.switcher}>
                  Inget konto ännu?{' '}
                  <button type="button" className={styles.inlineLinkButton} onClick={() => setTab('signup')}>
                    Skapa konto
                  </button>
                </p>
              </div>
            ) : (
              <div className={styles.formBlock}>
                <label htmlFor="signupEmail" className={styles.label}>
                  E-postadress
                </label>
                <input
                  id="signupEmail"
                  type="email"
                  className={styles.input}
                  placeholder="din@mail.se"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
                <label htmlFor="signupPassword" className={styles.label}>
                  Lösenord
                </label>
                <input
                  id="signupPassword"
                  type="password"
                  className={styles.input}
                  placeholder="Minst 6 tecken"
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <label htmlFor="signupConfirmPassword" className={styles.label}>
                  Upprepa lösenord
                </label>
                <input
                  id="signupConfirmPassword"
                  type="password"
                  className={styles.input}
                  placeholder="Upprepa lösenordet"
                  autoComplete="new-password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                />
                <div className={styles.actions}>
                  <button type="button" className={styles.primaryButton} onClick={handleSignup}>
                    Skapa konto
                  </button>
                </div>
                {signupInfo ? <p className={`${styles.message} ${styles.success}`}>{signupInfo}</p> : null}
                {signupError ? <p className={`${styles.message} ${styles.error}`}>{signupError}</p> : null}
                <p className={styles.switcher}>
                  Har du redan ett konto?{' '}
                  <button type="button" className={styles.inlineLinkButton} onClick={() => setTab('login')}>
                    Logga in
                  </button>
                </p>
              </div>
            )}

            <div className={styles.footerNote}>
              <span>Behöver du hjälp?</span>
              <a className={styles.inlineLink} href="mailto:Support@betspread.se">
                Support@betspread.se
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
