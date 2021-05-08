/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

(function (angular) {
	'use strict';

	function unitStaticsFactory($resource){
		var resourceUrl = '/api/unitStatics';
		return $resource(
			resourceUrl,
			{name: '@serverName'},
			{
				query: {
					method: 'GET',
					url: resourceUrl + '/:serverName',
					isArray:true
				}
			}
		);
	}
	unitStaticsFactory.$inject = ['$resource'];

	angular.module('ddcs.api.unitStatics', ['ngResource'])
		.factory('ddcs.api.unitStatics', unitStaticsFactory);
}(angular));
