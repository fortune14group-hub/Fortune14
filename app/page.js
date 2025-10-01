import Link from 'next/link';
import Logo from '../components/Logo';
import styles from './page.module.css';

const navLinks = [
  { label: 'Funktioner', href: '#features' },
  { label: 'Insikter', href: '#stats' },
  { label: 'Arbetsflöde', href: '#workflow' },
  { label: '+EV-beräknare', href: '/verktyg/ev' },
  { label: 'Vanliga frågor', href: '#faq' },
];

const heroHighlights = [
  'Registrera spel med match, marknad, odds, insats och egna noteringar.',
  'Få ROI, nettoresultat, hitrate och snittodds uträknade automatiskt per projekt.',
  'Uppdatera resultat med snabbval eller dropdowns direkt från listan.',
  'Analysera +EV på sekunder med kalkylatorn som beräknar Kelly och parlayvärden.',
];

const statHighlights = [
  {
    value: '3',
    label: 'Arbetslägen',
    caption: 'Registrering, månadssummering och spelöversikt.',
  },
  {
    value: '4+',
    label: 'Nyckeltal',
    caption: 'Nettoresultat, ROI, hitrate och snittodds beräknas åt dig.',
  },
  {
    value: 'Sekunder',
    label: 'Statusuppdatering',
    caption: 'Välj Win, Loss, Pending eller Void direkt från snabbmenyn.',
  },
];

const featureCards = [
  {
    title: 'Projektbaserad struktur',
    description:
      'Organisera dina spel i separata projekt och håll olika strategier åtskilda utan extra kalkylblad.',
    bullets: [
      'Skapa, byt namn på och radera projekt direkt i appen',
      'Visa aktuell portfölj och antal projekt i kontrollpanelen',
      'Växla fokus med ett klick när du arbetar live',
    ],
  },
  {
    title: 'Effektiv registrering',
    description:
      'Formuläret täcker match, marknad, odds, insats, spelbolag och egna anteckningar – allt som appen använder i sina beräkningar.',
    bullets: [
      'Resultat-knappar för Win, Loss, Pending och Void',
      'Redigera eller ta bort spel utan att lämna listan',
      'Få tydliga felmeddelanden om något saknas i formuläret',
    ],
  },
  {
    title: 'Inbyggd analys',
    description:
      'Månadssummeringen räknar ut dina nyckeltal och visar ett ackumulerat nettoresultat med tydliga axlar.',
    bullets: [
      'Automatiska värden för ROI, hitrate, snittodds och snittinsats',
      'Graf med markerade min-, max- och nollnivåer',
      'Panel för senaste spel med snabba statusuppdateringar',
    ],
  },
  {
    title: '+EV-beräknare',
    description:
      'Interaktiv kalkylator som räknar ut implied probability, edge, ROI, Kelly och parlaykombinationer direkt i webbläsaren.',
    bullets: [
      'Stöd för decimal-, amerikanska och fraktionella oddsformat',
      'Kelly-rekommendationer med full, halv och kvarts insats utifrån bankrullen',
      'Kombinera flera ben med parlay och kopiera resultatet till urklipp',
    ],
  },
];

const workflowSteps = [
  {
    title: 'Skapa ditt projekt',
    description:
      'Starta ett projekt för varje strategi och låt appen hålla ordning på dina portföljer.',
    caption: 'All data sparas i ditt konto när miljövariablerna är satta.',
  },
  {
    title: 'Registrera spelen',
    description:
      'Fyll i match, marknad, odds, insats, spelbolag och anteckningar – allt sparas direkt i databasen.',
    caption: 'Snabbknappar gör det enkelt att sätta korrekt resultatstatus.',
  },
  {
    title: 'Följ upp & analysera',
    description:
      'Använd månadssummeringen, grafen och senaste spel-panelen för att fatta beslut.',
    caption: 'Behåll överblicken även när du växlar mellan olika månader.',
  },
];

const personas = [
  {
    title: 'Hobbybettare',
    description:
      'Följ upp dina resultat för skojs skull och utveckla din analys och resultat.',
  },
  {
    title: 'Proffs/Syndikat',
    description:
      'Professionell översikt för resultat. Dela enkelt resultaten i forum eller spelgrupper.',
  },
];

const faqs = [
  {
    question: 'Är BetSpread gratis att använda?',
    answer: 'Ja, appen är gratis att använda medan vi fortsätter utveckla nya funktioner.',
  },
  {
    question: 'Kan jag importera befintliga spel?',
    answer:
      'Inte ännu. Du lägger in spel via formuläret i appen. CSV-import finns på vår roadmap och vi uppdaterar dokumentationen när funktionen lanseras.',
  },
  {
    question: 'Hur skyddas mina data?',
    answer:
      'Vi använder Supabase för lagring och inloggning med krypterade anslutningar. Dina uppgifter stannar i ditt konto och du kan alltid exportera dem själv.',
  },
];

const yearNow = new Date().getFullYear();

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.landingTopbar}>
        <Link href="/" className={styles.brand} aria-label="BetSpread startsida">
          <Logo className={styles.brandLogo} priority />
        </Link>
        <nav className={styles.nav} aria-label="Primär">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.topbarActions}>
          <Link href="/verktyg/ev" className={`${styles.btn} ${styles.btnGhost}`}>
            +EV-verktyg
          </Link>
          <Link href="/blog" className={`${styles.btn} ${styles.btnGhost}`}>
            Blogg
          </Link>
          <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
            Logga in
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} id="hero">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <h1>Professionell kontroll över dina spel – på en plats.</h1>
              <p>
                BetSpread hjälper dig att planera, registrera och analysera sportspel på ett strukturerat
                sätt. Håll koll på dina projekt, se hur nyckeltalen utvecklas och uppdatera statusen för
                varje spel direkt från listan.
              </p>
              <ul className={styles.heroHighlights}>
                {heroHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.ctaRow}>
                <Link href="/verktyg/ev" className={`${styles.btn} ${styles.btnGhost}`}>
                  Öppna +EV-beräknaren
                </Link>
                <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
                  Logga in
                </Link>
                <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Skapa konto
                </Link>
              </div>
            </div>
            <div className={styles.heroMockup}>
              <div className={styles.mockupCardPrimary}>
                <div>
                  <h3>Ditt Projekt</h3>
                  <p>ROI senaste 30 dagar</p>
                  <span className={styles.mockupKpi}>+23,4%</span>
                </div>
                <div className={styles.mockupChart}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className={styles.mockupCardSecondary}>
                <div>
                  <strong>Senaste spel</strong>
                  <p>Win • Serie A • 2.35 odds</p>
                </div>
                <div className={styles.mockupTags}>
                  <span>Win</span>
                  <span>Loss</span>
                  <span>Pending</span>
                  <span>Void</span>
                </div>
              </div>
              <div className={styles.mockupCardTertiary}>
                <h4>Arbetsflöde</h4>
                <ul>
                  <li>Skapa nytt projekt för helgens matcher</li>
                  <li>Registrera odds, insats och spelbolag</li>
                  <li>Sätt resultat när matchen är klar</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats} id="stats">
          <div className={styles.sectionHeading}>
            <h2>Insikter som baseras på dina registrerade spel</h2>
            <p>
              Alla nyckeltal räknas ut från den data du lägger in, så att du vet exakt hur varje strategi
              presterar.
            </p>
          </div>
          <div className={styles.statsGrid}>
            {statHighlights.map((item) => (
              <article key={item.label} className={styles.statCard}>
                <span className={styles.statValue}>{item.value}</span>
                <h3>{item.label}</h3>
                <p>{item.caption}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.featureSection} id="features">
          <div className={styles.sectionHeading}>
            <h2>Byggt för tydlig uppföljning</h2>
            <p>
              Varje funktion i appen är designad för att göra registrering och analys av spel så smidigt
              som möjligt.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {featureCards.map((feature) => (
              <article key={feature.title} className={styles.featureCard}>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <ul>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.workflow} id="workflow">
          <div className={styles.sectionHeading}>
            <h2>Ett arbetsflöde anpassat för manuell bettracking</h2>
            <p>Följ processen från idé till färdigt facit utan att lämna BetSpread.</p>
          </div>
          <div className={styles.workflowList}>
            {workflowSteps.map((step, index) => (
              <article key={step.title} className={styles.workflowStep}>
                <div className={styles.workflowIndex}>{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span>{step.caption}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.testimonialSection}>
          <div className={styles.sectionHeading}>
            <h2>Så kan BetSpread hjälpa dig</h2>
          </div>
          <div className={styles.testimonialGrid}>
            {personas.map((item) => (
              <article key={item.title} className={styles.testimonialCard}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.faqSection} id="faq">
          <div className={styles.sectionHeading}>
            <h2>Vanliga frågor</h2>
            <p>All information du behöver innan du kliver in i appen.</p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((item) => (
              <article key={item.question} className={styles.faqItem}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <div>
              <h2>Klara, färdiga, spela smartare.</h2>
              <p>
                Förvandla dina bettingdata till riktiga konkurrensfördelar med vårt eleganta och lättanvända
                verktyg.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
                Skapa gratis konto
              </Link>
              <Link href="/terms" className={`${styles.btn} ${styles.btnGhost}`}>
                Läs mer om villkor
              </Link>
            </div>
          </div>
        </section>
      </main>

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
          Support: <a href="mailto:Support@betspread.se">Support@betspread.se</a>
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
    </div>
  );
}
