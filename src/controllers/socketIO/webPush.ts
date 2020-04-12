/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
/*
import * as _ from "lodash";
import {ICmdQue} from "../../typings";
import {masterQueSave} from "./db";

_.set(exports, "sendToAll", (serverName: string, pData: ICmdQue) => {
    pData.serverName = _.toLower(serverName);
    for (let x = 0; x <= 3; x++) {
        pData.side = x;
        masterQueSave("save", serverName, pData)
            .catch((err: any) => {
                console.log("line9: ", err);
            })
        ;
    }
});

_.set(exports, 'sendToCoalition', function (serverName, pData) {
    var coalition = _.get(pData, ['payload', 'data', 'coalition']);
    var displaySide = _.get(pData, ['payload', 'data', 'displaySide']);
    _.set(pData, 'serverName', _.toLower(serverName));
    if(coalition) {
        _.set(pData, 'side', coalition);
    } else if (displaySide) {
        _.set(pData, 'side', displaySide);
    } else {
        console.log('no sendToCoalition side for ', pData);
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
