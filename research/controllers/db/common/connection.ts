export function getConnString(dbType: string): string {
    let connString: string = "";
    if (dbType === "localConnection") {
        connString = "mongodb://" + process.env.DB_LOCAL_HOST + ":27017/" + process.env.DB_LOCAL_DATABASE;
        if (!!process.env.DB_USER && !!process.env.DB_PASSWORD) {
            connString = "mongodb://" + process.env.DB_USER +
                ":" + process.env.DB_PASSWORD +
                "@" + process.env.DB_LOCAL_HOST +
                ":27017/" + process.env.DB_LOCAL_DATABASE + "?authSource=admin";
        }
    }

    if (dbType === "remoteConnection") {
        connString = "mongodb://" + process.env.DB_REMOTE_HOST + ":27017/" + process.env.DB_REMOTE_DATABASE;
        if (!!process.env.DB_USER && !!process.env.DB_PASSWORD) {
            connString = "mongodb://" + process.env.DB_USER +
                ":" + process.env.DB_PASSWORD +
                "@" + process.env.DB_REMOTE_HOST +
                ":27017/" + process.env.DB_REMOTE_DATABASE + "?authSource=admin";
        }
    }
    return connString;
}
