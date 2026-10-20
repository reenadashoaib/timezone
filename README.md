# Time Zone Converter

A static time zone converter with built-in ad spaces. Plain HTML, CSS and JavaScript: no build step, no framework.

The website lives in `public/`. Everything outside it (this README, `.claude/`) is not part of the site.

## Run it locally

```bash
cd public
python3 -m http.server 8000
```

Open http://localhost:8000. To see the full-screen ad straight away, open http://localhost:8000/?preview=interstitial.

## Deploy to Cloudflare

**Cloudflare Pages, connected to GitHub (recommended)**

1. In the Cloudflare dashboard, go to Workers & Pages, choose Create, then Pages, then Connect to Git.
2. Pick this repository and branch.
3. Framework preset: None. Build command: leave empty. Build output directory: `public`.
4. Save and deploy. Every push to the branch redeploys.
5. Add your domain under the project's Custom domains tab.

**Direct upload with Wrangler**

```bash
npx wrangler pages deploy public --project-name=time-zone-converter
```

`public/_headers` sets security and cache headers, and `public/404.html` is served for unknown pages.

## Before applying for AdSense

- [ ] Replace `your-domain.com` in `public/robots.txt` and `public/sitemap.xml`, and uncomment the canonical link in `public/index.html`.
- [ ] Replace `hello@example.com` in `public/about.html` with your real contact address.
- [ ] In `public/assets/ads-config.js`, set `showPlaceholders: false` so empty spaces collapse instead of showing grey boxes.
- [ ] Paste the AdSense verification snippet into the `<head>` of `public/index.html`.
- [ ] Once approved, put your publisher ID in `public/ads.txt` and `client` in `ads-config.js`.
- [ ] Visitors in the EEA, UK and Switzerland need a Google-certified consent banner. Turn on Google's own one under AdSense > Privacy & messaging.

## Ad spaces

All ad settings are in `public/assets/ads-config.js`. Each space has a key:

| Key | Where | Size |
| --- | --- | --- |
| `top-banner` | Above the header | 728 × 90, responsive on phones |
| `rail-left`, `rail-right` | Sticky side columns, screens 1360 px and wider | 160 × 600 |
| `tile-1` to `tile-3` | Row under the converter | 300 × 250 |
| `tile-4` to `tile-6` | Row under popular conversions | 300 × 250 |
| `bottom-banner` | Above the footer | 728 × 90, responsive |
| `video` | Floating box, bottom-right, closable | 16:9 player, 320 px wide (176 px on phones) |
| `interstitial` | Full-screen overlay, once per visitor per day | Fills the screen |

For each space you can:

- **Use AdSense**: create a display ad unit in AdSense and put its slot ID in `slots`.
- **Sell it directly**: put the advertiser's HTML (image link or ad tag) in `custom`. This overrides AdSense for that space.
- **Leave it empty**: it collapses when `showPlaceholders` is `false`.

The video box and full-screen ad have their own timing settings (`delaySeconds`, `closeAfterSeconds`, `frequencyHours`).

### Two AdSense rules to know

- **Full-screen ad.** AdSense does not allow its ads inside a pop-up or overlay the site builds itself. For the full-screen slot, either sell it directly through `custom`, or leave it empty and turn on AdSense Auto ads with **vignette ads**, which is Google's own full-screen format. If you put an AdSense slot ID there, the account can be flagged.
- **Video ad.** Standard AdSense display units do not play video. Fill the `video` space through `custom` with a video ad network's player tag (or Google Ad Manager), or use it for a directly sold video.

## Files

```
public/
  index.html          Converter page with all ad spaces
  about.html          About and contact (AdSense expects one)
  privacy.html        Privacy policy, including the required AdSense cookie text
  404.html
  ads.txt             Authorised sellers file for AdSense
  robots.txt, sitemap.xml, favicon.svg, _headers
  assets/
    styles.css        Design tokens and layout
    app.js            Converter logic
    ads-config.js     Your ad settings
    ads.js            Fills the ad spaces from the config
```
