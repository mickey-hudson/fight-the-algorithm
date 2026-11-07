// In December, both pages swap the tab favicon and home-screen icon for the
// Santa Meat Loaf. The static <link> tags in index.html and holiday/index.html
// carry the year-round icons; this patches their hrefs at load.
const DECEMBER_ICONS = {
  icon: '/favicon-holiday.png',
  'apple-touch-icon': '/apple-touch-icon-holiday.png',
}

export function applySeasonalIcons(now = new Date()) {
  if (now.getMonth() !== 11) return
  for (const [rel, href] of Object.entries(DECEMBER_ICONS)) {
    const link = document.querySelector(`link[rel="${rel}"]`)
    if (link) link.href = href
  }
}
