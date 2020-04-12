/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const net = require('net');
const _ = require('lodash');
const masterDBController = require('../db/masterDB');
const sychrontronController = require('../sychronize/Sychrontron');

var lastSyncTime = new Date().getTime();
var syncSpawnTimer = 1* 60 * 1000;

exports.createSocket = function (serverName, address, port, queName, callback, type) {
	var sock = this;
	var socketSpeed;
	var cnt = 0;
	var sockConn;
	_.set(sock, 'cQue', []);
	_.set(sock, 'serverName', serverName);
	_.set(sock, 'connOpen', true);
	_.set(sock, 'buffer', {});
	_.set(sock, 'startTime', new Date().valueOf() );
	_.set(sock, 'sessionName', serverName+'_'+sock.startTime+' ' + queName + ' Node Server Starttime');

	if (type === 'frontend') {
		socketSpeed = 200;
	}
	if (type === 'backend') {
		socketSpeed = 1000;
	}

	setInterval(function () { //sending FULL SPEED AHEAD, 1 per milsec (watch for weird errors, etc)
		var curTime = new Date().getTime();
		if (sychrontronController.isSyncLockdownMode && !sychrontronController.isServerSynced){
			if (sychrontronController.processInstructions) {
				if (lastSyncTime + syncSpawnTimer < curTime) {
					masterDBController.cmdQueActions('grabNextQue', serverName, {queName: queName})
						.then(function (resp) {
							if (resp) {
								sock.cQue.push(resp.actionObj);
							}
						})
						.catch(function (err) {
							console.log('erroring line34: ', err);
						})
					;
				}
			}
		} else {
			masterDBController.cmdQueActions('grabNextQue', serverName, {queName: queName})
				.then(function (resp) {
					if (resp) {
						sock.cQue.push(resp.actionObj);
					}
				})
				.catch(function (err) {
					console.log('erroring line34: ', err);
				})
			;
		}
	}, socketSpeed);

	sock.connSocket = function () {
		sockConn = net.createConnection({
			host: address,
			port: port
		}, function () {
			var time = new Date();
			console.log('Connected to DCS Client at '+address+':'+port+' !');
			_.set(sock, 'connOpen', false);
			sock.buffer = [];
		});
		sockConn.on('connect', function () {
			sock.startTime = new Date().valueOf() ;
			sock.sessionName = serverName+'_'+sock.startTime;
			sockConn.write('{"action":"NONE"}' + "\n");
		});

		sockConn.on('data', function (data) {
			sock.buffer += data;
			while ((i = sock.buffer.indexOf("\n")) >= 0) {
				var curStr;
				var nextInst;
				var strJson;
				var isValidJSON = true;
				var subStr = sock.buffer.substring(0, i);
				try { JSON.parse(subStr) } catch(e) { isValidJSON = false }
				if (isValidJSON) {
					curStr = JSON.parse(subStr);
				} else {
					curStr = '{}';
					console.log('bad substring: ', subStr);
				}
				callback(serverName, curStr);
				sock.buffer = sock.buffer.substring(i + 1);
				nextInst = _.get(sock, ['cQue', 0]);
				// console.log('sendPack: ', nextInst);
				// strJson = (JSON.stringify(nextInst)) ? JSON.stringify(nextInst) : '{"action":"NONE"}' ;
				strJson = (nextInst) ? JSON.stringify(nextInst) : '{"action":"NONE"}' ;
				sockConn.write( strJson + "\n");
				if (nextInst) {
					sock.cQue.shift();
				}
			}
		});

		sockConn.on('close', function () {
			time = new Date();
			console.log(' Reconnecting DCS Client on '+ address +':'+port+'....');
			_.set(sock, 'connOpen', true);
		});

		sockConn.on('error', function (err) {
			_.set(sock, 'connOpen', true);
			console.log('Client Error: ', err);
		});
	};
};
