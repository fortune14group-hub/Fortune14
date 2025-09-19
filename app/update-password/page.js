'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isProcessingLink, setIsProcessingLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParamsString = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const hadSessionRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isMounted = true;
    let authSubscription = null;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const active = Boolean(data.session);
      hadSessionRef.current = active;
      setHasSession(active);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const active = Boolean(session);
      if (!active && hadSessionRef.current) {
        setSessionExpired(true);
        setStatus('');
        setError('Återställningssessionen har gått ut. Begär en ny länk via e-postmeddelandet.');
      }
      if (active) {
        setSessionExpired(false);
        setError('');
      }
      hadSessionRef.current = active;
      setHasSession(active);
    });
    authSubscription = data?.subscription ?? null;

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    const processAuthParams = async () => {
      const query = new URLSearchParams(searchParamsString);
      const code = query.get('code');
      const token = query.get('token');
      const tokenHash = query.get('token_hash');
      const type = query.get('type') ?? 'recovery';
      const email = query.get('email') ?? query.get('email_address');

      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const trimmedHash = hash.startsWith('#') ? hash.slice(1) : hash;
      const hashParams = trimmedHash ? new URLSearchParams(trimmedHash) : null;
      const hasFragmentTokens =
        !!hashParams && (hashParams.has('access_token') || hashParams.has('refresh_token'));

      if (!code && !token && !tokenHash && !hasFragmentTokens) {
        return;
      }

      setIsProcessingLink(true);
      setSessionExpired(false);
      if (!hadSessionRef.current) {
        setStatus('Verifierar återställningslänken...');
      }
      setError('');

      const clearAuthParams = () => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        ['code', 'token', 'token_hash', 'type', 'email', 'email_address'].forEach((key) => {
          url.searchParams.delete(key);
        });
        url.hash = '';
        router.replace(`${url.pathname}${url.search}`, { scroll: false });
      };

      try {
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!isActive) return;
          if (exchangeError) {
            setStatus('');
            setError(
              exchangeError.message ||
                'Det gick inte att verifiera engångskoden. Öppna länken från e-postmeddelandet igen.'
            );
            hadSessionRef.current = false;
            setHasSession(false);
            return;
          }
          if (!data?.session) {
            setStatus('');
            setError('Vi kunde inte skapa en återställningssession. Försök igen via e-postlänken.');
            hadSessionRef.current = false;
            setHasSession(false);
            return;
          }

          hadSessionRef.current = true;
          setHasSession(true);
          setSessionExpired(false);
          setStatus('Återställningslänken är bekräftad. Ange ett nytt lösenord.');
          setError('');
          clearAuthParams();
          return;
        }

        if (token || tokenHash) {
          if (!tokenHash && !email) {
            setStatus('');
            setError(
              'Vi kunde inte hitta e-postadressen i länken. Begär en ny återställningslänk och försök igen.'
            );
            hadSessionRef.current = false;
            setHasSession(false);
            return;
          }

          const verifyParams = tokenHash ? { type, token_hash: tokenHash } : { type, token, email };
          const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyParams);
          if (!isActive) return;
          if (verifyError) {
            setStatus('');
            setError(
              verifyError.message ||
                'Det gick inte att verifiera återställningslänken. Öppna länken från e-postmeddelandet igen.'
            );
            hadSessionRef.current = false;
            setHasSession(false);
            return;
          }
          if (!data?.session) {
            setStatus('');
            setError('Återställningssessionen hittades inte. Begär en ny länk via e-postmeddelandet.');
            hadSessionRef.current = false;
            setHasSession(false);
            return;
          }

          hadSessionRef.current = true;
          setHasSession(true);
          setSessionExpired(false);
          setStatus('Återställningslänken är bekräftad. Ange ett nytt lösenord.');
          setError('');
          clearAuthParams();
          return;
        }

        if (hasFragmentTokens) {
          const { data, error: sessionError } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });
          if (!isActive) return;
          if (sessionError) {
            setStatus('');
            setError(
              sessionError.message ||
                'Det gick inte att läsa in återställningssessionen. Öppna länken från e-postmeddelandet igen.'
            );
            hadSessionRef.current = false;
            setHasSession(false);
            return;
          }
          if (!data?.session) {
            setStatus('');
            setError('Återställningssessionen hittades inte. Begär en ny länk via e-postmeddelandet.');
            hadSessionRef.current = false;
            setHasSession(false);
            return;
          }

          hadSessionRef.current = true;
          setHasSession(true);
          setSessionExpired(false);
          setStatus('Återställningslänken är bekräftad. Ange ett nytt lösenord.');
          setError('');
          clearAuthParams();
        }
      } catch (err) {
        if (!isActive) return;
        setStatus('');
        setError('Ett oväntat fel inträffade. Öppna återställningslänken igen och försök på nytt.');
        hadSessionRef.current = false;
        setHasSession(false);
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Fel vid bearbetning av återställningslänken:', err);
        }
      } finally {
        if (isActive) {
          setIsProcessingLink(false);
        }
      }
    };

    processAuthParams();

    return () => {
      isActive = false;
    };
  }, [router, searchParamsString, supabase]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setError('');
    setStatus('');

    const nextPassword = password;
    if (!nextPassword) {
      setError('Ange ett nytt lösenord.');
      return;
    }
    if (nextPassword.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken långt.');
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError('Lösenorden stämmer inte överens.');
      return;
    }
    if (!supabase) {
      setError('Supabase är inte konfigurerat. Lägg till miljövariablerna och försök igen.');
      return;
    }
    if (!hasSession) {
      setError('Återställningssessionen är inte aktiv. Öppna länken från e-postmeddelandet igen.');
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword });
    if (updateError) {
      setError(updateError.message || 'Det gick inte att uppdatera lösenordet. Försök igen.');
      setIsSubmitting(false);
      return;
    }

    setStatus('Lösenordet är uppdaterat. Du kan nu logga in med ditt nya lösenord.');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsSubmitting(false);
  };

  if (supabaseError) {
    return (
      <main
        style={{
          maxWidth: '560px',
          margin: '4rem auto',
          padding: '2.5rem',
          borderRadius: '1.5rem',
          background: '#111827',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.28)',
          color: '#e2e8f0',
          lineHeight: 1.6,
          border: '1px solid #1f2937',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#f8fafc' }}>Konfigurationsfel</h1>
        <p style={{ marginBottom: '1rem' }}>
          Återställningen av lösenord kräver en fungerande Supabase-konfiguration. Lägg till{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din miljö
          tillsammans med server-variablerna <code>SUPABASE_URL</code> och <code>SUPABASE_SERVICE_ROLE</code>,
          deploya på nytt och försök igen.
        </p>
        <p style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{supabaseError}</p>
        <p style={{ fontSize: '0.95rem', color: '#cbd5f5' }}>
          När variablerna är satta laddar sidan om automatiskt och du kan uppdatera ditt lösenord.
        </p>
      </main>
    );
  }

  const disableForm = !hasSession || isProcessingLink || isSubmitting;

  return (
    <div className="center">
      <div className="card">
        <h1>Uppdatera lösenord</h1>
        <p className="muted">
          Ange ett nytt lösenord för ditt konto. Formuläret låses upp via länken i e-postmeddelandet.
        </p>

        {isProcessingLink ? <div className="info">Verifierar återställningslänken...</div> : null}
        {status ? <div className="ok">{status}</div> : null}
        {error && !sessionExpired ? <div className="err">{error}</div> : null}
        {sessionExpired ? (
          <div className="err">Återställningssessionen har gått ut. Begär en ny länk via e-postmeddelandet.</div>
        ) : null}

        <form className="form-block" onSubmit={handleSubmit}>
          <label htmlFor="newPassword">Nytt lösenord</label>
          <input
            id="newPassword"
            type="password"
            placeholder="Minst 6 tecken"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={disableForm}
          />

          <label htmlFor="confirmPassword">Bekräfta nytt lösenord</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Upprepa lösenordet"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={disableForm}
          />

          <div className="row">
            <button type="submit" className="btn" disabled={disableForm}>
              {isSubmitting ? 'Uppdaterar...' : 'Spara nytt lösenord'}
            </button>
            <Link href="/login" className="btn-ghost">
              Till inloggningen
            </Link>
          </div>
        </form>

        {!hasSession && !isProcessingLink ? (
          <div className="info">
            Formuläret kräver en aktiv återställningssession. Öppna länken i e-postmeddelandet för att låsa upp det.
          </div>
        ) : null}
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
        input:disabled {
          opacity: 0.6;
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
        .btn:disabled {
          opacity: 0.6;
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
          margin-top: 12px;
          color: #fecaca;
          background: #3b0a0a;
          border: 1px solid #6b1212;
          padding: 10px 12px;
          border-radius: 10px;
        }
        .ok {
          margin-top: 12px;
          color: #bbf7d0;
          background: #083d24;
          border: 1px solid #195a39;
          padding: 10px 12px;
          border-radius: 10px;
        }
        .info {
          margin-top: 12px;
          color: #bfdbfe;
          background: #0f2746;
          border: 1px solid #1e3a8a;
          padding: 10px 12px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
