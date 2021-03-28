/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";
import * as ddcsControllers from "../../";

export async function processCommandQue(): Promise<void> {
    const getExpiredCommands = await futureCommandQueActionsGrabNextQue();
    for (const command of getExpiredCommands) {
        await ddcsControllers.sendUDPPacket(command.queName, {actionObj: command.actionObj});
        await futureCommandQueActionsDelete({_id: command._id});
    }
}

export async function futureCommandQueActionsGrabNextQue(): Promise<typings.ICmdQue[]> {
    return new Promise((resolve, reject) => {
        dbModels.futureCommandQueModel.find({
            timeToExecute: {$lt: new Date().getTime()}}, (err: any, clientQue: any) => {
            if (err) { reject(err); }
            resolve(clientQue);
        });
    });
}

export async function futureCommandQueActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const futureCommandQue = new dbModels.futureCommandQueModel(obj);
        futureCommandQue.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function futureCommandQueActionsDelete(obj: {
    _id: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.futureCommandQueModel.findByIdAndRemove(obj._id, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function cmdQueActionsRemoveAll(): Promise<any> {
    return dbModels.futureCommandQueModel.deleteMany({});
}

export async function cmdQueActionsDropAll(): Promise<any> {
    return dbModels.futureCommandQueModel.collection.drop();
}
