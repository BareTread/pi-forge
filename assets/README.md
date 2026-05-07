# Assets

`preview.mp4` is the Pi package gallery preview video.

The package manifest points Pi at the raw GitHub URL:

```json
{
  "pi": {
    "video": "https://raw.githubusercontent.com/BareTread/pi-forge/main/assets/preview.mp4"
  }
}
```

Pi gallery supports PNG, JPEG, GIF, WebP, and MP4. Video takes precedence over image when both are set.
