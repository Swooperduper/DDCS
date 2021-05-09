import * as bodyParser from "body-parser";
import * as controllers from "./webControllers";
import * as cors from "cors";
import { Server } from "@overnightjs/core";
import { Logger } from "@overnightjs/logger";
import * as express from "express";
import { initV3EngineMaster } from "./controllers";

class DDCSServer extends Server {

    private readonly SERVER_START_MSG = "DDCS server started on port: ";

    constructor() {
        super(true);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(cors());
        this.app.disable("x-powered-by");
        this.app.use("/", express.static(__dirname + "/"));
        this.app.use("/json", express.static(__dirname + "/../app/assets/json"));
        this.app.use("/css", express.static(__dirname + "/../app/assets/css"));
        this.app.use("/fonts", express.static(__dirname + "/../app/assets/fonts"));
        this.app.use("/imgs", express.static(__dirname + "/../app/assets/images"));
        this.app.use("/tabs", express.static(__dirname + "/../app/tabs"));
        this.app.use("/libs", express.static(__dirname + "/../node_modules"));
        this.app.use("/shh", express.static(__dirname + "/../shh"));
        this.setupControllers()
            .catch((err) => {
                console.log("Error setting up controllers: ", err);
            });
    }


    private async setupControllers(): Promise<void> {
        const ctlrInstances = [];

        await initV3EngineMaster()
            .catch((err) => {
                console.log("Engine Error: ", err);
            });

        for (const name in controllers) {
            if (controllers.hasOwnProperty(name)) {
                const controller = (controllers as any)[name];
                ctlrInstances.push(new controller());
            }
        }
        super.addControllers(ctlrInstances);
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            Logger.Imp(this.SERVER_START_MSG + port);
        });
    }
}

export default DDCSServer;
