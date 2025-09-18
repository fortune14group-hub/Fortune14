import Link from 'next/link';
import styles from './page.module.css';

const yearNow = new Date().getFullYear();

export default function LandingPage() {
  return (
    <>
      <div className={styles.landingTopbar}>
        <div className={styles.brand}><strong>BetSpread</strong></div>
        <div className={styles.topbarActions}>
          <Link href="/terms" className={styles.topbarLink}>
            Villkor
          </Link>
          <Link href="/privacy" className={styles.topbarLink}>
            Integritet
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
              Bokför dina spel, följ din statistik och analysera utvecklingen utan att lämna
              webbläsaren. BetSpread är kostnadsfritt att använda och byggt för hobbybettare och
              analytiker.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
                Kom igång gratis
              </Link>
            </div>
            <p className={styles.ctaNote}>
              Hela tjänsten är öppen och gratis att använda – inga kortuppgifter behövs.
            </p>
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
          <strong>Gratis och obegränsat</strong>
          <p>Under den öppna perioden sparar du hur många spel du vill.</p>
        </div>
      </section>

      <footer className={styles.landingFooter}>
        <nav className={styles.footerNav} aria-label="Juridik och policy">
          <Link href="/terms" className={styles.footerLink}>
            Villkor &amp; datahantering
          </Link>
          <Link href="/privacy" className={styles.footerLink}>
            Integritetspolicy
          </Link>
          <Link href="/disclaimer" className={styles.footerLink}>
            Ansvarsfriskrivning
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
