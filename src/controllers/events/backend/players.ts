/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as sideLockController from "../../action/sideLock";

export let rtPlayerArray: any;

export async function processPlayerEvent(sessionName: string, playerArray: any) {
    rtPlayerArray = playerArray.data;
    _.forEach(playerArray.data, (player: any) => {
        if (player) {
            const curPlyrUcid = player.ucid;
            const curPlyrSide = player.side;
            const curPlyrName = player.name;
            const isArtilleryCmdr = _.includes(player.slot, "artillery_commander");
            const isForwardObserver = _.includes(player.slot, "forward_observer");

            masterDBController.srvPlayerActionsRead({_id: curPlyrUcid, banned: true})
                .then((banUser: any) => {
                    if (!_.isEmpty(banUser)) {
                        console.log("Banning User: ", curPlyrName, curPlyrUcid, player.ipaddr);
                        DCSLuaCommands.kickPlayer(
                            player.id,
                            "You have been banned from this server."
                        );
                    } else {
                        if (curPlyrName === "") {
                            console.log("Banning User for blank name: ", curPlyrName, curPlyrUcid, player.ipaddr);
                            DCSLuaCommands.kickPlayer(
                                player.id,
                                "You have been kicked from this server for having a blank name."
                            );
                        }

                        masterDBController.unitActionRead({playername: curPlyrName, dead: false})
                            .then((unit: any) => {
                                const curUnit = unit[0];
                                const curUnitSide = curUnit.coalition;
                                if (curUnit) {
                                    // switching to spectator gets around this, fix this in future please
                                    if ((curUnitSide !== curPlyrSide) && curPlyrSide !== 0 && curPlyrSide) {
                                        if (curUnitSide) {
                                            DCSLuaCommands.sendMesgToAll(
                                                curPlyrName + " Has Switch To " + constants.side[curPlyrSide],
                                                15
                                            );
                                        }
                                    }
                                    if (isArtilleryCmdr || isForwardObserver) {
                                        masterDBController.srvPlayerActionsRead({ _id: player.ucid })
                                            .then((srvPlayer: any) => {
                                                const curPlayer = srvPlayer[0];
                                                if (curPlayer.gciAllowed || isForwardObserver) {
                                                    if (curPlayer.sideLock === 0) {
                                                        masterDBController.srvPlayerActionsUpdate({
                                                            _id: player.ucid,
                                                            sideLock: player.side,
                                                            sideLockTime: new Date().getTime() + (60 * 60 * 1000)
                                                        })
                                                            .then(() => {
                                                                sideLockController.setSideLockFlags();
                                                                console.log(player.name + " is now locked to " + player.side);
                                                            })
                                                            .catch((err) => {
                                                                console.log("line120", err);
                                                            })
                                                        ;
                                                    }
                                                } else {
                                                    if (constants.config.isJtacLocked) {
                                                        DCSLuaCommands.forcePlayerSpectator(player.id, "You are not allowed to use " +
                                                            "GCI/Tac Commander slot. Please contact a Mod for more information.");
                                                    }
                                                }
                                            })
                                            .catch((err) => {
                                                console.log("line120", err);
                                            });
                                    }
                                }
                            })
                            .catch((err) => {
                                console.log("err line87: ", err);
                            });
                    }
                })
                .catch((err) => {
                    console.log("line886", err);
                });
        }
    });

    _.forEach(playerArray.data, (data: any) => {
        const curData = _.cloneDeep(data);
        if (curData.ucid) {
            masterDBController.srvPlayerActionsUpdateFromServer({
                ...curData,
                _id: curData.ucid,
                playerId: curData.id,
                sessionName
            })
                .catch((err) => {
                    console.log("line156", err);
                })
            ;
        }
    });
}

