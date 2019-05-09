import Vue from 'vue';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

const requireComponent = require.context('.', false, /Vue[\w-]+.vue$/);

requireComponent.keys().forEach((filename) => {
  // Get Component Config
  const componentConfig = requireComponent(filename);

  // Get PascalCase name of component
  const componentName = upperFirst(camelCase(filename.replace(/^\.\//, '').replace(/\.\w+$/, '')));

  Vue.component(componentName, componentConfig.default || componentConfig);
});
