/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {localConnection} from "../../../";

const simpleStatEventTable = localConnection.model(
    process.env.SERVER_NAME + "_simpleStatEvent",
    schemas.simpleStatEventSchema
);

export async function simpleStatEventActionsRead(obj: {
    sessionName: string
}): Promise<typings.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        simpleStatEventTable.find({
            sessionName: obj.sessionName,
            showInChart: true},
            (err, simpleStatEvent: typings.ISimpleStatEvents[]) => {
                        if (err) { reject(err); }
                        resolve(simpleStatEvent);
                    }
        );
    });
}

export async function simpleStatEventActionsReadAll(): Promise<typings.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        simpleStatEventTable.find((err, simpleStatEvent: typings.ISimpleStatEvents[]) => {
            if (err) { reject(err); }
            resolve(simpleStatEvent);
        });
    });
}

export async function simpleStatEventActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const simplestatevent = new simpleStatEventTable(obj);
        simplestatevent.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}
