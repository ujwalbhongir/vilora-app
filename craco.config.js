module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source-map-loader warnings for node_modules
      webpackConfig.ignoreWarnings = [
        (warning) => warning.message && warning.message.includes('source-map-loader'),
      ];
      // Or exclude Firebase/html-entities specifically from source-map-loader
      const sourceMapLoaderRule = webpackConfig.module.rules.find(rule => rule.enforce === 'pre' && rule.loader?.includes('source-map-loader'));
      if (sourceMapLoaderRule) {
        sourceMapLoaderRule.exclude = [
          /node_modules\/(firebase|html-entities)/,
        ];
      }
      return webpackConfig;
    },
  },
};