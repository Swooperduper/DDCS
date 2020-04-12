import * as Mongoose from "mongoose";

export let localConnection: Mongoose.Connection;
export let remoteConnection: Mongoose.Connection;

export const getDBconnections = (): void => {
    if (!localConnection) {
        let connString = "mongodb://" + process.env.DB_LOCAL_HOST + ":27017/" + process.env.DB_LOCAL_DATABASE;
        if (!!process.env.DB_USER && !!process.env.DB_PASSWORD) {
            connString = "mongodb://" + process.env.DB_USER +
                ":" + process.env.DB_PASSWORD +
                "@" + process.env.DB_LOCAL_HOST +
                ":27017/" + process.env.DB_LOCAL_DATABASE + "?authSource=admin";
        }
        localConnection = Mongoose.createConnection(connString, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    if (!remoteConnection) {
        let connString = "mongodb://" + process.env.DB_REMOTE_HOST + ":27017/" + process.env.DB_REMOTE_DATABASE;
        if (!!process.env.DB_USER && !!process.env.DB_PASSWORD) {
            connString = "mongodb://" + process.env.DB_USER +
                ":" + process.env.DB_PASSWORD +
                "@" + process.env.DB_REMOTE_HOST +
                ":27017/" + process.env.DB_REMOTE_DATABASE + "?authSource=admin";
        }
        remoteConnection = Mongoose.createConnection(connString, { useNewUrlParser: true, useUnifiedTopology: true });
    }
};

exports.getDBconnections();
