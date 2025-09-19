'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

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
          typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
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
          Inloggningen är beroende av Supabase. Lägg till{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> och <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> i din miljö
          tillsammans med server-variablerna <code>SUPABASE_URL</code> och{' '}
          <code>SUPABASE_SERVICE_ROLE</code>, deploya på nytt och försök igen.
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
        <h1>BetSpread</h1>
        <p className="muted">Logga in eller skapa konto för att komma åt tjänsten.</p>

        <div className="tab-buttons">
          <button
            type="button"
            className={`btn ${tab === 'login' ? '' : 'btn-ghost'}`}
            onClick={() => setTab('login')}
          >
            Logga in
          </button>
          <button
            type="button"
            className={`btn ${tab === 'signup' ? '' : 'btn-ghost'}`}
            onClick={() => setTab('signup')}
          >
            Skapa konto
          </button>
        </div>

        {tab === 'login' ? (
            <div className="form-block">
              <label htmlFor="loginEmail">E-post</label>
              <input
                id="loginEmail"
                type="email"
              placeholder="din@mail.se"
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <label htmlFor="loginPassword">Lösenord</label>
              <input
                id="loginPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            <div className="row row-between">
              <button type="button" className="btn" onClick={handleLogin}>
                Logga in
              </button>
              <Link href="/reset-password" className="text-link">
                Glömt lösenord?
              </Link>
            </div>
            {loginError ? <div className="err">{loginError}</div> : null}
          </div>
        ) : (
          <div className="form-block">
            <label htmlFor="signupEmail">E-post</label>
            <input
              id="signupEmail"
              type="email"
              placeholder="din@mail.se"
              autoComplete="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
            />
            <label htmlFor="signupPassword">Lösenord</label>
            <input
              id="signupPassword"
              type="password"
              placeholder="Minst 6 tecken"
              autoComplete="new-password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
            />
            <label htmlFor="signupConfirmPassword">Upprepa lösenord</label>
            <input
              id="signupConfirmPassword"
              type="password"
              placeholder="Upprepa lösenordet"
              autoComplete="new-password"
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
            />
            <div className="row">
              <button type="button" className="btn" onClick={handleSignup}>
                Skapa konto
              </button>
            </div>
            {signupInfo ? <div className="ok">{signupInfo}</div> : null}
            {signupError ? <div className="err">{signupError}</div> : null}
          </div>
        )}

        <div className="row back-link">
          <Link href="/" className="btn-ghost">
            Till startsida
          </Link>
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
        .row-between {
          justify-content: space-between;
          align-items: center;
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
        .btn-ghost {
          background: transparent;
          border: 1px solid #334155;
          color: #e7eef5;
          padding: 12px 14px;
          border-radius: 10px;
        }
        .tab-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .tab-buttons .btn {
          background: #22c55e;
          color: #0b1116;
        }
        .tab-buttons .btn-ghost {
          background: transparent;
          border: 1px solid #334155;
          color: #e7eef5;
        }
        .btn.btn-ghost {
          background: transparent;
          border: 1px solid #334155;
          color: #e7eef5;
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
        .back-link {
          margin-top: 10px;
        }
        .back-link .btn-ghost {
          padding: 8px 12px;
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
