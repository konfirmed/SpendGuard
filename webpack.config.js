const path = require('path');

module.exports = {
  entry: {
    popup: './src/index.tsx',
    content: './src/content/intercept.tsx',
    background: './src/background/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].js',
    clean: false // Don't clean the public directory
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ]
              }
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  mode: 'development'
};
