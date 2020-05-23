/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

export async function setSideLockFlags(): Promise<void> {
    const playerSideLockTable: any[] = [];
    const latestSession = await ddcsControllers.sessionsActionsReadLatest();
    if (latestSession.name) {
        const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: latestSession.name});
        for (const player of playerArray) {
            let lockObj;
            if (player.isGameMaster) {
                lockObj = {
                    ucid: player._id + "_GM",
                    val: 1
                };
            } else {
                if (player.sideLock > 0) {
                    lockObj = {
                        ucid: player._id + "_" + player.sideLock,
                        val: 1
                    };
                } else {
                    lockObj = {
                        ucid: player._id + "_" + player.sideLock,
                        val: 0
                    };
                }
            }
            playerSideLockTable.push(lockObj);
        }

        console.log("setSideLock: ", playerSideLockTable);
        ddcsControllers.sendUDPPacket("frontEnd", {
            actionObj: {
                action : "SETSIDELOCK",
                data: playerSideLockTable
            },
            queName: "clientArray"
        });
    }
}
