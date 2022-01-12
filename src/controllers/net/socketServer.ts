/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
// tslint:disable-next-line:no-var-requires
const dgram = require("dgram");
const backendClient = dgram.createSocket("udp4");
const frontendClient = dgram.createSocket("udp4");
import * as ddcsControllers from "../";

export async function sendUDPPacket(environment: string, packetObj: any) {
    if (packetObj.timeToExecute > 0) {
        await ddcsControllers.futureCommandQueActionsSave({
            actionObj: packetObj.actionObj,
            queName: environment,
            timeToExecute: packetObj.timeToExecute
        });
    } else {
        if (environment === "backEnd") {
            backendClient.send(JSON.stringify(packetObj), Number(process.env.BACKEND_PORT), process.env.DB_LOCAL_HOST);
        }

        if (environment === "frontEnd") {
            frontendClient.send(JSON.stringify(packetObj), Number(process.env.MISSION_PORT), process.env.DB_LOCAL_HOST);
        }
    }
}

export async function startUpReceiveUDPSocket() {
    const server = dgram.createSocket("udp4");

    server.on("error", (err: any) => {
        console.log(`server error:\n${err.stack}`);
        server.close();
    });

    server.on("message", (msg: any) => {

        const dataObj = JSON.parse(msg);
        if (dataObj.action === "C" || dataObj.action === "U") {
            // doing math on nodeJS side, free up more DCS.exe
            const headingNorthCorr = Math.atan2(
                dataObj.data.unitXYZNorthCorr.z - dataObj.data.unitPosition.p.z,
                dataObj.data.unitXYZNorthCorr.x - dataObj.data.unitPosition.p.x
            );
            let heading = Math.atan2(dataObj.data.unitPosition.x.z, dataObj.data.unitPosition.x.x) + headingNorthCorr;
            if (heading < 0) {
                heading = heading + 2 * Math.PI;
            }
            dataObj.data.hdg = Math.floor(heading / Math.PI * 180);


            if (dataObj.uType === "unit" && dataObj.data.velocity) {
                dataObj.data.speed = Math.sqrt(
                    (dataObj.data.velocity.x * dataObj.data.velocity.x) + (dataObj.data.velocity.z * dataObj.data.velocity.z)
                );
            }
        }

        ddcsControllers.processingIncomingData(dataObj)
            .catch((err) => {
                console.log("ProcessError: ", err, dataObj);
            });
    });

    server.on("listening", () => {
        const address = server.address();
        console.log(`server listening ${address.address}:${address.port}`);
    });

    server.bind(Number(process.env.NODEJS_UDP_PORT));
}
