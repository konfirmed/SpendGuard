const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  const config = {
    entry: {
      popup: './src/popup/lightweight-popup.ts',
      content: './src/content/lightweight-intercept.ts',
      background: './src/background/index.ts'
    },
    output: {
      path: path.resolve(__dirname, 'public'),
      filename: '[name].js',
      clean: false
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    optimization: {
      minimize: isProduction,
      splitChunks: false // Keep bundles separate for extension
    }
  };

  // Add bundle analyzer if requested
  if (env && env.analyze) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    config.plugins = [new BundleAnalyzerPlugin()];
  }

  return config;
};
