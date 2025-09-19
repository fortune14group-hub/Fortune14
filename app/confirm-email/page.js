'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

function formatErrorMessage(rawMessage, queryMessage) {
  if (queryMessage) {
    return queryMessage;
  }

  if (!rawMessage) {
    return 'Länken är ogiltig eller har gått ut. Begär ett nytt bekräftelsemail nedan.';
  }

  const lower = rawMessage.toLowerCase();
  if (lower.includes('expired') || lower.includes('invalid') || lower.includes('otp')) {
    return 'Länken är ogiltig eller har gått ut. Begär ett nytt bekräftelsemail nedan.';
  }

  if (lower.includes('access_token')) {
    return 'Länken saknar en giltig bekräftelsekod. Begär ett nytt bekräftelsemail nedan.';
  }

  return `Kunde inte bekräfta e-postadressen: ${rawMessage}`;
}

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Bekräftar din e-postadress...');
  const [resendEmail, setResendEmail] = useState('');
  const [resendFeedback, setResendFeedback] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [supabaseState] = useState(() => {
    try {
      return { client: getSupabaseBrowserClient(), error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Okänt fel vid initiering av Supabase-klienten.';
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Supabase-konfiguration saknas:', err);
      }
      return { client: null, error: errorMessage };
    }
  });

  const supabase = supabaseState.client;
  const supabaseError = supabaseState.error;

  const emailFromQuery = useMemo(() => {
    const email = searchParams?.get('email') ?? searchParams?.get('email_address');
    return email ?? '';
  }, [searchParams]);

  useEffect(() => {
    setResendEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isActive = true;

    const exchangeSession = async () => {
      setStatus('loading');
      setMessage('Bekräftar din e-postadress...');

      const queryError = searchParams?.get('error_description') ?? undefined;
      let combinedErrorMessage = queryError;

      try {
        const code = searchParams?.get('code');
        const token = searchParams?.get('token');

        if (code || token) {
          const { error } = await supabase.auth.exchangeCodeForSession({
            authCode: code ?? token ?? '',
          });
          if (!error) {
            if (!isActive) return;
            setStatus('success');
            setMessage('Din e-postadress är nu bekräftad. Du kan fortsätta till appen.');
            return;
          }
          combinedErrorMessage = error?.message ?? combinedErrorMessage;
        }

        const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (!error) {
          if (!isActive) return;
          setStatus('success');
          setMessage('Din e-postadress är nu bekräftad. Du kan fortsätta till appen.');
          return;
        }

        combinedErrorMessage = error?.message ?? combinedErrorMessage;

        if (!isActive) return;
        setStatus('error');
        setMessage(formatErrorMessage(combinedErrorMessage, queryError));
      } catch (err) {
        if (!isActive) return;
        const rawMessage = err instanceof Error ? err.message : String(err);
        setStatus('error');
        setMessage(formatErrorMessage(rawMessage, queryError));
      }
    };

    exchangeSession();

    return () => {
      isActive = false;
    };
  }, [searchParams, supabase]);

  const handleResend = async (event) => {
    event.preventDefault();
    setResendFeedback(null);

    const email = resendEmail.trim();
    if (!email) {
      setResendFeedback({ type: 'error', message: 'Fyll i din e-postadress för att få ett nytt mejl.' });
      return;
    }

    if (!supabase) {
      setResendFeedback({
        type: 'error',
        message:
          'Supabase är inte konfigurerat. Lägg till miljövariablerna och försök igen innan du begär ett nytt mejl.',
      });
      return;
    }

    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        setResendFeedback({ type: 'error', message: error.message });
        return;
      }
      setResendFeedback({
        type: 'success',
        message: 'Om kontot finns skickas ett nytt bekräftelsemail inom kort.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResendFeedback({ type: 'error', message: errorMessage });
    } finally {
      setIsResending(false);
    }
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
          E-postbekräftelsen är beroende av Supabase. Lägg till{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din miljö tillsammans
          med server-variablerna <code>SUPABASE_URL</code> och <code>SUPABASE_SERVICE_ROLE</code>, deploya på nytt och
          försök igen.
        </p>
        <p style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{supabaseError}</p>
        <p style={{ fontSize: '0.95rem', color: '#cbd5f5' }}>
          När variablerna är satta laddar sidan om automatiskt och du kan logga in.
        </p>
      </main>
    );
  }

  return (
    <div className="center">
      <div className="card">
        <h1>Bekräfta e-post</h1>
        <p className="muted">
          {status === 'loading'
            ? 'Vi kontrollerar din länk...'
            : status === 'success'
              ? 'Din e-postadress är klar och du kan gå vidare.'
              : 'Vi kunde inte bekräfta din e-postadress.'}
        </p>

        <div className={`status-block status-${status}`}>
          <p>{message}</p>
        </div>

        {status === 'success' ? (
          <div className="row">
            <Link href="/app" className="btn">
              Till appen
            </Link>
            <Link href="/login" className="btn-ghost">
              Gå till inloggningen
            </Link>
          </div>
        ) : null}

        {status === 'error' ? (
          <form className="form-block" onSubmit={handleResend}>
            <label htmlFor="resendEmail">Skicka nytt bekräftelsemail</label>
            <input
              id="resendEmail"
              type="email"
              placeholder="din@mail.se"
              autoComplete="email"
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
              required
            />
            <div className="row">
              <button type="submit" className="btn" disabled={isResending}>
                {isResending ? 'Skickar...' : 'Skicka nytt mejl'}
              </button>
              <Link href="/login" className="btn-ghost">
                Till inloggningen
              </Link>
            </div>
            {resendFeedback ? (
              <div className={resendFeedback.type === 'error' ? 'err' : 'ok'}>{resendFeedback.message}</div>
            ) : null}
          </form>
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
        .status-block {
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #1f2a37;
          background: #101d2b;
          margin-bottom: 24px;
        }
        .status-loading {
          border-color: #1f2a37;
          background: #101d2b;
        }
        .status-success {
          border-color: #195a39;
          background: #083d24;
        }
        .status-error {
          border-color: #6b1212;
          background: #3b0a0a;
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
