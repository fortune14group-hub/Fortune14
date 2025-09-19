'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

const allowedOtpTypes = new Set(['signup', 'magiclink', 'recovery', 'email_change']);

function sanitizeType(type) {
  if (!type) {
    return 'signup';
  }

  return allowedOtpTypes.has(type) ? type : 'signup';
}

function clearAuthParams() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  window.history.replaceState({}, document.title, url.toString());
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailFallback />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenParam = searchParams?.get('token') ?? '';
  const typeParam = searchParams?.get('type') ?? '';
  const codeParam = searchParams?.get('code') ?? '';

  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');
  const [completedType, setCompletedType] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
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

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isMounted = true;

    const confirmEmail = async () => {
      if (!isMounted) {
        return;
      }

      setStatus('checking');
      setMessage('');

      const token = tokenParam || '';
      const hash =
        typeof window !== 'undefined' ? window.location.hash ?? '' : '';
      const hashParams = hash ? new URLSearchParams(hash.replace(/^#/, '')) : null;
      let sanitizedType = sanitizeType(typeParam || '');

      if (hashParams?.has('error_code')) {
        clearAuthParams();
        const errorCode = hashParams.get('error_code') || '';
        const errorDescription = hashParams.get('error_description') || '';

        setStatus('error');
        setMessage(
          errorCode === 'otp_expired'
            ? 'Länken är ogiltig eller har gått ut. Begär en ny länk via formuläret nedan.'
            : errorDescription ||
                'Ett fel inträffade vid bekräftelsen av e-postadressen. Försök igen eller be om ett nytt mail.'
        );
        return;
      }

      if (!typeParam && hashParams?.has('type')) {
        sanitizedType = sanitizeType(hashParams.get('type') || '');
      }

      const code = codeParam || '';

      try {
        const handleSuccess = (type) => {
          const normalizedType = type || 'signup';

          clearAuthParams();
          setStatus('success');
          setCompletedType(normalizedType);

          if (normalizedType === 'recovery') {
            setMessage('Klart! Vi skickar dig vidare för att byta lösenord…');
            router.replace('/update-password');
            return;
          }

          if (normalizedType === 'email_change') {
            setMessage('Din e-postadress är nu uppdaterad.');
            return;
          }

          if (normalizedType === 'magiclink') {
            setMessage('Länken är bekräftad. Vi loggar in dig automatiskt.');
            return;
          }

          setMessage('Tack! Nu kan du logga in.');
        };

        if (token) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: sanitizedType,
          });

          if (error) {
            throw error;
          }

          if (!data.session) {
            await supabase.auth.getSession();
          }

          if (!isMounted) {
            return;
          }

          handleSuccess(sanitizedType);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          if (!isMounted) {
            return;
          }

          handleSuccess(sanitizedType);
          return;
        }

        const hasHashTokens =
          hashParams?.has('access_token') || hashParams?.has('refresh_token');

        if (hasHashTokens) {
          const { error } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });

          if (error) {
            throw error;
          }

          if (!isMounted) {
            return;
          }

          handleSuccess(sanitizeType(typeParam || sanitizedType));
          return;
        }

        if (!isMounted) {
          return;
        }

        setStatus('missing');
        setMessage('Länken saknar information eller har redan använts.');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Ett okänt fel inträffade vid bekräftelse av e-postadress.'
        );
      }
    };

    confirmEmail();

    return () => {
      isMounted = false;
    };
  }, [supabase, tokenParam, typeParam, codeParam, router]);

  const handleResend = async (event) => {
    event.preventDefault();
    setResendStatus('');
    setResendError('');

    const trimmedEmail = resendEmail.trim();

    if (!trimmedEmail) {
      setResendError('Fyll i e-postadressen.');
      return;
    }

    if (!supabase) {
      setResendError('Supabase är inte konfigurerat. Lägg till miljövariablerna och försök igen.');
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
      });

      if (error) {
        throw error;
      }

      setResendStatus('Om adressen är registrerad skickas snart ett nytt bekräftelsemail.');
    } catch (error) {
      setResendError(
        error instanceof Error ? error.message : 'Ett fel inträffade när mailet skulle skickas på nytt.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  if (supabaseError) {
    return (
      <ConfirmEmailShell intro="Supabase är inte konfigurerat ännu. Lägg till miljövariablerna och försök igen.">
        <div className="state state-error">
          <p>
            E-postbekräftelsen kräver att <code>NEXT_PUBLIC_SUPABASE_URL</code> och{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> finns i din miljö tillsammans med{' '}
            <code>SUPABASE_URL</code> och <code>SUPABASE_SERVICE_ROLE</code>.
          </p>
          <p className="err-inline">{supabaseError}</p>
        </div>
        <p className="muted">
          Så snart variablerna är satta laddar sidan om och du kan bekräfta kontot via länken i mejlet.
        </p>
      </ConfirmEmailShell>
    );
  }

  return (
    <ConfirmEmailShell>
      <div className={`state state-${status}`}>
        {status === 'checking' ? <p>Bekräftar ditt konto…</p> : null}
        {status === 'success' ? (
          <>
            <p>
              {message ||
                (completedType === 'signup'
                  ? 'Tack! Nu kan du logga in.'
                  : 'Din e-postadress är nu bekräftad.')}
            </p>
            {completedType !== 'recovery' ? (
              <div className="row">
                {completedType === 'signup' ? (
                  <Link href="/login" className="btn">
                    Logga in
                  </Link>
                ) : (
                  <>
                    <Link href="/app" className="btn">
                      Fortsätt till appen
                    </Link>
                    <Link href="/login" className="btn-ghost">
                      Hantera konton
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </>
        ) : null}
        {status === 'missing' ? (
          <>
            <p>{message || 'Länken saknar information eller har redan använts.'}</p>
            <p className="muted">Du kan be om ett nytt bekräftelsemail nedan.</p>
          </>
        ) : null}
        {status === 'error' ? (
          <>
            <p className="err-inline">{message}</p>
            <p className="muted">Försök be om ett nytt bekräftelsemail nedan.</p>
          </>
        ) : null}
      </div>

      <form className="form-block" onSubmit={handleResend}>
        <label htmlFor="resendEmail">Få nytt bekräftelsemail</label>
        <input
          id="resendEmail"
          type="email"
          placeholder="din@mail.se"
          autoComplete="email"
          value={resendEmail}
          onChange={(event) => setResendEmail(event.target.value)}
        />
        <div className="row">
          <button type="submit" className="btn" disabled={resendLoading}>
            {resendLoading ? 'Skickar…' : 'Skicka nytt mail'}
          </button>
          <Link href="/login" className="btn-ghost">
            Tillbaka till inloggning
          </Link>
        </div>
        {resendStatus ? <div className="ok">{resendStatus}</div> : null}
        {resendError ? <div className="err">{resendError}</div> : null}
      </form>
    </ConfirmEmailShell>
  );
}

function ConfirmEmailFallback() {
  return (
    <ConfirmEmailShell intro="Vi förbereder sidan…">
      <div className="state state-checking">
        <p>Förbereder bekräftelsesidan…</p>
      </div>
    </ConfirmEmailShell>
  );
}

function ConfirmEmailShell({ intro, children }) {
  return (
    <div className="center">
      <div className="card">
        <h1>Bekräfta e-postadress</h1>
        {intro ? <p className="muted">{intro}</p> : null}
        {children}
      </div>
      <PageStyles />
    </div>
  );
}

function PageStyles() {
  return (
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
      .state {
        margin-bottom: 18px;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid #1f2a37;
        background: #111c28;
        color: #e2e8f0;
      }
      .state-success {
        border-color: #14532d;
        background: #052e16;
        color: #bbf7d0;
      }
      .state-error {
        border-color: #7f1d1d;
        background: #450a0a;
        color: #fecaca;
      }
      .state-missing {
        border-color: #7c3aed;
        background: #2e1065;
        color: #ddd6fe;
      }
      .state-checking {
        border-color: #1f2a37;
        background: #111c28;
        color: #e2e8f0;
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
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .form-block {
        display: flex;
        flex-direction: column;
      }
      .err,
      .ok {
        margin-top: 8px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid transparent;
      }
      .err {
        color: #fecaca;
        background: #3b0a0a;
        border-color: #6b1212;
      }
      .ok {
        color: #bbf7d0;
        background: #083d24;
        border-color: #195a39;
      }
      .err-inline {
        color: #fecaca;
      }
    `}</style>
  );
}
