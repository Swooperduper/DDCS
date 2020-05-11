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
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(3001);
