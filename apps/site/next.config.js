
const { composePlugins, withNx } = require('@nx/next');
const { withTamagui } = require('@tamagui/next-plugin')

const nextConfig = {
  nx: {
    svgr: false,
  },
  rewrites: () => Promise.resolve([{source: '/app', destination: '/app/index.html'}]),
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withTamagui({
    config: '../../libs/ui/rnw/src/lib/tamagui.config.ts',
    components: ['tamagui'],
  })
];

module.exports = composePlugins(...plugins)(nextConfig);
