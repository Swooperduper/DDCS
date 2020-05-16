/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
var _ = require('lodash');
var masterDBController = require('../db/masterDB');
// game mission commands
_.assign(exports, {
    forcePlayerSpectator: function (serverName, playerId, mesg) {
        var curCMD;
        var sendClient;
        var actionObj;
        curCMD = 'net.force_player_slot(' + playerId + ', 0, "")';
        sendClient = { action: "CMD", cmd: curCMD, reqID: 0 };
        actionObj = { actionObj: sendClient, queName: 'gameGuiArray' };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line65: ', err);
        });
        curCMD = 'net.send_chat([[' + mesg + ']], all)';
        sendClient = { action: "CMD", cmd: curCMD, reqID: 0 };
        actionObj = { actionObj: sendClient, queName: 'gameGuiArray' };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line73: ', err);
        });
    },
    kickPlayer: function (serverName, playerId, mesg) {
        var curCMD = 'net.kick(' + playerId + ', [[' + mesg + ']])';
        var sendClient = { action: "CMD", cmd: curCMD, reqID: 0 };
        var actionObj = { actionObj: sendClient, queName: 'gameGuiArray' };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line56: ', err);
        });
    },
    loadMission: function (serverName, missionName) {
        var curCMD = 'net.load_mission([[' + missionName + ']])';
        var sendClient = { action: "CMD", cmd: curCMD, reqID: 0 };
        var actionObj = { actionObj: sendClient, queName: 'gameGuiArray' };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line65: ', err);
        });
    },
    sendMesgChatWindow: function (serverName, mesg) {
        var curCMD = 'net.send_chat([[' + mesg + ']], true)';
        var sendClient = { action: "CMD", cmd: curCMD, reqID: 0 };
        var actionObj = { actionObj: sendClient, queName: 'gameGuiArray' };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line45: ', err);
        });
    },
    sendMesgToAll: function (serverName, mesg, time, delayTime) {
        var curCMD = 'trigger.action.outText([[' + mesg + ']], ' + time + ')';
        var sendClient = { action: "CMD", cmd: [curCMD], reqID: 0 };
        var actionObj = { actionObj: sendClient, queName: 'clientArray', timeToExecute: delayTime };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line16: ', err);
        });
    },
    sendMesgToCoalition: function (coalition, serverName, mesg, time, delayTime) {
        var curCMD = 'trigger.action.outTextForCoalition(' + coalition + ', [[' + mesg + ']], ' + time + ')';
        var sendClient = { action: "CMD", cmd: [curCMD], reqID: 0 };
        var actionObj = { actionObj: sendClient, queName: 'clientArray', timeToExecute: delayTime };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line27: ', err);
        });
    },
    sendMesgToGroup: function (groupId, serverName, mesg, time, delayTime) {
        var curCMD = 'trigger.action.outTextForGroup(' + groupId + ', [[' + mesg + ']], ' + time + ')';
        var sendClient = { action: "CMD", cmd: [curCMD], reqID: 0 };
        var actionObj = { actionObj: sendClient, queName: 'clientArray', timeToExecute: delayTime };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line38: ', err);
        });
    },
    setIsOpenSlotFlag: function (serverName, lockFlag) {
        var sendClient = { action: "SETISOPENSLOT", val: lockFlag };
        var actionObj = { actionObj: sendClient, queName: 'clientArray' };
        masterDBController.cmdQueActions('save', serverName, actionObj)["catch"](function (err) {
            console.log('erroring line38: ', err);
        });
    }
});
