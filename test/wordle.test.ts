import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABC';

// Step 1: a generator for five-letter uppercase words.
const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
const word = wordFrom(ALPHABET);

describe('matchGuess', () => {
  // pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });
  // pattern: invariant. The result only uses the colors G, Y, B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });

  // Pattern: conditional. If the guess equals the secret, every color is green.
  it('guessing the secret gives all greens', () => {
    const secretAndMatchingGuess = word.map(w => [w, w] as const);
    fc.assert(
      fc.property(secretAndMatchingGuess, ([secret, guess]) => {
        expect(matchGuess(secret, guess)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: invariant. Each letter is credited exactly min(count in guess, count in secret) times.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
          const inGuess = [...guess].filter(c => c === letter).length;
          const inSecret = [...secret].filter(c => c === letter).length;
          expect(credited).toBe(Math.min(inGuess, inSecret));
        }
      }),
    );
  });

  // Pattern: metamorphic. Consistently renaming letters in both words leaves the result unchanged.
  it('renaming letters consistently does not change the result', () => {
    fc.assert(
      fc.property(
        word,
        word,
        fc.shuffledSubarray([...ALPHABET], { minLength: ALPHABET.length, maxLength: ALPHABET.length }),
        (secret, guess, targets) => {
          const rename = (w: string) => [...w].map(c => targets[ALPHABET.indexOf(c)]).join('');
          expect(matchGuess(rename(secret), rename(guess))).toEqual(matchGuess(secret, guess));
        },
      ),
    );
  });
});
