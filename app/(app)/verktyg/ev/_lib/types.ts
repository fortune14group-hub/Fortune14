import { z } from 'zod';

export const oddsFormatSchema = z.enum(['decimal', 'american', 'fraction']);
export type OddsFormat = z.infer<typeof oddsFormatSchema>;

export const roundingModeSchema = z.enum(['none', 'two', 'krona']);
export type RoundingMode = z.infer<typeof roundingModeSchema>;

export const edgeModeSchema = z.enum(['auto', 'manual']);
export type EdgeMode = z.infer<typeof edgeModeSchema>;

export type ProbabilitySource = 'implied' | 'manualEdge' | 'user';

export const parlayLegSchema = z.object({
  id: z.string(),
  oddsFormat: oddsFormatSchema,
  oddsValue: z.string({ required_error: 'Ange odds' }).min(1, 'Ange odds'),
  ownProbability: z.string().optional(),
});

export const evFormSchema = z
  .object({
    oddsFormat: oddsFormatSchema,
    oddsValue: z.string({ required_error: 'Ange odds' }).min(1, 'Ange odds'),
    ownProbability: z.string().optional(),
    stake: z.string({ required_error: 'Ange insats' }).min(1, 'Ange insats'),
    bankroll: z.string().optional(),
    edgeMode: edgeModeSchema,
    manualEdge: z.string().optional(),
    rounding: roundingModeSchema,
    parlayEnabled: z.boolean().default(false),
    parlayLegs: z.array(parlayLegSchema).default([]),
  })
  .superRefine((values, ctx) => {
    const stakeNumber = parseNumber(values.stake);
    if (stakeNumber === null || stakeNumber <= 0) {
      ctx.addIssue({
        path: ['stake'],
        code: z.ZodIssueCode.custom,
        message: 'Insatsen måste vara ett positivt tal',
      });
    }

    const bankrollNumber = parseOptionalNumber(values.bankroll);
    if (values.bankroll && (bankrollNumber === null || bankrollNumber <= 0)) {
      ctx.addIssue({
        path: ['bankroll'],
        code: z.ZodIssueCode.custom,
        message: 'Bankrulle måste vara ett positivt tal',
      });
    }

    if (!validateOdds(values.oddsFormat, values.oddsValue)) {
      ctx.addIssue({
        path: ['oddsValue'],
        code: z.ZodIssueCode.custom,
        message: 'Ogiltigt oddsformat',
      });
    }

    const probability = parseOptionalProbability(values.ownProbability);
    if (probability === null && values.ownProbability && values.ownProbability.trim() !== '') {
      ctx.addIssue({
        path: ['ownProbability'],
        code: z.ZodIssueCode.custom,
        message: 'Sannolikhet måste vara mellan 0 och 100 %',
      });
    }

    if (values.edgeMode === 'manual') {
      const manualEdge = parseOptionalNumber(values.manualEdge);
      if (manualEdge === null) {
        ctx.addIssue({
          path: ['manualEdge'],
          code: z.ZodIssueCode.custom,
          message: 'Ange din edge i procent',
        });
      }
    }

    if (values.parlayEnabled) {
      if (values.parlayLegs.length === 0) {
        ctx.addIssue({
          path: ['parlayLegs'],
          code: z.ZodIssueCode.custom,
          message: 'Lägg till minst ett ben för parlay',
        });
      }

      values.parlayLegs.forEach((leg, index) => {
        if (!validateOdds(leg.oddsFormat, leg.oddsValue)) {
          ctx.addIssue({
            path: ['parlayLegs', index, 'oddsValue'],
            code: z.ZodIssueCode.custom,
            message: 'Ogiltiga odds för detta ben',
          });
        }
        const legProbability = parseOptionalProbability(leg.ownProbability);
        if (leg.ownProbability && legProbability === null) {
          ctx.addIssue({
            path: ['parlayLegs', index, 'ownProbability'],
            code: z.ZodIssueCode.custom,
            message: 'Sannolikhet måste vara mellan 0 och 100 %',
          });
        }
      });
    }
  });

export type EvFormValues = z.infer<typeof evFormSchema>;

export interface NormalizedLeg {
  id: string;
  format: OddsFormat;
  oddsInput: string;
  decimalOdds: number;
  impliedProbability: number;
  ownProbability: number;
  ownProbabilitySource: ProbabilitySource;
  americanOdds: string;
  fractionalOdds: string;
}

export interface NormalizedInputs {
  stake: number;
  bankroll?: number;
  rounding: RoundingMode;
  edgeMode: EdgeMode;
  manualEdgePercent?: number;
  baseFormat: OddsFormat;
  decimalOdds: number;
  impliedProbability: number;
  ownProbability: number;
  ownProbabilitySource: ProbabilitySource;
  americanOdds: string;
  fractionalOdds: string;
  parlayLegs: NormalizedLeg[];
  parlayEnabled: boolean;
}

export interface KellyRecommendations {
  full: number;
  half: number;
  quarter: number;
}

export interface SingleResult {
  decimalOdds: number;
  americanOdds: string;
  fractionalOdds: string;
  impliedProbability: number;
  ownProbability: number;
  ownProbabilitySource: ProbabilitySource;
  breakEvenProbability: number;
  stake: number;
  netProfit: number;
  evValue: number;
  roiPercent: number;
  edgePercent: number;
  kellyFraction: number;
  kellyRecommendations?: KellyRecommendations;
  bankroll?: number;
  rounding: RoundingMode;
  manualEdgePercent?: number;
  warnings: string[];
}

export interface ParlayResult extends SingleResult {
  legs: NormalizedLeg[];
}

export interface EvComputation {
  inputs: NormalizedInputs;
  single: SingleResult;
  parlay?: ParlayResult;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

export function parseOptionalNumber(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  return parseNumber(trimmed);
}

function parseOptionalProbability(value: string | undefined): number | null {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) {
    return null;
  }
  if (parsed < 0 || parsed > 100) {
    return null;
  }
  return parsed / 100;
}

function validateOdds(format: OddsFormat, value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  switch (format) {
    case 'decimal': {
      const parsed = parseNumber(trimmed);
      return parsed !== null && parsed > 1;
    }
    case 'american': {
      const parsed = parseNumber(trimmed);
      return parsed !== null && parsed !== 0;
    }
    case 'fraction': {
      const [num, denom] = trimmed.split('/').map((part) => parseNumber(part.trim()));
      if (num === null || denom === null) {
        return false;
      }
      return num > 0 && denom > 0;
    }
    default:
      return false;
  }
}

export { parseNumber as parsePositiveNumberCandidate, parseOptionalProbability };
