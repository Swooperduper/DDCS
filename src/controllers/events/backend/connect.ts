/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as webPushCommands from "../../socketIO/webPush";

export async function processConnect(sessionName: string, eventObj: any) {
    eventObj.data.mesg = "A: " + eventObj.data.arg2 || "?" + " has connected";
    webPushCommands.sendToAll({payload: eventObj});
    // "connect", playerID, name - no ucid lookup yet
    /*
    DCSLuaCommands.sendMesgToAll(
        serverName,
        mesg,
        5
    );
    */
}

