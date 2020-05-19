import * as mongoose from "mongoose";
import * as controllers from "../../";
import * as localModels from "../local/models";
import * as remoteModels from "../remote/models";

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

export async function initV3Engine(): Promise<void> {

    localConnection = await getDbConnection("localConnection");
    remoteConnection = await getDbConnection("remoteConnection");

    for (const [key, value] of Object.entries(localModels)) {
        dbModels[key] = value(localConnection);
    }
    for (const [key, value] of Object.entries(remoteModels)) {
        dbModels[key] = value(remoteConnection);
    }

    await controllers.initServer();

    await controllers.startUpReceiveUDPSocket();

    console.log("DB ", dbModels);
    await controllers.testRead();
}
