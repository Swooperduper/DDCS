/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db";

export async function sendMissingUnits(serverUnitArray: any) {
    const upPromises: any[] = [];
    return masterDBController.unitActionChkResync({})
        .then(() => {
            _.forEach(serverUnitArray, (unitName: string) => {
                upPromises.push(
                    masterDBController.unitActionUpdate({_id: unitName, isResync: true, dead: false})
                );
            });
            Promise.all(upPromises)
                .then(() => {
                    return masterDBController.unitActionRead({isResync: false, dead: false})
                        .then((units) => {

                            console.log("DB RESYNC, SERVER -> DB");
                            // dont remove units, only add
                            masterDBController.unitActionUpdate({
                                _id: units[0].name,
                                name: units[0].name,
                                dead: true
                            })
                                .catch((err) => {
                                    console.log("erroring line33: ", err);
                                });
                        })
                        .catch((err) => {
                            console.log("erroring line35: ", err);
                        });
                })
                .catch((err) => {
                    console.log("err line40: ", err);
                });
        })
        .catch((err) => {
            console.log("err line45: ", err);
        });
}
