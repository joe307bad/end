const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { merge } = require('webpack-merge');

module.exports = composePlugins(withNx(), withReact(), (config) => {
  return merge(config, {
    stats: { warnings: false },
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
        '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        './Platform': 'react-native-web/dist/exports/Platform',
        'react-native/Libraries/Utilities/codegenNativeComponent':
          'react-native-web/Libraries/Utilities/codegenNativeComponent',
        './ReactNativeSVG': 'react-native-svg/lib/module/ReactNativeSVG.web.js',
      },
    },
    module: {
      rules: [
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
