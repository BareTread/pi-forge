# Pi Forge

Matte graphite, molten copper, and brushed-steel visual identity for [Pi](https://pi.dev).

`pi-forge` is a visual package only. It adds the `forge` theme plus a Forge-gated atmosphere extension. It does not change prompts, tools, models, thinking level, autocomplete, or workflow.

## What You Get

One temperature system — cold iron → graphite → copper → white-hot — drives every animated surface, with one rule: **strike fast, cool slow**.

- `forge` theme: graphite shell, copper heat, wheat text, cool steel contrast.
- Ignition header: the π maker's-mark heats from cold graphite to a white-hot strike on session start, then settles into its resting gradient (~1.2s, then the timer stops — zero idle cost).
- Heat line: a stepped copper hairline under the wordmark, hot at the left and cooling to the right.
- Asymmetric working ember: 4 fast frames up to white-hot, 7 slow frames cooling through copper into steel, 3 cold rest beats.
- Forging vocabulary: the working message walks a real forging sequence one stage per turn — `heating the stock…` → `drawing out…` → `upsetting…` → … → `quenching…`.
- Terminal title pulse: fixed `⚒` anchor with an animating spark — strike → ember → cool → rest.
- Collapsed thinking label: `tempering…`.
- `/forge-atmosphere [on|off]` command (`on` re-runs the ignition).

Footer is untouched so packages such as `pi-powerline-footer` can keep owning it.

## Install

From npm after publish:

```bash
pi install npm:@baretread/pi-forge
```

From GitHub:

```bash
pi install git:github.com/BareTread/pi-forge
```

From this package checkout:

```bash
pi install .
```

From another checkout that contains this folder:

```bash
pi install ./path/to/pi-forge
```

Temporary test without installing:

```bash
pi -e .
```

## Enable

Select the theme in Pi:

```text
/settings → Theme → forge
/reload
```

The atmosphere extension is intentionally dormant unless the active theme is `forge`.

## Commands

```text
/forge-atmosphere        show current state
/forge-atmosphere on     apply Forge atmosphere
/forge-atmosphere off    restore default visual chrome
```

## Safety Boundary

This package is visual-only:

- no prompt injection
- no custom tools
- no model changes
- no thinking-level changes
- no active-tool changes
- no footer replacement
- no package overrides
- no personal settings or paths

## Package Notes

Pi packages load resources from `package.json` under the `pi` key. This package exposes:

```json
{
  "pi": {
    "extensions": ["./extensions"],
    "themes": ["./themes"],
    "video": "https://unpkg.com/@baretread/pi-forge@0.4.1/assets/preview.mp4",
    "image": "https://unpkg.com/@baretread/pi-forge@0.4.1/assets/preview.png"
  }
}
```

The Pi package gallery discovers packages with the `pi-package` keyword. Video takes precedence over the static image fallback.

## Uninstall

```bash
pi remove npm:@baretread/pi-forge
```

If installed from GitHub/local path, remove that matching package source from Pi settings.
