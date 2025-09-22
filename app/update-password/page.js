'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import { AuthLayout, AuthCard, AuthCardHeader, AuthCardBody, authStyles } from '../../components/AuthLayout';

const styles = authStyles;

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
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
      setChecking(false);
      return undefined;
    }

    let isMounted = true;
    let authSubscription = null;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setHasSession(Boolean(data.session));
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setHasSession(Boolean(session));
      setChecking(false);
    });
    authSubscription = data?.subscription ?? null;

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [supabase]);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!supabase) {
      setError('Supabase är inte konfigurerat. Lägg till miljövariablerna och försök igen.');
      return;
    }

    if (!hasSession) {
      setError('Återställningslänken är inte längre giltig. Begär en ny länk via e-post.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Fyll i båda fälten.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    setStatus('Ditt lösenord är uppdaterat. Logga in igen med ditt nya lösenord.');
    setPassword('');
    setConfirmPassword('');
    setHasSession(false);
  };

  const topbarActions = (
    <>
      <Link href="/login" className={styles.topbarLink}>
        Till inloggning
      </Link>
      <Link href="/" className={styles.topbarLink}>
        Till startsida
      </Link>
    </>
  );

  if (supabaseError) {
    return (
      <AuthLayout topbarActions={topbarActions}>
        <AuthCard>
          <AuthCardHeader
            eyebrow="Konfiguration"
            title="Supabase saknas"
            description="Uppdatering av lösenord är beroende av Supabase. Lägg till miljövariablerna och försök igen."
          />
          <AuthCardBody>
            <div className={`${styles.status} ${styles.statusError}`}>
              <p>
                Lägg till <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din miljö
                tillsammans med server-variablerna <code>SUPABASE_URL</code> och <code>SUPABASE_SERVICE_ROLE</code>,
                deploya på nytt och försök igen.
              </p>
              <p className={styles.small}>{supabaseError}</p>
            </div>
            <p className={styles.muted}>
              När variablerna är satta laddar sidan om automatiskt och du kan spara ett nytt lösenord.
            </p>
          </AuthCardBody>
        </AuthCard>
      </AuthLayout>
    );
  }

  const inputsDisabled = checking || !hasSession;

  return (
    <AuthLayout topbarActions={topbarActions}>
      <AuthCard>
        <AuthCardHeader
          eyebrow="Ditt konto"
          title="Sätt nytt lösenord"
          description="Vi guidar dig genom det sista steget för att säkra ditt konto igen."
        />
        <AuthCardBody>
          {checking ? (
            <div className={`${styles.status} ${styles.statusInfo}`}>
              <p>Vi kontrollerar återställningslänken …</p>
            </div>
          ) : !hasSession ? (
            <div className={`${styles.status} ${styles.statusWarning}`}>
              <p>Återställningslänken verkar inte längre vara giltig.</p>
              <p className={styles.muted}>
                Gå tillbaka till{' '}
                <Link href="/reset-password" className={styles.inlineLink}>
                  sidan för återställning
                </Link>{' '}
                och begär en ny länk.
              </p>
            </div>
          ) : (
            <p className={styles.muted}>Ange ett nytt lösenord för ditt konto.</p>
          )}

          <form className={styles.form} onSubmit={handleUpdate}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="newPassword">
                Nytt lösenord
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Minst 6 tecken"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                disabled={inputsDisabled}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirmNewPassword">
                Upprepa lösenord
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                placeholder="Upprepa lösenordet"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                disabled={inputsDisabled}
              />
            </div>
            <div className={styles.buttonRow}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={inputsDisabled}>
                Spara nytt lösenord
              </button>
              <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`} aria-disabled={inputsDisabled}>
                Tillbaka till inloggning
              </Link>
            </div>
            {status ? (
              <div className={`${styles.status} ${styles.statusSuccess}`}>
                <p>{status}</p>
              </div>
            ) : null}
            {error ? (
              <div className={`${styles.status} ${styles.statusError}`}>
                <p>{error}</p>
              </div>
            ) : null}
          </form>
        </AuthCardBody>
      </AuthCard>
    </AuthLayout>
  );
}
