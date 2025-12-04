/**
 * Smart URL Converter for Pipe Forge
 * 
 * Automatically converts user-friendly URLs to API-friendly URLs
 * Example: https://medium.com/@user → https://medium.com/feed/@user (RSS)
 */

export interface UrlConversion {
  source: string;
  originalUrl: string;
  convertedUrl: string;
  fetchType: 'json' | 'rss';
  hint: string;
  wasConverted: boolean;
}

interface UrlPattern {
  source: string;
  pattern: RegExp;
  convert: (match: RegExpMatchArray, originalUrl: string) => string;
  fetchType: 'json' | 'rss';
  hint: string;
}

const URL_PATTERNS: UrlPattern[] = [
  // Medium - convert to RSS feed
  {
    source: 'Medium',
    pattern: /^https?:\/\/(www\.)?medium\.com\/@([^\/\?#]+)/i,
    convert: (m) => `https://medium.com/feed/@${m[2]}`,
    fetchType: 'rss',
    hint: '✨ Detected Medium profile - using RSS feed',
  },
  // Reddit - add .json suffix
  {
    source: 'Reddit',
    pattern: /^https?:\/\/(www\.|old\.)?reddit\.com\/(r\/[^\/\?#]+)/i,
    convert: (m, url) => {
      // Remove trailing slash and add .json
      const cleanUrl = url.replace(/\/?(\?.*)?$/, '');
      return cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}.json`;
    },
    fetchType: 'json',
    hint: '✨ Detected Reddit - using JSON API',
  },
  // Reddit post/comments
  {
    source: 'Reddit Post',
    pattern: /^https?:\/\/(www\.|old\.)?reddit\.com\/r\/[^\/]+\/comments\/[^\/]+/i,
    convert: (_, url) => {
      const cleanUrl = url.replace(/\/?(\?.*)?$/, '');
      return cleanUrl.endsWith('.json') ? cleanUrl : `${cleanUrl}.json`;
    },
    fetchType: 'json',
    hint: '✨ Detected Reddit post - using JSON API',
  },
  // DEV.to user profile
  {
    source: 'DEV.to',
    pattern: /^https?:\/\/(www\.)?dev\.to\/([^\/\?#]+)\/?$/i,
    convert: (m) => `https://dev.to/api/articles?username=${m[2]}&per_page=30`,
    fetchType: 'json',
    hint: '✨ Detected DEV.to profile - using API',
  },
  // DEV.to tag
  {
    source: 'DEV.to Tag',
    pattern: /^https?:\/\/(www\.)?dev\.to\/t\/([^\/\?#]+)/i,
    convert: (m) => `https://dev.to/api/articles?tag=${m[2]}&per_page=30`,
    fetchType: 'json',
    hint: '✨ Detected DEV.to tag - using API',
  },
  // GitHub user profile
  {
    source: 'GitHub User',
    pattern: /^https?:\/\/(www\.)?github\.com\/([^\/\?#]+)\/?$/i,
    convert: (m) => `https://api.github.com/users/${m[2]}/repos?sort=updated&per_page=30`,
    fetchType: 'json',
    hint: '✨ Detected GitHub user - fetching repositories',
  },
  // GitHub repository
  {
    source: 'GitHub Repo',
    pattern: /^https?:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/\?#]+)\/?$/i,
    convert: (m) => `https://api.github.com/repos/${m[2]}/${m[3]}`,
    fetchType: 'json',
    hint: '✨ Detected GitHub repo - fetching details',
  },
  // Hacker News front page
  {
    source: 'Hacker News',
    pattern: /^https?:\/\/(www\.)?news\.ycombinator\.com\/?$/i,
    convert: () => `https://hacker-news.firebaseio.com/v0/topstories.json`,
    fetchType: 'json',
    hint: '✨ Detected Hacker News - fetching top story IDs',
  },
  // Hacker News best/new
  {
    source: 'Hacker News',
    pattern: /^https?:\/\/(www\.)?news\.ycombinator\.com\/(best|newest)/i,
    convert: (m) => {
      const type = m[2] === 'newest' ? 'newstories' : 'beststories';
      return `https://hacker-news.firebaseio.com/v0/${type}.json`;
    },
    fetchType: 'json',
    hint: '✨ Detected Hacker News - fetching story IDs',
  },
  // Wikipedia article
  {
    source: 'Wikipedia',
    pattern: /^https?:\/\/(\w+)\.wikipedia\.org\/wiki\/([^#\?]+)/i,
    convert: (m) => {
      const lang = m[1];
      const article = encodeURIComponent(m[2]);
      return `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${article}`;
    },
    fetchType: 'json',
    hint: '✨ Detected Wikipedia - fetching article summary',
  },
  // YouTube channel (note: requires API key in production)
  {
    source: 'YouTube',
    pattern: /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|@)([^\/\?#]+)/i,
    convert: (m) => `https://www.youtube.com/feeds/videos.xml?channel_id=${m[3]}`,
    fetchType: 'rss',
    hint: '✨ Detected YouTube channel - using RSS feed (may need channel ID)',
  },
];

/**
 * Convert a user-friendly URL to an API-friendly URL
 */
export function convertUrl(url: string): UrlConversion {
  const trimmedUrl = url.trim();
  
  // Try each pattern
  for (const pattern of URL_PATTERNS) {
    const match = trimmedUrl.match(pattern.pattern);
    if (match) {
      const convertedUrl = pattern.convert(match, trimmedUrl);
      return {
        source: pattern.source,
        originalUrl: trimmedUrl,
        convertedUrl,
        fetchType: pattern.fetchType,
        hint: pattern.hint,
        wasConverted: convertedUrl !== trimmedUrl,
      };
    }
  }
  
  // No conversion needed
  return {
    source: 'Unknown',
    originalUrl: trimmedUrl,
    convertedUrl: trimmedUrl,
    fetchType: 'json',
    hint: '',
    wasConverted: false,
  };
}

/**
 * Check if a URL matches any known pattern
 */
export function isKnownSource(url: string): boolean {
  const result = convertUrl(url);
  return result.wasConverted;
}

/**
 * Get list of supported sources for help/documentation
 */
export function getSupportedSources(): { name: string; example: string; description: string }[] {
  return [
    { name: 'Medium', example: 'medium.com/@username', description: 'Blog posts from Medium authors' },
    { name: 'Reddit', example: 'reddit.com/r/subreddit', description: 'Posts from any subreddit' },
    { name: 'DEV.to', example: 'dev.to/username', description: 'Articles from DEV.to developers' },
    { name: 'GitHub', example: 'github.com/username', description: 'Repositories from GitHub users' },
    { name: 'Hacker News', example: 'news.ycombinator.com', description: 'Top stories from HN' },
    { name: 'Wikipedia', example: 'en.wikipedia.org/wiki/Article', description: 'Article summaries' },
    { name: 'JSON APIs', example: 'api.example.com/data', description: 'Any public JSON endpoint' },
    { name: 'RSS Feeds', example: 'blog.example.com/feed', description: 'Any RSS/Atom feed' },
  ];
}

