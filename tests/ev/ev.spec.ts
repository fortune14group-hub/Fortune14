import { describe, expect, it } from 'vitest';

import { calculateEv, evCurrency, kellyFraction, roiPercent } from '../../app/(app)/verktyg/ev/_lib/ev';
import { toAmerican, toDecimal, toFraction, impliedFromDecimal } from '../../app/(app)/verktyg/ev/_lib/odds';
import { EvFormValues } from '../../app/(app)/verktyg/ev/_lib/types';

function formValues(overrides: Partial<EvFormValues> = {}): EvFormValues {
  return {
    oddsFormat: 'decimal',
    oddsValue: '2.00',
    ownProbability: '55',
    stake: '100',
    bankroll: '',
    edgeMode: 'auto',
    manualEdge: '',
    rounding: 'none',
    parlayEnabled: false,
    parlayLegs: [],
    ...overrides,
  };
}

describe('odds-konvertering', () => {
  it('konverterar amerikanska odds till decimal', () => {
    expect(toDecimal('american', '+150')).toBeCloseTo(2.5, 3);
    expect(toDecimal('american', '-200')).toBeCloseTo(1.5, 3);
  });

  it('konverterar fraktionella odds till decimal', () => {
    expect(toDecimal('fraction', '5/2')).toBeCloseTo(3.5, 3);
  });

  it('ger implied probability från decimalodds', () => {
    expect(impliedFromDecimal(2)).toBeCloseTo(0.5, 4);
  });

  it('konverterar decimal till amerikanska och fraktion', () => {
    const decimal = 1.91;
    const american = toAmerican(decimal);
    const fraction = toFraction(decimal);
    expect(american.startsWith('-')).toBe(true);
    expect(fraction).toContain('/');
  });
});

describe('EV-beräkningar', () => {
  it('uppfyller acceptanskriterium 1 (decimal)', () => {
    const result = calculateEv(formValues());
    const single = result.single;
    expect(single.impliedProbability).toBeCloseTo(0.5, 4);
    expect(single.breakEvenProbability).toBeCloseTo(0.5, 4);
    expect(single.evValue).toBeCloseTo(10, 4);
    expect(single.roiPercent).toBeCloseTo(10, 4);
    expect(single.kellyFraction).toBeCloseTo(0.1, 3);
  });

  it('uppfyller acceptanskriterium 2 (amerikanska odds)', () => {
    const result = calculateEv(
      formValues({ oddsFormat: 'american', oddsValue: '+150', ownProbability: '45' })
    );
    const single = result.single;
    expect(single.decimalOdds).toBeCloseTo(2.5, 3);
    expect(single.impliedProbability).toBeCloseTo(0.4, 4);
    expect(single.evValue).toBeCloseTo(12.5, 2);
    expect(single.roiPercent).toBeCloseTo(12.5, 2);
    expect(single.kellyFraction).toBeCloseTo(0.0667, 3);
  });

  it('uppfyller acceptanskriterium 3 (fraktion)', () => {
    const result = calculateEv(
      formValues({ oddsFormat: 'fraction', oddsValue: '5/2', ownProbability: '33', stake: '200' })
    );
    const single = result.single;
    expect(single.decimalOdds).toBeCloseTo(3.5, 3);
    expect(single.impliedProbability).toBeCloseTo(2 / 7, 3);
    expect(single.evValue).toBeCloseTo(-5, 1);
    expect(single.kellyFraction).toBeCloseTo(0.032, 3);
  });

  it('visar negativ Kelly', () => {
    const result = calculateEv(
      formValues({ oddsFormat: 'decimal', oddsValue: '2.20', ownProbability: '40', stake: '100', bankroll: '1000' })
    );
    const single = result.single;
    expect(single.kellyFraction).toBe(0);
    expect(single.warnings.some((msg) => msg.includes('negativ'))).toBe(true);
  });

  it('uppfyller acceptanskriterium 5 (parlay)', () => {
    const result = calculateEv(
      formValues({
        parlayEnabled: true,
        parlayLegs: [
          { id: 'leg-1', oddsFormat: 'decimal', oddsValue: '2.00', ownProbability: '55' },
          { id: 'leg-2', oddsFormat: 'decimal', oddsValue: '1.80', ownProbability: '60' },
        ],
      })
    );
    const parlay = result.parlay!;
    expect(parlay.decimalOdds).toBeCloseTo(3.6, 2);
    expect(parlay.ownProbability).toBeCloseTo(0.33, 2);
    expect(parlay.breakEvenProbability).toBeCloseTo(1 / 3.6, 3);
    expect(parlay.roiPercent).toBeCloseTo(18.8, 1);
  });

  it('hanterar manuell edge', () => {
    const result = calculateEv(
      formValues({
        edgeMode: 'manual',
        manualEdge: '5',
        ownProbability: '',
        oddsValue: '2.00',
      })
    );
    const single = result.single;
    expect(single.edgePercent).toBeCloseTo(5, 4);
    expect(single.ownProbability).toBeCloseTo(0.55, 4);
  });

  it('räknar fram EV/ROI/Kelly direkt', () => {
    const odds = 2.5;
    const probability = 0.45;
    const stake = 100;
    expect(roiPercent(odds, probability)).toBeCloseTo(12.5, 3);
    expect(evCurrency(odds, probability, stake)).toBeCloseTo(12.5, 3);
    expect(kellyFraction(odds, probability)).toBeCloseTo(0.0667, 3);
  });
});
