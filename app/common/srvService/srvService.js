/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

(function (angular) {
	'use strict';

	function srvService(DCSServerAPI, alertService) {
		var dSrv = this;

		dSrv.createServer = function (server) {
			var dsave = DCSServerAPI.save(server);
			dsave.$promise
				.then(function(data) {
					alertService.addAlert('success', 'Server successfully created!');
					dSrv.readServer();
					return data;
				})
				.catch(function(err){
					alertService.addAlert('danger', 'Server could not be created.');
					/* eslint-disable no-console */
					console.log(err);
					/* eslint-enable no-console */
				})
			;
		}

		dSrv.readServer = function() {
			var dread = DCSServerAPI.query();
			dread.$promise
				.then(function(data) {
					_.set(dSrv, 'servers', data);
				})
				.catch(function(err){
					alertService.addAlert('danger', 'Server service could not be queryed.');
					/* eslint-disable no-console */
					console.log(err);
					/* eslint-enable no-console */
				})
			;
		};

		dSrv.updateServer = function (server) {
			var dupdate = DCSServerAPI.updateOne(server);
			dupdate.$promise
				.then(function(data) {
					alertService.addAlert('success', 'Server options successfully saved!');
					return data;
				})
				.catch(function(err){
					alertService.addAlert('danger', 'Server options could not be updated.');
					/* eslint-disable no-console */
					console.log(err);
					/* eslint-enable no-console */
				})
			;
		};

		dSrv.deleteServer = function (server) {
			var ddelete = DCSServerAPI.delete(server);
			ddelete.$promise
				.then(function(data) {
					alertService.addAlert('success', 'Server has been successfully deleted!');
					dSrv.readServer();
					return data;
				})
				.catch(function(err){
					alertService.addAlert('danger', 'Server options could not be updated.');
					/* eslint-disable no-console */
					console.log(err);
					/* eslint-enable no-console */
				})
			;
		};

		dSrv.init = function () {
			dSrv.readServer();
		};
	}
	srvService.$inject = ['ddcs.api.server', 'alertService'];

	function initializeSrvService (srvService) {
		srvService.init();
	}
	initializeSrvService.$inject = ['srvService'];

	angular
		.module('ddcs.srvService',['ddcs.api.server', 'ddcs.alertService'])
		.service('srvService', srvService)
		.run(initializeSrvService)
	;
})(angular);
