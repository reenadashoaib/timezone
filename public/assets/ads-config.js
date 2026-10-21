/*
  Ad settings. This is the only file you need to edit to turn ads on.

  1. client: your AdSense publisher ID, like 'ca-pub-1234567890123456'.
  2. slots: for each ad space, the ad unit ID (data-ad-slot) from
     AdSense > Ads > By ad unit. Leave a space empty to keep it unfilled.
  3. custom: paste your own HTML for any space you sell directly to an
     advertiser. Custom HTML wins over AdSense for that space.
  4. showPlaceholders: true shows labelled boxes for empty spaces, so you can
     see the layout. Set it to false before going live so empty spaces collapse.
*/
window.TZC_ADS = {
  client: '',

  showPlaceholders: true,

  slots: {
    'top-banner': '',
    'rail-left': '',
    'rail-right': '',
    'tile-1': '',
    'tile-2': '',
    'tile-3': '',
    'tile-4': '',
    'tile-5': '',
    'tile-6': '',
    'bottom-banner': '',
    'video': '',
    'interstitial': '',
  },

  custom: {
    // 'tile-1': '<a href="https://advertiser.example" rel="sponsored noopener" target="_blank"><img src="/ads/tile-1.jpg" width="300" height="250" alt="Advertiser name"></a>',
    // 'video': '<script src="https://your-video-ad-network.example/player.js" async></script>',
  },

  // Floating player in the bottom-right corner.
  video: {
    enabled: true,
    delaySeconds: 4,
  },

  // Full-screen ad that covers the page until the visitor closes it.
  interstitial: {
    enabled: true,
    delaySeconds: 8,        // seconds on the page before it appears
    closeAfterSeconds: 5,   // seconds before the Close button works
    frequencyHours: 0,      // 0 = once per visit; 24 = at most once a day
  },
};
