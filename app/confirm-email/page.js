'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import { buildAbsoluteUrl } from '../../lib/siteUrl';
import { AuthLayout, AuthCard, AuthCardHeader, AuthCardBody, authStyles } from '../../components/AuthLayout';

const allowedOtpTypes = new Set(['signup', 'magiclink', 'recovery', 'email_change']);
const styles = authStyles;

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
  const statusContainerRef = useRef(null);
  const resendSuccessRef = useRef(null);
  const resendErrorRef = useRef(null);
  const [supabaseState] = useState(() => {
    try {
      return { client: getSupabaseBrowserClient(), error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Okänt fel vid initiering av Supabase-klienten.';

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Supabase-konfiguration saknas:', err);
      }

      return { client: null, error: errorMessage };
    }
  });

  const supabase = supabaseState.client;
  const supabaseError = supabaseState.error;

  const scrollElementIntoView = useCallback((element) => {
    if (!element) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    if (typeof element.focus === 'function') {
      try {
        element.focus({ preventScroll: true });
      } catch (error) {
        element.focus();
      }
    }

    if (typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  }, []);

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
      const hash = typeof window !== 'undefined' ? window.location.hash ?? '' : '';
      let sanitizedType = sanitizeType(typeParam || '');

      if (!typeParam && hash.includes('type=')) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
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

        const hasHashTokens = hash.includes('access_token=') || hash.includes('refresh_token=');

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

  useEffect(() => {
    if (status === 'checking') {
      return;
    }

    scrollElementIntoView(statusContainerRef.current);
  }, [status, scrollElementIntoView]);

  useEffect(() => {
    if (!resendError && !resendStatus) {
      return;
    }

    const target = resendError ? resendErrorRef.current : resendSuccessRef.current;
    scrollElementIntoView(target);
  }, [resendError, resendStatus, scrollElementIntoView]);

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
      const redirectTo = buildAbsoluteUrl('/confirm-email');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectTo,
          redirectTo,
        },
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
      <AuthLayout
        topbarActions={
          <>
            <Link href="/login" className={styles.topbarLink}>
              Till inloggning
            </Link>
            <Link href="/" className={styles.topbarLink}>
              Till startsida
            </Link>
          </>
        }
      >
        <AuthCard>
          <AuthCardHeader
            eyebrow="Konfiguration"
            title="Supabase saknas"
            description="Supabase är inte konfigurerat ännu. Lägg till miljövariablerna och försök igen."
          />
          <AuthCardBody>
            <div className={`${styles.status} ${styles.statusError}`}>
              <p>
                E-postbekräftelsen kräver att <code>NEXT_PUBLIC_SUPABASE_URL</code> och{' '}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> finns i din miljö tillsammans med{' '}
                <code>SUPABASE_URL</code> och <code>SUPABASE_SERVICE_ROLE</code>.
              </p>
              <p className={styles.small}>{supabaseError}</p>
            </div>
            <p className={styles.muted}>
              Så snart variablerna är satta laddar sidan om och du kan bekräfta kontot via länken i mejlet.
            </p>
            <Link href="/login" className={styles.inlineLink}>
              Tillbaka till inloggning
            </Link>
          </AuthCardBody>
        </AuthCard>
      </AuthLayout>
    );
  }

  const statusTone =
    status === 'success'
      ? styles.statusSuccess
      : status === 'missing'
      ? styles.statusWarning
      : status === 'error'
      ? styles.statusError
      : styles.statusInfo;

  return (
    <AuthLayout
      topbarActions={
        <>
          <Link href="/login" className={styles.topbarLink}>
            Till inloggning
          </Link>
          <Link href="/" className={styles.topbarLink}>
            Till startsida
          </Link>
        </>
      }
    >
      <AuthCard>
        <AuthCardHeader
          eyebrow="Bekräftelse"
          title="Bekräfta e-postadress"
          description="Vi kontrollerar länken och guidar dig vidare."
        />
        <AuthCardBody>
          <div
            ref={statusContainerRef}
            className={`${styles.status} ${statusTone}`}
            role={status === 'error' ? 'alert' : 'status'}
            aria-live={status === 'error' ? 'assertive' : 'polite'}
            aria-busy={status === 'checking'}
            tabIndex={-1}
          >
            {status === 'checking' ? (
              <>
                <p>Bekräftar ditt konto…</p>
                <p className={styles.helper}>Det tar bara ett ögonblick.</p>
              </>
            ) : null}
            {status === 'success' ? (
              <>
                <p>
                  {message ||
                    (completedType === 'signup'
                      ? 'Tack! Nu kan du logga in.'
                      : 'Din e-postadress är nu bekräftad.')}
                </p>
                {completedType !== 'recovery' ? (
                  <div className={styles.buttonRow}>
                    {completedType === 'signup' ? (
                      <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
                        Logga in
                      </Link>
                    ) : (
                      <>
                        <Link href="/app" className={`${styles.btn} ${styles.btnPrimary}`}>
                          Fortsätt till appen
                        </Link>
                        <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
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
                <p className={styles.muted}>Du kan be om ett nytt bekräftelsemail nedan.</p>
              </>
            ) : null}
            {status === 'error' ? (
              <>
                <p>{message}</p>
                <p className={styles.muted}>Försök be om ett nytt bekräftelsemail nedan.</p>
              </>
            ) : null}
          </div>

          <form className={styles.form} onSubmit={handleResend}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="resendEmail">
                Få nytt bekräftelsemail
              </label>
              <p id="resendEmailHelp" className={styles.helper}>
                Ange e-postadressen du registrerade kontot med så skickar vi en ny länk.
              </p>
              <input
                id="resendEmail"
                type="email"
                placeholder="din@mail.se"
                autoComplete="email"
                enterKeyHint="send"
                inputMode="email"
                value={resendEmail}
                onChange={(event) => setResendEmail(event.target.value)}
                className={styles.input}
                aria-describedby="resendEmailHelp"
              />
            </div>
            <div className={styles.buttonRow}>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={resendLoading}
                aria-busy={resendLoading}
              >
                {resendLoading ? 'Skickar…' : 'Skicka nytt mail'}
              </button>
              <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
                Tillbaka till inloggning
              </Link>
            </div>
            {resendStatus ? (
              <div
                ref={resendSuccessRef}
                className={`${styles.status} ${styles.statusSuccess}`}
                role="status"
                aria-live="polite"
                tabIndex={-1}
              >
                <p>{resendStatus}</p>
              </div>
            ) : null}
            {resendError ? (
              <div
                ref={resendErrorRef}
                className={`${styles.status} ${styles.statusError}`}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
              >
                <p>{resendError}</p>
              </div>
            ) : null}
          </form>
        </AuthCardBody>
      </AuthCard>
    </AuthLayout>
  );
}

function ConfirmEmailFallback() {
  return (
    <AuthLayout>
      <AuthCard>
        <AuthCardHeader
          eyebrow="Bekräftelse"
          title="Bekräftar länken"
          description="Vi förbereder sidan…"
        />
        <AuthCardBody>
          <div className={`${styles.status} ${styles.statusInfo}`}>
            <p>Förbereder bekräftelsesidan…</p>
          </div>
        </AuthCardBody>
      </AuthCard>
    </AuthLayout>
  );
}
