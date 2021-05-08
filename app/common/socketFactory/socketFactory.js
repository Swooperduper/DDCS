/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

(function (angular) {
	'use strict';

	function SocketFactoryController (socketFactory) {
		/* eslint-disable no-undef */
		var myIoSocket = io.connect(
			'/',
			{query: 'token=Bearer '+localStorage.getItem('access_token')+'&authId='+localStorage.getItem('sub')}
		);
		/* eslint-disable no-undef */
		var mySocket = socketFactory({
			ioSocket: myIoSocket
		});
		return mySocket;
	}
	SocketFactoryController.$inject = [
		'socketFactory'
	];

	angular
		.module('ddcs.socketFactory', [
			'btford.socket-io'
		])
		.factory('mySocket', SocketFactoryController)
	;
}(angular));

