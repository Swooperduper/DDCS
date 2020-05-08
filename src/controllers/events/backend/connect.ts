/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// import * as _ from "lodash";
// import * as ddcsController from "../../";

export async function processConnect(sessionName: string, eventObj: any): Promise<void> {
    eventObj.data.mesg = "A: " + eventObj.data.arg2 || "?" + " has connected";
    // await ddcsController.sendToAll({payload: eventObj});
    // "connect", playerID, name - no ucid lookup yet
    /*
    DCSLuaCommands.sendMesgToAll(
        serverName,
        mesg,
        5
    );
    */
}

