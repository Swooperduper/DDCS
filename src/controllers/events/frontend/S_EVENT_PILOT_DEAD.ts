/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventPilotDead(eventObj: any): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const nowTime = new Date().getTime();
    const iUnit = await ddcsControllers.unitActionRead({unitId: eventObj.data.initiator.unitId});
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
    if (iUnit[0]) {
        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName: ddcsControllers.getSessionName(),
                eventCode: ddcsControllers.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: iUnit[0].playername,
                displaySide: "A",
                roleCode: "I",
                msg: "A: " + ddcsControllers.side[iUnit[0].coalition] + " " + iUnit[0].type + "(" + iUnit[0].playername +
                    ") pilot is dead",
                groupId: iUnit[0].groupId
            };
            /*
            if (iCurObj.iucid) {
                await ddcsControllers.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await ddcsControllers.simpleStatEventActionsSave(iCurObj);
            }
             */
            await ddcsControllers.srvPlayerActionsClearTempScore({_id: iCurObj.iucid, groupId: iCurObj.groupId});

            if (engineCache.config.inGameHitMessages) {
                await ddcsControllers.sendMesgToAll(
                    "PILOTISDEAD",
                    ["#" + iUnit[0].coalition, iUnit[0].type, iUnit[0].playername],
                    5,
                    nowTime + ddcsControllers.time.oneMin
                );
            }
        }
    }
}
