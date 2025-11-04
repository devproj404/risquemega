/**
 * Utility functions for parsing image URLs from various formats
 */

/**
 * Extract full-size image URLs from BBCode format
 * Supports formats like:
 * [url=https://pixhost.to/show/9687/655054632_images-4.jpg][img]https://t1.pixhost.to/thumbs/9687/655054632_images-4.jpg[/img][/url]
 *
 * @param bbcode - BBCode formatted string containing image links
 * @returns Array of full-size image URLs
 */
export function parseBBCodeImages(bbcode: string): string[] {
  const urls: string[] = [];

  // Pattern 1: [img]THUMB_URL[/img]
  // For PixHost and other hosts, prefer the thumbnail URL as it contains server info
  // We'll convert thumbnails to full-size later
  const imgPattern = /\[img\](https?:\/\/[^\]]+)\[\/img\]/gi;
  let match;

  while ((match = imgPattern.exec(bbcode)) !== null) {
    const url = match[1];
    if (isImageUrl(url)) {
      urls.push(url);
    }
  }

  // Pattern 2: If no [img] tags found, extract from [url=...] tags
  if (urls.length === 0) {
    const urlPattern = /\[url=(https?:\/\/[^\]]+)\]/gi;
    while ((match = urlPattern.exec(bbcode)) !== null) {
      const url = match[1];
      if (isImageUrl(url)) {
        urls.push(url);
      }
    }
  }

  // Remove duplicates
  return [...new Set(urls)];
}

/**
 * Extract image URLs from plain text (one URL per line or space-separated)
 *
 * @param text - Plain text containing image URLs
 * @returns Array of image URLs
 */
export function parseImageUrls(text: string): string[] {
  const urls: string[] = [];

  // Match URLs (http/https)
  const urlPattern = /(https?:\/\/[^\s\n]+)/gi;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[1];
    if (isImageUrl(url)) {
      urls.push(url);
    }
  }

  // Remove duplicates
  return [...new Set(urls)];
}

/**
 * Check if a URL is likely an image URL
 *
 * @param url - URL to check
 * @returns true if URL appears to be an image
 */
function isImageUrl(url: string): boolean {
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;
  if (imageExtensions.test(url)) {
    return true;
  }

  // Check for known image hosting domains
  const imageHosts = [
    'pixhost.to',
    'imgur.com',
    'imgbox.com',
    'postimg.cc',
    'imageban.ru',
    'imagebam.com',
    'turboimagehost.com',
    'img.yt',
    'ibb.co',
    'imgbb.com',
    'imgsrc.ru',
    'radikal.ru',
  ];

  try {
    const urlObj = new URL(url);
    return imageHosts.some(host => urlObj.hostname.includes(host));
  } catch {
    return false;
  }
}

/**
 * Convert PixHost thumbnail URLs to full-size URLs
 *
 * @param url - PixHost URL (thumbnail or full)
 * @returns Full-size image URL
 */
export function convertToFullSize(url: string): string {
  // PixHost: Convert thumbs to direct image URL (images path, not show page)
  // From: https://t75.pixhost.to/thumbs/9687/655054632_images-4.jpg
  // To: https://img75.pixhost.to/images/9687/655054632_images-4.jpg
  if (url.includes('pixhost.to/thumbs')) {
    // Extract the number from t{N}.pixhost.to and use it for img{N}.pixhost.to
    const match = url.match(/https?:\/\/t(\d+)\.pixhost\.to\/thumbs/);
    if (match) {
      const serverNum = match[1];
      return url.replace(/https?:\/\/t\d+\.pixhost\.to\/thumbs/, `https://img${serverNum}.pixhost.to/images`);
    }
    // Fallback if no number found
    return url.replace(/https?:\/\/t\d+\.pixhost\.to\/thumbs/, 'https://img75.pixhost.to/images');
  }

  // PixHost: Convert show page to direct image URL
  // From: https://pixhost.to/show/9687/655054632_images-4.jpg
  // To: https://img75.pixhost.to/images/9687/655054632_images-4.jpg
  // Note: Show pages don't indicate which server, so we try a common one
  if (url.includes('pixhost.to/show')) {
    return url.replace(/https?:\/\/pixhost\.to\/show/, 'https://img75.pixhost.to/images');
  }

  // ImgBox: Convert thumbnail to original
  // From: https://thumbs2.imgbox.com/...
  // To: https://images2.imgbox.com/...
  if (url.includes('thumbs') && url.includes('imgbox.com')) {
    return url.replace(/thumbs(\d+)\.imgbox\.com/, 'images$1.imgbox.com');
  }

  return url;
}

/**
 * Smart parser that handles multiple input formats
 *
 * @param input - String containing images in any supported format
 * @returns Array of full-size image URLs
 */
export function parseImages(input: string): string[] {
  if (!input || !input.trim()) {
    return [];
  }

  let urls: string[] = [];

  // Try BBCode format first
  if (input.includes('[url=') || input.includes('[img]')) {
    urls = parseBBCodeImages(input);
  }

  // If no BBCode found or want to also parse plain URLs
  if (urls.length === 0 || !input.includes('[url=')) {
    const plainUrls = parseImageUrls(input);
    urls = [...urls, ...plainUrls];
  }

  // Convert thumbnails to full-size
  urls = urls.map(convertToFullSize);

  // Remove duplicates and empty strings
  return [...new Set(urls.filter(url => url && url.trim()))];
}
