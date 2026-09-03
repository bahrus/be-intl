# aria-live

## Bruce's Ask

Does the use of the aria-live attribute match your understanding of how it should work?

Please provide your thoughts below.

## Claude's thoughts

### What the code does

In `be-intl.js` `hydrate()`:

```js
const {enhancedElement} = self;
if(enhancedElement instanceof HTMLElement){
    enhancedElement.ariaLive = 'polite';
}
```

Every enhanced element (`<data>`, `<time>`, `<output>`, …) is turned into a polite
ARIA live region during hydration, before the value is first seeded. `ariaLive`
is the ARIA-reflection IDL property; it maps to the `aria-live="polite"` content
attribute, which is why the tests see `aria-live="polite"` in `outerHTML`. That
reflection is well-supported in current browsers — no concern there.

The *intent* is sound: when be-intl later rewrites `textContent` (value changed,
or locale/lang changed), a screen reader should be able to pick up the new
formatted string. `polite` (not `assertive`) is the right severity for that.

### Where it doesn't quite match how live regions work in practice

**1. It's unconditional, and that's a strong choice to make for the author.**
Whether an element should announce its own updates is a page-level accessibility
decision that depends on context — is this a value the user is actively watching
change, or just one of 40 timestamps in a table? A formatting library silently
converting every `<time>` on the page into a live region is surprising, and
there's no way to opt out (contrast `observeLang`, which *is* opt-in). A locale
toggle that reformats 40 `<time>` elements would queue 40 announcements.

Recommendation: make it opt-in, mirroring `observeLang` —
e.g. `be-intl-announce` / `be-intl-live="polite|assertive"` — and leave
`aria-live` untouched by default.

**2. Reformatting is a presentation change, not an information change.**
When only the locale changes, `12,345` → `12.345` carries no new information —
the underlying number is identical. Announcing the reformatted string to a
screen-reader user is arguably noise or even confusing. A live region can't
distinguish "the value changed" from "the same value is now rendered
differently"; both rewrite `textContent`. If announcements are wanted at all,
they make sense for the value-changed case, not the locale-changed case.

**3. The registration-vs-initial-render tension.**
Two well-known live-region gotchas pull in opposite directions here:

- A live region should exist and be stable *before* the mutation you want
  announced. Creating the region and mutating it within the same enhancement
  microtask burst (which is roughly what happens: set `ariaLive`, then a few
  awaits later seed `textContent`) is exactly the pattern many screen readers
  fail to announce.
- You generally do **not** want the *initial* render announced — the element
  showing its formatted value for the first time is just content appearing,
  like any static text. The current order (set `aria-live`, then seed the first
  value) risks the first formatted value being spoken on load for every enhanced
  element.

In practice today it probably "works" only because the registration race
usually suppresses that initial announcement anyway — i.e. it's relying on a
bug to cancel a bug. If you want reliable *update* announcements without an
*initial* one, seed the first value first and set `aria-live` afterward, for
subsequent updates only. (Enhancement code can't fully win here since it runs
after parse; an author who needs bulletproof announcements is better off owning
the live region themselves.)

**4. `aria-atomic` is left at its default (`false`).**
For a wholesale `textContent` replacement of a short number that's usually fine.
For `<time>` output like "Friday, November 18, 2011", a non-atomic region can
produce partial/odd announcements when only some words change. If the region is
kept, `aria-atomic="true"` makes the whole formatted string announce as one
unit and is more predictable.

**5. `<output>` is already a live region.**
`<output>` has an implicit role of `status` and implicit `aria-live="polite"`.
Setting it explicitly is redundant (harmless, but worth skipping).

### Bottom line

The direction is reasonable and `polite` is the correct choice, but applying it
unconditionally to every enhanced element — including for locale-only reformats,
and set in the same burst as the first content write — is broader and blunter
than how live regions are meant to be used. I'd make it opt-in, restrict it to
genuine value changes if possible, add `aria-atomic="true"` when it is on, and
not set it on `<output>`.

## Bruce's Response

Ok, please make your recommended changes and update README.md to explain this, and add your implementation notes below.

## Implementation notes (Claude)

### Behavior change

Live-region behavior is now **opt-in**. `hydrate()` no longer sets
`enhancedElement.ariaLive = 'polite'`. Instead:

- New boolean attribute **`be-intl-announce`** (`🌐-announce`), declared in
  `emc.mjs` alongside `observeLang`:
  ```js
  announce: '${base}-announce',
  _announce: { instanceOf: 'Boolean' },
  ```
- New prop **`rendered`**, flipped to `true` by `formatNumber` / `formatDate`
  the first time they actually write a value:
  ```js
  enhancedElement.textContent = intlNumberFormat.format(value);
  if(!self.rendered) return {rendered: true};
  ```
- New action **`armLiveRegion`**, gated so it runs exactly once, after that
  first render, and only when opted in:
  ```js
  armLiveRegion: {
      ifAllOf: ['announce', 'rendered'],
      ifKeyIn: ['rendered'],
  }
  ```
  ```js
  armLiveRegion(self){
      const {enhancedElement} = self;
      if(!(enhancedElement instanceof HTMLElement)) return;
      enhancedElement.setAttribute('aria-atomic', 'true');
      if(enhancedElement.localName !== 'output'){
          enhancedElement.setAttribute('aria-live', 'polite');
      }
  }
  ```

### How each point from the review was addressed

| Concern | Resolution |
| --- | --- |
| Unconditional | Opt-in via `be-intl-announce`; default touches no ARIA. |
| Registration-vs-initial-render race | Region is armed by a *separate* action that fires off the `rendered` flag, i.e. strictly after the first `textContent` write — the initial value mutates the DOM before the region exists, so it isn't announced; every later re-format mutates an already-registered region. |
| `aria-atomic` left at default | `armLiveRegion` sets `aria-atomic="true"`. |
| `<output>` already a live region | `armLiveRegion` skips `aria-live` for `<output>` (still sets `aria-atomic`). |
| Presentation-only changes still announced | Not fully solved — `formatNumber`/`formatDate` run for both value and locale changes and the code can't currently tell them apart, so a locale switch on an opted-in element is still announced. Documented as a known limitation; opting in is now a deliberate choice, and a locale toggle is a rarer, user-initiated event. A future refinement could pass the `changedProperty` through and suppress the announce when only `locale` changed. |
| `assertive` | Deliberately not exposed — `be-intl-announce` is boolean, always polite. |

### Reactive-graph safety

`rendered` is monitored only by `armLiveRegion`; it is **not** in
`formatNumber` / `formatDate`'s `ifKeyIn`, so setting it does not re-enter the
format actions (no loop). `formatNumber` returns `{rendered: true}` only while
`!self.rendered`, so `armLiveRegion` fires once per element.

### Docs / types

- `README.md` — new "Announcing updates to assistive technology" section.
- `types/be-intl/types.d.ts` (the `bahrus/types` submodule) — added `announce`
  to `EndUserProps`, `rendered` to `AllProps`, `armLiveRegion` to `Actions`, and
  widened `formatNumber`/`formatDate` returns to `PAP | void`. **Needs its own
  commit in the `types` repo.**
- `tests/test1.html` / `tests/test1.spec.mjs` — added a `<data be-intl
  be-intl-announce value="500">` case asserting `aria-live="polite"` +
  `aria-atomic="true"` appear after render, plus a negative assertion that a
  plain `be-intl` element gets no `aria-live`.
- `emc.json` / `🌐.json` regenerated via `npm run build`.

