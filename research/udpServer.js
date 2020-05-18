const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const backendClient = dgram.createSocket('udp4');
const frontendClient = dgram.createSocket('udp4');

setInterval(() => {
    frontendClient.send("NodeJS to Frontend Server: " + new Date().toTimeString(), 3002, 'localhost');
}, 1000);

setInterval(() => {
    backendClient.send("NodeJS to Backend Server: " + new Date().toTimeString(), 3003, 'localhost');
}, 1000);




server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    // console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

    let dataObj = JSON.parse(msg);

    if (dataObj.action === "C" || dataObj.action === "U") {

        // doing math on nodeJS side, free up more DCS.exe
        const headingNorthCorr = Math.atan2(dataObj.data.unitXYZNorthCorr.z - dataObj.data.unitPosition.p.z, dataObj.data.unitXYZNorthCorr.x - dataObj.data.unitPosition.p.x);
        let heading = Math.atan2(dataObj.data.unitPosition.x.z, dataObj.data.unitPosition.x.x) + headingNorthCorr;
        if (heading < 0) {
            heading = heading + 2 * Math.PI;
        }
        dataObj.data.hdg = Math.floor(heading / Math.PI * 180);


        if (dataObj.uType === "unit" && dataObj.data.velocity) {
            dataObj.data.speed = Math.sqrt((dataObj.data.velocity.x * dataObj.data.velocity.x) + (dataObj.data.velocity.z * dataObj.data.velocity.z));
        }
        console.log("DATA: ", dataObj.data.velocity, dataObj.data.speed);
    }



});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(3001);
