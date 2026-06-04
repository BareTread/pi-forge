# Pi Forge

Matte graphite, molten copper, and brushed-steel visual identity for [Pi](https://pi.dev).

Pi Forge bundles a `forge` theme with a small Forge-gated atmosphere extension. It is a visual package only: no prompt templates, no custom tools, no model changes, no thinking-level changes, and no workflow changes.

![Pi Forge preview](https://raw.githubusercontent.com/BareTread/pi-forge/main/assets/preview.png)

Demo video:
https://github.com/BareTread/pi-forge/raw/refs/heads/main/assets/preview.mp4

## What You Get

- **Forge theme** — graphite shell, copper heat, wheat text, and cool steel contrast.
- **Forge header** — compact atelier-style session chrome with model, cwd, and theme context.
- **Working pulse** — diamond/spark animation that flashes white-hot at the strike: `◇ ◇ ◆ ◆ ✦ ✦ ✦ ◆ ◆ ◇ ◇`.
- **Terminal title pulse** — `⚒ ✦ ◆ ◇` while the agent works.
- **Collapsed thinking label** — `tempering…`.
- **Control command** — `/forge-atmosphere [on|off]`.

The footer is intentionally untouched so packages such as `pi-powerline-footer` can keep owning it.

## Install

From npm after publish:

```bash
pi install npm:@baretread/pi-forge
```

From GitHub:

```bash
pi install git:github.com/BareTread/pi-forge
```

From a local checkout:

```bash
pi install .
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

Pi packages can execute code, so this package keeps its extension surface deliberately narrow. Pi Forge only touches visual chrome exposed by the Pi extension API.

It does **not** include:

- prompt templates
- custom tools
- model settings
- thinking-level settings
- active-tool changes
- autocomplete changes
- footer replacement
- package overrides
- personal settings or machine paths

## Package Manifest

```json
{
  "keywords": ["pi-package", "pi-theme", "pi-extension", "forge"],
  "pi": {
    "extensions": ["./extensions"],
    "themes": ["./themes"],
    "video": "https://github.com/BareTread/pi-forge/raw/refs/heads/main/assets/preview.mp4",
    "image": "https://raw.githubusercontent.com/BareTread/pi-forge/main/assets/preview.png"
  }
}
```

Because this package includes both a theme and a visual extension, the Pi gallery lists it as `extension` + `theme`.

## Uninstall

```bash
pi remove npm:@baretread/pi-forge
```

If installed from GitHub or a local path, remove that matching package source from Pi settings.

## License

MIT © BareTread
