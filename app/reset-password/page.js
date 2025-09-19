'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

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

  const handleReset = async () => {
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
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/update-password` : undefined;
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

  if (supabaseError) {
    return (
      <main
        style={{
          minHeight: '100svh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: '#0b1116',
          color: '#e2e8f0',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#f8fafc' }}>Konfigurationsfel</h1>
        <p style={{ marginBottom: '1rem' }}>
          Återställning av lösenord är beroende av Supabase. Lägg till{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din
          miljö tillsammans med server-variablerna <code>SUPABASE_URL</code> och{' '}
          <code>SUPABASE_SERVICE_ROLE</code>, deploya på nytt och försök igen.
        </p>
        <p style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{supabaseError}</p>
        <p style={{ fontSize: '0.95rem', color: '#cbd5f5' }}>
          När variablerna är satta laddar sidan om automatiskt och du kan återställa lösenord.
        </p>
      </main>
    );
  }

  return (
    <div className="center">
      <div className="card">
        <h1>Återställ lösenord</h1>
        <p className="muted">
          Fyll i e-postadressen du registrerade ditt konto med så skickar vi en länk för att sätta ett
          nytt lösenord.
        </p>

        <div className="form-block">
          <label htmlFor="resetEmail">E-post</label>
          <input
            id="resetEmail"
            type="email"
            placeholder="din@mail.se"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="row">
            <button type="button" className="btn" onClick={handleReset} disabled={loading}>
              {loading ? 'Skickar…' : 'Skicka återställningslänk'}
            </button>
            <Link href="/login" className="btn-ghost">
              Tillbaka till inloggning
            </Link>
          </div>
          {status ? <div className="ok">{status}</div> : null}
          {error ? <div className="err">{error}</div> : null}
        </div>
      </div>

      <style jsx global>{`
        body {
          background: #0b1116;
        }
        .center {
          min-height: 100svh;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .card {
          width: min(560px, 92vw);
          background: #0f1720;
          border: 1px solid #1f2a37;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        }
        h1 {
          margin: 0 0 6px;
          font-size: 22px;
        }
        .muted {
          margin: 0 0 16px;
          color: #94a3b8;
        }
        label {
          font-size: 12px;
          color: #b6c2cf;
          display: block;
          margin: 14px 0 6px;
        }
        input {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #243244;
          background: #0b1320;
          color: #e7eef5;
        }
        .row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }
        .btn {
          padding: 12px 14px;
          border-radius: 10px;
          border: 0;
          font-weight: 700;
          cursor: pointer;
          background: #22c55e;
          color: #0b1116;
        }
        .btn[disabled] {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid #334155;
          color: #e7eef5;
          padding: 12px 14px;
          border-radius: 10px;
        }
        .form-block {
          display: flex;
          flex-direction: column;
        }
        .err {
          margin-top: 8px;
          color: #fecaca;
          background: #3b0a0a;
          border: 1px solid #6b1212;
          padding: 10px 12px;
          border-radius: 10px;
        }
        .ok {
          margin-top: 8px;
          color: #bbf7d0;
          background: #083d24;
          border: 1px solid #195a39;
          padding: 10px 12px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
