import {Connection} from "mongoose";
import * as dotEnv from "dotenv";
import DDCSServer from "./server";
import * as controllers from "./controllers";
import * as localModels from "./controllers/db/local/models";
import * as remoteModels from "./controllers/db/remote/models";

dotEnv.config({path: `${__dirname}/../config/.env`});

export let localConnection: Connection;
export let remoteConnection: Connection;

export const dbModels: any = {};

async function startBackendEngine() {
    localConnection = await controllers.getDbConnection("localConnection");
    remoteConnection = await controllers.getDbConnection("remoteConnection");

    for (const [key, value] of Object.entries(localModels)) {
        dbModels[key] = value(remoteConnection);
    }
    for (const [key, value] of Object.entries(remoteModels)) {
        dbModels[key] = value(remoteConnection);
    }

    console.log("DB ", dbModels);
    await controllers.testRead();
}

startBackendEngine()
    .catch((err) => {
        console.log("Engine Error: ", err);
});

// start web frontend
const server = new DDCSServer();
server.start(process.env.NODE_ENV === "development" ? 3000 : 8000);
