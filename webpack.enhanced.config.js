/**
 * Build Configuration for SpendGuard
 * Supports both lightweight and enhanced versions
 */

const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const useEnhanced = env && env.enhanced;
  
  console.log(`Building SpendGuard ${useEnhanced ? 'Enhanced' : 'Lightweight'} version...`);
  
  const config = {
    entry: {
      popup: useEnhanced 
        ? './src/popup/enhanced-popup.ts' 
        : './src/popup/lightweight-popup.ts',
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
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: !isProduction, // Faster builds in dev
              configFile: 'tsconfig.json'
            }
          },
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@content': path.resolve(__dirname, 'src/content'),
        '@popup': path.resolve(__dirname, 'src/popup'),
        '@background': path.resolve(__dirname, 'src/background')
      }
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    optimization: {
      minimize: isProduction,
      splitChunks: false, // Keep bundles separate for extension
      usedExports: isProduction,
      sideEffects: false
    },
    stats: {
      errorDetails: true,
      colors: true,
      modules: false,
      chunks: false
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 500000, // 500kb limit for extensions
      maxEntrypointSize: 500000
    }
  };

  // Add bundle analyzer if requested
  if (env && env.analyze) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    config.plugins = [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        reportFilename: `bundle-analysis-${useEnhanced ? 'enhanced' : 'lightweight'}.html`
      })
    ];
  }

  return config;
};
