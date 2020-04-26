/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const constants = require('../../DynamicDCS/controllers/constants');
const DCSSocket = require('../../DynamicDCS/controllers/net/DCSSocket');
const masterDBController = require('../../DynamicDCS/controllers/db/masterDB');
const menuCmdsController = require('../../DynamicDCS/controllers/menu/menuCmds');
const unitsStaticsController = require('../../DynamicDCS/controllers/serverToDbSync/unitsStatics');
const staticCratesController = require('../../DynamicDCS/controllers/action/staticCrates');
const airbaseSyncController = require('../../DynamicDCS/controllers/serverToDbSync/airbaseSync');
const sychrontronController = require('../../DynamicDCS/controllers/sychronize/Sychrontron');
const recoveryController = require('../../DynamicDCS/controllers/sychronize/recovery');
const jtacController = require('../../DynamicDCS/controllers/action/jtac');
const minutesPlayedController = require('../../DynamicDCS/controllers/action/minutesPlayed');
const serverTimerController = require('../../DynamicDCS/controllers/action/serverTimer');
const processEventHit = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_HIT');
const processEventTakeoff = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_TAKEOFF');
const processEventLand = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_LAND');
const processEventEjection = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_EJECTION');
const processEventCrash = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_CRASH');
const processEventDead = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_DEAD');
const processEventPilotDead = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_PILOT_DEAD');
const processEventRefueling = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_REFUELING');
const processEventRefuelingStop = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_REFUELING_STOP');
const processEventBirth = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_BIRTH');
const processEventPlayerEnterUnit = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_PLAYER_ENTER_UNIT');
const processEventPlayerLeaveUnit = require('../../DynamicDCS/controllers/events/frontend/S_EVENT_PLAYER_LEAVE_UNIT');
const processTimedOneSec = require('../../DynamicDCS/controllers/timedEvents/oneSec');
const processTimedFiveSecs = require('../../DynamicDCS/controllers/timedEvents/fiveSecs');
const processTimedThirtySecs = require('../../DynamicDCS/controllers/timedEvents/thirtySecs');
const processTimedFiveMinutes = require('../../DynamicDCS/controllers/timedEvents/fiveMinutes');
const processTimedTenMinutes = require('../../DynamicDCS/controllers/timedEvents/tenMinutes');
const processTimedThirtyMinutes = require('../../DynamicDCS/controllers/timedEvents/thirtyMinutes');
const processOneHour = require('../../DynamicDCS/controllers/timedEvents/oneHour');

//config
var masterServer = '127.0.0.1';
var serverName = 'DDCSModernPG';

masterDBController.initDB(serverName, masterServer)
	.then(function() {
		constants.initServer(serverName)
			.then(function () {
				//checks to see if socket needs restarting every 3 secs
				setInterval(function () {
					if (exports.DCSSocket) {
						if (exports.DCSSocket.connOpen) {
							console.log('Connecting to ' + serverName + ' Frontend');
							_.set(exports, 'sessionName', '');
							sychrontronController.isSyncLockdownMode = false;
							masterDBController.cmdQueActions('removeall', serverName, {})
								.then(function () {
									exports.DCSSocket.connSocket();
								})
								.catch(function (err) {
									console.log('line62', err);
								})
							;
						}
					} else {
						exports.DCSSocket = new DCSSocket.createSocket(serverName, 'localhost', _.get(constants, 'config.dcsClientPort'), 'clientArray', exports.socketCallback, 'frontend');
					}
				}, 3 * _.get(constants, 'time.sec'));

				_.set(exports, 'getLatestSession', function (serverName, serverEpoc, startAbs, curAbs) {
					if (serverEpoc) {
						let sessionName = serverName + '_' + serverEpoc;
						let newSession = {
							_id: sessionName,
							name: sessionName
						};
						if (curAbs) {
							_.set(newSession, 'startAbsTime', startAbs);
							_.set(newSession, 'curAbsTime', curAbs);
						}
						masterDBController.sessionsActions('readLatest', serverName, {})
							.then(function (latestSession) {
								// console.log('sn: ', serverEpoc, startAbs, curAbs, latestSession.name);
								console.log('create new session: ', sessionName, ' !== ', _.get(latestSession,'name', ''), ' || ',  _.get(exports, ['curAbsTime'], 0), ' > ', curAbs);
								if (sessionName !== _.get(latestSession,'name', '') || _.get(exports, ['curAbsTime'], 0) > curAbs) {
									minutesPlayedController.resetMinutesPlayed(serverName);
									masterDBController.campaignsActions('readLatest', serverName, {})
										.then(function (campaign) {
											// console.log('CAMP: ', campaign);
											if (campaign) {
												_.set(newSession, 'campaignName', campaign.name);
												// console.log('SESS: ', newSession);
												masterDBController.sessionsActions('update', serverName, newSession)
													.then(function(newSessionName) {
														console.log('SESSNAME: ', newSession, newSessionName);
														_.set(exports, 'sessionName', sessionName)
													})
													.catch(function (err) {
														console.log('line49', err);
													})
												;
											}
										})
										.catch(function (err) {
											console.log('line90', err);
										})
									;
								} else {
									console.log('use existing session: ', sessionName);
									masterDBController.sessionsActions('update', serverName, newSession)
										.then(function() {
											_.set(exports, 'sessionName', sessionName);
										})
										.catch(function (err) {
											console.log('line55', err);
										})
									;
								}
							})
							.catch(function (err) {
								console.log('line49', err);
							})
						;
					}
				});

				_.set(exports, 'socketCallback', function (serverName, cbArray) {
					_.assign(exports, {
						curAbsTime: cbArray.curAbsTime,
						realServerSecs: cbArray.curAbsTime - cbArray.startAbsTime,
						startAbsTime: cbArray.startAbsTime
					});
					if (!sychrontronController.isServerSynced) {
						console.log('SYNC: ', sychrontronController.isServerSynced);
					}
					// console.log('CB: ', !_.get(exports, 'sessionName'));
					// console.log('ISS: ', sychrontronController.isServerSynced, exports.sessionName);
					_.set(exports, 'curServerUnitCnt', cbArray.unitCount);
					if(!_.get(exports, 'sessionName')) {
						console.log('getLatestSession: ');
						exports.getLatestSession(serverName, cbArray.epoc, cbArray.startAbsTime,  cbArray.curAbsTime);
					} else {
						_.forEach(_.get(cbArray, 'que', []), function (queObj) {
							if ((_.get(queObj, 'action') === 'C') || (_.get(queObj, 'action') === 'U') || (_.get(queObj, 'action') === 'D'))  {
								// console.log('CB: ', queObj.data);
								unitsStaticsController.processUnitUpdates(serverName, exports.sessionName, queObj);
							}

							if (_.get(queObj, 'action') === 'airbaseC' || _.get(queObj, 'action') === 'airbaseU') {
								airbaseSyncController.processAirbaseUpdates(serverName, queObj);
							}

							if ((_.get(queObj, 'action') === 'f10Menu') && sychrontronController.isServerSynced) {
								// console.log('CB: ', queObj);
								menuCmdsController.menuCmdProcess(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_HIT') && sychrontronController.isServerSynced) {
								processEventHit.processEventHit(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_TAKEOFF') && sychrontronController.isServerSynced) {
								processEventTakeoff.processEventTakeoff(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_LAND') && sychrontronController.isServerSynced) {
								processEventLand.processEventLand(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_EJECTION') && sychrontronController.isServerSynced) {
								processEventEjection.processEventEjection(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_CRASH') && sychrontronController.isServerSynced) {
								processEventCrash.processEventCrash(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_DEAD') && sychrontronController.isServerSynced) {
								processEventDead.processEventDead(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_PILOT_DEAD') && sychrontronController.isServerSynced) {
								processEventPilotDead.processEventPilotDead(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_REFUELING') && sychrontronController.isServerSynced) {
								processEventRefueling.processEventRefueling(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_REFUELING_STOP') && sychrontronController.isServerSynced) {
								processEventRefuelingStop.processEventRefuelingStop(serverName, exports.sessionName, queObj);
							}
							if ((_.get(queObj, 'action') === 'S_EVENT_BIRTH') && sychrontronController.isServerSynced) {
								processEventBirth.processEventBirth(serverName, exports.sessionName, queObj);
							}
							if ((_.get(queObj, 'action') === 'S_EVENT_PLAYER_ENTER_UNIT') && sychrontronController.isServerSynced) {
								processEventPlayerEnterUnit.processEventPlayerEnterUnit(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'S_EVENT_PLAYER_LEAVE_UNIT') && sychrontronController.isServerSynced) {
								processEventPlayerLeaveUnit.processEventPlayerLeaveUnit(serverName, exports.sessionName, queObj);
							}

							if ((_.get(queObj, 'action') === 'LOSVISIBLEUNITS') && sychrontronController.isServerSynced) {
								jtacController.processLOSEnemy(serverName, queObj);
							}

							if ((_.get(queObj, 'action') === 'CRATEOBJUPDATE') && sychrontronController.isServerSynced) {
								staticCratesController.processStaticCrate(serverName, queObj);
							}

							if (_.get(queObj, 'action') === 'unitsAlive') {
								recoveryController.sendMissingUnits(serverName, _.get(queObj, 'data'))
							}
						});
					}
				});

				setInterval(function () {
					if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
						processTimedOneSec.processOneSecActions(serverName, sychrontronController.isServerSynced);
					}
				}, _.get(constants, 'time.sec'));

				setInterval(function () {
					if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
						processTimedFiveSecs.processFiveSecActions(serverName, sychrontronController.isServerSynced);
					}
				}, _.get(constants, 'time.fiveSecs'));

				setInterval(function () {
					if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
						processTimedThirtySecs.processThirtySecActions(serverName, sychrontronController.isServerSynced);
						serverTimerController.processTimer(serverName, _.get(exports, 'realServerSecs', 0));
					} else {
						serverTimerController.timerObj = {}
					}
				}, _.get(constants, 'time.thirtySecs'));

				setInterval(function () {
					if (_.get(exports, 'sessionName')) {
						masterDBController.sessionsActions('update', serverName, {
							_id: _.get(exports, 'sessionName'),
							name: _.get(exports, 'sessionName'),
							startAbsTime: _.get(exports, 'startAbsTime'),
							curAbsTime: _.get(exports, 'curAbsTime')
						})
							.catch(function (err) {
								console.log('line240', err);
							})
						;
					}
				}, _.get(constants, 'time.oneMin'));

				setInterval(function () {
					if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
						processTimedFiveMinutes.processFiveMinuteActions(serverName, sychrontronController.isServerSynced);
					}
				}, _.get(constants, 'time.fiveMins'));

				setInterval(function () {
					if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
						processTimedTenMinutes.processTenMinuteActions(serverName, sychrontronController.isServerSynced);
					}
				}, _.get(constants, 'time.tenMinutes'));

				setInterval(function () {
					if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
						processTimedThirtyMinutes.processThirtyMinuteActions(serverName, sychrontronController.isServerSynced);
					}
				}, _.get(constants, 'time.thirtyMinutes'));

				setInterval(function () {
					if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
						processOneHour.processOneHourActions(serverName, sychrontronController.isServerSynced);
					}
				}, _.get(constants, 'time.oneHour'));

				setInterval(function () {
					if (constants.bases) {
						if (!_.get(exports, ['DCSSocket', 'connOpen'], true)) {
							sychrontronController.syncType(serverName, _.get(exports, 'curServerUnitCnt', -1));
						}
					}
				}, _.get(constants, 'time.sec'));
			})
			.catch(function (err) {
				console.log('line267', err);
			})
		;
	})
	.catch(function (err) {
		console.log('line267', err);
	})
;
