import Link from 'next/link';
import styles from './page.module.css';

const yearNow = new Date().getFullYear();

export default function LandingPage() {
  return (
    <>
      <div className={styles.landingTopbar}>
        <div className={styles.brand}><strong>BetSpread</strong></div>
        <div className={styles.topbarActions}>
          <Link href="/drift-krav" className={styles.topbarLink}>
            Drift & juridik
          </Link>
          <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
            Logga in
          </Link>
        </div>
      </div>

      <section className={styles.landingHero}>
        <div className={styles.landingCard}>
          <div>
            <h1>Spreadsheets för sports betting – snabbt, snyggt och enkelt</h1>
            <p>
              Bokför dina spel, följ dina resultat månadsvis och lås upp obegränsat med Premium. För
              hobbybettare och proffs.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
                Kom igång gratis
              </Link>
            </div>
            <p className={styles.ctaNote}>Bokför de första 20 spelen gratis. Inga kort krävs.</p>
          </div>
          <div className={styles.feature}>
            <strong>Hur funkar det?</strong>
            <ol>
              <li>Skapa konto och logga in</li>
              <li>Skapa projekt</li>
              <li>Registrera dina spel</li>
              <li>Se sammanställning och ROI per månad</li>
            </ol>
          </div>
        </div>
      </section>

      <section className={styles.featureGrid}>
        <div className={styles.feature}>
          <strong>Snabb registrering</strong>
          <p>Matchdag, odds, insats, marknad, spelbolag.</p>
        </div>
        <div className={styles.feature}>
          <strong>Månadsvis överblick</strong>
          <p>ROI, profit och win/loss per månad.</p>
        </div>
        <div className={styles.feature}>
          <strong>Gratis → Premium</strong>
          <p>20 spel gratis, uppgradera när du vill.</p>
        </div>
      </section>

      <footer className={styles.landingFooter}>
        <nav className={styles.footerNav} aria-label="Juridik och policy">
          <Link href="/terms" className={styles.footerLink}>
            Köpvillkor
          </Link>
          <Link href="/privacy" className={styles.footerLink}>
            Integritetspolicy
          </Link>
          <Link href="/disclaimer" className={styles.footerLink}>
            Ansvarsfriskrivning
          </Link>
          <Link href="/drift-krav" className={styles.footerLink}>
            Drift & juridik
          </Link>
        </nav>
        <p className={styles.footerContact}>
          Support: <a href="mailto:support@betspread.se">support@betspread.se</a>
        </p>
        <p className={styles.footerMessage}>
          Spela ansvarsfullt. Behöver du stöd? Besök{' '}
          <a href="https://www.stodlinjen.se" target="_blank" rel="noreferrer">
            Stödlinjen
          </a>
          .
        </p>
        <p className={styles.footerCopy}>© {yearNow} BetSpread</p>
      </footer>
    </>
  );
}
