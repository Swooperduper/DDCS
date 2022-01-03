/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";
import * as _ from "lodash";

export async function processOneSecActions(fullySynced: boolean) {
    if (fullySynced) {
        const iCurObj ={
            sessionName: ddcsControllers.getSessionName(),
            secondsAgo: 3000
        }
        const totalDisconnects = await ddcsControllers.simpleStatEventActionsReadDisconnectsInLastSeconds(iCurObj)
        if(totalDisconnects.length > 0){
            console.log("Clients Disconnected en masse - There were a total of disconnects", totalDisconnects.length, "in the past", iCurObj.secondsAgo,"seconds.")
            const mesg = "**Clients Disconnected en masse** \n DCS.exe stopped sending network traffic for a time \n LP will be refunded \n DCS.log:"
            ddcsControllers.sendMessageToDiscord(mesg);
            ddcsControllers.sendLogFileToDiscord();
            for (const player of totalDisconnects){
                let iCurObj =   {_id: player._id,
                                showInChart : false,
                };
                await ddcsControllers.simpleStatEventActionUpdate(iCurObj);
            }
            const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
            for (const player of totalDisconnects){
                let iPlayer = _.find(playerArray, {name: player.iName});
                if (iPlayer){
                    let iObject = {_id: iPlayer._id,
                        warbonds: iPlayer.warbonds + iPlayer.tmpWarbonds,
                        tmpWarbonds: 0
                    };
                    ddcsControllers.srvPlayerActionsUpdate({iObject});
                    console.log("Refunded ",iPlayer.tmpWarbonds, " to ", iPlayer.name, "due to a mass disconnect event");
                    console.log("iObject:",iObject)
                }                
            }
        }
    }
}
