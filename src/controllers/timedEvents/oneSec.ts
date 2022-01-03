/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";
import * as _ from "lodash";

export async function processOneSecActions(fullySynced: boolean) {
    if (fullySynced) {
        ddcsControllers.disconnectionDetction();
    }
}
