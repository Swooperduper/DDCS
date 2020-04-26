/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function spendResourcePoints(player: any, rsCost: number, rsItem: string, itemObj: any) {

    let curUnit: ddcsController.IUnit;

    if (isNaN(player.slot)) {
        console.log("player doesnt have slotID: " + player);
        return Promise.resolve(false);
    } else {
        return ddcsController.unitActionRead({unitId: _.toNumber(player.slot)})
            .then((cUnit) => {
                let mesg;
                let currentObjUpdate: any;
                curUnit = _.get(cUnit, [0]);
                if (curUnit.inAir) {
                    return ddcsController.unitActionRead({_id: "AI|" + itemObj.name + "|"})
                        .then((unitExist) => {
                            if (unitExist.length > 0 && rsItem === "Tanker") {
                                mesg = "G: Tanker your trying to spawn already exists";
                                ddcsController.sendMesgToGroup(
                                    curUnit.groupId,
                                    mesg,
                                    5
                                );
                                return false;
                                /*
                                } else if(unitExist.length > 0 && rsItem === 'AWACS') {
                                    mesg = 'G: AWACS your trying to spawn already exists';
                                    DCSLuaCommands.sendMesgToGroup(
                                        curUnit.groupId,
                                        serverName,
                                        mesg,
                                        5
                                    );
                                    return false;
                                    */
                            } else {
                                if (player.side === 1) {
                                    if (player.redRSPoints >= rsCost) {
                                        currentObjUpdate = {
                                            _id: player._id,
                                            redRSPoints: player.redRSPoints - rsCost
                                        };
                                        return ddcsController.srvPlayerActionsUpdate(currentObjUpdate)
                                            .then(() => {
                                                mesg = "G: You have spent red " + rsCost + " points on a " + rsItem +
                                                    "(" + currentObjUpdate.redRSPoints + "pts left)";
                                                ddcsController.sendMesgToGroup(
                                                    curUnit.groupId,
                                                    mesg,
                                                    5
                                                );
                                                return true;
                                            })
                                            .catch((err) => {
                                                console.log("line53", err);
                                            });
                                    } else {
                                        mesg = "G: You do not have red " + rsCost + " points to buy a " +
                                            rsItem + " (" + player.redRSPoints + "pts)";
                                        ddcsController.sendMesgToGroup(
                                            curUnit.groupId,
                                            mesg,
                                            5
                                        );
                                        return false;
                                    }
                                } else {
                                    if (player.blueRSPoints >= rsCost) {
                                        currentObjUpdate = {
                                            _id: player._id,
                                            blueRSPoints: player.blueRSPoints - rsCost
                                        };
                                        return ddcsController.srvPlayerActionsUpdate(currentObjUpdate)
                                            .then(() => {
                                                mesg = "G: You have spent " + rsCost + " blue points on a " + rsItem +
                                                    "(" + currentObjUpdate.blueRSPoints + "pts left)";
                                                ddcsController.sendMesgToGroup(
                                                    curUnit.groupId,
                                                    mesg,
                                                    5
                                                );
                                                return true;
                                            })
                                            .catch((err) => {
                                                console.log("line84", err);
                                            });
                                    } else {
                                        mesg = "G: You do not have " + rsCost + " blue points to buy a " +
                                            rsItem + " (" + player.blueRSPoints + "pts)";
                                        ddcsController.sendMesgToGroup(
                                            curUnit.groupId,
                                            mesg,
                                            5
                                        );
                                        return false;
                                    }
                                }
                            }
                        })
                        .catch((err) => {
                            console.log("line101", err);
                        })
                        ;
                } else {
                    mesg = "G: You cannot spend RS points on the ground, Please TakeOff First, Then Call RS Point Option!";
                    ddcsController.sendMesgToGroup(
                        curUnit.groupId,
                        mesg,
                        5
                    );
                    return false;
                }
            })
            .catch((err) => {
                console.log("line118", err);
            });
    }
}

export async function checkResourcePoints(player: any) {
    if (player.name) {
        return ddcsController.unitActionRead({dead: false, playername: player.name})
            .then((cUnit) => {
                let mesg;
                if (cUnit.length > 0) {
                    if (player.side === 1) {
                        mesg = "G: You have " + player.redRSPoints + " Red Resource Points!";
                    } else {
                        mesg = "G: You have " + player.blueRSPoints + " Blue Resource Points!";
                    }

                    ddcsController.sendMesgToGroup(
                        cUnit[0].groupId,
                        mesg,
                        5
                    );
                }
            })
            .catch((err) => {
                console.log("line145", err);
            });
    }
}
