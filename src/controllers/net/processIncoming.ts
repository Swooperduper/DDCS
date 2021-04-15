import * as _ from "lodash";
import * as ddcsController from "../";
import { dbModels } from "../db/common";
import * as typings from "../../typings";
import {I18nResolver} from "i18n-ts";
import {ISrvPlayers} from "../../typings";
import * as ddcsControllers from "../action/aiConvoys";

export async function processingIncomingData(incomingObj: any) {
    switch (incomingObj.action) {
        case "serverInfo":
            await ddcsController.getLatestSession(incomingObj);
            break;
        case "C":
            await ddcsController.processUnitUpdates(incomingObj);
            break;
        case "U":
            await ddcsController.processUnitUpdates(incomingObj);
            break;
        case "D":
            await ddcsController.processUnitUpdates(incomingObj);
            break;
        case  "airbaseC":
            await ddcsController.processAirbaseUpdates(incomingObj);
            break;
        case  "airbaseU":
            await ddcsController.processAirbaseUpdates(incomingObj);
            break;
        case "f10Menu":
            await ddcsController.menuCmdProcess(incomingObj);
            break;
        case "S_EVENT_SHOT":
            await ddcsController.processEventShot(incomingObj);
            break;
        case "S_EVENT_HIT":
            // not using hit anymore for kills
            // await ddcsController.processEventHit(incomingObj);
            break;
        case "S_EVENT_KILL":
            await ddcsController.processEventKill(incomingObj);
            break;
        case "S_EVENT_TAKEOFF":
            await ddcsController.processEventTakeoff(incomingObj);
            break;
        case "S_EVENT_LAND":
            await ddcsController.processEventLand(incomingObj);
            break;
        case "S_EVENT_EJECTION":
            // await ddcsController.processEventEjection(incomingObj);
            break;
        case "S_EVENT_CRASH":
            // await ddcsController.processEventCrash(incomingObj);
            break;
        case "S_EVENT_DEAD":
            await ddcsController.processEventDead(incomingObj);
            break;
        case "S_EVENT_PILOT_DEAD":
            await ddcsController.processEventPilotDead(incomingObj);
            break;
        case "S_EVENT_REFUELING":
            // await ddcsController.processEventRefueling(incomingObj);
            break;
        case "S_EVENT_REFUELING_STOP":
            // await ddcsController.processEventRefuelingStop(incomingObj);
            break;
        case "S_EVENT_BIRTH":
            // console.log("player unit birth: ", incomingObj);
            await ddcsController.processEventBirth(incomingObj);
            break;
        case "S_EVENT_PLAYER_ENTER_UNIT":
            // console.log("player enter unit1");
            await ddcsController.processEventPlayerEnterUnit(incomingObj);
            break;
        case "S_EVENT_PLAYER_LEAVE_UNIT":
            // console.log("player EXIT unit1");
            // await ddcsController.processEventPlayerLeaveUnit(incomingObj);
            break;
        case "unitsAlive":
            await ddcsController.sendMissingUnits(incomingObj.data);
            break;
        case "playerStats":
            await ddcsController.processPlayerEvent(incomingObj);
            break;
        case "friendly_fire":
            await ddcsController.processFriendlyFire(incomingObj);
            break;
        case "self_kill":
            await ddcsController.processSelfKill(incomingObj);
            break;
        case "connect":
            await ddcsController.processConnect(incomingObj);
            break;
        case "disconnect":
            await ddcsController.processDisconnect(incomingObj);
            break;
        case "change_slot":
            // console.log('CHANGE EVENT SLOT HAPPENED: ', queObj);
            // await ddcsController.processDisconnect(incomingObj);
            break;
        case "processReq":
            const curReqJobObj = ddcsController.getRequestJob(incomingObj.reqId);
            if (curReqJobObj) {
                // @ts-ignore
                await ddcsController[curReqJobObj.callBack](incomingObj, incomingObj.reqId, curReqJobObj.reqArgs);

                // cleanup request job array
                console.log("req array size before: ", ddcsController.getRequestJobSize());
                ddcsController.cleanRequestJobArray(incomingObj.reqId);
                console.log("req array size after: ", ddcsController.getRequestJobSize());
            } else {
                console.log("Cant find req Id: ", incomingObj.reqId);
            }
            break;
        case "incomingMessage":
            console.log("MESG: ", incomingObj.message);
            dbModels.srvPlayerModel.find({_id: incomingObj.from}, async (err: any, serverObj: typings.ISrvPlayers[]) => {
                if (err) { console.log("incomingMsgError: ", err); }
                const curPly = serverObj[0];
                const engineCache = ddcsController.getEngineCache();
                const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
                if (incomingObj.message === i18n.COMMANDRED) {
                    await ddcsController.lockUserToSide(incomingObj, 1);

                } else if (incomingObj.message === i18n.COMMANDBLUE) {
                    await ddcsController.lockUserToSide(incomingObj, 2);

                } else if (incomingObj.message === "-joinrandom") {
                    const randSide = _.random(1, 2);
                    await ddcsController.lockUserToSide(incomingObj, randSide);

                } else if (incomingObj.message === "-refreshMenu") {
                    const unit = await ddcsController.unitActionRead({playername: curPly.name});
                    if (unit.length > 0) {
                        await ddcsController.initializeMenu(unit[0]);
                        await ddcsController.sendMesgToPlayerChatWindow("Menu has been refreshed", curPly.playerId);
                    } else {
                        await ddcsController.sendMesgToPlayerChatWindow("You are not in a vehicle", curPly.playerId);
                    }

                } else if (_.includes(incomingObj.message, i18n.COMMANDDEFAULT)) {
                    const mesg = i18n.COMMANDDEFAULTRESPONSE;
                    await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
                }
            });

            /*
            if (incomingObj.message === "-reload") {
                await ddcsController.sendUDPPacket("backEnd", {
                    action: "refreshPlayerSlots"
                });
            }
             */
            /*
            if (incomingObj.message === "-se") {
                const carrierGroupName = "~Carrier|West|Lincoln|Red|";
                await ddcsController.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: ["Group.getByName(\"" + carrierGroupName + "\"):activate()"],
                        reqID: 0,
                        time: new Date()
                    }
                });
            }

            if (incomingObj.message === "-sr") {
                const carrierGroupName = "~Carrier|East|Roosevelt|Blue|";
                await ddcsController.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: ["Group.getByName(\"" + carrierGroupName + "\"):activate()"],
                        reqID: 0,
                        time: new Date()
                    }
                });
            }

            if (incomingObj.message === "-getdetect") {
                console.log("getdetect");
                await ddcsController.getAllDetectedUnitsByNameArray();
                await ddcsController.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "processGCIDetectionByName",
                        ewrNames: ["~Aerial-1"],
                        verbose: true,
                        reqID: 0
                    }
                });
            }
            */
            break;
        case "playerChangeSlot":
            if (incomingObj && incomingObj.occupiedUnitSide && incomingObj.playerInfo && (incomingObj.occupiedUnitSide === 0 ||
                (incomingObj.occupiedUnitSide.groupName && incomingObj.occupiedUnitSide.countryName))) {
                const curBaseName = incomingObj.occupiedUnitSide.groupName.split(" @")[0];
                const curSlotSide = _.includes(ddcsController.engineCache.config.countrySides[2],
                    _.toUpper(incomingObj.occupiedUnitSide.countryName)) ? 2 : 1;
                const bases = await ddcsController.baseActionRead({_id: curBaseName});
                // console.log("1: ", bases[0], incomingObj.playerInfo.ucid);
                if (bases.length > 0) {
                    dbModels.srvPlayerModel.find({_id: incomingObj.playerInfo.ucid}, async (err: any, serverObj: typings.ISrvPlayers[]) => {
                        if (err) { console.log("ERROR: " + err); }
                        // console.log("2: ", serverObj);
                        if (serverObj.length > 0) {
                            const curPlayer = serverObj[0];
                            const curSlotBase = bases[0];
                            await processSlotLock(curPlayer, curSlotBase.side, curSlotSide, incomingObj.playerInfo.id);
                        }
                    });
                }
            }
            break;
    }
}

export async function processSlotLock(curPlayer: ISrvPlayers, baseSide: number, curSlotSide: number, playerId: string) {
    const engineCache = ddcsController.getEngineCache();
    const i18n = new I18nResolver(engineCache.i18n, curPlayer.lang).translation as any;

    if (curPlayer.sideLock === 0) {
        await ddcsController.forcePlayerSpectator(playerId, i18n.CHOOSEASIDE);
    } else {
        if (curPlayer.sideLock !== curSlotSide) {
            await ddcsController.forcePlayerSpectator(playerId, i18n.PLAYERALREADYLOCKEDTOSIDE.replace("#1", i18n[curPlayer.sideLock]));
        }

        if (baseSide !== curSlotSide) {
            // message = "You must capture this base before you can occupy slot";
            // TODO: need to get this translation into every language...^^^^ using locked to side for now
            await ddcsController.forcePlayerSpectator(playerId, i18n.PLAYERALREADYLOCKEDTOSIDE.replace("#1", i18n[curPlayer.sideLock]));
        }
    }
}

export async function protectSlots(curPlayer: ISrvPlayers, playerSide: number, playerId: string) {
    const engineCache = ddcsController.getEngineCache();
    const i18n = new I18nResolver(engineCache.i18n, curPlayer.lang).translation as any;

    if (curPlayer.sideLock === 0 && playerSide !== 0) {
        await ddcsController.forcePlayerSpectator(playerId, i18n.CHOOSEASIDE);
    }

    if (playerSide !== 0 && curPlayer.sideLock !== playerSide) {
        await ddcsController.forcePlayerSpectator(playerId, i18n.PLAYERALREADYLOCKEDTOSIDE.replace("#1", i18n[curPlayer.sideLock]));
    }
}


