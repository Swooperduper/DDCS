import {serverActionsRead} from "./remote";

export * from "./common";
// export * from "./remote";

export async function testRead() {
    console.log("serverTest ", await serverActionsRead({}));
}
