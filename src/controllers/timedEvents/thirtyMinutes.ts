/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function processThirtyMinuteActions(fullySynced: boolean) {
    if (fullySynced) {

        const currentRedBases = await ddcsController.baseActionRead({
            side: 1,
            enabled: true
        });
        const currentBlueBases = await ddcsController.baseActionRead({
            side: 2,
            enabled: true
        });

        let losingSide = 0;
        if (currentRedBases.length< 10){
            losingSide = 1
        } else if (currentBlueBases.length < 10) {
            losingSide = 2
        }
        if(losingSide != 0){
            const msg = "The other team is now down to their last 10 bases, if you'd like to help them out and keep the war going you can now swap to their team with the -swap command";
            await ddcsController.sendMesgToCoalition(
                losingSide,
                msg,
                [],
                10,
                5
            );
        }
        // await ddcsControllers.maintainPvEConfig();
    }
}
