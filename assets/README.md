# Assets

- `preview.png` is the Pi package gallery preview image.
- `preview.mp4` is kept as an optional demo video in the repository/package.

The package manifest currently uses the PNG preview for maximum gallery compatibility:

```json
{
  "pi": {
    "image": "https://raw.githubusercontent.com/BareTread/pi-forge/main/assets/preview.png"
  }
}
```

Pi gallery supports PNG, JPEG, GIF, WebP, and MP4. Video takes precedence over image when both are set.
