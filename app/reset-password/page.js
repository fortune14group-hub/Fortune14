'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import { buildAbsoluteUrl } from '../../lib/siteUrl';
import { AuthLayout, AuthCard, AuthCardHeader, AuthCardBody, authStyles } from '../../components/AuthLayout';

const styles = authStyles;

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleReset = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Fyll i e-postadressen.');
      return;
    }

    if (!supabase) {
      setError('Supabase är inte konfigurerat. Lägg till miljövariablerna och försök igen.');
      return;
    }

    setLoading(true);
    const redirectTo = buildAbsoluteUrl('/update-password');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setStatus('Om adressen finns registrerad skickas snart en återställningslänk via e-post.');
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
            description="Återställning av lösenord är beroende av Supabase. Lägg till miljövariablerna och försök igen."
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
              När variablerna är satta laddar sidan om automatiskt och du kan återställa lösenord.
            </p>
          </AuthCardBody>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout topbarActions={topbarActions}>
      <AuthCard>
        <AuthCardHeader
          eyebrow="Ditt konto"
          title="Återställ lösenord"
          description="Fyll i e-postadressen du registrerade ditt konto med så skickar vi en länk för att sätta ett nytt lösenord."
        />
        <AuthCardBody>
          <form className={styles.form} onSubmit={handleReset}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="resetEmail">
                E-postadress
              </label>
              <input
                id="resetEmail"
                type="email"
                placeholder="din@mail.se"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.buttonRow}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading}>
                {loading ? 'Skickar…' : 'Skicka återställningslänk'}
              </button>
              <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
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
