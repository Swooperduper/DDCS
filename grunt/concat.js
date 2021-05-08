/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

'use strict';

module.exports = function task(grunt, config) {
	return {
		app: {
			options: {
				banner: '<%= banner %>',
				sourceMap: true,
			},
			src: ['<%= eslint.app.src %>', '<%= ngtemplates.app.dest %>'],
			dest: '<%= dest %>/<%= appFileName %>.js',
		},
		css: {
			src: ['<%= src %>/../node_modules/codemirror/lib/codemirror.css', '<%= dest %>/<%= appFileName %>.css'],
			dest: '<%= dest %>/<%= appFileName %>.css'
		},
		demo: {
			src: ['<%= eslint.demo.src %>', '<%= ngtemplates.demo.dest %>'],
			dest: '<%= demoDest %>/demo.js'
		},
		vendor: {
			src: grunt.file.exists(grunt.template.process(config.vendorYAML, { data: config })) ?
				grunt.file.readYAML(grunt.template.process(config.vendorYAML, { data: config })) : '{}',
			dest: '<%= dest %>/vendor.js'
		},
	};
};
