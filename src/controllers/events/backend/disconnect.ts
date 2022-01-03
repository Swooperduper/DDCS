/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processDisconnect(eventObj: any): Promise<void> {
    // "disconnect", playerID, name, playerSide, reason_code
    const playerInfo = eventObj.playerInfo
    console.log ("playerInfo:",playerInfo)
    const iCurObj = {
        _id: playerInfo.ucid + new Date,
        sessionName: ddcsControllers.getSessionName(),
        showInChart : true,
        eventCode: ddcsControllers.shortNames[eventObj.action],
        iucid: playerInfo.ucid,
        iName: playerInfo.name,
        displaySide: "A",
        roleCode: "I",
        msg: "A: " + playerInfo.name + " has disconnected - Ping:" + playerInfo.ping + " Lang:" + playerInfo.lang
    };
    console.log(iCurObj.msg);
    await ddcsControllers.simpleStatEventActionsSave(iCurObj);

}
