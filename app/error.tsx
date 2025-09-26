'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="sv">
      <body style={styles.body}>
        <main style={styles.main}>
          <h1 style={styles.heading}>Något gick fel</h1>
          <p style={styles.text}>
            Ett oväntat fel inträffade. Försök igen eller gå tillbaka till startsidan.
          </p>
          <div style={styles.actions}>
            <button type="button" onClick={() => reset()} style={styles.button}>
              Försök igen
            </button>
            <Link href="/" style={{ ...styles.button, ...styles.secondary }}>
              Till startsidan
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

const styles: Record<string, CSSProperties> = {
  body: {
    margin: 0,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    backgroundColor: '#020617',
    color: '#f8fafc',
  },
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '32px',
    textAlign: 'center',
  },
  heading: {
    fontSize: '2.5rem',
    margin: 0,
  },
  text: {
    maxWidth: '480px',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: '16px',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
};
