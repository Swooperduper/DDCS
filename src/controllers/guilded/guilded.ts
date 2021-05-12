import * as _ from "lodash";
import * as ddcsController from "../index";
// import * as serverCodes from "http-status-codes";
import * as localModels from "../db/local/models";
import * as https from "https";

// const { Client } = require("@guildedjs/guilded.js");

/*
function sleep(milliseconds: number) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
*/

export async function updateCampaignPlayers( credentials: any[] ) {
    ddcsController.serverActionsRead({enabled: true})
        .then((servers) => {
            for (const curServer of servers) {
                ddcsController.getDbConnection(
                    curServer.ip,
                    curServer._id,
                    process.env.DB_USER,
                    process.env.DB_PASSWORD
                )
                    .then( async (dbConnection) => {
                        ddcsController.updateDBModels(dbConnection, localModels);
                        const lockedUsernames: string[][] = [[], [], []];
                        const srvPlayers = await ddcsController.srvPlayerActionsRead({
                            name: {$ne: ""}
                        });
                        srvPlayers.forEach((server) => {
                            if (server.sideLock >= 0) {
                                const curName = server.name || "";
                                lockedUsernames[server.sideLock].push(curName);
                            }
                        });
                        // console.log("testName: ", lockedUsernames);
                        // console.log(".");

                        const req = https.request({
                            method: "POST",
                            hostname: "www.guilded.gg",
                            path: "/api/login",
                            headers: {}
                        }, (res: any) => {
                            res.on("data", () => true);
                            res.on("end", () => {
                                const sessionCookie = res.headers["set-cookie"];
                                // console.log("cookie: ", sessionCookie);
                                const req2 = https.request({
                                    method: "GET",
                                    hostname: "www.guilded.gg",
                                    path: "/api/teams/" + process.env.GUILDED_TEAM_ID,
                                    headers: {
                                        cookie: sessionCookie
                                    }
                                }, (res2: any) => {
                                    const chunks: any[] = [];
                                    res2.on("data", (chunk: any) => {
                                        chunks.push(chunk);
                                    });
                                    res2.on("end", () => {
                                        const body = Buffer.concat(chunks);
                                        // console.log("guildedObj: ", JSON.parse(body.toString()));
                                        const guildedObj = JSON.parse(body.toString());
                                        const membersArray = guildedObj.team.members;
                                        if (!!guildedObj.team && membersArray.length > 0) {
                                            for (const member of membersArray) {
                                                // process red side
                                                const redRoleId = Number(curServer.guildedSubGroups[1]);
                                                const redEnemyRoleId = Number(curServer.guildedSubGroups[2]);
                                                if ( lockedUsernames[1].indexOf(member.name) !== -1 ||
                                                    lockedUsernames[1].indexOf(member.nickname) !== -1 ) {
                                                    if (!member.roleIds || member.roleIds.indexOf(redRoleId) === -1) {
                                                        console.log("Adding Red to: ", member.name, "/api/teams/" +
                                                            process.env.GUILDED_TEAM_ID + "/roles/" + redRoleId + "/users/" +
                                                            member.id, redEnemyRoleId);
                                                        const onRed1 = https.request({
                                                            method: "PUT",
                                                            hostname: "www.guilded.gg",
                                                            path: "/api/teams/" + process.env.GUILDED_TEAM_ID + "/roles/" +
                                                                redRoleId + "/users/" + member.id,
                                                            headers: {
                                                                cookie: sessionCookie
                                                            }
                                                        }, (onRed1Res: any) => {
                                                            onRed1Res.on("data", () => true);
                                                            onRed1Res.on("end", () => true);
                                                            onRed1Res.on("error", (onRed1Err: any) => {
                                                                console.error(onRed1Err);
                                                            });
                                                        });
                                                        onRed1.end();
                                                    }
                                                    if (member.roleIds && member.roleIds.indexOf(redEnemyRoleId) !== -1) {
                                                        const onRed2 = https.request({
                                                            method: "DELETE",
                                                            hostname: "www.guilded.gg",
                                                            path: "/api/teams/" + process.env.GUILDED_TEAM_ID + "/roles/" +
                                                                redEnemyRoleId + "/users/" + member.id,
                                                            headers: {
                                                                cookie: sessionCookie
                                                            }
                                                        }, (onRed2Res: any) => {
                                                            onRed2Res.on("data", () => true);
                                                            onRed2Res.on("end", () => true);
                                                            onRed2Res.on("error", (onRed2Err: any) => {
                                                                console.error(onRed2Err);
                                                            });
                                                        });
                                                        onRed2.end();
                                                    }
                                                }

                                                // process blue side
                                                const blueRoleId = Number(curServer.guildedSubGroups[2]);
                                                const blueEnemyRoleId = Number(curServer.guildedSubGroups[1]);
                                                if ( lockedUsernames[2].indexOf(member.name) !== -1 ||
                                                    lockedUsernames[2].indexOf(member.nickname) !== -1 ) {
                                                    if (!member.roleIds || member.roleIds.indexOf(blueRoleId) === -1) {
                                                        console.log("Adding Blue to: ", member.name, "/api/teams/" + process.env.TEAM_ID + "/roles/" + blueRoleId + "/users/" + member.id, blueEnemyRoleId);
                                                        const onBlue1 = https.request({
                                                            method: "PUT",
                                                            hostname: "www.guilded.gg",
                                                            path: "/api/teams/" + process.env.GUILDED_TEAM_ID + "/roles/" +
                                                                blueRoleId + "/users/" + member.id,
                                                            headers: {
                                                                cookie: sessionCookie
                                                            }
                                                        }, (onBlue1Res: any) => {
                                                            onBlue1Res.on("data", () => true);
                                                            onBlue1Res.on("end", () => true);
                                                            onBlue1Res.on("error", (onBlue1Err: any) => {
                                                                console.error(onBlue1Err);
                                                            });
                                                        });
                                                        onBlue1.end();

                                                    }
                                                    if (member.roleIds && member.roleIds.indexOf(blueEnemyRoleId) !== -1) {
                                                        const onBlue2 = https.request({
                                                            method: "DELETE",
                                                            hostname: "www.guilded.gg",
                                                            path: "/api/teams/" + process.env.GUILDED_TEAM_ID + "/roles/" +
                                                                blueEnemyRoleId + "/users/" + member.id,
                                                            headers: {
                                                                cookie: sessionCookie
                                                            }
                                                        }, (onBlue2Res: any) => {
                                                            onBlue2Res.on("data", () => true);
                                                            onBlue2Res.on("end", () => true);
                                                            onBlue2Res.on("error", (onBlue2Err: any) => {
                                                                console.error(onBlue2Err);
                                                            });
                                                        });
                                                        onBlue2.end();
                                                    }
                                                }

                                                if ( lockedUsernames[0].indexOf(member.name) !== -1 ||
                                                    lockedUsernames[0].indexOf(member.nickname) !== -1 ) {

                                                    // no team lock remove both
                                                    if (member.roleIds && member.roleIds.indexOf(redRoleId) !== -1) {
                                                        const onRed2 = https.request({
                                                            method: "DELETE",
                                                            hostname: "www.guilded.gg",
                                                            path: "/api/teams/" + process.env.GUILDED_TEAM_ID + "/roles/" +
                                                                redRoleId + "/users/" + member.id,
                                                            headers: {
                                                                cookie: sessionCookie
                                                            }
                                                        }, (onRed2Res: any) => {
                                                            onRed2Res.on("data", () => true);
                                                            onRed2Res.on("end", () => true);
                                                            onRed2Res.on("error", (onRed2Err: any) => {
                                                                console.error(onRed2Err);
                                                            });
                                                        });
                                                        onRed2.end();
                                                    }
                                                    if (member.roleIds && member.roleIds.indexOf(blueRoleId) !== -1) {
                                                        const onBlue2 = https.request({
                                                            method: "DELETE",
                                                            hostname: "www.guilded.gg",
                                                            path: "/api/teams/" + process.env.GUILDED_TEAM_ID + "/roles/" +
                                                                blueRoleId + "/users/" + member.id,
                                                            headers: {
                                                                cookie: sessionCookie
                                                            }
                                                        }, (onBlue2Res: any) => {
                                                            onBlue2Res.on("data", () => true);
                                                            onBlue2Res.on("end", () => true);
                                                            onBlue2Res.on("error", (onBlue2Err: any) => {
                                                                console.error(onBlue2Err);
                                                            });
                                                        });
                                                        onBlue2.end();
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    res2.on("error", (error: any) => {
                                        console.error(error);
                                    });
                                });
                                req2.end();
                            });
                            res.on("error", (error: any) => { console.error(error); });
                        });
                        const postData = `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"email\"\r\n\r\n`
                            + credentials[0] +
                            `\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\n` +
                            credentials[1] +
                            `\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`;
                        req.setHeader("content-type", "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW");
                        req.write(postData);
                        req.end();
                    })
                    .catch((err) => {
                        console.log("line28: ", err);
                    })
                ;
            }
        })
        .catch((err) => {
            console.log("line33: ", err);
        })
    ;
}
