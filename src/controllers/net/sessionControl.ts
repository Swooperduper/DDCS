import * as ddcsController from "../";

export let sessionName: string = "";
export let curAbsTime: number = 0;
export let realServerSecs: number = 0;
export let startAbsTime: number = 0;
export let curServerUnitCnt: number = 0;

export async function getLatestSession(serverEpoc: number, startAbs: number, curAbs: number): Promise<void> {
    if (serverEpoc) {
        const buildSessionName = process.env.SERVER_NAME + "_" + serverEpoc;
        const newSession = {
            _id: buildSessionName,
            name: buildSessionName,
            startAbsTime: startAbs,
            curAbsTime: curAbs,
            campaignName: ""
        };
        const latestSession = await ddcsController.sessionsActionsReadLatest();
        console.log(
            "create new session: ",
            sessionName,
            " !== ",
            latestSession[0].name,
            " || ",
            curAbsTime,
            " > ",
            curAbs
        );
        if (sessionName !== latestSession[0].name || curAbsTime > curAbs) {
            await ddcsController.resetMinutesPlayed();
            const campaign = await ddcsController.campaignsActionsReadLatest();
            if (campaign) {
                newSession.campaignName =  campaign[0].name;
                await ddcsController.sessionsActionsUpdate(newSession);
                console.log("SESSNAME: ", newSession, buildSessionName);
                sessionName = buildSessionName;
            }
        } else {
            console.log("use existing session: ", sessionName);
            await ddcsController.sessionsActionsUpdate(newSession);
            sessionName = buildSessionName;
        }
    }
}
