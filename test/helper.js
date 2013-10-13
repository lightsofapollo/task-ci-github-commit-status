global.assert = require('assert');
global.sinon = require('sinon');

sinon.assert.expose(assert, { prefix: '' });
