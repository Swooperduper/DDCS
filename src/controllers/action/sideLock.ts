/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";
import { dbModels } from "../db/common";
import * as typings from "../../typings";
import {sendMesgToPlayerChatWindow} from "../";

export async function lockUserToSide(incomingObj: any, lockToSide: number): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: incomingObj.from}, async (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            const curPly = serverObj[0];
            // console.log("current player: ", curPly, incomingObj);
            if (curPly && curPly.sideLock !== 0) {
                await sendMesgToPlayerChatWindow("Player ALREADY Locked to side " +
                    ddcsControllers.side[curPly.sideLock].toUpperCase(), curPly.playerId);
            } else {
                // console.log("lockToSide: ", lockToSide, curPly.name);
                await sendMesgToPlayerChatWindow("Player is now Locked to side " +
                    ddcsControllers.side[lockToSide].toUpperCase(), curPly.playerId);
                dbModels.srvPlayerModel.updateOne(
                    {_id: incomingObj.from},
                    {$set: {sideLock: lockToSide}},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        resolve();
                    }
                );
            }
        });
    });
}

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
