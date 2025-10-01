'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

import { calculateEv } from '../_lib/ev';
import { EvComputation, EvFormValues, evFormSchema } from '../_lib/types';

const defaultValues: EvFormValues = {
  oddsFormat: 'decimal',
  oddsValue: '2.00',
  ownProbability: '55',
  stake: '100',
  bankroll: '',
  edgeMode: 'auto',
  manualEdge: '',
  rounding: 'two',
  parlayEnabled: false,
  parlayLegs: [
    { id: 'ben-1', oddsFormat: 'decimal', oddsValue: '2.00', ownProbability: '55' },
    { id: 'ben-2', oddsFormat: 'decimal', oddsValue: '1.80', ownProbability: '60' },
  ],
};

interface EvFormProps {
  onChange: (result: EvComputation | null) => void;
}

export function EvForm({ onChange }: EvFormProps) {
  const form = useForm<EvFormValues>({
    resolver: zodResolver(evFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, register, watch, reset, handleSubmit, formState } = form;

  const parlayFieldArray = useFieldArray({
    control,
    name: 'parlayLegs',
  });

  React.useEffect(() => {
    onChange(calculateEv(defaultValues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const subscription = watch((values, { type }) => {
      if (type === 'change' || type === 'blur') {
        const parsed = evFormSchema.safeParse(values as EvFormValues);
        if (parsed.success) {
          try {
            const computation = calculateEv(parsed.data);
            onChange(computation);
          } catch (error) {
            console.error(error);
            onChange(null);
          }
        } else {
          onChange(null);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [onChange, watch]);

  const onSubmit = React.useCallback(
    (values: EvFormValues) => {
      const parsed = evFormSchema.safeParse(values);
      if (!parsed.success) {
        onChange(null);
        return;
      }
      const computation = calculateEv(parsed.data);
      onChange(computation);
    },
    [onChange]
  );

  const handleReset = React.useCallback(() => {
    reset(defaultValues);
    onChange(calculateEv(defaultValues));
  }, [onChange, reset]);

  const showManualEdge = watch('edgeMode') === 'manual';
  const parlayEnabled = watch('parlayEnabled');

  const addParlayLeg = React.useCallback(() => {
    parlayFieldArray.append({
      id: `ben-${parlayFieldArray.fields.length + 1}`,
      oddsFormat: 'decimal',
      oddsValue: '2.00',
      ownProbability: '',
    });
  }, [parlayFieldArray]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-card"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Oddsformat" htmlFor="oddsFormat" error={formState.errors.oddsValue?.message}>
          <Select id="oddsFormat" {...register('oddsFormat')}>
            <option value="decimal">Decimal (EU)</option>
            <option value="american">Amerikanska (+/-)</option>
            <option value="fraction">Fraktion (t.ex. 5/2)</option>
          </Select>
        </FormField>
        <FormField label="Odds" htmlFor="oddsValue" error={formState.errors.oddsValue?.message}>
          <Input id="oddsValue" inputMode="decimal" {...register('oddsValue')} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Egen sannolikhet %"
          htmlFor="ownProbability"
          description="Valfritt – lämna tomt för implied probability"
          error={formState.errors.ownProbability?.message}
        >
          <Input id="ownProbability" inputMode="decimal" {...register('ownProbability')} />
        </FormField>
        <FormField label="Insats" htmlFor="stake" error={formState.errors.stake?.message}>
          <Input id="stake" inputMode="decimal" {...register('stake')} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Bankrulle" htmlFor="bankroll" error={formState.errors.bankroll?.message}>
          <Input id="bankroll" inputMode="decimal" placeholder="Valfritt" {...register('bankroll')} />
        </FormField>
        <FormField label="Avrundning" htmlFor="rounding">
          <Select id="rounding" {...register('rounding')}>
            <option value="none">Ingen</option>
            <option value="two">2 decimaler</option>
            <option value="krona">Närmaste krona</option>
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Edge-läge" htmlFor="edgeMode">
          <Select id="edgeMode" {...register('edgeMode')}>
            <option value="auto">Auto (egen sannolikhet vs implied)</option>
            <option value="manual">Manuell edge %</option>
          </Select>
        </FormField>
        {showManualEdge ? (
          <FormField
            label="Min edge %"
            htmlFor="manualEdge"
            error={formState.errors.manualEdge?.message}
          >
            <Input id="manualEdge" inputMode="decimal" {...register('manualEdge')} />
          </FormField>
        ) : null}
      </div>

      <div className="space-y-3 rounded-lg border border-slate-800/70 bg-slate-950/40 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            {...register('parlayEnabled')}
          />
          Aktivera parlay (flera ben)
        </label>
        {parlayEnabled ? (
          <div className="space-y-4">
            {parlayFieldArray.fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-3 rounded-md border border-slate-800/70 bg-slate-900/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-200">Ben {index + 1}</p>
                  {parlayFieldArray.fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-slate-300 hover:text-red-200"
                      onClick={() => parlayFieldArray.remove(index)}
                    >
                      Ta bort
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <FormField
                    label="Format"
                    htmlFor={`parlay-leg-${field.id}-format`}
                    error={formState.errors.parlayLegs?.[index]?.oddsValue?.message}
                  >
                    <Select
                      id={`parlay-leg-${field.id}-format`}
                      {...register(`parlayLegs.${index}.oddsFormat` as const)}
                    >
                      <option value="decimal">Decimal</option>
                      <option value="american">Amerikanska</option>
                      <option value="fraction">Fraktion</option>
                    </Select>
                  </FormField>
                  <FormField
                    label="Odds"
                    htmlFor={`parlay-leg-${field.id}-odds`}
                    error={formState.errors.parlayLegs?.[index]?.oddsValue?.message}
                  >
                    <Input
                      id={`parlay-leg-${field.id}-odds`}
                      inputMode="decimal"
                      {...register(`parlayLegs.${index}.oddsValue` as const)}
                    />
                  </FormField>
                  <FormField
                    label="Egen sannolikhet %"
                    htmlFor={`parlay-leg-${field.id}-prob`}
                    error={formState.errors.parlayLegs?.[index]?.ownProbability?.message}
                  >
                    <Input
                      id={`parlay-leg-${field.id}-prob`}
                      inputMode="decimal"
                      placeholder="Tom = implied"
                      {...register(`parlayLegs.${index}.ownProbability` as const)}
                    />
                  </FormField>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={addParlayLeg}>
                Lägg till ben
              </Button>
              {parlayFieldArray.fields.length > 0 ? (
                <Alert variant="info" className="text-xs">
                  Tips: egen sannolikhet lämnas tom för att använda implied probability per ben.
                </Alert>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {formState.errors.root ? (
        <Alert variant="destructive">{formState.errors.root.message}</Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Beräkna</Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Rensa
        </Button>
        <p className="text-xs text-slate-400">
          Formuläret uppdaterar resultaten automatiskt när du ändrar något.
        </p>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
  description?: string;
}

function FormField({ label, htmlFor, children, error, description }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {description ? <p className="text-xs text-slate-400">{description}</p> : null}
      {children}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
