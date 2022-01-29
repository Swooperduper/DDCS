/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventEjection(eventObj: any): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const nowTime = new Date().getTime();
    const iUnit = await ddcsControllers.unitActionRead({unitId: eventObj.data.initiator.unitId});
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
    const curIUnit = iUnit[0];
    if (curIUnit) {
        console.log("Player Ejected - curIUnit:",curIUnit);
        const curUnitDictionary = _.find(engineCache.unitDictionary, {_id: curIUnit.type});
        let curUnitwarbondCost = (curUnitDictionary) ? curUnitDictionary.warbondCost : 1;
        let warbondsToRefund = curUnitwarbondCost * engineCache.config.ejectionRefundModifier
        await ddcsControllers.processUnitUpdates({action: "D", data: {name: curIUnit.name}});

        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
        await ddcsControllers.addWarbonds(
            iPlayer,
            iUnit[0],
            "Eject",
            warbondsToRefund
        );
        if (iPlayer) {
            const iCurObj = {
                sessionName: ddcsControllers.getSessionName(),
                eventCode: ddcsControllers.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: curIUnit.playername,
                displaySide: "A",
                roleCode: "I",
                msg: ddcsControllers.side[curIUnit.coalition] + " " + curIUnit.type + "(" + curIUnit.playername +
                    ") ejected",
                groupId: curIUnit.groupId
            };
            /*
            if (iCurObj.iucid) {
                await ddcsControllers.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await ddcsControllers.simpleStatEventActionsSave(iCurObj);
            }
             */
            await ddcsControllers.srvPlayerActionsClearTempWarbonds({_id: iCurObj.iucid, groupId: iCurObj.groupId});

            if (engineCache.config.inGameHitMessages) {
                await ddcsControllers.sendMesgToAll(
                    "PLAYEREJECTED",
                    ["#" + curIUnit.coalition, curIUnit.type, curIUnit.playername],
                    5,
                    nowTime + ddcsControllers.time.oneMin
                );
            }
        }
    }
}
