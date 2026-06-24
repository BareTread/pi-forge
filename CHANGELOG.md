# Changelog

## 0.4.1

- Replace the package gallery demo with the new npm-hosted MP4 preview and generated PNG fallback.
- Point `pi.video` and `pi.image` at versioned npm asset URLs so the Pi package catalog can load the same assets published with the package.

## 0.4.0

- **Unify all motion under one temperature system**: a single 7-step ramp (cold iron → graphite → deep copper → dim → core → hot → white-hot) now drives every animated surface, so the header, working ember, and title pulse read as one material responding to one fire.
- **Ignition header**: on session start the π maker's-mark heats from cold graphite up through copper, overshoots to a white-hot strike, and settles into its resting gradient — a ~1.2s overshoot-and-settle sequence whose timer stops permanently afterwards (zero idle cost). The resting glyph now carries a real heat treatment: white-hot eyes, a crown gradient hottest at the center where the hammer lands, and legs cooling toward the feet.
- **Heat line**: a new stepped copper hairline under the wordmark — hot at the left, cooling to the right — that participates in the ignition and gives the header its letterhead structure.
- **Asymmetric working ember**: the working indicator is rebuilt around strike physics — 4 fast frames up to a white-hot peak, 7 slow frames cooling through copper into steel, 3 cold rest beats (14 frames @ 90ms). A strike is sudden; cooling is not.
- **Forging vocabulary**: the working message now walks a real forging sequence one stage per turn — heating the stock… → drawing out… → upsetting… → punching… → shaping… → planishing… → annealing… → quenching… (`tempering…` stays reserved for collapsed thinking).
- **Width safety**: header lines are now ANSI-aware clipped to the terminal width, so ultra-narrow terminals never overflow the component contract.
- Theme: warm the last neutral gray (`bgPending` #151515 → #171513) so every dark surface leans graphite-warm, and move `mdHr` from near-invisible `border` to `copperDeep` so markdown rules read as faint warm hairlines that echo the heat line.
- Visual-only refinements; no prompts, tools, model, thinking, or workflow changes.

## 0.3.0

- Give types their own hue: `syntaxType` moves off the copper trio to a new `typePatina` (#8bb89a) — oxidized-copper green, kept distinct from the diff-added/success `oxide` so types finally separate from copper keywords and functions.
- Lift the genuinely-faint tiers for legibility: `steelDim` (#475867 → #5a6e80) so footer `think:off` and quote borders are readable, and `dim` (#5e5a53 → #706b62) so header labels and minimal-thinking text are no longer near-invisible.
- Punch up the working pulse: the ember now flashes white-hot at the strike — an 11-frame ramp with a new `copperWhite` peak (`◇ ◇ ◆ ◆ ✦ ✦ ✦ ◆ ◆ ◇ ◇`) — instead of topping out at the same copper twice.
- Rebuild the terminal-title pulse around a fixed `⚒` anchor: instead of the hammer rotating in and out among the spark glyphs (which read as a random flicker), the hammer now stays put and only the spark beside it animates — strike → ember → cool → a held rest beat — at a slower, deliberate 300ms cadence.
- Visual-only refinements; no prompts, tools, model, thinking, or workflow changes.

## 0.2.0

- Rebalance the syntax hierarchy so molten copper leads: calm the over-bright cool strings (steelBright → steel) and lift the faintest tokens for legibility — punctuation, link URLs, and diff context now share a new `dimText` tier, and comments move to a readable aged-bronze `commentText`.
- Smooth and unify the forge-breathing motion: the working pulse becomes a 10-frame symmetric ember ramp (`◇ ◇ ◆ ◆ ✦ ✦ ◆ ◆ ◇ ◇`), and the terminal-title pulse shares its glyph set (`⚒ ✦ ◆ ◇`, strike → spark → ember → cool) at a calmer cadence.
- Visual-only refinements; no prompts, tools, model, thinking, or workflow changes.

## 0.1.1

- Use a GitHub raw MP4 URL as the primary Pi gallery preview, matching other video-preview Pi packages.
- Add a PNG fallback/static preview image for README and gallery compatibility.

## 0.1.0

- Add `forge` Pi theme.
- Add Forge-gated visual atmosphere extension.
- Add custom header, diamond/spark working pulse, title pulse, and `tempering…` collapsed-thinking label.
- Add `/forge-atmosphere [on|off]` command.
- Add MP4 gallery preview metadata.
- Keep footer, prompts, tools, model settings, and workflow untouched.
