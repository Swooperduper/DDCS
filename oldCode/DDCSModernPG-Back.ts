/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const constants = require('../../DynamicDCS/controllers/constants');
const DCSSocket = require('../../DynamicDCS/controllers/net/DCSSocket');
const masterDBController = require('../../DynamicDCS/controllers/db/masterDB');
const playersEvent = require('../../DynamicDCS/controllers/events/backend/players');
const friendlyFireEvent = require('../../DynamicDCS/controllers/events/backend/friendlyFire');
const selfKillEvent = require('../../DynamicDCS/controllers/events/backend/selfKill');
const connectEvent = require('../../DynamicDCS/controllers/events/backend/connect');
const disconnectEvent = require('../../DynamicDCS/controllers/events/backend/disconnect');
const commsUserProcessing = require('../../DynamicDCS/controllers/discordBot/commsUserProcessing');
const serverTimerController = require('../../DynamicDCS/controllers/action/serverTimer');

//config
var commsCounter = 0;
var masterServer = '127.0.0.1';
var serverName = 'DDCSModernPG';
var lastSentLoader = new Date().getTime();

masterDBController.initDB(serverName, masterServer)
	.then(function() {
		constants.initServer(serverName)
			.then(function () {
				//checks to see if socket needs restarting every 3 secs
				setInterval(function () {
					if (exports.DCSSocket) {
						if (exports.DCSSocket.connOpen) {
							console.log('Connecting to ' + serverName + ' Backend');
							exports.DCSSocket.connSocket();
						}
					} else {
						exports.DCSSocket = new DCSSocket.createSocket(serverName, 'localhost', _.get(constants, 'config.dcsGameGuiPort'), 'gameGuiArray', exports.socketCallback, 'backend');
					}
				}, 5 * 1000);

				_.set(exports, 'getLatestSession', function (serverName) {
					masterDBController.sessionsActions('readLatest', serverName, {})
						.then(function (latestSession) {
							if (latestSession) {
								if (_.get(exports, 'sessionName') !== latestSession.name) {
									console.log('New Session: ', latestSession);
									lastSentLoader = new Date().getTime();
									_.set(exports, 'sessionName', latestSession.name);
								}
							}
						})
						.catch(function (err) {
							console.log('line43', err);
						})
					;
				});

				_.set(exports, 'socketCallback', function (serverName, cbArray) {
					var curTime;
					var missionArray;
					var missionFileArray;
					var missionPath;
					// console.log('BB: ', cbArray.que);
					exports.getLatestSession(serverName);
					_.forEach(_.get(cbArray, 'que', []), function (queObj) {
						if (_.get(queObj, 'action') === 'mission') {
							curTime = new Date().getTime();
							missionArray = _.split(_.get(queObj, 'data'), '\\');
							missionFileArray = _.split(_.last(missionArray), '_');
							// console.log('missionTime: ', curTime, missionArray, missionFileArray, _.last(missionFileArray) === 'Loader.miz', curTime > lastSentLoader + _.get(constants, 'time.oneMin'), curTime, ' > ', lastSentLoader + _.get(constants, 'time.oneMin'), lastSentLoader);
							if (_.last(missionFileArray) === 'Loader.miz' && curTime > lastSentLoader + _.get(constants, 'time.oneMin')) {
								missionArray.pop();
								missionPath = _.join(missionArray, '/') + '/' + _.first(missionFileArray);
								// console.log('missionPath: ', missionPath, serverName);
								masterDBController.serverActions('update', {
									name: serverName,
									curFilePath: missionPath
								})
									.catch(function (err) {
										console.log('line73: ', err);
									})
								;
								// console.log('mis: ', missionArray, missionPath);
								serverTimerController.restartServer(serverName);
								lastSentLoader = curTime;
							}
						}
						if (_.get(queObj, 'action') === 'players') {
							playersEvent.processPlayerEvent(serverName, exports.sessionName, queObj);
							if (commsCounter > 59) {
								commsUserProcessing.checkForComms(serverName, _.get(constants, 'config.isDiscordAllowed', false), queObj.data);
								commsCounter = 0;
							}
							commsCounter++;
							// console.log('PLAYERS: ', queObj.data);
						}

						if (_.get(queObj, 'action') === 'friendly_fire') {
							friendlyFireEvent.processFriendlyFire(serverName, exports.sessionName, queObj);
						}

						if (_.get(queObj, 'action') === 'self_kill') {
							selfKillEvent.processSelfKill(serverName, exports.sessionName, queObj);
						}

						if (_.get(queObj, 'action') === 'connect') {
							connectEvent.processConnect(serverName, exports.sessionName, queObj);
						}

						if (_.get(queObj, 'action') === 'disconnect') {
							disconnectEvent.processDisconnect(serverName, exports.sessionName, queObj);
						}
						if (_.get(queObj, 'action') === 'change_slot') {
							//console.log('CHANGE EVENT SLOT HAPPENED: ', queObj);
							//disconnectEvent.processDisconnect(serverName, exports.sessionName, queObj);
						}
					});
				});
			})
			.catch(function (err) {
				console.log('line61', err);
			})
		;
	})
	.catch(function (err) {
		console.log('line267', err);
	})
;

