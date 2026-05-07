# Assets

Add public gallery preview here before release:

- `preview.png` for static Pi package gallery preview, or
- `demo.mp4` for hover video preview.

Then add one public URL to `package.json`:

```json
{
  "pi": {
    "image": "https://raw.githubusercontent.com/BareTread/pi-forge/main/assets/preview.png"
  }
}
```

Pi gallery supports PNG, JPEG, GIF, WebP, and MP4. Video takes precedence over image.
