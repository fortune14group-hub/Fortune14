import Link from 'next/link';
import styles from './page.module.css';

const navLinks = [
  { label: 'Funktioner', href: '#features' },
  { label: 'Insikter', href: '#stats' },
  { label: 'Arbetsflöde', href: '#workflow' },
  { label: 'Vanliga frågor', href: '#faq' },
];

const heroHighlights = [
  'Registrera spel med match, marknad, odds, insats och egna noteringar.',
  'Få ROI, nettoresultat, hitrate och snittodds uträknade automatiskt per projekt.',
  'Uppdatera resultat med snabbval eller dropdowns utan att lämna listan.',
];

const statHighlights = [
  {
    value: '3',
    label: 'Arbetslägen',
    caption: 'Registrering, månadssummering och spelöversikt i samma vy.',
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
      'Tydliga aviseringar om användningsgränser när betalplaner är aktiverade',
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
];

const workflowSteps = [
  {
    title: 'Skapa ditt projekt',
    description:
      'Starta ett projekt för varje strategi och låt appen hålla ordning på dina portföljer.',
    caption: 'All data sparas i ditt Supabase-konto när miljövariablerna är satta.',
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

const testimonials = [
  {
    quote:
      'Jag loggar varje fotbollsspel med odds, insats och spelbolag och ser omedelbart hur ROI och hitrate förändras.',
    name: 'Scenario: Solo-analytiker',
    role: 'En person som vill ha koll på sitt eget track record.',
  },
  {
    quote:
      'Teamet växlar mellan olika projekt under livesändningar och uppdaterar resultaten utan att lämna listvyn.',
    name: 'Scenario: Litet bettingteam',
    role: 'Flera användare som delar ett Supabase-konto.',
  },
];

const faqs = [
  {
    question: 'Är BetSpread gratis att använda?',
    answer:
      'I dagsläget är hela appen öppen utan kostnad. När vi aktiverar betalplaner kommer gratisläget fortsatt låta dig registrera och analysera spel.',
  },
  {
    question: 'Kan jag importera befintliga spel?',
    answer:
      'Inte ännu. Du lägger in spel via formuläret i appen. CSV-import finns på vår roadmap och vi uppdaterar dokumentationen när funktionen lanseras.',
  },
  {
    question: 'Hur skyddas mina data?',
    answer:
      'Dina data sparas i det Supabase-projekt du kopplar appen till. Supabase hanterar autentisering och krypterade anslutningar – se till att behålla dina nycklar säkra och skapa egna backuper vid behov.',
  },
];

const yearNow = new Date().getFullYear();

export default function LandingPage() {
  return (
    <>
      <header className={styles.landingTopbar}>
        <div className={styles.brand}>BetSpread</div>
        <nav className={styles.nav} aria-label="Primär">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.topbarActions}>
          <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
            Logga in
          </Link>
          <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
            Starta gratis
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} id="hero">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.heroBadge}>Din sportbetting-dashboard i molnet</span>
              <h1>Professionell kontroll över varje spel – på en plats.</h1>
              <p>
                BetSpread hjälper dig att planera, registrera och analysera sportspel på ett strukturerat
                sätt. Håll koll på dina projekt, se hur nyckeltalen utvecklas och uppdatera statusen för
                varje spel utan att lämna sidan.
              </p>
              <ul className={styles.heroHighlights}>
                {heroHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.ctaRow}>
                <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Skapa konto
                </Link>
                <Link href="/app" className={`${styles.btn} ${styles.btnGhost}`}>
                  Gå till appen
                </Link>
              </div>
              <p className={styles.ctaNote}>Inga kortuppgifter behövs. Avsluta när du vill.</p>
            </div>
            <div className={styles.heroMockup}>
              <div className={styles.mockupCardPrimary}>
                <div>
                  <span className={styles.mockupLabel}>Exempelvy från appen</span>
                  <h3>Projekt: EuroEdge</h3>
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
            <p>Två praktiska scenarier som visar hur funktionerna används i vardagen.</p>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((item) => (
              <figure key={item.name} className={styles.testimonialCard}>
                <blockquote>{item.quote}</blockquote>
                <figcaption>
                  <span>{item.name}</span>
                  <small>{item.role}</small>
                </figcaption>
              </figure>
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
          Support: <a href="mailto:betspreadapp@gmail.com">betspreadapp@gmail.com</a>
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
