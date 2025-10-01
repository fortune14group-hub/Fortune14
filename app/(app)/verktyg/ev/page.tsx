import type { Metadata } from 'next';
import * as React from 'react';

import { ToastProvider } from '@/components/ui/toast';

import { EvForm } from './_components/EvForm';
import { EvResults } from './_components/EvResults';
import { EvComputation } from './_lib/types';

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

function EvCalculatorClient() {
  'use client';

  const [result, setResult] = React.useState<EvComputation | null>(null);

  return (
    <ToastProvider>
      <section className="flex flex-col gap-8">
        <header className="space-y-3 text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-400">Verktyg</p>
          <h1 className="text-3xl font-bold text-slate-50 md:text-4xl">+EV-beräknare</h1>
          <p className="text-base text-slate-300 md:max-w-2xl">
            Ange odds, egen sannolikhet och bankrulle för att se om ditt spel har positivt förväntat värde.
            Verktyget räknar automatiskt ut implied probability, edge, ROI och Kelly-rekommendationer.
          </p>
        </header>
        <EvForm onChange={setResult} />
        <EvResults computation={result} />
      </section>
    </ToastProvider>
  );
}
