import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ajoutez ceci UNIQUEMENT si le site n'est pas à la racine de votre domaine :
  basePath: '/yraime.docs', 
};


export default withMDX(config);
