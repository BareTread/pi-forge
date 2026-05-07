# Assets

- `preview.mp4` is the primary Pi package gallery preview video.
- `preview.png` is the fallback/static preview image and README screenshot.

The package manifest uses the same GitHub raw video URL style as other video-preview Pi packages, plus an image fallback:

```json
{
  "pi": {
    "video": "https://github.com/BareTread/pi-forge/raw/refs/heads/main/assets/preview.mp4",
    "image": "https://raw.githubusercontent.com/BareTread/pi-forge/main/assets/preview.png"
  }
}
```

Pi gallery supports PNG, JPEG, GIF, WebP, and MP4. Video takes precedence over image when both are set.
