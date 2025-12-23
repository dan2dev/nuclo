module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.ts',
      'types/**/*.ts',
      'test/**/*.ts',
      '!test/**/*.test.ts'
    ],
    tests: [
      'test/**/*.test.ts'
    ],
    env: {
      type: 'node',
      runner: 'node',
      params: {
        runner: '--experimental-vm-modules'
      }
    },
    testFramework: {
      type: 'vitest',
      path: './node_modules/vitest'
    },
    setup: function () {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
      });
      global.window = dom.window;
      global.document = dom.window.document;
      global.navigator = dom.window.navigator;
      global.HTMLElement = dom.window.HTMLElement;
    }
  };
};
