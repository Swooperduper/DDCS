/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

(function (angular) {
	'use strict';

	function chatBoxController () {
		// var cbt = this;
		// $timeout, dynMsgService
		// $timeout(function() {
		//	_.set(cbt, 'msgs', _.get(dynMsgService, ['cObj', cbt.socketSub]));
		// });
		// '$timeout', 'dynMsgService'
	}
	chatBoxController.$injector = [];
	// ['cObj', cbt.socketSub]
	function chatBox() {
		return {
			restrict: 'E',
			scope: {
				socketSub: '@',
				chatTo: '@'
			},
			controller: 'chatBoxController',
			controllerAs: 'cbCtrl',
			bindToController: true,
			templateUrl: '/apps/ddcs/common/chat-box/chat-box.tpl.html'
		}
	}
	chatBox.$inject = [];

	angular
		.module('ddcs.chat-box', [])
		.directive('chatBox', chatBox)
		.controller('chatBoxController', chatBoxController)
	;
}(angular));
//dmSrv, 'cObj.events'
//eventMsg
