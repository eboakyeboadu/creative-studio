const logoSvg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 400">
  <text x="50" y="180" font-family="Arial, sans-serif" font-weight="900" font-size="200" font-style="italic" letter-spacing="-8" fill="${color}">CREATIVE</text>
  <text x="60" y="340" font-family="Arial, sans-serif" font-weight="900" font-size="160" letter-spacing="-5" fill="${color}">STUDIO</text>
</svg>`;

const iconSvg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text x="50" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="80" font-style="italic" fill="${color}" text-anchor="middle">C</text>
</svg>`;

export const STUDIO_LOGO_WHITE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg('#FFFFFF'))}`;
export const STUDIO_LOGO_RED = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg('#FF0000'))}`;
export const STUDIO_ICON_RED = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg('#FF0000'))}`;
