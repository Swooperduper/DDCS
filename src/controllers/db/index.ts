import {serverActionsRead} from "./remote";

export * from "./common";
export * from "./local";
export * from "./remote";

export async function testRead() {
    const getServers = await serverActionsRead({});
    console.log("serverTest ", getServers.length);
}
