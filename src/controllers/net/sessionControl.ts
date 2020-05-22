import * as ddcsController from "../";

export let sessionName: string = "";
export let curServerEpoc: number = 0;
export let curAbsTime: number = 0;
export let startAbsTime: number = 0;
export let curServerUnitCnt: number = 0;
export let curServerStaticCnt: number = 0;

export async function getLatestSession(serverInfoObj: any): Promise<void> {

    if (curServerEpoc) {
        const buildSessionName = process.env.SERVER_NAME + "_" + curServerEpoc;
        const latestSession = await ddcsController.sessionsActionsReadLatest();
        console.log(
            "create new session: ",
            sessionName,
            " !== ",
            latestSession[0].name,
            " || ",
            curAbsTime,
            " > ",
            serverInfoObj.curAbsTime
        );
        if (sessionName !== latestSession[0].name || curAbsTime > serverInfoObj.curAbsTime) {
            await ddcsController.resetMinutesPlayed();
            const campaign = await ddcsController.campaignsActionsReadLatest();
            const newSession = {
                _id: buildSessionName,
                name: buildSessionName,
                startAbsTime: serverInfoObj.startAbs,
                curAbsTime: serverInfoObj.curAbsTime,
                campaignName: ""
            };
            if (campaign) {
                newSession.campaignName =  campaign[0].name;
                await ddcsController.sessionsActionsUpdate(newSession);
                console.log("SESSNAME: ", newSession, buildSessionName);
                sessionName = buildSessionName;
            }
        } else {
            console.log("use existing session: ", sessionName);
        }
        curServerEpoc = serverInfoObj.epoc;
        curAbsTime = serverInfoObj.curAbsTime;
        startAbsTime = serverInfoObj.startAbs;
        curServerUnitCnt = serverInfoObj.unitCount;
        curServerStaticCnt = serverInfoObj.staticCount;
    }
}
