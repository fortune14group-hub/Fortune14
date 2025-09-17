import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Integritetspolicy | BetSpread',
  description:
    'Integritetspolicyn beskriver hur BetSpread behandlar personuppgifter, hur Supabase används samt dina rättigheter enligt GDPR.',
};

export default function PrivacyPage() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden>←</span> Till startsidan
        </Link>
      </div>

      <header className={styles.header}>
        <h1>Integritetspolicy</h1>
        <p className={styles.updated}>Senast uppdaterad: 20 maj 2024</p>
        <p className={styles.lead}>
          Den här policyn förklarar hur BetSpread samlar in, använder och skyddar personuppgifter när du
          registrerar dig, loggar spel eller köper premiumtjänster. Vi följer GDPR och samarbetar med
          leverantörer som Supabase och Stripe för att erbjuda en säker upplevelse.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. Personuppgiftsansvarig</h2>
        <p>
          BetSpread är personuppgiftsansvarig för behandlingar kopplade till plattformen. Frågor om
          dataskydd skickas till <a href="mailto:support@betspread.se">support@betspread.se</a> med
          ämnesraden "Integritet".
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Vilka uppgifter vi samlar in</h2>
        <ul>
          <li>
            <strong>Konto och autentisering:</strong> e-postadress, lösenord (hashas) och tidsstämplar
            lagras i Supabase tabellen <code>users</code>.
          </li>
          <li>
            <strong>Spelposter:</strong> Projekt, matcher, marknader, insatser och resultat kopplas till
            ditt användar-ID för att kunna visa statistik.
          </li>
          <li>
            <strong>Betalningsinformation:</strong> Stripe hanterar kort- och betaluppgifter. Vi tar emot
            referenser som kund-ID, prenumerations-ID och betalningsstatus men aldrig fullständiga
            kortnummer.
          </li>
          <li>
            <strong>Supportärenden:</strong> e-postmeddelanden och metadata som krävs för att lösa
            ärendet sparas enligt vår incident- och supportprocess.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Ändamål och rättslig grund</h2>
        <ul>
          <li>
            <strong>Leverans av tjänsten:</strong> att skapa konton, spara spelposter och visa statistik.
            Rättslig grund: avtal.
          </li>
          <li>
            <strong>Betalningar:</strong> att debitera abonnemang, hantera kvitton och uppgraderingar via
            Stripe. Rättslig grund: avtal och rättslig skyldighet (bokföring).
          </li>
          <li>
            <strong>Support & incidenter:</strong> att svara på frågor och hantera felrapporter.
            Rättslig grund: berättigat intresse.
          </li>
          <li>
            <strong>Regelefterlevnad:</strong> att uppfylla spelrättsliga krav, bekämpa missbruk och
            tillhandahålla statistik till myndigheter vid behov. Rättslig grund: rättslig skyldighet.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>4. Lagring och säkerhet</h2>
        <ul>
          <li>
            Supabase driftar databasen inom EU. Row Level Security (RLS) är aktiverat för tabellerna
            <code>users</code>, <code>projects</code> och <code>bets</code> så att varje användare enbart
            ser sina egna uppgifter.
          </li>
          <li>
            Vi tar dagliga snapshots via Supabases backup-funktion och sparar krypterade kopior i minst 30
            dagar för att kunna återställa vid incidenter.
          </li>
          <li>
            Ett personuppgiftsbiträdesavtal (Data Processing Agreement, DPA) är ingånget med Supabase och
            en signerat kopia lagras i vår säkerhetsdokumentation.
          </li>
          <li>
            Åtkomst till administrativa verktyg skyddas med stark autentisering och principen om minsta
            privilegium. Service-rollnyckeln lagras endast i backend-miljöer.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. Delning av uppgifter</h2>
        <p>
          Vi delar personuppgifter med betrodda leverantörer som agerar personuppgiftsbiträden, till
          exempel Supabase (hosting av databasen) och Stripe (betalningar). Varje leverantör regleras av
          ett giltigt avtal och uppfyller GDPR. Uppgifter lämnas ut till myndigheter endast om lag kräver
          det.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Lagringstid</h2>
        <p>
          Uppgifter behålls så länge du har ett aktivt konto och upp till 24 månader efter avslut för att
          uppfylla bokförings- och konsumentlagstiftning. Du kan begära radering tidigare om inga
          rättsliga skyldigheter hindrar det.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Dina rättigheter</h2>
        <ul>
          <li>Begära utdrag (registerutdrag) över vilka uppgifter vi lagrar om dig.</li>
          <li>Få felaktiga uppgifter korrigerade.</li>
          <li>Begära radering eller begränsning av behandling.</li>
          <li>Invända mot viss behandling eller återkalla samtycke.</li>
          <li>Överföra data till annan tjänst (dataportabilitet).</li>
        </ul>
        <p className={styles.note}>
          Kontakta <a href="mailto:support@betspread.se">support@betspread.se</a> för att utöva dina
          rättigheter. Vi svarar inom 30 dagar. Du kan även klaga hos Integritetsskyddsmyndigheten
          (IMY).
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Incidenthantering</h2>
        <p>
          Säkerhetsincidenter loggas och utreds skyndsamt. Vi bekräftar mottaget ärende inom 24 timmar,
          isolerar berörda system, återställer data från senaste snapshot och informerar drabbade användare
          inom 72 timmar vid personuppgiftsincidenter. IMY kontaktas enligt gällande regler.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Kontakta oss</h2>
        <p>
          Vid frågor om denna policy eller dataskydd generellt når du oss på{' '}
          <a href="mailto:support@betspread.se">support@betspread.se</a>. Om ärendet rör betalningar
          hänvisar vi även till{' '}
          <Link href="/terms">köpvillkoren</Link> och <Link href="/drift-krav">drift- och
          säkerhetssidan</Link>.
        </p>
      </section>
    </main>
  );
}
