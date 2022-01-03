/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function processOneSecActions(fullySynced: boolean) {
    if (fullySynced) {
        const iCurObj ={
            sessionName: ddcsControllers.getSessionName(),
            secondsAgo: 1
        }
        const totalDisconnects = await ddcsControllers.simpleStatEventActionsReadDisconnectsInLastSeconds(iCurObj)
        if(totalDisconnects.length > 3){
            console.log("There were a total of disconnects", totalDisconnects.length, "in the past", iCurObj.secondsAgo,"seconds.")
            for (const player of totalDisconnects){
                console.log("player.name:", player.iName);
            }
        }
    }
}

