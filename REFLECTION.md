# Reflection

**Name / Andrew ID:** 
Vaishnavi Palasamudrum / vpalasam

**Recitation group members (Task 2):**

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

The Wordle property "returns exactly five colors" killed none of the 5 mutants, because each of them still returns an array of length 5. It's still valid because the spec says matchGuess returns five colors, one per position, so it can never fail on a correct implementation. A bug it would catch is a version that builds the result by only appending colors for non-green positions, which would end up being less than 5 colors

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

touchingNotMerged

With the original generator, fc.tuple(fc.integer(), fc.integer()) over the full integer range, the mutant survived because two random 32-bit intervals almost never share an endpoint exactly. The properties were the same in both runs. I changed the generator to start values in -20..20 with lengths 0..5, which makes cases like [0,1] and [1,1] common.

Before:


  ✘ touchingNotMerged       SURVIVED

Mutation score: 6/7 killed (86%)

After:


  ✔ touchingNotMerged       killed  by: returns sorted intervals that neither overlap nor touch; merging a list with itself gives the same result as merging it once
      Counterexample: [[[0,1],[1,1]]]
      AssertionError: expected 1 to be less than 1

Mutation score: 7/7 killed (100%)

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

  ✔ touchingNotMerged       killed  by: returns sorted intervals that neither overlap nor touch; merging a list with itself gives the same result as merging it once
      Counterexample: [[[0,0],[0,0]]]
      AssertionError: expected 0 to be less than 0

The spec says these are closed intervals and that consecutive output intervals must satisfy result[i][1] < result[i + 1][0]. Since [0,0] and [0,0] cover the same point 0, they should merge into a single [0,0]. The mutant only merges when start < lastEnd, and since 0 < 0 is false it leaves them as two intervals, so the output breaks the invariant.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.


The `hint` module (`hint.ts`) behind our `/hint` command, specifically `count` and `parse`.

Property 1 (metamorphic), on `count`.
Inserting parts that are not hints anywhere in the session (non-text parts, text parts with no metadata, or text parts whose `hint` metadata is not a number) does not change the count.

Property 2 (conditional), on `parse`.
If the first word of the arguments is `new` or `reset` in any casing, `reset` is true and `question` is the remaining words joined by single spaces.

**Generators.** For `count`, a naive generator would pick random hint levels like `[2, 3, 2]`, which can never happen in a real session because level 1 always comes first and only `/hint new` brings it back. With no level 1 in the list, `count` falls back to `levels.length`, so the test would mostly exercise an impossible state. Instead I would build sessions by simulating real use: start at 0, and at each step either add a hint at level `next(count(parts))` or, sometimes, a reset that adds a level 1 hint. Then I would interleave random non-hint parts, including text parts whose `hint` metadata is a string like `"1"`, since that is exactly what the `typeof === "number"` check is meant to exclude. For `parse`, `fc.string()` would almost never produce `new` or `reset` as the first word, so the condition would rarely hold. I would construct the input directly: pick a reset word, randomize the case of each letter, add leading and trailing whitespace including tabs and newlines, and append a random list of words with varied whitespace between them.
