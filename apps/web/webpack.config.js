const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx(),
  withReact({
    // Uncomment this line if you don't want to use SVGR
    // See: https://react-svgr.com/
    // svgr: false
  }),
  (config) => {
    // Update the webpack config as needed here.
    // e.g. `config.plugins.push(new MyPlugin())`
    config.resolve.alias['react-native$'] = 'react-native-web';
    config.resolve.alias['../Utilities/Platform'] =
      'react-native-web/dist/exports/Platform';
    config.resolve.alias['../../Utilities/Platform'] =
      'react-native-web/dist/exports/Platform';
    config.resolve.alias['./Platform'] =
      'react-native-web/dist/exports/Platform';
    return config;
  }
);
