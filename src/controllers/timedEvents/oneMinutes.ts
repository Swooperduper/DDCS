/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";
import { engineGlobals } from "../constants";

export async function processOneMinuteActions(fullySynced: boolean): Promise<void> {
    if (fullySynced) {
        //Slowly Adding F10 Markers to the Map
        await ddcsControllers.updateServerLifePoints(); 
        if(!engineGlobals.farpsMarked){
            console.log("Placing Farp Markers on F-10 Map")
            engineGlobals.farpsMarked = true
            await ddcsControllers.setFarpMarks();
        }else if (!engineGlobals.circlesMarked){
            console.log("Placing ownership circles on F-10 Map")
            engineGlobals.circlesMarked = true
            await ddcsControllers.setCircleMarkers();
        }else if (!engineGlobals.unitMenuWritten)  {
            console.log("Unit Menu's now available")
            engineGlobals.unitMenuWritten = true
            let playerUnits = await ddcsControllers.unitActionRead({
                _id: /DU\|/,
                dead: false
            });
            let timeDelay = -100
            for (const playerUnit of playerUnits) {
                timeDelay = timeDelay +100
                setTimeout(() => { ddcsControllers.initializeMenu(playerUnit);}, timeDelay);
                console.log("Current Time Delay is", timeDelay/1000,"Seconds")
            }
            console.log("Finished Loop for Drawing Unit Menu's")
        }   
    }
}
