/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function processOneSecActions(fullySynced: boolean) {
    if (fullySynced) {
        const iCurObj ={
            sessionName: ddcsControllers.getSessionName(),
            secondsAgo: 3000
        }
        const totalDisconnects = await ddcsControllers.simpleStatEventActionsReadDisconnectsInLastSeconds(iCurObj)
        if(totalDisconnects.length > 2){
            console.log("There were a total of disconnects", totalDisconnects.length, "in the past", iCurObj.secondsAgo,"seconds.")
            const mesg = "**Clients Disconnected en masse** \n DCS.exe stopped sending network traffic for a time \n LP will be refunded \n DCS.log:"
            ddcsControllers.sendMessageToDiscord(mesg);
            for (const player of totalDisconnects){
                console.log(player._id)
                let iCurObj =   {_id: player._id,
                                showInChart : false,
                }
                await ddcsControllers.simpleStatEventActionUpdate(iCurObj)
                console.log("player.name:", player.iName);
            }
        }
    }
}