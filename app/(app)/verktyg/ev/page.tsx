import type { Metadata } from 'next';

import { EvCalculatorClient } from './_components/EvCalculatorClient';

export const generateMetadata = (): Metadata => ({
  title: '+EV-beräknare | Betspread',
  description:
    'Beräkna implied probability, förväntat värde, ROI och Kelly-fraktion för dina spel. Perfekt för att hitta +EV-spel och optimera insatser.',
  openGraph: {
    title: '+EV-beräknare | Betspread',
    description:
      'Interaktiv +EV-kalkylator med stöd för flera oddsformat, edge-hantering, Kelly och parlays.',
    type: 'website',
    url: 'https://www.betspread.se/verktyg/ev',
  },
});

export default function EvPage() {
  return (
    <main className="bg-slate-950/80 py-12">
      <div className="mx-auto w-full max-w-6xl px-4">
        <EvCalculatorClient />
      </div>
    </main>
  );
}
