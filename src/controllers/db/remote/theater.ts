/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const theaterTable = ddcsController.remoteConnection.model("theaters", ddcsController.theaterSchema);

export async function theaterActionsRead(): Promise<{theaters: ddcsController.ITheater[]}> {
    return new Promise((resolve, reject) => {
        theaterTable.find((err, servers: ddcsController.ITheater[]) => {
            if (err) { reject(err); }
            resolve({theaters: servers});
        });
    });
}
