import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Integritetspolicy | BetSpread',
  description:
    'Integritetspolicyn beskriver hur BetSpread hanterar personuppgifter, Supabase som datalager och användarnas rättigheter i den kostnadsfria tjänsten.',
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
        <p className={styles.updated}>Senast uppdaterad: 5 juni 2024</p>
        <p className={styles.lead}>
          Den här policyn förklarar hur BetSpread samlar in, använder och skyddar personuppgifter när du
          registrerar dig och loggar spel. Tjänsten är kostnadsfri men vi följer samma krav enligt GDPR
          och samarbetar med Supabase som datalager. Stripe finns förberett för framtida betalningar men
          är inte aktivt just nu.
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
            lagras i Supabase-tabellen <code>users</code> för att kunna logga in säkert.
          </li>
          <li>
            <strong>Spelposter:</strong> projekt, matcher, marknader, insatser och resultat kopplas till
            ditt användar-ID i tabellerna <code>projects</code> och <code>bets</code> för att kunna visa
            statistik.
          </li>
          <li>
            <strong>Support och kommunikation:</strong> meddelanden, bilagor och metadata sparas så länge
            det behövs för att hantera ärendet och följa upp incidenter.
          </li>
          <li>
            <strong>Tekniska loggar:</strong> fel, inloggningar och administrativa åtgärder loggas i ett
            begränsat omfång för att kunna felsöka och förebygga missbruk.
          </li>
          <li>
            <strong>Betalningsreferenser (inaktivt):</strong> eftersom tjänsten är gratis samlar vi inte
            in kort- eller betalningsuppgifter. Historiska Stripe-referenser som kund- eller
            prenumerations-ID kan finnas kvar men innehåller inga känsliga kortdata.
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
            <strong>Drift och säkerhet:</strong> att övervaka system, förhindra missbruk och hantera
            incidenter. Rättslig grund: berättigat intresse.
          </li>
          <li>
            <strong>Support och kommunikation:</strong> att svara på frågor och hålla användare informerade
            vid driftstörningar. Rättslig grund: berättigat intresse.
          </li>
          <li>
            <strong>Förberedelse av betalningar:</strong> att kunna återaktivera premiumpaket i framtiden
            genom att behålla kundreferenser. Rättslig grund: berättigat intresse och rättslig skyldighet
            vid bokföring om betalningar blir aktuella.
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
            Ett personuppgiftsbiträdesavtal (Data Processing Agreement, DPA) är ingånget med Supabase.
            Eventuella avtal med Stripe aktiveras först om betalningar införs igen.
          </li>
          <li>
            Administrativa verktyg skyddas med stark autentisering och principen om minsta privilegium.
            Service-rollnyckeln lagras endast i backend-miljöer.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. Delning av uppgifter</h2>
        <p>
          Vi delar personuppgifter med betrodda leverantörer som agerar personuppgiftsbiträden. Supabase
          tillhandahåller hosting av databasen. Om betalningar återinförs använder vi Stripe som
          betalningsleverantör, men inga kortuppgifter lagras i BetSpread. Uppgifter lämnas ut till
          myndigheter endast om lag kräver det.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Lagringstid</h2>
        <p>
          Uppgifter behålls så länge du har ett aktivt konto och upp till 24 månader efter avslut för att
          uppfylla bokförings- och säkerhetskrav. Du kan begära radering tidigare om inga rättsliga
          skyldigheter hindrar det.
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
          isolerar berörda system, återställer data från senaste snapshot och informerar drabbade
          användare inom 72 timmar vid personuppgiftsincidenter. IMY kontaktas enligt gällande regler.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Kontakta oss</h2>
        <p>
          Vid frågor om denna policy eller dataskydd generellt når du oss på{' '}
          <a href="mailto:support@betspread.se">support@betspread.se</a>. För övergripande villkor se
          även våra <Link href="/terms">villkor &amp; datahantering</Link> och{' '}
          <Link href="/disclaimer">ansvarsfriskrivning</Link>.
        </p>
      </section>
    </main>
  );
}
