# Pi Forge

Matte graphite, molten copper, and brushed-steel visual identity for [Pi](https://pi.dev).

`pi-forge` is a visual package only. It adds the `forge` theme plus a Forge-gated atmosphere extension. It does not change prompts, tools, models, thinking level, autocomplete, or workflow.

## What You Get

- `forge` theme: graphite shell, copper heat, wheat text, cool steel contrast.
- Forge header: compact atelier-style session chrome.
- Working pulse: `◇ ◇ ◆ ✦ ✦ ◆ ◇ ◇`.
- Terminal title pulse: `⚒ ◆ ⚒ ◇` while the agent works.
- Collapsed thinking label: `tempering…`.
- `/forge-atmosphere [on|off]` command.

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
    "video": "https://raw.githubusercontent.com/BareTread/pi-forge/main/assets/preview.mp4"
  }
}
```

The Pi package gallery discovers packages with the `pi-package` keyword. Because this package includes both a theme and a visual extension, the gallery lists it as `extension` + `theme`.

## Uninstall

```bash
pi remove npm:@baretread/pi-forge
```

If installed from GitHub/local path, remove that matching package source from Pi settings.
