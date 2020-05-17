import * as dotEnv from "dotenv";
import DDCSServer from "./server";
import { initV3Engine } from "./controllers/db/common";

dotEnv.config({path: `${__dirname}/../config/.env`});

initV3Engine()
    .catch((err) => {
        console.log("Engine Error: ", err);
    });

// start web frontend
const server = new DDCSServer();
server.start(process.env.NODE_ENV === "development" ? 3000 : 8000);
