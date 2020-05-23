/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export let rtPlayerArray: any;

export async function processPlayerEvent(playerArray: any): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    if (playerArray.data > 0) {
        rtPlayerArray = playerArray.data;
        for (const player of playerArray.data) {
            if (player) {
                const curPlyrUcid = player.ucid;
                const curPlyrSide = player.side;
                const curPlyrName = player.name;
                const isArtilleryCmdr = _.includes(player.slot, "artillery_commander");
                const isForwardObserver = _.includes(player.slot, "forward_observer");

                const banUser = await ddcsControllers.srvPlayerActionsRead({_id: curPlyrUcid, banned: true});
                if (!_.isEmpty(banUser)) {
                    console.log("Banning User: ", curPlyrName, curPlyrUcid, player.ipaddr);
                    await ddcsControllers.kickPlayer(
                        player.id,
                        "You have been banned from this server."
                    );
                } else {
                    if (curPlyrName === "") {
                        console.log("Banning User for blank name: ", curPlyrName, curPlyrUcid, player.ipaddr);
                        await ddcsControllers.kickPlayer(
                            player.id,
                            "You have been kicked from this server for having a blank name."
                        );
                    }

                    const unit = await ddcsControllers.unitActionRead({playername: curPlyrName, dead: false});
                    const curUnit = unit[0];
                    const curUnitSide = curUnit.coalition;
                    if (curUnit) {
                        // switching to spectator gets around this, fix this in future please
                        if ((curUnitSide !== curPlyrSide) && curPlyrSide !== 0 && curPlyrSide) {
                            if (curUnitSide) {
                                await ddcsControllers.sendMesgToAll(
                                    curPlyrName + " Has Switch To " + ddcsControllers.side[curPlyrSide],
                                    15
                                );
                            }
                        }
                        if (isArtilleryCmdr || isForwardObserver) {
                            const srvPlayer = await ddcsControllers.srvPlayerActionsRead({ _id: player.ucid });
                            const curPlayer = srvPlayer[0];
                            if (curPlayer.gciAllowed || isForwardObserver) {
                                if (curPlayer.sideLock === 0) {
                                    await ddcsControllers.srvPlayerActionsUpdate({
                                        _id: player.ucid,
                                        sideLock: player.side,
                                        sideLockTime: new Date().getTime() + (60 * 60 * 1000)
                                    });
                                    await ddcsControllers.setSideLockFlags();
                                    console.log(player.name + " is now locked to " + player.side);
                                }
                            } else {
                                if (engineCache.config.isJtacLocked) {
                                    await ddcsControllers.forcePlayerSpectator(player.id, "You are not allowed to use " +
                                        "GCI/Tac Commander slot. Please contact a Mod for more information.");
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const data of playerArray.data) {
            const curData = _.cloneDeep(data);
            if (curData.ucid) {
                await ddcsControllers.srvPlayerActionsUpdateFromServer({
                    ...curData,
                    _id: curData.ucid,
                    playerId: curData.id,
                    sessionName: ddcsControllers.getSessionName()
                });
            }
        }
    }
}

