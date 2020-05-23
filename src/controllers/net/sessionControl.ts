import * as ddcsController from "../";

let sessionName: string = "";
let curServerEpoc: number = 0;
let curAbsTime: number = 0;
let startAbsTime: number = 0;
let curServerUnitCnt: number = 0;
let curServerStaticCnt: number = 0;

export function getSessionName() {
    return sessionName;
}
export function getCurServerEpoc() {
    return curServerEpoc;
}
export function getCurAbsTime() {
    return curAbsTime;
}
export function getStartAbsTime() {
    return startAbsTime;
}
export function getCurServerUnitCnt() {
    return curServerUnitCnt;
}
export function getCurServerStaticCnt() {
    return curServerStaticCnt;
}

export function setSessionName(curSessionName: string) {
    sessionName = curSessionName;
}
export function setCurServerEpoc(serverEpoc: number) {
    curServerEpoc = serverEpoc;
}
export function setCurAbsTime(absTime: number) {
    curAbsTime = absTime;
}
export function setStartAbsTime(curStartAbsTime: number) {
    startAbsTime = curStartAbsTime;
}
export function setCurServerUnitCnt(unitCount: number) {
    curServerUnitCnt = unitCount;
}
export function setCurServerStaticCnt(staticCnt: number) {
    curServerStaticCnt = staticCnt;
}

export async function getLatestSession(serverInfoObj: any): Promise<void> {

    if (serverInfoObj.epoc && serverInfoObj.startAbsTime) {
        const buildSessionName = process.env.SERVER_NAME + "_" + serverInfoObj.epoc;
        const latestSession = await ddcsController.sessionsActionsReadLatest();
        if ( !latestSession || (getSessionName() !== latestSession.name || curAbsTime > serverInfoObj.curAbsTime)) {

            console.log("LS: ", latestSession);
            console.log(
                "create new session: ",
                getSessionName(),
                " !== ",
                (latestSession) ? latestSession.name : buildSessionName,
                " || ",
                getCurAbsTime(),
                " > ",
                serverInfoObj.curAbsTime
            );

            await ddcsController.resetMinutesPlayed();
            const campaign = await ddcsController.campaignsActionsReadLatest();
            if (!campaign) {
                await ddcsController.campaignsActionsSave({ _id: buildSessionName, name: buildSessionName});
            }
            const newSession = {
                _id: buildSessionName,
                name: buildSessionName,
                startAbsTime: serverInfoObj.startAbsTime,
                curAbsTime: serverInfoObj.curAbsTime,
                campaignName: (campaign) ? campaign : buildSessionName
            };

            await ddcsController.sessionsActionsUpdate(newSession);
            console.log("SESSNAME: ", newSession, buildSessionName);
            setSessionName(buildSessionName);

        } else {
            console.log("use existing session: ", sessionName);
            await ddcsController.sessionsActionsUpdate({
                    _id: buildSessionName,
                    curAbsTime: serverInfoObj.curAbsTime
                });
        }

        setCurServerEpoc(serverInfoObj.epoc);
        setCurAbsTime(serverInfoObj.curAbsTime);
        setStartAbsTime(serverInfoObj.startAbsTime);
        setCurServerUnitCnt(serverInfoObj.unitCount);
        setCurServerStaticCnt(serverInfoObj.staticCount);
    }
}
