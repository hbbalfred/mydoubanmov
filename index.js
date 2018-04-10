const system = require('./lib/system');
const detail = require('./lib/detail');

system.register('db');

system.start = function () {
	detail();
};