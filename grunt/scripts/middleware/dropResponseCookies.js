/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

'use strict';

const onHeaders = require('on-headers');

function removeCookies() {
	this.removeHeader('set-cookie');
}

module.exports = function dropResponseCookies(req, res, next) {
	onHeaders(res, removeCookies);
	next();
};
