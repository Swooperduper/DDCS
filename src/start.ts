import * as dotEnv from "dotenv";
import DDCSServer from "./server";
import { initV3Engine } from "./controllers/db/common";

dotEnv.config({path: `${__dirname}/../config/.env`});

if (process.env.SERVER_NAME === "DDCS") {
    // start web frontend
    const server = new DDCSServer();

    server.start(process.env.NODE_ENV === "development" ? 3000 : 80);
} else {
    initV3Engine()
        .catch((err) => {
            console.log("Engine Error: ", err);
        });
}
