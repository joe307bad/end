const { composePlugins, withNx } = require('@nx/next');
const { withTamagui } = require('@tamagui/next-plugin');
const { createContentlayerPlugin } = require('next-contentlayer2');

const nextConfig = {
  nx: {
    svgr: false,
  },
  rewrites: () =>
    Promise.resolve([
      { source: '/b/:slug', destination: '/app-source/index.html', permanent: true },
    ]),
};

const contentLayerConfig = () =>
  createContentlayerPlugin({
    configPath: 'apps/site/contentlayer.config.ts',
  });

const plugins = [
  contentLayerConfig,
  withNx,
  withTamagui({
    config: '../../libs/ui/shared/src/lib/tamagui.config.ts',
    components: ['tamagui'],
  })
];

module.exports = composePlugins(...plugins)(nextConfig);
