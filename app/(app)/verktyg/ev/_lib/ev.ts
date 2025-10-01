import { toAmerican, toDecimal, toFraction, impliedFromDecimal } from './odds';
import {
  EvComputation,
  EvFormValues,
  NormalizedInputs,
  NormalizedLeg,
  ParlayResult,
  ProbabilitySource,
  RoundingMode,
  SingleResult,
  parseOptionalNumber,
  parseOptionalProbability,
} from './types';

export function netProfit(decimalOdds: number, stake: number): number {
  return (decimalOdds - 1) * stake;
}

export function evCurrency(
  decimalOdds: number,
  ownProbability: number,
  stake: number
): number {
  return ownProbability * netProfit(decimalOdds, stake) - (1 - ownProbability) * stake;
}

export function roiPercent(decimalOdds: number, ownProbability: number): number {
  return (decimalOdds * ownProbability - 1) * 100;
}

export function breakEvenProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

export function edgePercent(ownProbability: number, impliedProbability: number): number {
  return (ownProbability - impliedProbability) * 100;
}

export function kellyFraction(decimalOdds: number, ownProbability: number): number {
  const b = decimalOdds - 1;
  if (b <= 0) {
    return 0;
  }
  const q = 1 - ownProbability;
  return (b * ownProbability - q) / b;
}

export function roundValue(value: number, mode: RoundingMode): number {
  switch (mode) {
    case 'two':
      return Math.round(value * 100) / 100;
    case 'krona':
      return Math.round(value);
    case 'none':
    default:
      return value;
  }
}

function clampProbability(probability: number): number {
  if (Number.isNaN(probability)) {
    return 0;
  }
  return Math.min(1, Math.max(0, probability));
}

function clampKelly(fraction: number): number {
  if (Number.isNaN(fraction)) {
    return 0;
  }
  return Math.min(1, Math.max(0, fraction));
}

function parseStake(value: string): number {
  const parsed = parseOptionalNumber(value);
  if (parsed === null || parsed <= 0) {
    throw new Error('Insatsen måste vara positiv');
  }
  return parsed;
}

function parseBankroll(value?: string): number | undefined {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) {
    return undefined;
  }
  if (parsed <= 0) {
    throw new Error('Bankrullen måste vara positiv');
  }
  return parsed;
}

function parseManualEdge(values: EvFormValues): number | undefined {
  if (values.edgeMode !== 'manual') {
    return undefined;
  }
  const parsed = parseOptionalNumber(values.manualEdge);
  if (parsed === null) {
    throw new Error('Ogiltig edge');
  }
  return parsed;
}

function determineProbability(
  implied: number,
  values: EvFormValues,
  manualEdge?: number
): { probability: number; source: ProbabilitySource } {
  if (values.edgeMode === 'manual' && manualEdge !== undefined) {
    return {
      probability: clampProbability(implied + manualEdge / 100),
      source: 'manualEdge',
    };
  }

  const ownProbability = parseOptionalProbability(values.ownProbability);
  if (ownProbability !== null) {
    return { probability: clampProbability(ownProbability), source: 'user' };
  }

  return { probability: clampProbability(implied), source: 'implied' };
}

function normalizeLeg(leg: EvFormValues['parlayLegs'][number], index: number): NormalizedLeg {
  const decimalOdds = toDecimal(leg.oddsFormat, leg.oddsValue);
  const impliedProbability = impliedFromDecimal(decimalOdds);
  const ownProbabilityCandidate = parseOptionalProbability(leg.ownProbability);
  const probability =
    ownProbabilityCandidate !== null ? ownProbabilityCandidate : impliedProbability;
  const source: ProbabilitySource =
    ownProbabilityCandidate !== null ? 'user' : 'implied';

  return {
    id: leg.id || `ben-${index + 1}`,
    format: leg.oddsFormat,
    oddsInput: leg.oddsValue,
    decimalOdds,
    impliedProbability,
    ownProbability: clampProbability(probability),
    ownProbabilitySource: source,
    americanOdds: toAmerican(decimalOdds),
    fractionalOdds: toFraction(decimalOdds),
  };
}

export function normalizeInputs(values: EvFormValues): NormalizedInputs {
  const decimalOdds = toDecimal(values.oddsFormat, values.oddsValue);
  const impliedProbability = impliedFromDecimal(decimalOdds);
  const stake = parseStake(values.stake);
  const bankroll = parseBankroll(values.bankroll);
  const manualEdge = parseManualEdge(values);
  const { probability, source } = determineProbability(
    impliedProbability,
    values,
    manualEdge
  );

  const parlayLegs = values.parlayLegs.map((leg, index) => normalizeLeg(leg, index));

  return {
    stake,
    bankroll,
    rounding: values.rounding,
    edgeMode: values.edgeMode,
    manualEdgePercent: manualEdge,
    baseFormat: values.oddsFormat,
    decimalOdds,
    impliedProbability,
    ownProbability: probability,
    ownProbabilitySource: source,
    americanOdds: toAmerican(decimalOdds),
    fractionalOdds: toFraction(decimalOdds),
    parlayLegs,
    parlayEnabled: values.parlayEnabled,
  };
}

export function calculateEv(values: EvFormValues): EvComputation {
  const inputs = normalizeInputs(values);
  const single = buildSingleResult(inputs);
  const parlay = buildParlayResult(inputs);

  return { inputs, single, parlay };
}

function buildSingleResult(inputs: NormalizedInputs): SingleResult {
  const breakEven = breakEvenProbability(inputs.decimalOdds);
  const evValue = evCurrency(inputs.decimalOdds, inputs.ownProbability, inputs.stake);
  const roi = roiPercent(inputs.decimalOdds, inputs.ownProbability);
  const edge =
    inputs.edgeMode === 'manual' && typeof inputs.manualEdgePercent === 'number'
      ? inputs.manualEdgePercent
      : edgePercent(inputs.ownProbability, inputs.impliedProbability);
  const kellyRaw = kellyFraction(inputs.decimalOdds, inputs.ownProbability);
  const kelly = clampKelly(kellyRaw);
  const warnings: string[] = [];
  if (kellyRaw <= 0) {
    warnings.push('Kelly-fractionen är negativ, ingen insats rekommenderas.');
  }
  if (kellyRaw > 1) {
    warnings.push('Kelly-fractionen överstiger 100 %, begränsa insatsen.');
  }

  const recommendations =
    typeof inputs.bankroll === 'number'
      ? {
          full: roundValue(inputs.bankroll * kelly, inputs.rounding),
          half: roundValue(inputs.bankroll * kelly * 0.5, inputs.rounding),
          quarter: roundValue(inputs.bankroll * kelly * 0.25, inputs.rounding),
        }
      : undefined;

  return {
    decimalOdds: inputs.decimalOdds,
    americanOdds: inputs.americanOdds,
    fractionalOdds: inputs.fractionalOdds,
    impliedProbability: inputs.impliedProbability,
    ownProbability: inputs.ownProbability,
    ownProbabilitySource: inputs.ownProbabilitySource,
    breakEvenProbability: breakEven,
    stake: inputs.stake,
    netProfit: netProfit(inputs.decimalOdds, inputs.stake),
    evValue: roundValue(evValue, inputs.rounding),
    roiPercent: roi,
    edgePercent: edge,
    kellyFraction: kelly,
    kellyRecommendations: recommendations,
    bankroll: inputs.bankroll,
    rounding: inputs.rounding,
    manualEdgePercent: inputs.manualEdgePercent,
    warnings,
  };
}

function buildParlayResult(inputs: NormalizedInputs): ParlayResult | undefined {
  if (!inputs.parlayEnabled || inputs.parlayLegs.length === 0) {
    return undefined;
  }

  const decimalOdds = inputs.parlayLegs.reduce(
    (total, leg) => total * leg.decimalOdds,
    1
  );
  const impliedProbability = inputs.parlayLegs.reduce(
    (total, leg) => total * leg.impliedProbability,
    1
  );
  const ownProbability = inputs.parlayLegs.reduce(
    (total, leg) => total * leg.ownProbability,
    1
  );
  const probabilitySource: ProbabilitySource = inputs.parlayLegs.every(
    (leg) => leg.ownProbabilitySource === 'implied'
  )
    ? 'implied'
    : 'user';

  const breakEven = breakEvenProbability(decimalOdds);
  const evValue = evCurrency(decimalOdds, ownProbability, inputs.stake);
  const roi = roiPercent(decimalOdds, ownProbability);
  const edge = edgePercent(ownProbability, impliedProbability);
  const kellyRaw = kellyFraction(decimalOdds, ownProbability);
  const kelly = clampKelly(kellyRaw);
  const warnings: string[] = [];
  if (kellyRaw <= 0) {
    warnings.push('Kelly-fractionen är negativ, ingen insats rekommenderas.');
  }
  if (kellyRaw > 1) {
    warnings.push('Kelly-fractionen överstiger 100 %, begränsa insatsen.');
  }

  const recommendations =
    typeof inputs.bankroll === 'number'
      ? {
          full: roundValue(inputs.bankroll * kelly, inputs.rounding),
          half: roundValue(inputs.bankroll * kelly * 0.5, inputs.rounding),
          quarter: roundValue(inputs.bankroll * kelly * 0.25, inputs.rounding),
        }
      : undefined;

  return {
    decimalOdds,
    americanOdds: toAmerican(decimalOdds),
    fractionalOdds: toFraction(decimalOdds),
    impliedProbability,
    ownProbability,
    ownProbabilitySource: probabilitySource,
    breakEvenProbability: breakEven,
    stake: inputs.stake,
    netProfit: netProfit(decimalOdds, inputs.stake),
    evValue: roundValue(evValue, inputs.rounding),
    roiPercent: roi,
    edgePercent: edge,
    kellyFraction: kelly,
    kellyRecommendations: recommendations,
    bankroll: inputs.bankroll,
    rounding: inputs.rounding,
    warnings,
    legs: inputs.parlayLegs,
  };
}

export type { NormalizedInputs, NormalizedLeg };
