/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {remoteConnection} from "../../../";

const theaterTable = remoteConnection.model("theaters", schemas.theaterSchema);

export async function theaterActionsRead(): Promise<{theaters: typings.ITheater[]}> {
    return new Promise((resolve, reject) => {
        theaterTable.find((err, servers: typings.ITheater[]) => {
            if (err) { reject(err); }
            resolve({theaters: servers});
        });
    });
}
