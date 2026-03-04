/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    webpack: (
      config,
      { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    ) => {
      config.externals.push({ canvas: 'commonjs canvas' })
      return config
    },
    images: {
        unoptimized: true,
      },
};

export default nextConfig;
