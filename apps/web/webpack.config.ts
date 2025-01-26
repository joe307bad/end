import { NxAppWebpackPlugin } from '@nx/webpack/app-plugin';
import { NxReactWebpackPlugin } from '@nx/react/webpack-plugin';
import { DefinePlugin } from 'webpack';
import { routes } from '../../routes.json';

module.exports = {
  stats: { warnings: false },
  ignoreWarnings: [/Failed to parse source map/],
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-svg': 'react-native-svg-web',
      '@react-native/assets-registry/registry':
        'react-native-web/dist/modules/AssetRegistry/index',
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js'],
  },
  devServer: {
    port: 4200,
    historyApiFallback: true,
  },
  plugins: [
    new NxAppWebpackPlugin({
      tsConfig: './tsconfig.app.json',
      compiler: 'babel',
      main: './src/main-web.tsx',
      index: './src/index.html',
      outputPath: 'dist/apps/web',
      baseHref: '/',
      assets: ['./src/favicon.ico', './src/assets'],
      styles: [],
      outputHashing: process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
      optimization: process.env['NODE_ENV'] === 'production',
    }),
    new DefinePlugin({
      'ALL_ROUTES': JSON.stringify(routes),
      'process.env.WEBSOCKET_URL': JSON.stringify(process.env.WEBSOCKET_URL),
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL),
      'process.env.END_VERSION': JSON.stringify(process.env.END_VERSION),
      'process.env.END_COMMIT_SHA': JSON.stringify(process.env.END_COMMIT_SHA),
    }),
    new NxReactWebpackPlugin({
      // Uncomment this line if you don't want to use SVGR
      // See: https://react-svgr.com/
      // svgr: false
    }),
  ],
};
