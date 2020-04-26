/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function baseUnitUnderAttack(unit: ddcsController.IUnit) {
    // only work on ground units
    // console.log('baseUnderAttack: ', serverName, unit);
    if (unit.category === "GROUND") {
        return ddcsController.getBasesInProximity(_.get(unit, "lonLatLoc"), 18, _.get(unit, "coalition"))
            .then((closestBases: any) => {
                if (closestBases) {
                    const curDBBase = closestBases[0];
                    ddcsController.unitActionRead({name: _.get(curDBBase, "name") + " Communications", dead: false})
                        .then((aliveComms) => {
                            if (aliveComms.length > 0) {
                                const curBase = _.find(_.get(ddcsController, "bases"), {_id: _.get(curDBBase, "_id")});
                                _.set(curBase, "underAttack", _.get(curBase, "underAttack", 0) + 1);
                                console.log(_.get(curBase, "name") + " is under attack " + _.get(curBase, "underAttack") + " times");
                            }
                        })
                        .catch((err) => {
                            console.log("erroring line189: ", err);
                        })
                    ;
                }
            })
            .catch((err) => {
                console.log("line 27: ", err);
            })
        ;
    } else {
        return Promise.resolve();
    }
}

export async function checkBaseWarnings() {
    // console.log('checkBaseWarnings');
    _.forEach(_.get(ddcsController, "bases"), (base) => {
        if (_.get(base, "underAttack") > 0) {
            ddcsController.sendMesgToCoalition(
                _.get(base, "side"),
                _.get(base, "name") + " is under attack!",
                20
            );
            _.set(base, "underAttack", 0);
        }
    });
}
