# +EV-beräknare

Detta verktyg räknar ut implied probability, edge, ROI, Kelly-fraktion och förväntat värde för ett spel eller en kombination (parlay). Alla beräkningar sker i realtid när användaren ändrar formuläret.

## Formler
- **Implied probability**: \( p_\text{implied} = 1 / \text{decimalodds} \)
- **Break-even probability**: \( p_\text{break-even} = 1 / \text{decimalodds} \)
- **Förväntat värde (EV)**: \( EV = p_\text{egen} \cdot (\text{odds} - 1) \cdot \text{insats} - (1 - p_\text{egen}) \cdot \text{insats} \)
- **ROI**: \( ROI = (\text{odds} \cdot p_\text{egen} - 1) \cdot 100 \)
- **Edge**: \( Edge = (p_\text{egen} - p_\text{implied}) \cdot 100 \)
- **Kelly-fraktion**: \( f^* = ((\text{odds} - 1) \cdot p_\text{egen} - (1 - p_\text{egen})) / (\text{odds} - 1) \)

## Exempel
Ett spel med decimalodds 2.00, egen sannolikhet 55 % och insats 100 kr ger:
- Implied probability: 50 %
- EV: 10 kr
- ROI: 10 %
- Kelly-fraktion: 10 % (full Kelly)

## Tester
Enhetstester finns i `tests/ev/ev.spec.ts` och täcker konverteringar mellan oddsformat, EV/ROI-beräkningar samt Kelly för både singelspel och parlay.
