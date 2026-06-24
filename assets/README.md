# Assets

- `preview.mp4` is the primary Pi package gallery preview video.
- `preview.png` is the fallback/static preview image and README screenshot.

The package manifest uses npm-hosted asset URLs, plus an image fallback:

```json
{
  "pi": {
    "video": "https://unpkg.com/@baretread/pi-forge@0.4.1/assets/preview.mp4",
    "image": "https://unpkg.com/@baretread/pi-forge@0.4.1/assets/preview.png"
  }
}
```

Pi gallery supports PNG, JPEG, GIF, WebP, and MP4. Video takes precedence over image when both are set.
