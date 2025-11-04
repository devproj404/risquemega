import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Temporarily disable until Sharp is installed
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'cdni.pornpics.com',
      },
      {
        protocol: 'https',
        hostname: '**.pornpics.com',
      },
      // Image hosting services
      {
        protocol: 'https',
        hostname: 'pixhost.to',
      },
      {
        protocol: 'https',
        hostname: '**.pixhost.to',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgbox.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgbox.com',
      },
      {
        protocol: 'https',
        hostname: 'postimg.cc',
      },
      {
        protocol: 'https',
        hostname: '**.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'imageban.ru',
      },
      {
        protocol: 'https',
        hostname: '**.imageban.ru',
      },
      {
        protocol: 'https',
        hostname: 'imagebam.com',
      },
      {
        protocol: 'https',
        hostname: '**.imagebam.com',
      },
      {
        protocol: 'https',
        hostname: 'turboimagehost.com',
      },
      {
        protocol: 'https',
        hostname: '**.turboimagehost.com',
      },
      {
        protocol: 'https',
        hostname: 'img.yt',
      },
      {
        protocol: 'https',
        hostname: 'ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'imgbb.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgbb.com',
      },
      {
        protocol: 'https',
        hostname: 'imgsrc.ru',
      },
      {
        protocol: 'https',
        hostname: 'radikal.ru',
      },
    ],
  },
};

export default nextConfig;
