# Changelog

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
