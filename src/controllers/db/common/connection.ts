import * as mongoose from "mongoose";

export async function getDbConnection(dbType: string): Promise<mongoose.Connection> {

    const user = (!!process.env.DB_USER && !!process.env.DB_PASSWORD) ? process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" : "";
    const host = (dbType === "remoteConnection") ? process.env.DB_REMOTE_HOST : process.env.DB_LOCAL_HOST;
    const database = (dbType === "remoteConnection") ? process.env.DB_REMOTE_DATABASE : process.env.DB_LOCAL_DATABASE;
    const authSource = (!!process.env.DB_USER && !!process.env.DB_PASSWORD) ? "?authSource=admin" : "";

    return mongoose.createConnection(
        "mongodb://" + user + host + ":27017/" + database + authSource,
        { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }
    );
}
