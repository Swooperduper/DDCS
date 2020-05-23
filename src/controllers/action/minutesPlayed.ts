/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";

export async function checkCurrentPlayerBalance(): Promise<typings.IPlayerBalance>  {
    let sideState: typings.IPlayerBalance = {
        underdog: 0,
        ratio: 1
    };
    const latestCampaignArray = await ddcsControllers.campaignsActionsReadLatest();
    const latestCampaign = latestCampaignArray[0];
    const totalCampaignTime = new Date(latestCampaign.updatedAt).getTime() - new Date(latestCampaign.createdAt).getTime();
    if (totalCampaignTime > ddcsControllers.time.oneHour) {
        console.log("STACK: Blue:", latestCampaign.totalMinutesPlayed_blue, " Red:", latestCampaign.totalMinutesPlayed_red);
        if (latestCampaign.name) {
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
            }
        }
    }
    return sideState;
}

export async function updateLatestCampaign(): Promise<void> {
    const campaign = await ddcsControllers.campaignsActionsReadLatest();
    if (campaign) {
        const campSessions = await ddcsControllers.sessionsActionsRead({campaignName: campaign[0].name});
        let totalMinutesPlayedBlue = 0;
        let totalMinutesPlayedRed = 0;
        _.forEach(campSessions, (pa) => {
            totalMinutesPlayedBlue += pa.totalMinutesPlayed_blue;
            totalMinutesPlayedRed += pa.totalMinutesPlayed_red;
        });
        await ddcsControllers.campaignsActionsUpdate({
            name: campaign[0].name,
            totalMinutesPlayed_blue: totalMinutesPlayedBlue,
            totalMinutesPlayed_red: totalMinutesPlayedRed
        });
        console.log("campaignUpdate: Blue: ", totalMinutesPlayedBlue, " Red: ", totalMinutesPlayedRed);
    }
}

export async function updateSession(sessionName: string) {
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName});
    let currentSessionMinutesPlayedBlue = 0;
    let currentSessionMinutesPlayedRed = 0;
    _.forEach(playerArray, (pa) => {
        currentSessionMinutesPlayedBlue += pa.currentSessionMinutesPlayed_blue;
        currentSessionMinutesPlayedRed += pa.currentSessionMinutesPlayed_red;
    });
    await ddcsControllers.sessionsActionsUpdate({
        name: sessionName,
        totalMinutesPlayed_blue: currentSessionMinutesPlayedBlue,
        totalMinutesPlayed_red: currentSessionMinutesPlayedRed
    });
    await updateLatestCampaign();
    console.log("sessionUpdate: Blue: ", currentSessionMinutesPlayedBlue, " Red: ", currentSessionMinutesPlayedRed);
}

export async function recordFiveMinutesPlayed() {
    const totalMinsPerSide = [
        0,
        0,
        0
    ];
    const latestSession = await ddcsControllers.sessionsActionsReadLatest();
    if (latestSession) {
        const unitsNewThan = new Date().getTime() - ddcsControllers.time.fourMins;
        const playerArray = await ddcsControllers.srvPlayerActionsRead({
            sessionName: latestSession.name,
            updatedAt: {$gt: unitsNewThan}
        });
        const processPromise: any[] = [];
        _.forEach(playerArray, (player) => {
            totalMinsPerSide[player.side] += 5;
            processPromise.push(ddcsControllers.srvPlayerActionsAddMinutesPlayed({
                _id: player._id,
                minutesPlayed: 5,
                side: player.side
            }));
        });
        await Promise.all(processPromise);
        await updateSession(latestSession.name);
        console.log("PlayerFiveMinCount: ", totalMinsPerSide);
    }
}

export async function resetMinutesPlayed() {
    const latestSession = await ddcsControllers.sessionsActionsReadLatest();
    if (latestSession) {
        const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: latestSession.name});
        for (const player of playerArray) {
            await ddcsControllers.srvPlayerActionsResetMinutesPlayed({
                _id: player._id,
                side: player.side
            });
        }
    }
}
