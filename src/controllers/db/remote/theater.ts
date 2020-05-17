/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function theaterActionsRead(): Promise<{theaters: typings.ITheater[]}> {
    return new Promise((resolve, reject) => {
        dbModels.theaterModel.find((err: any, servers: typings.ITheater[]) => {
            if (err) { reject(err); }
            resolve({theaters: servers});
        });
    });
}
