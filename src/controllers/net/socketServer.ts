/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
import * as dgram from "dgram";
const server = dgram.createSocket("udp4");
const backendClient = dgram.createSocket("udp4");
const frontendClient = dgram.createSocket("udp4");
import * as ddcsControllers from "../";

export function sendUDPPacket(environment: string, packetObj: any) {
    if (environment === "backEnd") {
        backendClient.send(JSON.stringify(packetObj), Number(process.env.BACKEND_PORT), process.env.DB_LOCAL_HOST);
    }

    if (environment === "frontEnd") {
        frontendClient.send(JSON.stringify(packetObj), Number(process.env.MISSION_PORT), process.env.DB_LOCAL_HOST);
    }
}

server.on("error", (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (msg) => {

    const dataObj = JSON.parse(msg.toString());

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
        // console.log("DATA: ", dataObj.data.velocity, dataObj.data.speed);
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

/*
import * as net from "net";
import * as _ from "lodash";
import * as ddcsControllers from "../";

const lastSyncTime = new Date().getTime();
const syncSpawnTimer = 60 * 1000;

export function createSocket(address: string, port: number, queName: string, callback: any, type: string) {
    let socketSpeed;
    const curTime = new Date().valueOf();
    const mainQue: any[] = [];

    const sock = {
        cQue: mainQue,
        serverName: process.env.SERVER_NAME,
        connOpen: true,
        buffer: "",
        startTime: curTime,
        sessionName: process.env.SERVER_NAME + "_" + curTime + " " + queName + " Node Server Start Time",
        sockConn: net.createConnection({ host: address, port }, () => {
            console.log("Connected to DCS Client at " + address + ":" + port + " !");
            sock.connOpen = false;
            sock.buffer = "";
        })
    };

    sock.sockConn.on("connect", () => {
        sock.startTime = new Date().valueOf() ;
        sock.sessionName = process.env.SERVER_NAME + "_" + sock.startTime;
        sock.sockConn.write("{\"action\":\"NONE\"}" + "\n");
    });

    sock.sockConn.on("data", (data) => {
        let i: number;
        sock.buffer += data;
        // tslint:disable-next-line:no-conditional-assignment
        while ((i = sock.buffer.indexOf("\n")) >= 0) {
            let curStr;
            let isValidJSON = true;
            const subStr = sock.buffer.substring(0, i);
            try {
                JSON.parse(subStr);
            } catch (e) { isValidJSON = false; }
            if (isValidJSON) {
                curStr = JSON.parse(subStr);
            } else {
                curStr = "{}";
                console.log("bad substring: ", subStr);
            }
            callback(curStr);
            sock.buffer = sock.buffer.substring(i + 1);
            const nextInst = sock.cQue[0];
            const strJson = (nextInst) ? JSON.stringify(nextInst) : "{\"action\":\"NONE\"}" ;
            sock.sockConn.write( strJson + "\n");
            if (nextInst) {
                sock.cQue.shift();
            }
        }
    });

    sock.sockConn.on("close", () => {
        console.log(" Reconnecting DCS Client on " + address + ":" + port + "....");
        sock.connOpen = true;
    });

    sock.sockConn.on("error", (err) => {
        sock.connOpen = true;
        console.log("Client Error: ", err);
    });

    if (type === "frontend") {
        socketSpeed = 200;
    }
    if (type === "backend") {
        socketSpeed = 1000;
    }

    setInterval(() => { // sending FULL SPEED AHEAD, 1 per milsec (watch for weird errors, etc)
        const curIntervalTime = new Date().getTime();
        if (ddcsControllers.isSyncLockdownMode && !ddcsControllers.isServerSynced) {
            if (ddcsControllers.processInstructions) {
                if (lastSyncTime + syncSpawnTimer < curIntervalTime) {
                    ddcsControllers.cmdQueActionsGrabNextQue({queName})
                        .then((resp: any) => {
                            if (resp) {
                                sock.cQue.push(resp.actionObj);
                            }
                        })
                        .catch((err) => {
                            console.log("erroring line34: ", err);
                        })
                    ;
                }
            }
        } else {
            ddcsControllers.cmdQueActionsGrabNextQue({queName})
                .then((resp: any) => {
                    if (resp) {
                        sock.cQue.push(resp.actionObj);
                    }
                })
                .catch((err) => {
                    console.log("erroring line34: ", err);
                })
            ;
        }
    }, socketSpeed);
}
*/
