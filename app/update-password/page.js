'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

function getHashParams() {
  if (typeof window === 'undefined') {
    return null;
  }

  const { hash } = window.location;
  if (!hash) {
    return null;
  }

  return new URLSearchParams(hash.replace(/^#/, ''));
}

function clearHashParams() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState({}, document.title, url.toString());
}

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
      setChecking(false);
      return undefined;
    }

    let isMounted = true;
    let authSubscription = null;

    const processInitialSession = async () => {
      const hashParams = getHashParams();

      if (hashParams?.has('error_code')) {
        if (!isMounted) {
          return;
        }

        const errorCode = hashParams.get('error_code') || '';
        const errorDescription = hashParams.get('error_description') || '';
        clearHashParams();
        setHasSession(false);
        setChecking(false);
        setError(
          errorCode === 'otp_expired'
            ? 'Återställningslänken är ogiltig eller har gått ut. Begär en ny länk via e-post.'
            : errorDescription ||
                'Ett fel inträffade när återställningslänken verifierades. Försök igen eller begär en ny länk.'
        );
        return;
      }

      if (hashParams?.has('access_token') || hashParams?.has('refresh_token')) {
        setError('');

        try {
          const { data, error } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });

          if (error) {
            throw error;
          }

          if (!isMounted) {
            return;
          }

          clearHashParams();
          setHasSession(Boolean(data.session));
          setChecking(false);
          return;
        } catch (err) {
          if (!isMounted) {
            return;
          }

          clearHashParams();
          setHasSession(false);
          setChecking(false);
          setError(
            err instanceof Error
              ? err.message
              : 'Ett fel inträffade när återställningslänken verifierades. Försök igen eller begär en ny länk.'
          );
          return;
        }
      }

      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setHasSession(Boolean(data.session));
      setChecking(false);
    };

    processInitialSession();

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

  const handleUpdate = async () => {
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
          Uppdatering av lösenord är beroende av Supabase. Lägg till{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din
          miljö tillsammans med server-variablerna <code>SUPABASE_URL</code> och{' '}
          <code>SUPABASE_SERVICE_ROLE</code>, deploya på nytt och försök igen.
        </p>
        <p style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{supabaseError}</p>
        <p style={{ fontSize: '0.95rem', color: '#cbd5f5' }}>
          När variablerna är satta laddar sidan om automatiskt och du kan spara ett nytt lösenord.
        </p>
      </main>
    );
  }

  const inputsDisabled = checking || !hasSession;

  return (
    <div className="center">
      <div className="card">
        <h1>Sätt nytt lösenord</h1>
        {checking ? (
          <div className="info">Vi kontrollerar återställningslänken …</div>
        ) : !hasSession ? (
          <div className="info warning">
            Återställningslänken verkar inte längre vara giltig. Gå tillbaka till{' '}
            <Link href="/reset-password" className="text-link">
              sidan för återställning
            </Link>{' '}
            och begär en ny länk.
          </div>
        ) : (
          <p className="muted">Ange ett nytt lösenord för ditt konto.</p>
        )}

        <div className="form-block">
          <label htmlFor="newPassword">Nytt lösenord</label>
          <input
            id="newPassword"
            type="password"
            placeholder="Minst 6 tecken"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={inputsDisabled}
          />
          <label htmlFor="confirmNewPassword">Upprepa lösenord</label>
          <input
            id="confirmNewPassword"
            type="password"
            placeholder="Upprepa lösenordet"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={inputsDisabled}
          />
          <div className="row">
            <button type="button" className="btn" onClick={handleUpdate} disabled={inputsDisabled}>
              Spara nytt lösenord
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
        input[disabled] {
          opacity: 0.7;
          cursor: not-allowed;
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
        .info {
          margin: 0 0 16px;
          background: #152235;
          border: 1px solid #1f2a37;
          color: #cbd5f5;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.95rem;
        }
        .info.warning {
          background: #331a0a;
          border-color: #8b5a2b;
          color: #fcd9b6;
        }
        .text-link {
          color: #38bdf8;
          font-weight: 600;
          text-decoration: none;
          padding: 0;
        }
        .text-link:hover,
        .text-link:focus {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
