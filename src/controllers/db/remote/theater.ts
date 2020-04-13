/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {theaterSchema} from "./schemas";
import {ITheater} from "../../../typings";

const theaterTable = remoteConnection.model("theaters", theaterSchema);

export async function theaterActionsRead() {
    return new Promise((resolve, reject) => {
        theaterTable.find((err, servers: ITheater[]) => {
            if (err) { reject(err); }
            resolve({theaters: servers});
        });
    });
}
