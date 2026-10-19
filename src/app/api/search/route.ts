import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// On indique à Next.js de mettre en cache de manière statique cette route
export const revalidate = false;

// On exporte la méthode staticGET renommée en GET
export const { staticGET: GET } = createFromSource(source);
