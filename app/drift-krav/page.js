import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Drift & juridik | BetSpread',
  description:
    'Samlad drift- och juridikplan med ansvarsfördelning, regelefterlevnad, säkerhet och incidentrutiner för BetSpread.',
};

export default function OperationsAndLegalPage() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden>←</span> Till startsidan
        </Link>
      </div>

      <header className={styles.header}>
        <h1>Drift &amp; juridik för BetSpread</h1>
        <p>
          Den här sidan fungerar som den gemensamma manualen för hur BetSpread drivs, övervakas och
          uppfyller legala krav. Följ rutinerna nedan för att säkerställa en trygg leverans till
          kunder, korrekt hantering av data och transparens gentemot myndigheter.
        </p>
        <div className={styles.metaRow}>
          <span>Senast uppdaterad: 15 februari 2024</span>
          <span>Version 1.0</span>
        </div>
      </header>

      <section className={styles.section}>
        <h2>Organisation &amp; ansvar</h2>
        <p>
          BetSpread AB (org.nr 559999-1234) är ansvarigt för drift och juridik kopplat till
          plattformen. Följande funktioner måste vara tillsatta och ha dokumenterade ersättare vid
          frånvaro.
        </p>
        <div className={styles.infoPanel}>
          <h3>Bolagsuppgifter</h3>
          <p>
            Registrerad adress: Sveavägen 12, 111 57 Stockholm. Faktureringsadress och tekniska
            kontaktuppgifter uppdateras i den här sidan vid förändring.
          </p>
          <ul>
            <li>
              Support: <a href="mailto:support@betspread.se">support@betspread.se</a>
            </li>
            <li>
              Dataskydd: <a href="mailto:dataskydd@betspread.se">dataskydd@betspread.se</a>
            </li>
            <li>Telefon för driftjour: +46 (0)8-123 45 600</li>
          </ul>
        </div>
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h3>Personuppgiftsansvarig</h3>
            <ul>
              <li>Fastställer ändamål och laglig grund för samtliga behandlingar i Supabase.</li>
              <li>Godkänner registerförteckning, gallringspolicy och biträdesavtal.</li>
              <li>
                Driver utbildning i GDPR och säkerställer att användare informeras om sina
                rättigheter.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Drift- och säkerhetsansvarig</h3>
            <ul>
              <li>Planerar deployment, release-fönster och statuskommunikation.</li>
              <li>Övervakar loggar, larm och molnresurser samt initierar incidentprocessen.</li>
              <li>Förvaltar backupstrategi, återläsningstest och dokumenterade körscheman.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Produkt- &amp; kundansvarig</h3>
            <ul>
              <li>Äger användarvillkor, prissättning och kommunikation kring premiumtjänster.</li>
              <li>Ser till att onboarding, FAQ och supporttexter hålls uppdaterade.</li>
              <li>Beslutar om kompensation, uppsägning och kreditering vid kundärenden.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Ekonomi &amp; betalflöden</h3>
            <ul>
              <li>Avstämmer Stripe-utbetalningar mot bokföring och momsdeklaration.</li>
              <li>Arkiverar kvitton, fakturor och export av transaktioner i sju år.</li>
              <li>Kontrollerar att kvitton visar organisationsnummer, pris och skatter.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Licenser &amp; regelefterlevnad</h2>
        <p>
          BetSpread erbjuder statistik och administrationsstöd. Bedöm löpande om nya funktioner kan
          innebära licenskrav och dokumentera resultatet av varje bedömning.
        </p>
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h3>Spellagen</h3>
            <ul>
              <li>
                Genomför halvårsvisa riskanalyser kring om tjänsten klassas som spel enligt 3 kap.
                Spellagen (2018:1138).
              </li>
              <li>
                Dokumentera beslut, ansvarig person och datum i regelefterlevnadsloggen.
              </li>
              <li>
                Säkerställ att marknadsföring innehåller ansvarsfullt spelande och åldersgränser.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>GDPR &amp; IMY</h3>
            <ul>
              <li>Publicera tydlig integritetspolicy och samla in aktivt samtycke där det krävs.</li>
              <li>
                Utför årlig konsekvensbedömning (DPIA) för känsliga behandlingar och uppdatera
                registerförteckningen.
              </li>
              <li>Rapportera personuppgiftsincidenter till IMY inom 72 timmar vid risk för skada.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Konsument- &amp; e-handelslag</h3>
            <ul>
              <li>Informera om 14 dagars ångerrätt för digitala premiumabonnemang.</li>
              <li>Visa pris inklusive moms och avtalsvillkor före köp.</li>
              <li>
                Erbjud enkel uppsägning via kontoinställningar och bekräfta avslut skriftligen.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Avtal &amp; leverantörer</h3>
            <ul>
              <li>Teckna och arkivera personuppgiftsbiträdesavtal med Supabase, Stripe och övriga.</li>
              <li>Gör årlig leverantörsbedömning av säkerhet, redundans och efterlevnad.</li>
              <li>För in avtalslöptider i kalendern och starta omförhandling i god tid.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Teknisk drift &amp; säkerhet</h2>
        <p>
          Plattformen körs i en Next.js-miljö med Supabase som datalager och Stripe för betalningar.
          Följ nedanstående rutiner för stabilitet, integritet och tillgänglighet.
        </p>
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h3>Release &amp; miljöer</h3>
            <ul>
              <li>Separera utveckling, staging och produktion med egna API-nycklar.</li>
              <li>All kod måste genomgå kodgranskning och automatiska tester före produktion.</li>
              <li>Planera större releaser utanför peaktrafik och informera kunder i förväg.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Åtkomst &amp; hemligheter</h3>
            <ul>
              <li>
                Hantera Supabase- och Stripe-nycklar i krypterade hemlighetshanterare, aldrig direkt i
                koden.
              </li>
              <li>Aktivera Multi-Factor Authentication för alla administrativa konton.</li>
              <li>Granska åtkomstrapporter kvartalsvis och rensa inaktiva konton.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Backup &amp; kontinuitet</h3>
            <ul>
              <li>Ta dagliga snapshots av databasen och lagra krypterade kopior i 30 dagar.</li>
              <li>Genomför återställningstester varje kvartal och dokumentera resultat.</li>
              <li>
                Upprätta plan för katastrofåterställning med RTO 4 timmar och RPO 1 timme.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Övervakning &amp; loggning</h3>
            <ul>
              <li>Logga alla API-anrop, inloggningar och administrativa händelser.</li>
              <li>Sätt larm på fel, förhöjd svarstid och onormalt många inloggningsförsök.</li>
              <li>Bevara loggar i minst 90 dagar för felsökning och revisionsspår.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Dataskydd &amp; dokumentation</h2>
        <p>
          Säkerställ att all personuppgiftshantering är dokumenterad och att användare kan utöva sina
          rättigheter utan onödiga dröjsmål.
        </p>
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h3>Registerförteckning</h3>
            <ul>
              <li>Lista tabeller, datatyper, lagringsplats och behörigheter i ett delat register.</li>
              <li>Uppdatera förteckningen i samband med nya funktioner eller integrationer.</li>
              <li>Dokumentera lagringsperiod och gallringsmetod per dataset.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Rättigheter för användare</h3>
            <ul>
              <li>Besvara begäran om registerutdrag inom 30 dagar.</li>
              <li>Erbjud dataportabilitet via säkra exportformat (CSV/JSON) genom supporten.</li>
              <li>Logga alla raderingar och anonymiseringar i ett särskilt protokoll.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Intern utbildning</h3>
            <ul>
              <li>Genomför årlig säkerhets- och GDPR-utbildning för alla med åtkomst till kunddata.</li>
              <li>Dokumentera deltagare och kompletterande åtgärder vid frånvaro.</li>
              <li>Publicera checklista för säkra arbetsrutiner i intern handbok.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Revision &amp; uppföljning</h3>
            <ul>
              <li>Utför internkontroll två gånger per år med fokus på åtkomst och loggar.</li>
              <li>Sammanställ rapporter till ledningen med identifierade brister och åtgärdsplan.</li>
              <li>Arkivera revisionsprotokoll och beslut i tre år.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Support, incidenter &amp; rapportering</h2>
        <p>
          Kund- och säkerhetsärenden hanteras centraliserat. Följ processen nedan och håll kontaktlistor
          uppdaterade så att incidenter kan lösas utan dröjsmål.
        </p>
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h3>Supportprocess</h3>
            <ul>
              <li>Öppettider vardagar 09.00–17.00 med SLA svar inom 24 timmar.</li>
              <li>Kategorisera ärenden (betalning, konto, teknik, data) för enklare uppföljning.</li>
              <li>Logga samtliga ärenden i systemet med tidsstämplar och ansvarig person.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Incidentrespons</h3>
            <ul>
              <li>Bekräfta rapport inom 1 timme vid driftstopp eller säkerhetsincident.</li>
              <li>Skapa incidentbiljett, tilldela roller och starta teknisk felsökning.</li>
              <li>Efter avslut: genomför rotorsaksanalys och distribuera rapport till ledningen.</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Kommunikation</h3>
            <ul>
              <li>Publicera statusuppdateringar på statussida och skicka e-post vid större avbrott.</li>
              <li>Informera berörda kunder före planerade driftfönster minst 48 timmar innan.</li>
              <li>Samordna press- eller myndighetskontakter genom personuppgiftsansvarig.</li>
            </ul>
          </article>
        </div>
        <div className={styles.infoPanel}>
          <h3>Kontaktvägar vid incident</h3>
          <ul>
            <li>
              Driftjour: <a href="tel:+46812345600">+46 (0)8-123 45 600</a>
            </li>
            <li>
              Säkerhetsärenden: <a href="mailto:security@betspread.se">security@betspread.se</a>
            </li>
            <li>
              Dataskyddsförfrågningar: <a href="mailto:dataskydd@betspread.se">dataskydd@betspread.se</a>
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Checklista att följa upp</h2>
        <ul className={styles.checklist}>
          <li>
            <span className={styles.bullet}>1</span>
            <div>
              <strong>Licens &amp; ansvarsfriskrivning:</strong> Dokumentera beslut kring spellicens och
              publicera tydlig ansvarsfriskrivning på webbplatsen.
            </div>
          </li>
          <li>
            <span className={styles.bullet}>2</span>
            <div>
              <strong>Dataskydd:</strong> Uppdatera registerförteckning, integritetspolicy och
              biträdesavtal.
            </div>
          </li>
          <li>
            <span className={styles.bullet}>3</span>
            <div>
              <strong>Teknisk säkerhet:</strong> Kontrollera backup, larm och åtkomstrapporter enligt
              planen ovan.
            </div>
          </li>
          <li>
            <span className={styles.bullet}>4</span>
            <div>
              <strong>Support &amp; incidenter:</strong> Testa incidentflödet och verifiera att kontaktlistor
              och statuskanaler fungerar.
            </div>
          </li>
          <li>
            <span className={styles.bullet}>5</span>
            <div>
              <strong>Ekonomi &amp; betalning:</strong> Avstäm Stripe-exporter, skatteunderlag och
              faktureringsrutiner.
            </div>
          </li>
        </ul>
        <p className={styles.closingNote}>
          När checklistan är klar kan BetSpread levereras på ett professionellt och regelkonformt
          sätt. Komplettera med uppdaterade{' '}
          <Link href="/terms">köpvillkor</Link>, <Link href="/privacy">integritetspolicy</Link> och{' '}
          <Link href="/disclaimer">ansvarsfriskrivning</Link> så att kunder alltid hittar aktuell
          information.
        </p>
      </section>
    </main>
  );
}
