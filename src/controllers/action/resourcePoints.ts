/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function spendResourcePoints(
    player: ddcsController.ISrvPlayers,
    rsCost: number,
    rsItem: string,
    itemObj: ddcsController.IUnit
): Promise<void> {

    let curUnit: ddcsController.IUnit;

    if (isNaN(Number(player.slot))) {
        console.log("player doesnt have slotID: " + player);
        return Promise.resolve();
    } else {
        const cUnit = await ddcsController.unitActionRead({unitId: Number(player.slot)});
        let mesg;
        let currentObjUpdate: any;
        curUnit = cUnit[0];
        if (curUnit.inAir) {
            const unitExist = await ddcsController.unitActionRead({_id: "AI|" + itemObj.name + "|"});
            if (unitExist.length > 0 && rsItem === "Tanker") {
                mesg = "G: Tanker your trying to spawn already exists";
                await ddcsController.sendMesgToGroup(
                    curUnit.groupId,
                    mesg,
                    5
                );
            } else {
                if (player.side === 1) {
                    if (player.redRSPoints >= rsCost) {
                        currentObjUpdate = {
                            _id: player._id,
                            redRSPoints: player.redRSPoints - rsCost
                        };
                        await ddcsController.srvPlayerActionsUpdate(currentObjUpdate);
                        mesg = "G: You have spent red " + rsCost + " points on a " + rsItem +
                            "(" + currentObjUpdate.redRSPoints + "pts left)";
                        await ddcsController.sendMesgToGroup(
                            curUnit.groupId,
                            mesg,
                            5
                        );
                    } else {
                        mesg = "G: You do not have red " + rsCost + " points to buy a " +
                            rsItem + " (" + player.redRSPoints + "pts)";
                        await ddcsController.sendMesgToGroup(
                            curUnit.groupId,
                            mesg,
                            5
                        );
                    }
                } else {
                    if (player.blueRSPoints >= rsCost) {
                        currentObjUpdate = {
                            _id: player._id,
                            blueRSPoints: player.blueRSPoints - rsCost
                        };
                        await ddcsController.srvPlayerActionsUpdate(currentObjUpdate);
                        mesg = "G: You have spent " + rsCost + " blue points on a " + rsItem +
                            "(" + currentObjUpdate.blueRSPoints + "pts left)";
                        await ddcsController.sendMesgToGroup(
                            curUnit.groupId,
                            mesg,
                            5
                        );
                    } else {
                        mesg = "G: You do not have " + rsCost + " blue points to buy a " +
                            rsItem + " (" + player.blueRSPoints + "pts)";
                        await ddcsController.sendMesgToGroup(
                            curUnit.groupId,
                            mesg,
                            5
                        );
                    }
                }
            }
        } else {
            mesg = "G: You cannot spend RS points on the ground, Please TakeOff First, Then Call RS Point Option!";
            await ddcsController.sendMesgToGroup(
                curUnit.groupId,
                mesg,
                5
            );
        }
    }
}

export async function checkResourcePoints(player: ddcsController.ISrvPlayers):Promise<void> {
    if (player.name) {
        const cUnit = await ddcsController.unitActionRead({dead: false, playername: player.name});
        let mesg;
        if (cUnit.length > 0) {
            if (player.side === 1) {
                mesg = "G: You have " + player.redRSPoints + " Red Resource Points!";
            } else {
                mesg = "G: You have " + player.blueRSPoints + " Blue Resource Points!";
            }

            await ddcsController.sendMesgToGroup(
                cUnit[0].groupId,
                mesg,
                5
            );
        }
    }
}
