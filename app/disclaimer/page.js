import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Ansvarsfriskrivning | BetSpread',
  description:
    'Ansvarsfriskrivningen förklarar begränsningarna i BetSpreads ansvar och hur tjänsten ska användas på ett spelansvarsfullt sätt.',
};

export default function DisclaimerPage() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden>←</span> Till startsidan
        </Link>
      </div>

      <header className={styles.header}>
        <h1>Ansvarsfriskrivning</h1>
        <p className={styles.updated}>Senast uppdaterad: 20 maj 2024</p>
        <p className={styles.lead}>
          BetSpread är ett administrationsverktyg för att logga och analysera egna spel. Informationen i
          tjänsten ska inte uppfattas som investerings-, spel- eller finansrådgivning. All användning sker
          på eget ansvar.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. Ingen rådgivning</h2>
        <p>
          Innehållet i BetSpread – inklusive ROI-beräkningar, historik och rapporter – är endast avsett
          för informationsändamål. Vi lämnar inga rekommendationer om att lägga spel, välja odds eller
          använda specifika spelbolag. Resultat från tidigare spel garanterar aldrig framtida utfall.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Eget ansvar för spel</h2>
        <ul>
          <li>Du ansvarar själv för att följa svensk lag och eventuella licenskrav kring spel.</li>
          <li>
            Du är ensam ansvarig för insatser, vinster och förluster. BetSpread ersätter inte förlorade
            medel och tar inget ansvar för beslut du fattar baserat på data i tjänsten.
          </li>
          <li>
            Kontrollera alltid information hos spelbolaget innan du placerar ett spel. Vi garanterar inte
            att data i plattformen är fullständig eller fri från fel.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Tekniska begränsningar</h2>
        <p>
          Vi strävar efter hög driftsäkerhet men kan inte garantera oavbruten åtkomst. Planerat
          underhåll, externa beroenden eller incidenter kan tillfälligt påverka tillgängligheten. Vi
          informerar användare via e-post och statuskanaler vid större störningar.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Spela ansvarsfullt</h2>
        <p>
          Spel ska vara underhållning. Sätt personliga gränser, ta pauser och sök hjälp om spelandet känns
          problematiskt. Vi hänvisar till <a href="https://www.stodlinjen.se">Stödlinjen</a> och andra
          stödorganisationer för rådgivning. Minderåriga får inte använda tjänsten.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Förändringar</h2>
        <p>
          Ansvarsfriskrivningen kan uppdateras vid ändringar i funktioner eller lagkrav. Vi meddelar
          registrerade användare via e-post och uppdaterar versionsdatumet ovan. Fortsatt användning av
          tjänsten innebär att du accepterar den senaste versionen.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Kontakt</h2>
        <p>
          Har du frågor om denna ansvarsfriskrivning kontaktar du oss på{' '}
          <a href="mailto:betspreadapp@gmail.com">betspreadapp@gmail.com</a>. För övriga juridiska
          dokument, se våra <Link href="/terms">villkor &amp; datahantering</Link> och{' '}
          <Link href="/privacy">integritetspolicy</Link>.
        </p>
      </section>
    </main>
  );
}
