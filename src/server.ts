import * as bodyParser from "body-parser";
import * as controllers from "./webControllers";
import { Server } from "@overnightjs/core";
import { Logger } from "@overnightjs/logger";
import * as express from "express";

class DDCSServer extends Server {

    private readonly SERVER_START_MSG = "DDCS server started on port: ";

    constructor() {
        super(true);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use("/assets", express.static(__dirname + "/webControllers/assets"));
        this.setupControllers()
            .catch((err) => {
                console.log("Error setting up controllers: ", err);
            });
    }


    private async setupControllers(): Promise<void> {
        const ctlrInstances = [];
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
