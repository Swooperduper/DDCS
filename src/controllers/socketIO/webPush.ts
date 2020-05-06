/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function sendToAll(pData: ddcsController.IMasterCue): Promise<void> {
    for (let x = 0; x <= 3; x++) {
        pData.side = x;
        await ddcsController.masterQueSave(pData);
    }
}

export function sendToCoalition(pData: ddcsController.IMasterCue) {
    const coalition = pData.payload.data.coalition;
    const displaySide = pData.payload.data.displaySide;

    if (coalition) {
        pData.side = coalition;
    } else if (displaySide) {
        pData.side = displaySide;
    } else {
        console.log("no sendToCoalition side for ", pData);
    }
}
/*
    masterDBController.masterQueActions('save', serverName, pData)
        .catch(function (err) {
            console.log('line274: ', err);
        })
    ;

    _.set(pData, 'side', 3);
    masterDBController.masterQueActions('save', serverName, pData)
        .catch(function (err) {
            console.log('line274: ', err);
        })
    ;

});

_.set(exports, 'sendToIndividual', function (serverName, socketId, pData) {

});
*/
