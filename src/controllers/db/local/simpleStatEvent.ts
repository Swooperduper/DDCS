/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function simpleStatEventActionsRead(obj: {
    sessionName: string
}): Promise<typings.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        dbModels.simpleStatEventTable.find({
            sessionName: obj.sessionName,
            showInChart: true},
            (err: any, simpleStatEvent: typings.ISimpleStatEvents[]) => {
                        if (err) { reject(err); }
                        resolve(simpleStatEvent);
                    }
        );
    });
}

export async function simpleStatEventActionsReadAll(): Promise<typings.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        dbModels.simpleStatEventTable.find((err: any, simpleStatEvent: typings.ISimpleStatEvents[]) => {
            if (err) { reject(err); }
            resolve(simpleStatEvent);
        });
    });
}

export async function simpleStatEventActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const simplestatevent = new dbModels.simpleStatEventTable(obj);
        simplestatevent.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}
