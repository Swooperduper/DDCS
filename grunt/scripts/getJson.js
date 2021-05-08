/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

'use strict';

const resolve = require('path').resolve;

module.exports = function getJson(grunt, path, defaultValue) {
	const resolved = resolve(path);
	let value;
	if (grunt.file.exists(resolved)) {
		value = grunt.file.readJSON(resolved, { encoding: 'utf8' });
	} else {
		value = defaultValue;
	}
	return value;
};
