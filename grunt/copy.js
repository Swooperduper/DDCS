/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

'use strict';

module.exports = function copyTask(grunt) {
	return {
		index: {
			options: {
				process: grunt.template.process,
			},
			src: '<%= src %>/index.html',
			dest: '<%= dest %>/index.html',
		},
		indexDemo: {
			options: {
				process: grunt.template.process,
			},
			src: '<%= demoSrc %>/index.html',
			dest: '<%= demoDest %>/index.html',
		},
		locales: {
			cwd: '<%= src %>/assets/',
			expand: true,
			src: 'locales/*.json',
			dest: '<%= dest %>/',
		},
	};
};
