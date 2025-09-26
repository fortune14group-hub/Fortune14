'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout, AuthCard, AuthCardHeader, AuthCardBody, authStyles } from '@/components/AuthLayout';

const styles = authStyles;

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Fyll i e-postadressen.');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: trimmedEmail }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result?.message ?? 'Något gick fel. Försök igen.');
      return;
    }

    setStatus(result?.message ?? 'Om adressen finns registrerad skickas snart en återställningslänk via e-post.');
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
