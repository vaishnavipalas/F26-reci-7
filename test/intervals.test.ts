import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

const interval: fc.Arbitrary<Interval> = fc.tuple(fc.integer({ min: -20, max: 20 }), fc.nat(5))
                                          .map(([start, len]) => [start, start + len]);

const intervalList = fc.array(interval, { maxLength: 10 });

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. The output is sorted by start and consecutive intervals neither overlap nor touch.
  it('returns sorted intervals that neither overlap nor touch', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i + 1 < out.length; i++) {
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }
      }),
    );
  });

  // Pattern: invariant. The input array and the intervals in it are not modified.
  it('does not modify its input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = structuredClone(xs);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });

  // Pattern: algebraic. Merging is idempotent: merging an already-merged list changes nothing.
  it('is idempotent', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: metamorphic. Duplicating every interval in the input does not change the output.
  it('merging a list with itself gives the same result as merging it once', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals([...xs, ...xs])).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: differential. A real point p is covered by the output exactly when it is covered by the input.
  it('covers exactly the same points as the input', () => {
    const covered = (ivs: readonly Interval[], p: number) => ivs.some(([a, b]) => a <= p && p <= b);
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        // 0.5 so non-integer gap points are checked.
        for (let p = -21; p <= 26; p += 0.5) {
          expect(covered(out, p)).toBe(covered(xs, p));
        }
      }),
    );
  });

  // Pattern: conditional. If the input is already sorted and disjoint (no overlaps, no touching), the output equals the input.
  it('returns already-disjoint input unchanged', () => {
    const disjoint = fc.tuple(fc.integer({ min: -10, max: 10 }), fc.array(fc.tuple(fc.integer({ min: 1, max: 3 }), fc.nat(3)), { maxLength: 6 }))
      .map(([first, steps]) => {
        let pos = first;
        return steps.map(([gap, len]): Interval => {
          const iv: Interval = [pos + gap, pos + gap + len];
          pos = iv[1];
          return iv;
        });
      });
    fc.assert(
      fc.property(disjoint, ivs => {
        expect(mergeIntervals(ivs)).toEqual(ivs);
      }),
    );
  });
});
