const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { merge } = require('webpack-merge');

module.exports = composePlugins(withNx(), withReact(), (config) => {
  return merge(config, {
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
        '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
        './Platform': 'react-native-web/dist/exports/Platform',
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
