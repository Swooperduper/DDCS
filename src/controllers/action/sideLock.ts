/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function setSideLockFlags() {
    // console.log('SETSIDELOCKGFLAGS ');
    const playerSideLockTable: any[] = [];
    return ddcsController.sessionsActionsReadLatest()
        .then((latestSession: any) => {
            if (latestSession.name) {
                return ddcsController.srvPlayerActionsRead({sessionName: latestSession.name})
                    .then((playerArray: any) => {
                        _.forEach(playerArray, (player) => {
                            let lockObj;
                            const lockedSide =  player.sideLock;
                            if (player.isGameMaster) {
                                lockObj = {
                                    ucid: player._id + "_GM",
                                    val: 1
                                };
                            } else {
                                if (lockedSide > 0) {
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
                        });

                        console.log("setSideLock: ", playerSideLockTable);
                        return ddcsController.cmdQueActionsSave({
                            actionObj: {
                                action : "SETSIDELOCK",
                                data: playerSideLockTable
                            },
                            queName: "clientArray"
                        })
                            .catch((err) => console.log("error" + " line41: ", err) );
                    })
                    .catch((err) => console.log("line80", err) );
            }
        })
        .catch((err) => console.log("line86", err) );
}
