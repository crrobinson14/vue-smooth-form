module.exports = {
  lintOnSave: false,
  chainWebpack: (config) => {
    // remove the old loader
    config.module.rules.delete('svg');
  },
  configureWebpack: {
    module: {
      rules: [],
    },
  },
};
