import {localConnection} from "../common/connection";
import {simpleStatEventSchema} from "./schemas";
import {ISimpleStatEvents} from "../../../typings";

const simpleStatEventTable = localConnection.model(process.env.SERVERNAME + "_simpleStatEvent", simpleStatEventSchema);

export async function simpleStatEventActionsRead(obj: {
    sessionName: string
}) {
    return new Promise((resolve, reject) => {
        simpleStatEventTable.find({sessionName: obj.sessionName, showInChart: true}, (err, simpleStatEvent) => {
            if (err) { reject(err); }
            resolve(simpleStatEvent);
        });
    });
}

export async function simpleStatEventActionsReadAll() {
    return new Promise((resolve, reject) => {
        simpleStatEventTable.find((err, simpleStatEvent) => {
            if (err) { reject(err); }
            resolve(simpleStatEvent);
        });
    });
}

export async function simpleStatEventActionsSave(obj: any) {
    return new Promise((resolve, reject) => {
        const simplestatevent = new simpleStatEventTable(obj);
        simplestatevent.save((err, simpleStatEvent) => {
            if (err) { reject(err); }
            resolve(simpleStatEvent);
        });
    });
}
