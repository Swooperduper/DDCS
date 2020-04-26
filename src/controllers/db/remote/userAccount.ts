/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

const userAccountTable = ddcsController.remoteConnection.model("useraccounts", ddcsController.userAccountSchema);

export async function userAccountActionsCreate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const useraccount = new userAccountTable(obj);
        useraccount.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function userAccountActionsRead(obj: any): Promise<ddcsController.IUserAccount[]> {
    return new Promise((resolve, reject) => {
        userAccountTable.find(obj, (err, useraccount: ddcsController.IUserAccount[]) => {
            if (err) { reject(err); }
            resolve(useraccount);
        });
    });
}

export async function userAccountActionsGetPerm(obj: any): Promise<ddcsController.IUserAccount[]> {
    return new Promise((resolve, reject) => {
        userAccountTable.find({authId: obj}, (err, useraccount: ddcsController.IUserAccount[]) => {
            if (err) { reject(err); }
            resolve(useraccount);
        });
    });
}

export async function userAccountActionsUpdateSingleUCID(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        userAccountTable.findOneAndUpdate(
            {ucid: obj.ucid},
            {$set: obj},
            {new: true},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function userAccountActionsUpdateSingleIP(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        userAccountTable.findOneAndUpdate(
            {lastIp: obj.ipaddr},
            {$set: obj},
            {new: true},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function userAccountActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        userAccountTable.find({ucid: obj.ucid}, (err, ucidUser: ddcsController.IUserAccount[]) => {
            if (err) {
                reject(err);
            }

            if (ucidUser.length > 0) {
                const firstUcidUser = {
                    ...ucidUser[0],
                    gameName: obj.gameName,
                    lastIp: obj.lastIp
                };

                if (typeof obj.curSocket !== "undefined") {
                    firstUcidUser.curSocket = obj.curSocket;
                }
                const fIObj = new userAccountTable(firstUcidUser);
                fIObj.save((saveErr) => {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve();
                });
            } else {
                userAccountTable.find({lastIp: obj.lastIp}, (findErr, ipUser: ddcsController.IUserAccount[]) => {
                    if (findErr) {
                        reject(findErr);
                    }
                    const firstIpUser = ipUser[0];
                    if (firstIpUser) {
                        firstIpUser.gameName = obj.gameName;
                        if (typeof obj.curSocket !== "undefined") {
                            firstIpUser.curSocket = obj.curSocket;
                        }
                        const fIObj = new userAccountTable(firstIpUser);
                        fIObj.save((saveErr) => {
                            if (saveErr) { reject(saveErr); }
                            resolve();
                        });
                    }
                });
            }
        });
    });
}

export async function userAccountActionsUpdateSocket(obj: any): Promise<void> {
    // console.log('UA update socket line42: ', obj);
    return new Promise((resolve, reject) => {
        userAccountTable.find({authId: obj.authId}, (err, authIdUser: ddcsController.IUserAccount[]) => {
            if (err) {
                reject(err);
            }
            let firstAuthIdUser = authIdUser[0];
            if (firstAuthIdUser) {
                firstAuthIdUser = {
                    ...firstAuthIdUser,
                    lastIp: obj.lastIp,
                    curSocket: obj.curSocket
                };

                const fAObj = new userAccountTable(firstAuthIdUser);
                fAObj.save((saveErr) => {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve();
                });
            } else {
                console.log("User " + obj.authId + " does not exist in user database line111");
                // reject('User '+obj.authId+' does not exist in user database');
            }
        });
    });
}

export async function userAccountActionsCheckAccount(obj: any): Promise<void> {
    const curAuthId = _.get(obj, "body.sub");
    return new Promise((resolve, reject) => {
        userAccountTable.find({authId: curAuthId}, (err, userAccount) => {
            if (err) { reject(err); }
            const firstUserAccount = _.first(userAccount);
            if (!firstUserAccount) {

                const useraccount = new userAccountTable({
                    authId: curAuthId,
                    realName: obj.body.name,
                    firstName: obj.body.given_name,
                    lastName: obj.body.family_name,
                    nickName: obj.body.nickname,
                    picture: obj.body.picture,
                    gender: obj.body.gender,
                    locale: obj.body.locale
                });
                useraccount.save((saveErr) => {
                    if (saveErr) { reject(saveErr); }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}
