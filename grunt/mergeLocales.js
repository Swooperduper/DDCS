/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

'use strict';

module.exports = function task(grunt, config) {
	return {
		vendorLocales: {
			src: grunt.file.exists(grunt.template.process(config.vendorLocales, { data: config })) ?
				grunt.file.readYAML(grunt.template.process(config.vendorLocales, { data: config })) : '{}',
			dest: '<%= dest %>/locales/',
		},
	};
};
