'use client';

import * as React from 'react';

import { ToastProvider } from '@/components/ui/toast';

import { EvForm } from './EvForm';
import { EvResults } from './EvResults';
import { EvComputation } from '../_lib/types';

export function EvCalculatorClient() {
  const [result, setResult] = React.useState<EvComputation | null>(null);

  return (
    <ToastProvider>
      <section className="flex flex-col gap-8">
        <header className="space-y-3 text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-400">Verktyg</p>
          <h1 className="text-3xl font-bold text-slate-50 md:text-4xl">+EV-beräknare</h1>
          <p className="text-base text-slate-300 md:max-w-2xl">
            Ange odds, egen sannolikhet och bankrulle för att se om ditt spel har positivt förväntat
            värde. Verktyget räknar automatiskt ut implied probability, edge, ROI och
            Kelly-rekommendationer.
          </p>
        </header>
        <EvForm onChange={setResult} />
        <EvResults computation={result} />
      </section>
    </ToastProvider>
  );
}
