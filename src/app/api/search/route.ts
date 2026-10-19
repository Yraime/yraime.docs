import { source } from '@/lib/source';
import { createSearchAPI } from 'fumadocs-core/search/server';

export const dynamic = 'force-static';

export const { GET } = createSearchAPI('static', {
  indexes: source.getPages().map((page) => ({
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    id: page.url,
    structuredData: page.data.structuredData,
  })),
});
