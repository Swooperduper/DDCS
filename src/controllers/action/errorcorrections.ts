/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */


import * as _ from "lodash";
import { defaultsDeep } from "lodash";
import * as ddcsControllers from "../";
import * as ddcsController from "../action/unitDetection";
import { unitActionRead } from "../db";


export async function correctPlayerAircraftDuplicates(): Promise<void> {
    let aircraftFlying = await ddcsControllers.unitActionRead({"unitCategory":0, "objectCategory":1, "playername":{ $ne : "" }});
    if (aircraftFlying.length > 1){
        for (const player in aircraftFlying){
            let PlayerAircraft = await ddcsControllers.unitActionRead({"unitCategory":0, "objectCategory":1, "playername": aircraftFlying[player].playername});
            if (PlayerAircraft.length > 1){
                const deadPlayerAircraft = await ddcsControllers.unitActionRead({"unitCategory":0, "objectCategory":1, "playername": PlayerAircraft[0].playername, "dead":true});
                if (deadPlayerAircraft.length >= 1){
                    console.log("Dead Player Aircraft Found:",deadPlayerAircraft.length);
                    for (const aircraft in deadPlayerAircraft){
                        console.log("Removing dead",deadPlayerAircraft[aircraft].type,"belonging to",deadPlayerAircraft[aircraft].playername, "from the database");
                        await ddcsControllers.unitActionDelete(deadPlayerAircraft[aircraft]);
                    }
                }
                PlayerAircraft = await ddcsControllers.unitActionRead({"unitCategory":0, "objectCategory":1, "playername": PlayerAircraft[0].playername});
                if (PlayerAircraft.length > 1){
                    console.log("Still too many aircraft in DB showing controlled by",PlayerAircraft[0].playername, "removing the oldest");
                    const oldestPlayerAircraft = await ddcsControllers.unitActionReadOldest({"unitCategory":0, "objectCategory":1, "playername": PlayerAircraft[0].playername});
                    await ddcsControllers.unitActionDelete(oldestPlayerAircraft[0]);
                }
            }
        }
    }
}


