/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

'use strict';

const noop = require('lodash/noop');

module.exports = function registerNOOP(grunt) {
	grunt.registerTask(
		'noop',
		'A no-operation task -> useful in testing situations',
		noop
	);
};
