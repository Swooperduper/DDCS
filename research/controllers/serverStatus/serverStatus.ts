/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
/*
import * as net from "net";
import * as _ from "lodash";
import * as action from "../action";
import * as constants from "../../";
import * as localDb from "../db/local";
import * as menu from "../menu";
import * as playerLib from "../player";
import * as proxZone from "../proxZone";
import * as remoteDb from "../db/remote";
import * as serverToDbSync from "../serverToDbSync";
import * as spawn from "../spawn";
import * as sychronize from "../sychronize";
import * as typing from "../../typings";
import * as webPush from "../socketIO";


export async function checkServers() {
    return masterDBController.serverActionsRead({enabled: true})
        .then((servers: any) => {
            _.forEach(servers, (server: any) => {
                const serverDBObj = masterDBController.dbObj.dbConn[server.name];
                if (!serverDBObj) {
                    masterDBController.connectDB(server.ip, server.name);
                }
                masterDBController.sessionsActionsReadLatest()
                    .then((lastSession: any) => {
                        masterDBController.serverActionsUpdate({
                            name: server.name,
                            curTimer: lastSession.curAbsTime - lastSession.startAbsTime,
                            isServerUp: new Date(lastSession.updatedAt).getTime() > new Date().getTime() - constants.time.fiveMins
                        })
                            .catch((err) => {
                                console.log("line23: ", err);
                            })
                        ;
                    })
                    .catch((err) => {
                        console.log("line20: ", err);
                    });
            });
        })
        .catch((err) => {
            console.log("line27: ", err);
        })
    ;
}

setInterval (() => {
    exports.checkServers();
}, 60 * 1000);
*/
