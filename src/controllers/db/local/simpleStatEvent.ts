/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const simpleStatEventTable = ddcsController.localConnection.model(
    process.env.SERVERNAME + "_simpleStatEvent",
    ddcsController.simpleStatEventSchema
);

export async function simpleStatEventActionsRead(obj: {
    sessionName: string
}): Promise<ddcsController.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        simpleStatEventTable.find({
            sessionName: obj.sessionName,
            showInChart: true},
            (err, simpleStatEvent: ddcsController.ISimpleStatEvents[]) => {
                        if (err) { reject(err); }
                        resolve(simpleStatEvent);
                    }
        );
    });
}

export async function simpleStatEventActionsReadAll(): Promise<ddcsController.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        simpleStatEventTable.find((err, simpleStatEvent: ddcsController.ISimpleStatEvents[]) => {
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
