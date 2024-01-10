const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { merge } = require('webpack-merge');
const path = require('node:path');

module.exports = composePlugins(withNx(), withReact(), (config) => {
  return merge(config, {
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
        '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        './Platform': 'react-native-web/dist/exports/Platform',
        '../../Image/Image': 'identity-obj-proxy',
        '../Utilities/BackHandler': 'identity-obj-proxy',
        '../../StyleSheet/PlatformColorValueTypes': 'identity-obj-proxy',
      },
    },
    module: {
      rules: [
        {
          test: /.[tj]sx?$/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, '../../node_modules/react-native'),
            path.resolve(__dirname, '../../node_modules/@react-native'),
            path.resolve(__dirname, '../../node_modules/@react-navigation'),
            path.resolve(
              __dirname,
              '../../node_modules/expo-dev-menu/vendored/react-native-safe-area-context/src'
            ),
          ],
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                presets: ['module:metro-react-native-babel-preset'],
                plugins: [['react-native-web', { commonjs: true }]],
              },
            },
          ],
        },
        {
          test: /\.(scss|css)$/i,
          use: ['sass-loader'],
        },
        {
          test: /\.(woff|woff2)$/,
          use: {
            loader: 'url-loader',
          },
        },
      ],
    },
  });
});
