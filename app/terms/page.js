import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Villkor & datahantering | BetSpread',
  description:
    'Översikt över användarvillkor, datainsamling och hur BetSpread hanterar personuppgifter i den kostnadsfria tjänsten.',
};

export default function TermsPage() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden>←</span> Till startsidan
        </Link>
      </div>

      <header className={styles.header}>
        <h1>Villkor &amp; datahantering för BetSpread</h1>
        <p className={styles.updated}>Senast uppdaterad: 5 juni 2024</p>
        <p className={styles.lead}>
          BetSpread är ett kostnadsfritt verktyg för att logga egna sportspel och analysera resultat.
          Denna sida beskriver vilka uppgifter vi behandlar, hur de skyddas och vilket ansvar du har
          som användare.
        </p>
        <p className={styles.note}>
          För fördjupad information om personuppgifter och rättigheter, se även vår{' '}
          <Link href="/privacy">integritetspolicy</Link> samt{' '}
          <Link href="/disclaimer">ansvarsfriskrivning</Link>.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. Tjänsten</h2>
        <p>
          BetSpread tillhandahålls utan avgift. Du skapar ett konto med e-postadress och lösenord för
          att logga in. Tjänsten erbjuder projekt för olika spelstrategier, registrering av matcher,
          insatser och resultat samt översikter och grafer baserade på dina egna data. Vi ger inga
          spelrekommendationer och förmedlar inte vadslagning – alla spelbeslut fattas av dig.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Uppgifter vi hanterar</h2>
        <ul>
          <li>
            <strong>Konto:</strong> e-postadress, lösenord (lagrat som hash) och tidsstämplar för
            inloggning lagras för att kunna autentisera och skydda konton.
          </li>
          <li>
            <strong>Spelposter:</strong> projekt, matcher, marknader, insatser, odds, resultat och egna
            anteckningar kopplas till ditt konto för att kunna visa statistik.
          </li>
          <li>
            <strong>Supportärenden:</strong> meddelanden och metadata från kontakten med oss sparas så
            länge det behövs för att lösa ärendet och följa upp incidenter.
          </li>
          <li>
            <strong>Tekniska loggar:</strong> vi sparar begränsade loggar över fel, inloggningar och
            administrativa åtgärder för att kunna felsöka och upprätthålla säkerheten.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Lagring och säkerhet</h2>
        <ul>
          <li>
            Data lagras i Supabase inom EU. Row Level Security begränsar åtkomst så att varje användare
            endast ser sina egna poster.
          </li>
          <li>
            Backuper tas dagligen och sparas krypterat i minst 30 dagar för att möjliggöra återställning
            vid incidenter.
          </li>
          <li>
            Administrativ åtkomst skyddas med stark autentisering och principen om minsta privilegium.
            Hemliga nycklar lagras endast i säkra servermiljöer.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>4. Användarens ansvar</h2>
        <ul>
          <li>Håll dina inloggningsuppgifter hemliga och välj starka lösenord.</li>
          <li>
            Registrera endast spel som du själv har placerat och se till att informationen du lägger in
            är korrekt.
          </li>
          <li>
            Följ svensk lag och spelbolagens regler. BetSpread ansvarar inte för beslut eller förluster
            kopplade till dina spel.
          </li>
          <li>Missbruk, manipulation eller försök att bryta mot säkerheten kan leda till avstängning.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. Dina rättigheter och kontakt</h2>
        <p>
          Du har rätt att få tillgång till, rätta eller radera uppgifter om dig samt invända mot viss
          behandling. Kontakta <a href="mailto:betspreadapp@gmail.com">betspreadapp@gmail.com</a> för att
          utöva dina rättigheter eller ställa frågor om dessa villkor. Mer information finns i vår{' '}
          <Link href="/privacy">integritetspolicy</Link>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Förändringar</h2>
        <p>
          Vi kan uppdatera villkoren vid förändringar i funktioner, lagkrav eller leverantörer. Vid
          större ändringar informerar vi registrerade användare via e-post och uppdaterar
          versionsdatumet ovan. Genom att fortsätta använda BetSpread accepterar du den senaste
          versionen.
        </p>
      </section>
    </main>
  );
}
