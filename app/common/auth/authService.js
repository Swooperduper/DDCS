/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

(function (angular) {
	'use strict';

	function authService($state, angularAuth0, $timeout, userAccountService) {

		var userProfile;
		function login() {
			angularAuth0.authorize();
		}

		function handleAuthentication() {
			angularAuth0.parseHash(function(err, authResult) {
				if (authResult && authResult.idToken) {
					setSession(authResult);
					getProfile();
				} else if (err) {
					$timeout(function() {
						location.reload();
					});
					/* eslint-disable no-console */
					console.log(err);
					/* eslint-enable no-console */
					alert('Error: ' + err.error + '. Check the console for further details.');
				}
			});
		}

		function getProfile() {
			if (localStorage.getItem('access_token') !== null) {
				var accessToken = localStorage.getItem('access_token');
				if (!accessToken) {
					/* eslint-disable no-console */
					console.log('Access token must exist to fetch profile');
					/* eslint-enable no-console */
				}
				angularAuth0.client.userInfo(accessToken, function(err, profile) {
					if (profile) {
						setUserProfile(profile);
					}
				});
			}
		}

		function setUserProfile(profile) {
			userProfile = profile;
			userAccountService.checkUserAccount(profile);
		}

		function getCachedProfile() {
			return userProfile;
		}

		function setSession(authResult) {
			// Set the time that the access token will expire at
			var expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());

			var scopes = authResult.scope || '';

			//console.log('sub is: ', authResult.idTokenPayload.sub);

			localStorage.setItem('access_token', authResult.accessToken);
			localStorage.setItem('id_token', authResult.idToken);
			localStorage.setItem('sub', authResult.idTokenPayload.sub);
			localStorage.setItem('expires_at', expiresAt);
			localStorage.setItem('scopes', JSON.stringify(scopes));
		}

		function logout() {
			// Remove tokens and expiry time from localStorage
			localStorage.removeItem('access_token');
			localStorage.removeItem('id_token');
			localStorage.removeItem('sub');
			localStorage.removeItem('expires_at');
			localStorage.removeItem('scopes');
			$state.go('index');
		}

		function isAuthenticated() {
			var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
			return new Date().getTime() < expiresAt;
		}

		function userHasScopes(scopes) {
			var grantedScopes = JSON.parse(localStorage.getItem('scopes')).split(' ');
			for (var i = 0; i < scopes.length; i++) {
				if (grantedScopes.indexOf(scopes[i]) < 0) {
					return false;
				}
			}
			return true;
		}

		return {
			login: login,
			getProfile: getProfile,
			getCachedProfile: getCachedProfile,
			handleAuthentication: handleAuthentication,
			logout: logout,
			isAuthenticated: isAuthenticated,
			userHasScopes: userHasScopes
		}
	}

	authService.$inject = ['$state', 'angularAuth0', '$timeout', 'userAccountService'];

	angular
		.module('ddcs.authService',[
			'ddcs.userAccountService'
		])
		.service('authService', authService)
	;
})(angular);
