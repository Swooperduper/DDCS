/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export let rtPlayerArray: any;

export async function processPlayerEvent(playerArray: any): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    if (playerArray.players.length > 0) {
        rtPlayerArray = playerArray.players;
        for (const player of playerArray.players) {
            if (player) {
                // console.log("player: ", player);
                // player check sides, lock etc
                const curPlyrUcid = player.ucid;
                const curPlyrName = player.name;
                const gamemaster = _.includes(player.slot, "instructor");
                const isArtilleryCmdr = _.includes(player.slot, "artillery_commander");
                // const isForwardObserver = _.includes(player.slot, "forward_observer");
                // console.log("player slot: ", player.slot);

                if (gamemaster) {
                    await ddcsControllers.forcePlayerSpectator(player.id, "You are not allowed to use Game Master slot.");
                }

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

                    if (isArtilleryCmdr && engineCache.config.isJtacLocked) {
                        await ddcsControllers.forcePlayerSpectator(player.id, "You are not allowed to use " +
                            "GCI/Tac Commander slot. Please contact a Mod for more information.");
                    }
                }
            }
        }

        for (const player of playerArray.players) {
            const curData = _.cloneDeep(player);
            curData._id = curData.ucid;
            curData.playerId = curData.id;
            curData.sessionName = ddcsControllers.getSessionName();
            // console.log("updateP: ", curData);
            if (curData.ucid) {
                await ddcsControllers.srvPlayerActionsUpdateFromServer(curData);
            }
        }
    }
}

