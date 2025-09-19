import Link from 'next/link';
import styles from './page.module.css';

const navLinks = [
  { label: 'Funktioner', href: '#features' },
  { label: 'Insikter', href: '#stats' },
  { label: 'Arbetsflöde', href: '#workflow' },
  { label: 'Vanliga frågor', href: '#faq' },
];

const heroHighlights = [
  'Automatisk ROI- och hitrate-analys i realtid',
  'Smart filtrering per projekt, liga och spelform',
  'Delningsbara dashboards för team och kunder',
];

const statHighlights = [
  { value: '120k+', label: 'Spårade spel', caption: 'Samlad historik från aktiva BetSpread-användare.' },
  { value: '18,4%', label: 'Genomsnittlig ROI', caption: 'När användare följer sina strategier konsekvent.' },
  { value: '12', label: 'Integrerade marknader', caption: 'Odds, sporter och bolag i samma kontrollpanel.' },
];

const featureCards = [
  {
    title: 'Moderna dashboards',
    description:
      'Koppla samman dina spel, se dagsfärska trender och få rekommendationer baserat på din historik.',
    bullets: ['Interaktiva grafer och tabeller', 'Scenarier med olika insatsnivåer', 'Sparade vyer för varje projekt'],
  },
  {
    title: 'Proffsigt lagrad data',
    description:
      'Allt sparas i en säker molndatabas med exportmöjligheter till CSV och Google Sheets.',
    bullets: ['GDPR-säker lagring i EU', 'Automatiska säkerhetskopior', 'API-stöd för egna integrationer'],
  },
  {
    title: 'Resultat i fokus',
    description:
      'Identifiera dina mest lönsamma speltyper, boka vinster snabbare och få påminnelser om pending-matcher.',
    bullets: ['Alert-system via mejl', 'Hitrate, profit per spel & volym', 'Färgkodade statusar och etiketter'],
  },
];

const workflowSteps = [
  {
    title: 'Skapa ditt projekt',
    description:
      'Bestäm spelstrategi, valuta och mål – BetSpread anpassar layouten efter din plan.',
    caption: 'Bygg flera projekt parallellt och växla mellan dem på sekunder.',
  },
  {
    title: 'Registrera spelen',
    description:
      'Fyll i odds, insats och marknad eller importera från Excel. Vi räknar ut avkastningen åt dig.',
    caption: 'Snabbkommandon och autofyll sparar tid vid livebetting.',
  },
  {
    title: 'Analysera & dela',
    description:
      'Fördjupa dig i grafer, skapa dashboards och exportera rapporter till kunder eller följare.',
    caption: 'Delningslänkar kan lösenordsskyddas och tidsbegränsas.',
  },
];

const testimonials = [
  {
    quote:
      '"BetSpread gör mitt dagliga arbete så mycket smidigare. Jag ser direkt vilka marknader som levererar bäst."',
    name: 'Elin Andersson',
    role: 'Sportanalytiker, OddsLab',
  },
  {
    quote:
      '"Efter att vi började logga allt i BetSpread ökade transparensen i teamet och ROI:n steg markant."',
    name: 'Marcus Lind',
    role: 'Grundare, EdgeCollective',
  },
];

const faqs = [
  {
    question: 'Är BetSpread gratis att använda?',
    answer:
      'Ja, basversionen är helt kostnadsfri. Vi arbetar på premiumfunktioner för team och större datavolymer, men standardkontot är gratis.',
  },
  {
    question: 'Kan jag importera befintliga spel?',
    answer:
      'Absolut. Ladda upp CSV-filer eller kopiera från kalkylblad så ordnar vi resten. Vår importguide hjälper dig steg för steg.',
  },
  {
    question: 'Hur skyddas mina data?',
    answer:
      'Vi lagrar allt i EU med dagliga säkerhetskopior och kryptering vid överföring. Du kan när som helst exportera eller radera dina data.',
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
                BetSpread hjälper dig att planera, registrera och analysera sportspel med en detaljnivå
                i klass med tradingteam. Få en inbjudande arbetsyta där statistik och nästa drag alltid
                är ett klick bort.
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
                  Utforska demot
                </Link>
              </div>
              <p className={styles.ctaNote}>Inga kortuppgifter behövs. Avsluta när du vill.</p>
            </div>
            <div className={styles.heroMockup}>
              <div className={styles.mockupCardPrimary}>
                <div>
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
                  <span>Push</span>
                </div>
              </div>
              <div className={styles.mockupCardTertiary}>
                <h4>Arbetsflöde</h4>
                <ul>
                  <li>Importera 12 spel från CSV</li>
                  <li>Uppdatera status innan midnatt</li>
                  <li>Skicka rapport till kund</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats} id="stats">
          <div className={styles.sectionHeading}>
            <h2>Insikter i världsklass från dag ett</h2>
            <p>
              Oavsett om du är ensam hobbybettare eller leder ett analysteam får du samma kraftfulla
              analysmotor.
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
            <h2>Byggt för spelare med höga krav</h2>
            <p>
              Avancerad funktionalitet, polerad design och allt du behöver för att fatta smartare beslut
              i nästa spel.
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
            <h2>Ett arbetsflöde som följer din takt</h2>
            <p>
              Från första idé till färdig rapport – BetSpread ger dig strukturen och verktygen att leverera
              på topp varje dag.
            </p>
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
            <h2>Älskat av analytiker och bettingteam</h2>
            <p>Se varför svenska sportbettare väljer BetSpread för sin dagliga rapportering.</p>
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
                Förvandla dina bettingdata till riktiga konkurrensfördelar med marknadens mest eleganta
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
