/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// import * as _ from "lodash";
// import {ICmdQue} from "../../typings";
import * as masterDBController from "../db";

export async function sendToAll(pData: any) {
    // pData.serverName = _.toLower(serverName);
    for (let x = 0; x <= 3; x++) {
        pData.side = x;
        masterDBController.masterQueSave(pData)
            .catch((err: any) => {
                console.log("line9: ", err);
            });
    }
}

export function sendToCoalition(pData: any) {
    const coalition = pData.payload.data.coalition;
    const displaySide = pData.payload.data.displaySide;
    // _.set(pData, 'serverName', _.toLower(serverName));
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
