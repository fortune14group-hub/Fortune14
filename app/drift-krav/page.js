import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Drift & juridik | BetSpread',
  description:
    'Genomgång av vilka juridiska, säkerhetsmässiga och operativa krav som krävs för att driva BetSpread på ett professionellt sätt.',
};

export default function CompliancePage() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden>←</span> Till startsidan
        </Link>
      </div>

      <header className={styles.header}>
        <h1>Juridik, drift och compliance för BetSpread</h1>
        <p>
          Här samlar vi alla krav och rekommenderade åtgärder för att driva tjänsten på ett
          lagligt, säkert och professionellt sätt. Dokumentet bygger på hur BetSpread fungerar i
          dag: ett Next.js-baserat arbetsflöde som loggar sportsbetting-projekt, hanterar
          användarkonton via Supabase och säljer premiumfunktioner genom Stripe.
        </p>
      </header>

      <section className={styles.section}>
        <h2>Översikt</h2>
        <p>
          BetSpread erbjuder registrering av spel, resultatöversikter, ROI-analys samt möjligheten
          att låsa upp fler funktioner mot betalning. Eftersom tjänsten tydligt kopplas till
          sportsbetting måste ni säkerställa att erbjudandet inte klassas som spelverksamhet enligt
          Spellagen, och om det gör det krävs samordning med Spelinspektionen. Samtidigt behandlas
          personuppgifter (användarprofiler, e-postadresser, kopplade spelposter) och betalkortsdata
          via Stripe, vilket innebär att ni är personuppgiftsansvarig och omfattas av GDPR och
          betaltjänstregelverk.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Prioriterade åtgärder</h2>
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h3>Säkerställ spelrättsligt läge</h3>
            <ul>
              <li>
                Kartlägg om tjänsten klassas som spel enligt Spellagen. Om ni förmedlar spel eller
                ger instruktioner som påverkar utfall kan licens från Spelinspektionen krävas.
              </li>
              <li>
                Ta fram tydliga ansvarsfriskrivningar om BetSpread endast erbjuder statistik och
                administration av egna spel, utan att förmedla eller marknadsföra spel åt andra.
              </li>
              <li>
                Sätt rutiner för rapportering och ålderskontroller om verksamheten landar inom
                licenspliktigt område.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>GDPR och datasäkerhet</h3>
            <ul>
              <li>
                Inventera vilka personuppgifter som lagras i Supabase (t.ex. tabellerna <code>users</code>
                och spelhistorik) och dokumentera ändamålet, lagringsperioder och rättslig grund.
              </li>
              <li>
                Upprätta integritetspolicy, informera användare om deras rättigheter och teckna
                personuppgiftsbiträdesavtal med Supabase och övriga leverantörer.
              </li>
              <li>
                Säkerställ tekniska skydd: krypterade anslutningar, loggning av administrativa
                åtgärder, 2FA för interna konton samt rutiner för incidentrapportering.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Betalningar & konsumentskydd</h3>
            <ul>
              <li>
                Bekräfta att Stripe-flödena följer PSD2 och Strong Customer Authentication. Testa
                webhookhantering och se till att hemliga nycklar enbart ligger i säkra
                miljövariabler.
              </li>
              <li>
                Publicera villkor för premiumtjänster: pris, bindningstid, uppsägning och
                eventuella begränsningar. Informera om ångerrätt och återbetalningspolicy.
              </li>
              <li>
                Ange organisationsuppgifter och momshantering på kvitton samt i användarvillkor för
                att uppfylla konsumentlagstiftning.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Skydda drift & hemligheter</h3>
            <ul>
              <li>
                Flytta Supabase-nycklar, Stripe-hemligheter och andra känsliga värden till
                miljövariabler med korrekt åtkomstkontroll. Använd aldrig service-rollnycklar i
                klientkod.
              </li>
              <li>
                Implementera övervakning, loggning och larm för fel, intrångsförsök och missbruk.
              </li>
              <li>
                Dokumentera backup-rutiner, deployprocess och behörighetsnivåer för teamet.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Villkor & kundsupport</h3>
            <ul>
              <li>
                Publicera användarvillkor och integritetspolicy där syfte, databehandling och
                betalningsflöden förklaras tydligt.
              </li>
              <li>
                Erbjud kontaktvägar för support och klagomål, samt sätt SLA för svarstider.
              </li>
              <li>
                Säkerställ dokumenterade processer för kontostängning, dataportabilitet och
                radering på begäran.
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Checklista att följa upp</h2>
        <ul className={styles.checklist}>
          <li>
            <span className={styles.bullet}>1</span>
            <div>
              <strong>Licens & ansvarsfriskrivning:</strong> Dokumentera beslut om ni behöver
              svensk spellicens och publicera tydlig ansvarsfriskrivning på sajten.
            </div>
          </li>
          <li>
            <span className={styles.bullet}>2</span>
            <div>
              <strong>Dataskydd:</strong> Slutför integritetspolicy, biträdesavtal och tekniska
              skyddsåtgärder enligt GDPR.
            </div>
          </li>
          <li>
            <span className={styles.bullet}>3</span>
            <div>
              <strong>Betalning & villkor:</strong> Publicera premiumvillkor och säkerställ korrekt
              hantering av Stripe-nycklar, kvitton och kundsupport.
            </div>
          </li>
          <li>
            <span className={styles.bullet}>4</span>
            <div>
              <strong>Drift & säkerhet:</strong> Etablera loggning, backup, incidentrutiner och
              åtkomstkontroller för produktion.
            </div>
          </li>
        </ul>
        <p className={styles.closingNote}>
          När checklistan är avklarad har ni grunden för att driva BetSpread professionellt och
          uppfylla de krav som ställs av svensk lagstiftning, dataskyddsregler och
          betalningsleverantörer.
        </p>
      </section>
    </main>
  );
}
