import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Köpvillkor | BetSpread',
  description:
    'Köpvillkoren beskriver hur abonnemang, betalningar, ångerrätt och support fungerar för BetSpreads premiumtjänster.',
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
        <h1>Köpvillkor för BetSpread</h1>
        <p className={styles.updated}>Senast uppdaterad: 20 maj 2024</p>
        <p className={styles.lead}>
          Dessa köpvillkor gäller när du tecknar eller använder ett BetSpread Premium-abonnemang.
          BetSpread är en digital plattform för att logga och analysera egna sportspel. Genom att
          slutföra ett köp via Stripe accepterar du villkoren nedan.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. Tjänsten och avtalsparter</h2>
        <p>
          Avtalet ingås mellan dig som kund ("kunden") och BetSpread ("vi" eller "oss"). Tjänsten
          omfattar åtkomst till verktyg för projekthantering, registrering av spel och analyser som
          beskrivs på{' '}
          <Link href="/">betspread.se</Link>. Plattformen ger inga spelrekommendationer och
          förmedlar inte vadslagning – du ansvarar själv för alla beslut och insatser.
        </p>
        <p className={styles.note}>
          För ytterligare juridisk information, se även vår{' '}
          <Link href="/privacy">integritetspolicy</Link> och{' '}
          <Link href="/disclaimer">ansvarsfriskrivning</Link>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Abonnemang och betalning</h2>
        <ul>
          <li>
            BetSpread Premium säljs som ett löpande abonnemang som faktureras via Stripe. Betalningen
            sker i förskott per period (månad om inget annat anges).
          </li>
          <li>
            Stripe är vår betalningsleverantör. Kassan och kundportalen använder säkra anslutningar och
            kräver stark kundautentisering (SCA/PSD2) när det behövs.
          </li>
          <li>
            Kortuppgifter lagras endast av Stripe. Vi sparar aldrig hela kortnummer i våra system.
          </li>
          <li>
            För att betalflödena ska fungera måste miljövariablerna{' '}
            <code>STRIPE_SECRET_KEY</code>, <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> och{' '}
            <code>STRIPE_WEBHOOK_SECRET</code> sättas i den säkra driftmiljön.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Priser, skatter och kvitton</h2>
        <p>
          Aktuellt pris framgår alltid i kassan innan du godkänner köpet. Priser anges i svenska kronor
          inklusive gällande moms. Kvitton tillhandahålls via Stripe och skickas till den e-postadress
          du anger i betalflödet. Vid ändrade priser informerar vi minst 30 dagar innan nästa
          faktureringsperiod.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Ångerrätt och uppsägning</h2>
        <ul>
          <li>
            Konsumenter har 14 dagars ångerrätt från köpet. Kontakta supporten för återbetalning om du
            vill utnyttja ångerrätten och inte har börjat använda Premiumfunktionerna.
          </li>
          <li>
            Abonnemanget kan sägas upp när som helst via kundportalen i Stripe eller genom att kontakta
            oss. Avslutet gäller inför nästa faktureringsperiod.
          </li>
          <li>
            Om du säger upp efter att perioden påbörjats tillhandahåller vi tjänsten tills perioden löpt
            ut. Ingen ytterligare debitering sker därefter.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. Användning av tjänsten</h2>
        <ul>
          <li>
            Du ansvarar för att kontouppgifter hålls hemliga. All aktivitet som sker via ditt konto
            betraktas som utförd av dig.
          </li>
          <li>
            Det är inte tillåtet att dela premiuminnehåll offentligt, kringgå användarbegränsningar eller
            manipulera tjänsten tekniskt.
          </li>
          <li>
            Vi kan stänga av konton som bryter mot villkoren, misstänks för missbruk eller inte
            uppfyller lagkraven kring spelansvar.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>6. Ansvar och begränsningar</h2>
        <ul>
          <li>
            BetSpread tillhandahåller statistik- och administrationsverktyg. Vi ansvarar inte för
            resultat, vinster eller förluster kopplade till dina spel.
          </li>
          <li>
            Vi ansvarar inte för indirekta skador, utebliven vinst eller följdskador såvida inte grov
            oaktsamhet föreligger.
          </li>
          <li>
            Tjänsten kan tillfälligt vara otillgänglig vid planerat underhåll eller oförutsedda driftfel.
            Vi informerar via e-post och statuskanaler vid längre avbrott.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>7. Support och kontakt</h2>
        <p>
          Support nås via <a href="mailto:support@betspread.se">support@betspread.se</a>. Vi besvarar
          normalt ärenden vardagar 09.00–17.00 och återkommer inom 24 timmar vid driftstörningar eller
          betalningsproblem. Vid säkerhetsincidenter följer vi rutinen som beskrivs på sidan{' '}
          <Link href="/drift-krav">Drift &amp; juridik</Link>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Tvister</h2>
        <p>
          Tvister ska i första hand lösas i dialog med vår support. Om en överenskommelse inte nås kan
          du som konsument vända dig till Allmänna reklamationsnämnden (ARN). Svensk lag tillämpas på
          avtalet.
        </p>
      </section>
    </main>
  );
}
