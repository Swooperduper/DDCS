/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db";
import * as DCSLuaCommands from "../player/DCSLuaCommands";

const dBot = {};
const srsServers = {
    // DDCSStandard: "srs.dynamicdcs.com:5002",
    DDCS1978ColdWar: "srs.dynamicdcs.com:5002",
    DDCSModern: "srs.dynamicdcs.com:5010"
};

export const oldestAllowedUser = 300;
export const timeToCorrect = 15;
export const only0ChannelNames = [
    "Please join side before joining GCI"
];
export const only1ChannelNames = [
    "Red Gen Chat(Relaxed GCI)",
    "Red GCI Group 1(Brevity)",
    "Red GCI Group 2(Brevity)"
];
export const only2ChannelNames = [
    "Blue Gen Chat(Relaxed GCI)",
    "Blue GCI Group 1(Brevity)",
    "Blue GCI Group 2(Brevity)"
];

export async function resetKickTimer(curPlayer: any) {
    return masterDBController.srvPlayerActionsRead({ _id: curPlayer.ucid })
        .then((curPlayerDB: any) => {
            return masterDBController.srvPlayerActionsUnsetGicTimeLeft({_id: curPlayerDB[0].ucid })
                .catch((err: any) => {
                    console.log("line38", err);
                });
        })
        .catch((err) => {
            console.log("line43", err);
        });
}

export async function processKick(
    curPlayer: any,
    playerCommObj: any,
    isDiscordAllowed: boolean,
    curPlayerUnit: any,
    discordOnline: boolean
) {
    return masterDBController.srvPlayerActionsRead({ _id: curPlayer.ucid })
        .then((curPlayerDB: any) => {
            let mesg: string;
            const curPlayerName = curPlayer.name;
            const curGicTimeLeft = curPlayerDB[0].gicTimeLeft;
            const newLifeCount = (curGicTimeLeft === 0) ? exports.timeToCorrect : curGicTimeLeft - 1 ;

            if (newLifeCount !== 0) {
                if (!playerCommObj && isDiscordAllowed) {
                    mesg = "REQUIREMENT(" + newLifeCount + " mins left):You are not a member of the DDCS discord(with your name matching " +
                        "EXACTLY) and also you need to be in a VOICE discord channel(Not AFK)(Status is online(not invisi)) OR connected " +
                        "to the correct SRS server (#serverName) https://discord.gg/h4G9QZf ";
                    console.log("GTBK: ", newLifeCount, curPlayerName, " Not A Member, discordOnline: " + discordOnline);
                } else if (!playerCommObj)  {
                    mesg = "REQUIREMENT(" + newLifeCount + " mins left):You are not a member of the DDCS discord(with your name matching " +
                        "EXACTLY), & also need to be connected to the correct SRS server ( #serverName ) https://discord.gg/h4G9QZf ";
                    console.log("GTBK: ", newLifeCount, curPlayerName, " Not A Member, discordOnline: " + discordOnline);
                } else if (isDiscordAllowed) {
                    mesg = "REQUIREMENT(" + newLifeCount + " mins left):You need to be in a VOICE discord channel(Not AFK)(Status is " +
                        "online(not invisi)) OR connected to the correct SRS server ( #serverName ), https://discord.gg/h4G9QZf ";
                    console.log("GTBK: ", newLifeCount, curPlayerName, " Not In Discord Or SRS, discordOnline: " + discordOnline);
                /* } else if (serverName !== _.get(playerCommObj, 'SRSData.SRSServer')) {
                    mesg = "REQUIREMENT(" + newLifeCount + " mins left):You must join the correct SRS server ( #serverName )";
                    console.log('GTBK: ', newLifeCount, curPlayerName, ' Not In the correct SRS, discordOnline: ' + discordOnline); */
                } else {
                    mesg = "REQUIREMENT(" + newLifeCount + " mins left):You must join the correct SRS server ( #serverName )";
                    console.log("GTBK: ", newLifeCount, curPlayerName, " Not In SRS, discordOnline: " + discordOnline);
                }
                if (curPlayerUnit) {
                    DCSLuaCommands.sendMesgToGroup(curPlayerUnit.groupId, mesg, 60);
                }
                return masterDBController.srvPlayerActionsUpdate({_id: curPlayer.ucid, gicTimeLeft: newLifeCount})
                    .catch((err: any) => {
                        console.log("line58", err);
                    });
            } else {
                if (!playerCommObj && isDiscordAllowed) {
                    mesg = "KICKED: You are not a member of the DDCS discord(with your name matching EXACTLY) and also you need to be in " +
                        "a VOICE discord channel(Not AFK)(Status is online(not invisi)) OR connected to the correct SRS server " +
                        "( #serverName ) https://discord.gg/h4G9QZf ";
                    console.log("KICKING: ", curPlayerName, "Not A Member, discordOnline: " + discordOnline);
                } else if (!playerCommObj)  {
                    mesg = "KICKED:You are not a member of the DDCS discord(with your name matching EXACTLY), & also need to be connected" +
                        " to the correct SRS server ( #serverName ) https://discord.gg/h4G9QZf ";
                    console.log("KICKING: ", curPlayerName, "Not A Member, discordOnline: " + discordOnline);
                } else if (isDiscordAllowed) {
                    mesg = "KICKED: You need to be in a VOICE discord channel(Not AFK)(Status is online(not invisi)) OR connected to the " +
                        "SRS correct server ( #serverName ), https://discord.gg/h4G9QZf ";
                    console.log("KICKING: ", curPlayerName, "Not In Discord OR SRS, discordOnline: " + discordOnline);
                /* } else if (serverName !== _.get(playerCommObj, 'SRSData.SRSServer')) {
                    mesg = "KICKED: You must join the correct SRS server (" + _.get(srsServers, [serverName]) + ")";
                    console.log('KICKING: ', curPlayerName, 'Not In the correct SRS, discordOnline: ' + discordOnline); */
                } else {
                    mesg = "KICKED: You must join the correct SRS server ( #serverName )";
                    console.log("KICKING: ", curPlayerName, "Not In SRS, discordOnline: " + discordOnline);
                }
                return masterDBController.srvPlayerActionsUpdate({_id: curPlayer.ucid, gicTimeLeft: newLifeCount})
                    .then(() => {
                        if (curPlayerUnit) {
                            console.log("KICKED FOR NO COMMS: ", curPlayerUnit.playername, curPlayer.id);
                            DCSLuaCommands.sendMesgToGroup(curPlayerUnit.groupId, mesg, 60);
                        }
                        DCSLuaCommands.forcePlayerSpectator(curPlayer.id, mesg);
                    })
                    .catch((err) => {
                        console.log("line70", err);
                    })
                ;
            }
        })
        .catch((err) => {
            console.log("line58", err);
        });
}

export async function kickForNoComms(playerArray: any, isDiscordAllowed: boolean) {
    return masterDBController.remoteCommsActionsRead({})
        .then((playersInComms: any) => {
            console.log("-------------------------------");
            _.forEach(playerArray, (curPlayer: any) => {
                const curPlayerName = curPlayer.name;
                const curPlayerCommObj = _.find(playersInComms, {_id: curPlayerName});
                masterDBController.unitActionRead({dead: false, playername: curPlayerName})
                    .then((pUnit: any) => {
                        /*
                        const curPlayerUnit = pUnit[0];
                        if (curPlayerCommObj) {
                            if (curPlayerUnit) {
                                curPlayerCommObj.playerType = "unit";
                            } else if (_.includes(curPlayer.slot, "artillery_commander")) {
                                curPlayerCommObj.playerType = "jtac";
                            }  else if (_.includes(curPlayer.slot, "")) {
                                curPlayerCommObj.playerType = "spectator";
                            }

                            if (!((curPlayerCommObj.isInSRS && serverName === _.get(curPlayerCommObj, 'SRSData.SRSServer')) ||
                                (curPlayerCommObj.isInDiscord && isDiscordAllowed))) {
                                constants.getServer(serverName)
                                    .then(function (serverConf) {
                                        let isDiscordOnline = _.get(serverConf, 'isDiscordOnline');
                                        if (isDiscordOnline) {
                                            dBot.processKick(
                                                serverName,
                                                curPlayer,
                                                curPlayerCommObj,
                                                isDiscordAllowed,
                                                curPlayerUnit,
                                                isDiscordOnline
                                            );
                                        }
                                    })
                                    .catch(function (err) {
                                        reject('line:542, failed to connect to db: ', serverName, err);
                                    })
                                ;
                            } else {
                                //reset gic timer for matching
                                dBot.resetKickTimer(serverName, curPlayer)
                            }
                        } else {
                            constants.getServer(serverName)
                                .then(function (serverConf) {
                                    let isDiscordOnline = _.get(serverConf, 'isDiscordOnline');
                                    if (isDiscordOnline) {
                                        dBot.processKick(
                                            serverName,
                                            curPlayer,
                                            curPlayerCommObj,
                                            isDiscordAllowed,
                                            curPlayerUnit,
                                            isDiscordOnline
                                        );
                                    }
                                })
                                .catch(function (err) {
                                    reject('line:542, failed to connect to db: ', serverName, err);
                                })
                            ;
                        }
                        */
                    })
                    .catch((err) => {
                        console.log("line37", err);
                    });
            });
        })
        .catch((err) => {
            console.log("line37", err);
        });
}

/*
_.set(dBot, 'kickForOpposingSides', function (playerArray, discordByChannel) {
    var moveToChan;
    _.forEach(exports.Only1ChannelNames, function (chanName) {
        if(discordByChannel[chanName]) {
            _.forEach(discordByChannel[chanName], function (vcUser, userName) {
                var findCurPlayer = _.find(playerArray, {name: userName});
                if(findCurPlayer) {
                    if (findCurPlayer.side === 0) {
                        console.log('kick user to gen: ', userName);
                        moveToChan = client.channels.find("name", _.first(exports.only0ChannelNames));
                        vcUser.setVoiceChannel(moveToChan);
                    } else if (findCurPlayer.side !== 1) {
                        console.log('kick user for wrong side GCI: ', userName);
                        moveToChan = client.channels.find("name", _.first(exports.Only2ChannelNames));
                        vcUser.setVoiceChannel(moveToChan);
                    }
                }
            });
        }
    });
    _.forEach(exports.Only2ChannelNames, function (chanName) {
        if(discordByChannel[chanName]) {
            _.forEach(discordByChannel[chanName], function (vcUser, userName) {
                var findCurPlayer = _.find(playerArray, {name: userName});
                if(findCurPlayer) {
                    if (findCurPlayer.side === 0) {
                        console.log('kick user to gen: ', userName);
                        moveToChan = client.channels.find("name", _.first(exports.only0ChannelNames));
                        vcUser.setVoiceChannel(moveToChan);
                    } else if (findCurPlayer.side !== 2) {
                        console.log('kick user for wrong side GCI: ', userName);
                        moveToChan = client.channels.find("name", _.first(exports.Only1ChannelNames));
                        vcUser.setVoiceChannel(moveToChan);
                    }
                }
            });
        }
    });
});
*/

export async function checkForComms(isDiscordAllowed: boolean, playerArray: any) {
    // console.log('PA: ', playerArray);
    /* Turn OFf Comms
    var removeServerHost = _.filter(playerArray, function (p) {
        if (p) {
            return p.id != 1;
        }
        return false;
    });
    dBot.kickForNoComms(serverName, removeServerHost, isDiscordAllowed);
 */
    /*
    var fiveMinsAgo = new Date().getTime() - (5 * oneMin);
    masterDBController.sessionsActions('readLatest', serverName, {})
        .then(function (latestSession) {
            if (latestSession.name) {
                masterDBController.srvPlayerActions('read', serverName, {
                    playerId: {$ne: '1'},
                    name: {$ne: ''},
                    sessionName: latestSession.name,
                    updatedAt: {
                        $gt: new Date(fiveMinsAgo)
                    }
                })
                    .then(function (playerArray) {
                        console.log('PA: ', playerArray.length, fiveMinsAgo, new Date().getTime(), new Date().getTime() - fiveMinsAgo, {
                            playerId: {$ne: '1'},
                            name: {$ne: ''},
                            sessionName: latestSession.name,
                            updatedAt: {
                                $gt: new Date(fiveMinsAgo)
                            }});
                        dBot.kickForNoComms(serverName, playerArray, isDiscordAllowed);
                        // have all the existing player names on the server
                        // dBot.kickForOpposingSides(playerArray, discordByChannel); for the future
                    })
                    .catch(function (err) {
                        console.log('line181', err);
                    })
                ;
            }
        })
        .catch(function (err) {
            console.log('line187', err);
        })
    ;
    */
}
