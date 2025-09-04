const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const publicPath = isProduction ? '/DZInternalTesting/' : '/';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: '[name].[contenthash].js',
      publicPath: publicPath
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader'
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource'
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './public/index.html'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public/.nojekyll',
            to: '.nojekyll',
            toType: 'file'
          },
          {
            from: 'public/supabase.config.js',
            to: 'supabase.config.js',
            toType: 'file'
          }
        ]
      }),
      new webpack.DefinePlugin({
        'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(process.env.REACT_APP_SUPABASE_URL || ''),
        'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(process.env.REACT_APP_SUPABASE_ANON_KEY || ''),
        'process.env.REACT_APP_SUPABASE_BUCKET': JSON.stringify(process.env.REACT_APP_SUPABASE_BUCKET || 'drawerzen'),
        'process.env.REACT_APP_SUPABASE_TABLE': JSON.stringify(process.env.REACT_APP_SUPABASE_TABLE || 'dataset'),
        'process.env.REACT_APP_SUPABASE_ORDERS_TABLE': JSON.stringify(process.env.REACT_APP_SUPABASE_ORDERS_TABLE || 'orders'),
        'process.env.REACT_APP_SUPABASE_DEBUG': JSON.stringify(process.env.REACT_APP_SUPABASE_DEBUG || ''),
        'process.env.REACT_APP_DEBUG_LAYOUT': JSON.stringify(process.env.REACT_APP_DEBUG_LAYOUT || ''),
    'process.env.REACT_APP_SUPABASE_RECTIFY_TABLE': JSON.stringify(process.env.REACT_APP_SUPABASE_RECTIFY_TABLE || process.env.REACT_APP_SUPABASE_TABLE || 'dataset'),
        'process.env.REACT_APP_ORDER_INITIAL_STATUS': JSON.stringify(process.env.REACT_APP_ORDER_INITIAL_STATUS || ''),
        'process.env.REACT_APP_ORDER_ALLOWED_STATUSES': JSON.stringify(process.env.REACT_APP_ORDER_ALLOWED_STATUSES || ''),
  'process.env.REACT_APP_ORDER_REQUIRE_IMAGE': JSON.stringify(process.env.REACT_APP_ORDER_REQUIRE_IMAGE || ''),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || (isProduction ? 'production' : 'development')),
        process: JSON.stringify({ env: {
          REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || '',
          REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
          REACT_APP_SUPABASE_BUCKET: process.env.REACT_APP_SUPABASE_BUCKET || 'drawerzen',
          REACT_APP_SUPABASE_TABLE: process.env.REACT_APP_SUPABASE_TABLE || 'dataset',
          REACT_APP_SUPABASE_ORDERS_TABLE: process.env.REACT_APP_SUPABASE_ORDERS_TABLE || 'orders',
          REACT_APP_SUPABASE_DEBUG: process.env.REACT_APP_SUPABASE_DEBUG || '',
          REACT_APP_DEBUG_LAYOUT: process.env.REACT_APP_DEBUG_LAYOUT || '',
          REACT_APP_SUPABASE_RECTIFY_TABLE: process.env.REACT_APP_SUPABASE_RECTIFY_TABLE || process.env.REACT_APP_SUPABASE_TABLE || 'dataset',
          REACT_APP_ORDER_INITIAL_STATUS: process.env.REACT_APP_ORDER_INITIAL_STATUS || '',
          REACT_APP_ORDER_ALLOWED_STATUSES: process.env.REACT_APP_ORDER_ALLOWED_STATUSES || '',
          REACT_APP_ORDER_REQUIRE_IMAGE: process.env.REACT_APP_ORDER_REQUIRE_IMAGE || '',
          NODE_ENV: process.env.NODE_ENV || (isProduction ? 'production' : 'development')
        }})
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public')
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles')
      },
      fallback: {
        fs: false,
        net: false,
        tls: false
      }
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          }
        }
      }
    },
    ignoreWarnings: [
      (warning) => warning.message && /Critical dependency: the request of a dependency is an expression/.test(warning.message) && warning.module && /@supabase[\\/]|realtime-js/.test(warning.module?.resource || '')
    ]
  };
};