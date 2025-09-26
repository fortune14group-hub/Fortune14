import Link from 'next/link';
import type { CSSProperties } from 'react';

export default function NotFound() {
  return (
    <main style={styles.main}>
      <h1 style={styles.heading}>Sidan kunde inte hittas</h1>
      <p style={styles.text}>
        Kontrollera länken eller gå tillbaka till startsidan för att fortsätta.
      </p>
      <Link href="/" style={styles.button}>
        Till startsidan
      </Link>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '48px 24px',
    textAlign: 'center',
  },
  heading: {
    fontSize: '2.5rem',
    margin: 0,
  },
  text: {
    maxWidth: '520px',
    lineHeight: 1.6,
    color: 'rgba(148, 163, 184, 0.9)',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
