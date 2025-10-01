'use client';

import * as React from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

import { EvComputation, NormalizedLeg } from '../_lib/types';

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('sv-SE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

interface EvResultsProps {
  computation: EvComputation | null;
}

export function EvResults({ computation }: EvResultsProps) {
  const { toast } = useToast();

  const handleCopy = React.useCallback(async () => {
    if (!computation) {
      return;
    }
    const single = computation.single;
    const summaryLines = [
      `Singelspel: EV ${formatCurrency(single.evValue)}, ROI ${formatPercent(single.roiPercent)}, Edge ${formatPercent(single.edgePercent)}, Kelly ${(single.kellyFraction * 100).toFixed(2)} %`,
    ];
    if (computation.parlay) {
      const parlay = computation.parlay;
      summaryLines.push(
        `Parlay: EV ${formatCurrency(parlay.evValue)}, ROI ${formatPercent(parlay.roiPercent)}, Edge ${formatPercent(parlay.edgePercent)}, Kelly ${(parlay.kellyFraction * 100).toFixed(2)} %`
      );
    }
    try {
      await navigator.clipboard.writeText(summaryLines.join('\n'));
      toast({
        title: 'Resultat kopierat',
        description: 'Snabbsummeringen finns nu i urklippet.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Kunde inte kopiera',
        description: 'Kontrollera behörigheter för urklipp i din webbläsare.',
        variant: 'destructive',
      });
    }
  }, [computation, toast]);

  if (!computation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Snabbsummering</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">
            Fyll i formuläret för att se beräkningarna i realtid.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { single, parlay } = computation;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Snabbsummering</CardTitle>
          <Button type="button" variant="secondary" onClick={handleCopy}>
            Kopiera resultat
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryMetric label="EV" tooltip="Förväntat värde per spel" value={formatCurrency(single.evValue)} trend={single.evValue} />
            <SummaryMetric
              label="ROI"
              tooltip="Avkastning per spel baserat på egen sannolikhet"
              value={formatPercent(single.roiPercent)}
              trend={single.roiPercent}
            />
            <SummaryMetric
              label="Edge"
              tooltip="Skillnad mellan egen och implied sannolikhet"
              value={formatPercent(single.edgePercent)}
              trend={single.edgePercent}
            />
            <SummaryMetric
              label="Kelly f*"
              tooltip="Optimal fraktion av bankrulle enligt Kelly"
              value={`${percentFormatter.format(single.kellyFraction * 100)} %`}
              trend={single.kellyFraction * 100}
            />
          </div>
        </CardContent>
      </Card>

      <ResultCard title="Singelspel" description="Detaljerad vy för ditt enskilda spel">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <SectionHeading title="Sannolikheter och odds" />
            <KeyValue label="Implied probability" tooltip="Oddsens inbyggda sannolikhet" value={formatProbability(single.impliedProbability)} />
            <KeyValue label="Egen sannolikhet" tooltip="Din uppskattade träffprocent" value={formatProbability(single.ownProbability)} />
            <KeyValue label="Break-even" tooltip="Krävd träffprocent för +-0" value={formatProbability(single.breakEvenProbability)} />
            <KeyValue label="Decimalodds" value={single.decimalOdds.toFixed(2)} />
            <KeyValue label="Amerikanska odds" value={single.americanOdds} />
            <KeyValue label="Fraktion" value={single.fractionalOdds} />
          </div>
          <div className="space-y-4">
            <SectionHeading title="Resultat" />
            <KeyValue label="Insats" value={formatCurrency(single.stake)} />
            <KeyValue label="Netto vid vinst" tooltip="Utbetalning minus insats" value={formatCurrency(single.netProfit)} />
            <KeyValue label="Förväntat värde" tooltip="p*vinsten - (1-p)*insats" value={formatCurrency(single.evValue)} />
            <KeyValue label="ROI" value={formatPercent(single.roiPercent)} />
            <KeyValue label="Edge" value={formatPercent(single.edgePercent)} />
            <KeyValue label="Kelly f*" value={`${percentFormatter.format(single.kellyFraction * 100)} %`} />
            {single.bankroll ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-200">Rekommenderad insats</p>
                {single.kellyFraction <= 0 ? (
                  <Alert variant="info" className="text-xs">
                    Ingen insats rekommenderas (negativ Kelly).
                  </Alert>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                    <li>Full Kelly: {formatCurrency(single.kellyRecommendations?.full ?? 0)}</li>
                    <li>½ Kelly: {formatCurrency(single.kellyRecommendations?.half ?? 0)}</li>
                    <li>¼ Kelly: {formatCurrency(single.kellyRecommendations?.quarter ?? 0)}</li>
                  </ul>
                )}
              </div>
            ) : (
              <Alert variant="info" className="text-xs">
                Kelly-faktorn är {percentFormatter.format(single.kellyFraction * 100)} %. Ange bankrulle för belopp.
              </Alert>
            )}
            {single.warnings.length > 0 ? (
              <div className="space-y-2">
                {single.warnings.map((warning) => (
                  <Alert key={warning} variant="destructive" className="text-xs">
                    {warning}
                  </Alert>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </ResultCard>

      {parlay ? (
        <ResultCard title="Parlay" description="Sammanställning för kombinationsspel">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <SectionHeading title="Leggar" />
                <div className="space-y-2">
                  {parlay.legs.map((leg, index) => (
                    <LegSummary key={leg.id} leg={leg} index={index} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <SectionHeading title="Resultat" />
                <KeyValue label="Kombinerade odds" value={parlay.decimalOdds.toFixed(2)} />
                <KeyValue label="Amerikanska" value={parlay.americanOdds} />
                <KeyValue label="Fraktion" value={parlay.fractionalOdds} />
                <KeyValue label="Kombinerad sannolikhet" value={formatProbability(parlay.ownProbability)} />
                <KeyValue label="Implied" value={formatProbability(parlay.impliedProbability)} />
                <KeyValue label="Break-even" value={formatProbability(parlay.breakEvenProbability)} />
                <KeyValue label="EV" value={formatCurrency(parlay.evValue)} />
                <KeyValue label="ROI" value={formatPercent(parlay.roiPercent)} />
                <KeyValue label="Edge" value={formatPercent(parlay.edgePercent)} />
                <KeyValue label="Kelly f*" value={`${percentFormatter.format(parlay.kellyFraction * 100)} %`} />
              </div>
            </div>
            {parlay.kellyFraction <= 0 ? (
              <Alert variant="info" className="text-xs">
                Ingen insats rekommenderas (negativ Kelly).
              </Alert>
            ) : parlay.kellyRecommendations ? (
              <Alert variant="default" className="text-xs text-emerald-100">
                Rek. insats: Full Kelly {formatCurrency(parlay.kellyRecommendations.full)}, halv {formatCurrency(parlay.kellyRecommendations.half)}, kvart {formatCurrency(parlay.kellyRecommendations.quarter)}.
              </Alert>
            ) : null}
            {parlay.warnings.length > 0 ? (
              <div className="space-y-2">
                {parlay.warnings.map((warning) => (
                  <Alert key={warning} variant="destructive" className="text-xs">
                    {warning}
                  </Alert>
                ))}
              </div>
            ) : null}
          </div>
        </ResultCard>
      ) : null}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tooltip,
  trend,
}: {
  label: string;
  value: string;
  tooltip?: string;
  trend?: number;
}) {
  const color = trendColor(trend ?? 0);
  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {tooltip ? <InfoTooltip text={tooltip} /> : null}
      </p>
      <p className={`mt-2 text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function ResultCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</p>;
}

function KeyValue({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm text-slate-200">
      <span className="font-medium text-slate-300">
        {label}
        {tooltip ? <InfoTooltip text={tooltip} /> : null}
      </span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function LegSummary({ leg, index }: { leg: NormalizedLeg; index: number }) {
  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 text-sm text-slate-200">
      <p className="font-semibold text-slate-100">Ben {index + 1}</p>
      <p>Odds: {leg.decimalOdds.toFixed(2)} ({leg.americanOdds})</p>
      <p>Fraktion: {leg.fractionalOdds}</p>
      <p>Egen sannolikhet: {formatProbability(leg.ownProbability)}</p>
      <p>Implied: {formatProbability(leg.impliedProbability)}</p>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] text-slate-300"
      title={text}
      aria-label={text}
    >
      ⓘ
    </span>
  );
}

function trendColor(value: number): string {
  if (value > 0) {
    return 'text-emerald-300';
  }
  if (value < 0) {
    return 'text-rose-300';
  }
  return 'text-slate-200';
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)} %`;
}

function formatProbability(probability: number): string {
  return `${percentFormatter.format(probability * 100)} %`;
}
