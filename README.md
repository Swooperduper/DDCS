# DDCS 3.0
## Dynamic DCS System for Controlling DCS Servers
The Dynamic DCS engine is built on externally written software from the ground up to offload all the process's from the DCS server to allow for unique game play using nodeJS and mongoDB for asynchronous processing and decision making.
The server then, syncs to it through lua sockets and it compiles commands to send back, essentially freeing up massive amounts of overhead for the server to do what it needs to do.<br>

The full system is compiled of:<br>
DCS (Game Server) <-> dynamicdcs.com (nodeJS) <-> Discord (API) or SRS (JSON file)

The main goal of this server is to create a place to fly where it feels like a real war, things happen that you cant predict like a real war.

## Commands:
(Some of these commands require `npm install` to have been run beforehand)
- `npm start`: start the app in production mode. Production code must be built for production first (needs linux env): `npm run build`.
- `npm run start-dev`: start the server in dev mode. Will activate automated file-watcher and generate source-maps.
- `npm run build` at _root/_ will build the app for production. Contents are put into _build/_.
- `npm test`: Run back-end unit-tests

If you have any questions you can reach me at: andrew.finegan < at > gmail.com
