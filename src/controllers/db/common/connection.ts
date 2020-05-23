import * as mongoose from "mongoose";
import * as localModels from "../local/models";
import * as remoteModels from "../remote/models";
import * as ddcsController from "../../";

export let localConnection: mongoose.Connection;
export let remoteConnection: mongoose.Connection;
export const dbModels: any = {};

export async function getDbConnection(dbType: string): Promise<mongoose.Connection> {

    const user = (!!process.env.DB_USER && !!process.env.DB_PASSWORD) ? process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" : "";
    const host = (dbType === "remoteConnection") ? process.env.DB_REMOTE_HOST : process.env.DB_LOCAL_HOST;
    const database = (dbType === "remoteConnection") ? process.env.DB_REMOTE_DATABASE : process.env.DB_LOCAL_DATABASE;
    const authSource = (!!process.env.DB_USER && !!process.env.DB_PASSWORD) ? "?authSource=admin" : "";

    return mongoose.createConnection(
        "mongodb://" + user + host + ":27017/" + database + authSource,
        { useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true }
    );
}

export async function updateBases(): Promise<void> {
    const curBases = await ddcsController.baseActionRead({});
    if (curBases.length) {
        ddcsController.setBases(curBases);
    } else {
        console.log("Rebuilding Base DB");
        await ddcsController.sendUDPPacket("frontEnd", {
            actionObj: { action: "GETPOLYDEF" },
            queName: "clientArray"
        });
        console.log("rebuild base DB");
    }
}

export async function updateConfig(): Promise<void> {
    const curServer = await ddcsController.serverActionsRead({_id: process.env.SERVER_NAME});
    ddcsController.setConfig(curServer[0]);
}

export async function updateStaticDictionary(): Promise<void> {
    ddcsController.setStaticDictionary(await ddcsController.staticDictionaryActionsRead({}));
}

export async function updateUnitDictionary(curTimePeriod: string): Promise<void> {
    ddcsController.setUnitDictionary(await ddcsController.unitDictionaryActionsRead({ timePeriod: curTimePeriod }));
}

export async function updateWeaponDictionary(): Promise<void> {
    ddcsController.setWeaponDictionary(await ddcsController.weaponScoreActionsRead({}));
}

export async function initV3Engine(): Promise<void> {

    localConnection = await getDbConnection("localConnection");
    remoteConnection = await getDbConnection("remoteConnection");

    for (const [key, value] of Object.entries(localModels)) {
        dbModels[key] = value(localConnection);
    }
    for (const [key, value] of Object.entries(remoteModels)) {
        dbModels[key] = value(remoteConnection);
    }

    await updateConfig();
    await updateStaticDictionary();
    await updateUnitDictionary(ddcsController.getEngineCache().config.timePeriod);
    await updateWeaponDictionary();
    await updateBases();

    await ddcsController.startUpReceiveUDPSocket();

    setInterval( async () => {
        if (ddcsController.isServerSynced) {
            await ddcsController.processOneSecActions(ddcsController.isServerSynced);
        }
    }, ddcsController.time.sec);

    setInterval( async () => {
        if (ddcsController.isServerSynced) {
            await ddcsController.processFiveSecActions(ddcsController.isServerSynced);
        }
    }, ddcsController.time.fiveSecs);

    setInterval( async () => {
        if (ddcsController.isServerSynced) {
            await ddcsController.processThirtySecActions(ddcsController.isServerSynced);
            await ddcsController.processTimer(ddcsController.curServerEpoc);
        } else {
            ddcsController.resetTimerObj();
        }
    }, ddcsController.time.thirtySecs);

    setInterval( async () => {
        if (ddcsController.sessionName !== "") {
            await ddcsController.sessionsActionsUpdate({
                _id: ddcsController.sessionName,
                name: ddcsController.sessionName,
                startAbsTime: ddcsController.startAbsTime,
                curAbsTime: ddcsController.curAbsTime
            });
        }
    }, ddcsController.time.oneMin);

    setInterval( async () => {
        if (ddcsController.isServerSynced) {
            await ddcsController.processFiveMinuteActions(ddcsController.isServerSynced);
        }
    }, ddcsController.time.fiveMins);

    setInterval( async () => {
        if (ddcsController.isServerSynced) {
            await ddcsController.processTenMinuteActions(ddcsController.isServerSynced);
        }
    }, ddcsController.time.tenMinutes);

    setInterval( async () => {
        if (ddcsController.isServerSynced) {
            await ddcsController.processThirtyMinuteActions(ddcsController.isServerSynced);
        }
    }, ddcsController.time.thirtyMinutes);

    setInterval( async () => {
        if (ddcsController.isServerSynced) {
            await ddcsController.processOneHourActions(ddcsController.isServerSynced);
        }
    }, ddcsController.time.oneHour);

    setInterval( async () => {
        if (ddcsController.getEngineCache().bases && ddcsController.isServerSynced) {
            await ddcsController.syncType(ddcsController.curServerUnitCnt);
        }
    }, ddcsController.time.sec);

    await ddcsController.testRead();
}
