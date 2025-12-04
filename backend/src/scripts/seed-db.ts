/**
 * Seed Database Script
 * 
 * Creates system templates (no user account required)
 * Templates are organized by category and difficulty level
 */

import { Pool } from 'pg';
import { config } from '../config/env';

// =============================================================================
// TEMPLATE CATEGORIES
// =============================================================================

type TemplateCategory = 'getting-started' | 'api-integration' | 'rss-feeds' | 'data-processing';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface PipeTemplate {
  name: string;
  description: string;
  definition: {
    nodes: any[];
    edges: any[];
  };
  tags: string[];
  category: TemplateCategory;
  difficulty: DifficultyLevel;
}

// =============================================================================
// GETTING STARTED TEMPLATES (Beginner)
// =============================================================================

const GETTING_STARTED_TEMPLATES: PipeTemplate[] = [
  {
    name: '🟢 First Steps: Fetch & Limit',
    description: 'Your first pipe! Fetches posts from an API and limits to 5 items. Perfect for learning the basics of connecting operators.',
    category: 'getting-started',
    difficulty: 'beginner',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Posts',
            config: {
              url: 'https://jsonplaceholder.typicode.com/posts',
            },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 450, y: 200 },
          data: {
            label: 'First 5',
            config: {
              count: 5,
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 800, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e2', source: 'truncate-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['beginner', 'tutorial', 'getting-started'],
  },
  {
    name: '📝 Last Items: Using Tail',
    description: 'Learn the Tail operator - the opposite of Truncate. Gets the last N items from a list instead of the first.',
    category: 'getting-started',
    difficulty: 'beginner',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Comments',
            config: {
              url: 'https://jsonplaceholder.typicode.com/comments',
            },
          },
        },
        {
          id: 'tail-1',
          type: 'tail',
          position: { x: 450, y: 200 },
          data: {
            label: 'Last 3',
            config: {
              count: 3,
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 800, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'tail-1', type: 'selectable' },
        { id: 'e2', source: 'tail-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['beginner', 'tutorial', 'tail'],
  },
  {
    name: '🏷️ Rename Fields',
    description: 'Learn to rename data fields to more readable names. Great for cleaning up API responses.',
    category: 'getting-started',
    difficulty: 'beginner',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Users',
            config: {
              url: 'https://jsonplaceholder.typicode.com/users',
            },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 420, y: 200 },
          data: {
            label: 'First 3',
            config: {
              count: 3,
            },
          },
        },
        {
          id: 'rename-1',
          type: 'rename',
          position: { x: 740, y: 200 },
          data: {
            label: 'Rename Fields',
            config: {
              mappings: [
                { source: 'name', target: 'full_name' },
                { source: 'email', target: 'email_address' },
              ],
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1060, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e2', source: 'truncate-1', target: 'rename-1', type: 'selectable' },
        { id: 'e3', source: 'rename-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['beginner', 'tutorial', 'rename'],
  },
];

// =============================================================================
// DATA PROCESSING TEMPLATES (Intermediate)
// =============================================================================

const DATA_PROCESSING_TEMPLATES: PipeTemplate[] = [
  {
    name: '🔍 Filter & Sort',
    description: 'Filter posts by a specific user, then sort by ID descending. Learn to chain multiple operators together.',
    category: 'data-processing',
    difficulty: 'intermediate',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Posts',
            config: {
              url: 'https://jsonplaceholder.typicode.com/posts',
            },
          },
        },
        {
          id: 'filter-1',
          type: 'filter',
          position: { x: 420, y: 200 },
          data: {
            label: 'User 1 Only',
            config: {
              mode: 'permit',
              matchMode: 'all',
              rules: [
                { field: 'userId', operator: 'equals', value: '1' }
              ],
            },
          },
        },
        {
          id: 'sort-1',
          type: 'sort',
          position: { x: 740, y: 200 },
          data: {
            label: 'Sort by ID',
            config: {
              field: 'id',
              direction: 'desc',
            },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 1060, y: 200 },
          data: {
            label: 'Top 5',
            config: {
              count: 5,
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1380, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'filter-1', type: 'selectable' },
        { id: 'e2', source: 'filter-1', target: 'sort-1', type: 'selectable' },
        { id: 'e3', source: 'sort-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e4', source: 'truncate-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['intermediate', 'filter', 'sort', 'data-processing'],
  },
  {
    name: '🔄 Transform & Extract',
    description: 'Transform data to extract and rename specific fields. Create clean, focused data structures.',
    category: 'data-processing',
    difficulty: 'intermediate',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Posts',
            config: {
              url: 'https://jsonplaceholder.typicode.com/posts',
            },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 400, y: 200 },
          data: {
            label: 'First 10',
            config: {
              count: 10,
            },
          },
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 700, y: 200 },
          data: {
            label: 'Extract Fields',
            config: {
              mappings: [
                { source: 'userId', target: 'author_id' },
                { source: 'title', target: 'post_title' },
                { source: 'id', target: 'post_id' },
              ],
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e2', source: 'truncate-1', target: 'transform-1', type: 'selectable' },
        { id: 'e3', source: 'transform-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['intermediate', 'transform', 'data-processing'],
  },
  {
    name: '✨ Remove Duplicates',
    description: 'Use the Unique operator to remove duplicate entries based on a specific field.',
    category: 'data-processing',
    difficulty: 'intermediate',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Posts',
            config: {
              url: 'https://jsonplaceholder.typicode.com/posts',
            },
          },
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 420, y: 200 },
          data: {
            label: 'Extract Author',
            config: {
              mappings: [
                { source: 'userId', target: 'author_id' },
                { source: 'title', target: 'sample_title' },
              ],
            },
          },
        },
        {
          id: 'unique-1',
          type: 'unique',
          position: { x: 740, y: 200 },
          data: {
            label: 'Unique Authors',
            config: {
              field: 'author_id',
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1060, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'transform-1', type: 'selectable' },
        { id: 'e2', source: 'transform-1', target: 'unique-1', type: 'selectable' },
        { id: 'e3', source: 'unique-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['intermediate', 'unique', 'dedupe', 'data-processing'],
  },
];

// =============================================================================
// API INTEGRATION TEMPLATES
// =============================================================================

const API_INTEGRATION_TEMPLATES: PipeTemplate[] = [
  {
    name: '⭐ GitHub Top Repos',
    description: 'Fetch public repositories from GitHub, sort by stars, and extract key information. Learn to work with real APIs.',
    category: 'api-integration',
    difficulty: 'intermediate',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Repos',
            config: {
              url: 'https://api.github.com/users/octocat/repos',
            },
          },
        },
        {
          id: 'sort-1',
          type: 'sort',
          position: { x: 420, y: 200 },
          data: {
            label: 'Sort by Stars',
            config: {
              field: 'stargazers_count',
              direction: 'desc',
            },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 740, y: 200 },
          data: {
            label: 'Top 5',
            config: {
              count: 5,
            },
          },
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 1060, y: 200 },
          data: {
            label: 'Extract Info',
            config: {
              mappings: [
                { source: 'name', target: 'repo_name' },
                { source: 'stargazers_count', target: 'stars' },
                { source: 'html_url', target: 'url' },
                { source: 'description', target: 'desc' },
              ],
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1380, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'sort-1', type: 'selectable' },
        { id: 'e2', source: 'sort-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e3', source: 'truncate-1', target: 'transform-1', type: 'selectable' },
        { id: 'e4', source: 'transform-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['intermediate', 'github', 'api', 'repos'],
  },
  {
    name: '👤 GitHub User Profile',
    description: 'Fetch and transform a GitHub user profile. Extract key information like bio, followers, and repos count.',
    category: 'api-integration',
    difficulty: 'beginner',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 100 },
          data: {
            label: 'Fetch User',
            config: {
              url: 'https://api.github.com/users/octocat',
            },
          },
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 450, y: 100 },
          data: {
            label: 'Extract Profile',
            config: {
              mappings: [
                { source: 'login', target: 'username' },
                { source: 'name', target: 'name' },
                { source: 'bio', target: 'bio' },
                { source: 'avatar_url', target: 'avatar' },
                { source: 'followers', target: 'followers' },
                { source: 'public_repos', target: 'public_repos' },
              ],
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 800, y: 100 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'transform-1', type: 'selectable' },
        { id: 'e2', source: 'transform-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['beginner', 'github', 'api', 'profile'],
  },
  {
    name: '🌤️ Weather Dashboard',
    description: 'Fetch current weather data from Open-Meteo API. Transform the data into a clean weather summary.',
    category: 'api-integration',
    difficulty: 'beginner',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 100 },
          data: {
            label: 'Fetch Weather',
            config: {
              url: 'https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true',
            },
          },
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 450, y: 100 },
          data: {
            label: 'Format Weather',
            config: {
              mappings: [
                { source: 'current_weather.temperature', target: 'temperature' },
                { source: 'current_weather.windspeed', target: 'windspeed' },
                { source: 'current_weather.time', target: 'time' },
                { source: 'latitude', target: 'latitude' },
                { source: 'longitude', target: 'longitude' },
              ],
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 800, y: 100 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'transform-1', type: 'selectable' },
        { id: 'e2', source: 'transform-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['beginner', 'weather', 'api', 'dashboard'],
  },
  {
    name: '💻 DEV.to Popular Articles',
    description: 'Fetch trending articles from DEV.to. Filter by reactions and get the most popular tech posts.',
    category: 'api-integration',
    difficulty: 'intermediate',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Articles',
            config: {
              url: 'https://dev.to/api/articles?per_page=30',
            },
          },
        },
        {
          id: 'filter-1',
          type: 'filter',
          position: { x: 400, y: 200 },
          data: {
            label: 'Popular Only',
            config: {
              mode: 'permit',
              matchMode: 'all',
              rules: [{ field: 'positive_reactions_count', operator: 'gt', value: '10' }],
            },
          },
        },
        {
          id: 'sort-1',
          type: 'sort',
          position: { x: 700, y: 200 },
          data: {
            label: 'By Reactions',
            config: { field: 'positive_reactions_count', direction: 'desc' },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Top 10',
            config: { count: 10 },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1300, y: 200 },
          data: { label: 'Output', config: {} },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'filter-1', type: 'selectable' },
        { id: 'e2', source: 'filter-1', target: 'sort-1', type: 'selectable' },
        { id: 'e3', source: 'sort-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e4', source: 'truncate-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['intermediate', 'devto', 'api', 'tech'],
  },
];

// =============================================================================
// RSS FEED TEMPLATES
// =============================================================================

const RSS_FEED_TEMPLATES: PipeTemplate[] = [
  {
    name: '📰 Tech News Feed',
    description: 'Fetch technology news from NY Times RSS feed. Clean up titles and limit to top stories.',
    category: 'rss-feeds',
    difficulty: 'intermediate',
    definition: {
      nodes: [
        {
          id: 'fetch-rss-1',
          type: 'fetch-rss',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch RSS Feed',
            config: {
              url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
              maxItems: 20,
            },
          },
        },
        {
          id: 'string-replace-1',
          type: 'string-replace',
          position: { x: 450, y: 200 },
          data: {
            label: 'Clean Titles',
            config: {
              field: 'title',
              search: ' - The New York Times',
              replacement: '',
            },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 800, y: 200 },
          data: {
            label: 'Top 10',
            config: {
              count: 10,
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1150, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-rss-1', target: 'string-replace-1', type: 'selectable' },
        { id: 'e2', source: 'string-replace-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e3', source: 'truncate-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['intermediate', 'rss', 'news', 'tech'],
  },
  {
    name: '📱 Reddit Feed Reader',
    description: 'Fetch top posts from any subreddit. Change "programming" to your favorite subreddit!',
    category: 'rss-feeds',
    difficulty: 'intermediate',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch r/programming',
            config: {
              url: 'https://reddit.com/r/programming.json',
            },
          },
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 400, y: 200 },
          data: {
            label: 'Extract Posts',
            config: {
              path: 'data.children',
              mappings: [
                { source: 'data.title', target: 'title' },
                { source: 'data.score', target: 'score' },
                { source: 'data.author', target: 'author' },
                { source: 'data.url', target: 'link' },
              ],
            },
          },
        },
        {
          id: 'sort-1',
          type: 'sort',
          position: { x: 700, y: 200 },
          data: {
            label: 'Sort by Score',
            config: { field: 'score', direction: 'desc' },
          },
        },
        {
          id: 'truncate-1',
          type: 'truncate',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Top 10',
            config: { count: 10 },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1300, y: 200 },
          data: { label: 'Output', config: {} },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'transform-1', type: 'selectable' },
        { id: 'e2', source: 'transform-1', target: 'sort-1', type: 'selectable' },
        { id: 'e3', source: 'sort-1', target: 'truncate-1', type: 'selectable' },
        { id: 'e4', source: 'truncate-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['intermediate', 'reddit', 'social', 'rss'],
  },
];

// =============================================================================
// ADVANCED TEMPLATES
// =============================================================================

const ADVANCED_TEMPLATES: PipeTemplate[] = [
  {
    name: '🔴 Advanced: Multi-Filter Pipeline',
    description: 'Complex pipeline with multiple filters using OR logic. Filter data from multiple users and transform results.',
    category: 'data-processing',
    difficulty: 'advanced',
    definition: {
      nodes: [
        {
          id: 'fetch-1',
          type: 'fetch-json',
          position: { x: 100, y: 200 },
          data: {
            label: 'Fetch Posts',
            config: {
              url: 'https://jsonplaceholder.typicode.com/posts',
            },
          },
        },
        {
          id: 'filter-1',
          type: 'filter',
          position: { x: 420, y: 200 },
          data: {
            label: 'Users 1-3',
            config: {
              mode: 'permit',
              matchMode: 'any',
              rules: [
                { field: 'userId', operator: 'equals', value: '1' },
                { field: 'userId', operator: 'equals', value: '2' },
                { field: 'userId', operator: 'equals', value: '3' },
              ],
            },
          },
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 740, y: 200 },
          data: {
            label: 'Extract Fields',
            config: {
              mappings: [
                { source: 'userId', target: 'author_id' },
                { source: 'title', target: 'post_title' },
              ],
            },
          },
        },
        {
          id: 'unique-1',
          type: 'unique',
          position: { x: 1060, y: 200 },
          data: {
            label: 'Unique Authors',
            config: {
              field: 'author_id',
            },
          },
        },
        {
          id: 'output-1',
          type: 'pipe-output',
          position: { x: 1380, y: 200 },
          data: {
            label: 'Output',
            config: {},
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'fetch-1', target: 'filter-1', type: 'selectable' },
        { id: 'e2', source: 'filter-1', target: 'transform-1', type: 'selectable' },
        { id: 'e3', source: 'transform-1', target: 'unique-1', type: 'selectable' },
        { id: 'e4', source: 'unique-1', target: 'output-1', type: 'selectable' },
      ],
    },
    tags: ['advanced', 'filter', 'transform', 'unique'],
  },
];

// =============================================================================
// ALL TEMPLATES
// =============================================================================

const ALL_TEMPLATES: PipeTemplate[] = [
  ...GETTING_STARTED_TEMPLATES,
  ...DATA_PROCESSING_TEMPLATES,
  ...API_INTEGRATION_TEMPLATES,
  ...RSS_FEED_TEMPLATES,
  ...ADVANCED_TEMPLATES,
];

// =============================================================================
// SEED FUNCTION
// =============================================================================

async function seedDatabase() {
  const pool = new Pool({
    connectionString: config.databaseUrl,
  });

  try {
    console.log('🌱 Seeding database with templates...\n');

    // Group templates by category for display
    const byCategory = ALL_TEMPLATES.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {} as Record<string, PipeTemplate[]>);

    let createdCount = 0;
    let skippedCount = 0;

    for (const template of ALL_TEMPLATES) {
      // Check if template already exists (by name, for system templates with null user_id)
      const existing = await pool.query(
        'SELECT id FROM pipes WHERE name = $1 AND user_id IS NULL',
        [template.name]
      );

      if (existing.rows.length > 0) {
        console.log(`   ⏭️  Skipping "${template.name}" (already exists)`);
        skippedCount++;
        continue;
      }

      // Insert template as system template (user_id = NULL)
      const result = await pool.query(
        `INSERT INTO pipes (user_id, name, description, definition, is_public, is_featured, tags, is_draft)
         VALUES (NULL, $1, $2, $3, true, true, $4, false)
         RETURNING id, name`,
        [
          template.name,
          template.description,
          JSON.stringify(template.definition),
          [...template.tags, template.category, template.difficulty],
        ]
      );

      const pipe = result.rows[0];
      console.log(`   ✅ ${template.difficulty.toUpperCase().padEnd(12)} ${pipe.name}`);

      // Create version for template
      await pool.query(
        `INSERT INTO pipe_versions (pipe_id, version_number, definition)
         VALUES ($1, 1, $2)`,
        [pipe.id, JSON.stringify(template.definition)]
      );

      createdCount++;
    }

    await pool.end();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Database seeded successfully!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${createdCount} templates`);
    console.log(`   Skipped: ${skippedCount} (already exist)`);
    console.log('\n📦 Templates by Category:');
    
    for (const [category, templates] of Object.entries(byCategory)) {
      const categoryDisplay = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      console.log(`\n   ${categoryDisplay}:`);
      templates.forEach(t => {
        const diffBadge = t.difficulty === 'beginner' ? '🟢' : t.difficulty === 'intermediate' ? '🟡' : '🔴';
        console.log(`      ${diffBadge} ${t.name}`);
      });
    }

    console.log('\n🚀 Templates are now available in the app!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await pool.end();
    process.exit(1);
  }
}

seedDatabase();
