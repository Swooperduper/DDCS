/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db";
import * as constants from "../constants";

export async function checkCurrentPlayerBalance(): Promise<any>  {
    // set to 2:1 or worse
    return masterDBController.campaignsActionsReadLatest()
        .then((latestCampaign: any) => {
            let sideState = {};
            const totalCampaignTime =
                new Date(_.get(latestCampaign, "updatedAt")).getTime() - new Date(_.get(latestCampaign, "createdAt")).getTime();
            // console.log('tct: ', totalCampaignTime);
            if (totalCampaignTime > _.get(constants, "time.oneHour")) {
                // if (totalCampaignTime > 0) {
                console.log("STACK: Blue:", latestCampaign.totalMinutesPlayed_blue, " Red:", latestCampaign.totalMinutesPlayed_red);
                if (_.get(latestCampaign, "name")) {
                    if (latestCampaign.totalMinutesPlayed_blue === 0) {latestCampaign.totalMinutesPlayed_blue = 1; }
                    if (latestCampaign.totalMinutesPlayed_red === 0) {latestCampaign.totalMinutesPlayed_red = 1; }
                    const redUnderdog = latestCampaign.totalMinutesPlayed_blue / latestCampaign.totalMinutesPlayed_red;
                    const blueUnderdog = latestCampaign.totalMinutesPlayed_red / latestCampaign.totalMinutesPlayed_blue;

                    if (redUnderdog > 1 && isFinite(redUnderdog)) {
                        sideState = {
                            underdog: 1,
                            ratio: redUnderdog
                        };
                    } else if (blueUnderdog > 1 && isFinite(blueUnderdog)) {
                        sideState = {
                            underdog: 2,
                            ratio: blueUnderdog
                        };
                    } else {
                        sideState = {
                            underdog: 0,
                            ratio: 1
                        };
                    }
                }
            }
            return sideState;
        })
        .catch((err: any) => {
            console.log("err line26: ", err);
        });
}

export async function updateLatestCampaign() {
    masterDBController.campaignsActionsReadLatest()
        .then((campaign: any) => {
            if (campaign) {
                masterDBController.sessionsActionsRead({campaignName: campaign.name})
                    .then((campSessions: any) => {
                        let totalMinutesPlayedBlue = 0;
                        let totalMinutesPlayedRed = 0;
                        _.forEach(campSessions, (pa) => {
                            totalMinutesPlayedBlue += _.get(pa, "totalMinutesPlayed_blue", 0);
                            totalMinutesPlayedRed += _.get(pa, "totalMinutesPlayed_red", 0);
                        });
                        masterDBController.campaignsActionsUpdate({
                            name: campaign.name,
                            totalMinutesPlayed_blue: totalMinutesPlayedBlue,
                            totalMinutesPlayed_red: totalMinutesPlayedRed
                        });
                        console.log("campaignUpdate: Blue: ", totalMinutesPlayedBlue, " Red: ", totalMinutesPlayedRed);
                    })
                    .catch((err: any) => {
                        console.log("line54", err);
                    })
                ;
            }
        })
        .catch((err: any) => {
            console.log("line60", err);
        });
}

export async function updateSession(sessionName: string) {
    masterDBController.srvPlayerActionsRead({sessionName})
        .then((playerArray: any) => {
            let currentSessionMinutesPlayedBlue = 0;
            let currentSessionMinutesPlayedRed = 0;
            _.forEach(playerArray, (pa) => {
                currentSessionMinutesPlayedBlue += _.get(pa, "currentSessionMinutesPlayed_blue", 0);
                currentSessionMinutesPlayedRed += _.get(pa, "currentSessionMinutesPlayed_red", 0);
            });
            masterDBController.sessionsActionsUpdate({
                name: sessionName,
                totalMinutesPlayed_blue: currentSessionMinutesPlayedBlue,
                totalMinutesPlayed_red: currentSessionMinutesPlayedRed
            })
                .then(() => {
                    exports.updateLatestCampaign();
                    console.log("sessionUpdate: Blue: ", currentSessionMinutesPlayedBlue, " Red: ", currentSessionMinutesPlayedRed);
                })
                .catch((err: any) => {
                    console.log("err line49: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("err line17: ", err);
        })
    ;
}

export async function recordFiveMinutesPlayed(serverName: string) {
    const totalMinsPerSide: any = {
        1: 0,
        2: 0
    };
    masterDBController.sessionsActionsReadLatest()
        .then((latestSession: any) => {
            const unitsNewThan = new Date().getTime() - _.get(constants, ["time", "fourMins"], 0);
            // update only people who have played in the last 5 minutes
            masterDBController.srvPlayerActionsRead({
                sessionName: latestSession.name,
                updatedAt: {$gt: unitsNewThan}
            })
                .then((playerArray: any) => {
                    // console.log('playersInFiveMinutes: ', playerArray.length);
                    const processPromise: any[] = [];
                    _.forEach(playerArray, (player: any) => {
                        // console.log('isPlayerTimeGreater: ', player.name, new Date(player.updatedAt).getTime() >
                        // 		unitsNewThan, new Date(player.updatedAt).getTime() - unitsNewThan);
                        totalMinsPerSide[player.side] = totalMinsPerSide[player.side] + 5;
                        processPromise.push(masterDBController.srvPlayerActionsAddMinutesPlayed({
                            _id: player._id,
                            minutesPlayed: 5,
                            side: player.side
                        }));
                    });
                    Promise.all(processPromise)
                        .then(() => {
                            exports.updateSession(serverName, latestSession);
                        })
                        .catch((err: any) => {
                            console.log("err line133: ", err);
                        })
                    ;
                    console.log("PlayerFiveMinCount: ", totalMinsPerSide);
                })
                .catch((err: any) => {
                    console.log("err line62: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("err line67: ", err);
        })
    ;
}

export async function resetMinutesPlayed() {
    masterDBController.sessionsActionsReadLatest()
        .then((latestSession: any) => {
            if (latestSession) {
                masterDBController.srvPlayerActionsRead({sessionName: latestSession.name})
                    .then((playerArray: any) => {
                        _.forEach(playerArray, (player) => {
                            masterDBController.srvPlayerActionsResetMinutesPlayed({
                                _id: player._id,
                                side: player.side
                            });
                        });
                        console.log("mins reset");
                    })
                    .catch((err: any) => {
                        console.log("err line84: ", err);
                    })
                ;
            }
        })
        .catch((err: any) => {
            console.log("err line89: ", err);
        });
}
