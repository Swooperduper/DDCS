import * as mongoose from "mongoose";
import * as localModels from "../local/models";
import * as remoteModels from "../remote/models";
import * as ddcsController from "../../";

export let localConnection: mongoose.Connection;
export let remoteConnection: mongoose.Connection;
export const dbModels: any = {};

export async function getDbConnection(
    host: string = "",
    database: string = "",
    user: string = "",
    password: string = ""
): Promise<mongoose.Connection> {
    const login = (!!user && !!password) ? user + ":" + password + "@" : "";
    const authSource = (!!user && !!password) ? "?authSource=admin" : "";
    return mongoose.createConnection(
        "mongodb://" + login + host + ":27017/" + database + authSource,
        { useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true }
    );
}
/*
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
*/
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

export async function updateI18n(): Promise<void> {
    ddcsController.setI18n(await ddcsController.i18nActionsRead());
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

export async function updateMenuCommands(): Promise<void> {
    ddcsController.setMenuCommands(await ddcsController.menuCommandsRead({}));
}

export function updateDBModels(dbConnection: mongoose.Connection, modelsLibrary: any) {
    for (const [key, value] of Object.entries(modelsLibrary)) {
        // @ts-ignore
        dbModels[key] = value(dbConnection);
    }
}

export async function initV3EngineMaster(): Promise<void> {
    remoteConnection = await getDbConnection(
        process.env.DB_REMOTE_HOST,
        process.env.DB_REMOTE_DATABASE,
        process.env.DB_USER,
        process.env.DB_PASSWORD
    );

    updateDBModels(remoteConnection, remoteModels);
}

export async function initV3Engine(): Promise<void> {

    localConnection = await getDbConnection(
        process.env.DB_LOCAL_HOST,
        process.env.DB_LOCAL_DATABASE,
        process.env.DB_USER,
        process.env.DB_PASSWORD
    );

    updateDBModels(localConnection, localModels);

    remoteConnection = await getDbConnection(
        process.env.DB_REMOTE_HOST,
        process.env.DB_REMOTE_DATABASE,
        process.env.DB_USER,
        process.env.DB_PASSWORD
    );

    updateDBModels(remoteConnection, remoteModels);

    await updateConfig();
    await updateI18n();
    await updateStaticDictionary();
    await updateUnitDictionary(ddcsController.getEngineCache().config.timePeriod);
    await updateWeaponDictionary();
    await updateBases();
    await updateMenuCommands();
    //await ddcsController.setFarpMarks();

    await ddcsController.setResetFullCampaign(ddcsController.getEngineCache().config.resetFullCampaign);

    await ddcsController.startUpReceiveUDPSocket();

    await ddcsController.updateServerLifePoints();

    setInterval( async () => {
        if (ddcsController.getServerSynced()) {
            await ddcsController.processOneSecActions(ddcsController.getServerSynced());
        }
    }, ddcsController.time.sec);

    setInterval( async () => {
        await ddcsController.processFiveSecActions(ddcsController.getServerSynced());
        await ddcsController.processTimer(ddcsController.getCurAbsTime());
    }, ddcsController.time.fiveSecs);

    setInterval( async () => {
        if (ddcsController.getServerSynced()) {
            await ddcsController.processThirtySecActions(ddcsController.getServerSynced());
        }
    }, ddcsController.time.thirtySecs);

    setInterval( async () => {
        if (ddcsController.getSessionName() !== "") {
            await ddcsController.sessionsActionsUpdate({
                _id: ddcsController.getSessionName(),
                name: ddcsController.getSessionName(),
                startAbsTime: ddcsController.getStartAbsTime(),
                curAbsTime: ddcsController.getCurAbsTime()
            });
        }
    }, ddcsController.time.oneMin);

    setInterval( async () => {
        if (ddcsController.getServerSynced()) {
            await ddcsController.processOneMinuteActions(ddcsController.getServerSynced());
        }
    }, ddcsController.time.oneMin);

    setInterval( async () => {
        if (ddcsController.getServerSynced()) {
            await ddcsController.processFiveMinuteActions(ddcsController.getServerSynced());
        }
    }, ddcsController.time.fiveMins);

    setInterval( async () => {
        if (ddcsController.getServerSynced()) {
            await ddcsController.processTenMinuteActions(ddcsController.getServerSynced());
        }
    }, ddcsController.time.tenMinutes);

    setInterval( async () => {
        if (ddcsController.getServerSynced()) {
            await ddcsController.processThirtyMinuteActions(ddcsController.getServerSynced());
        }
   }, ddcsController.time.thirtyMinutes);

    setInterval( async () => {
        if (ddcsController.getServerSynced()) {
            await ddcsController.processOneHourActions(ddcsController.getServerSynced());
        }
    }, ddcsController.time.oneHour);

    // await ddcsController.testRead();

}
