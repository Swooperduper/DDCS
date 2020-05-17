/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function userAccountActionsCreate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const useraccount = new dbModels.userAccountModel(obj);
        useraccount.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function userAccountActionsRead(obj: any): Promise<typings.IUserAccount[]> {
    return new Promise((resolve, reject) => {
        dbModels.userAccountModel.find(obj, (err: any, useraccount: typings.IUserAccount[]) => {
            if (err) { reject(err); }
            resolve(useraccount);
        });
    });
}

export async function userAccountActionsGetPerm(obj: any): Promise<typings.IUserAccount[]> {
    return new Promise((resolve, reject) => {
        dbModels.userAccountModel.find({authId: obj}, (err: any, useraccount: typings.IUserAccount[]) => {
            if (err) { reject(err); }
            resolve(useraccount);
        });
    });
}

export async function userAccountActionsUpdateSingleUCID(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.userAccountModel.findOneAndUpdate(
            {ucid: obj.ucid},
            {$set: obj},
            {new: true},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function userAccountActionsUpdateSingleIP(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.userAccountModel.findOneAndUpdate(
            {lastIp: obj.ipaddr},
            {$set: obj},
            {new: true},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function userAccountActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.userAccountModel.find({ucid: obj.ucid}, (err: any, ucidUser: typings.IUserAccount[]) => {
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
                const fIObj = new dbModels.userAccountModel(firstUcidUser);
                fIObj.save((saveErr: any) => {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve();
                });
            } else {
                dbModels.userAccountModel.find({lastIp: obj.lastIp}, (findErr: any, ipUser: typings.IUserAccount[]) => {
                    if (findErr) {
                        reject(findErr);
                    }
                    const firstIpUser = ipUser[0];
                    if (firstIpUser) {
                        firstIpUser.gameName = obj.gameName;
                        if (typeof obj.curSocket !== "undefined") {
                            firstIpUser.curSocket = obj.curSocket;
                        }
                        const fIObj = new dbModels.userAccountModel(firstIpUser);
                        fIObj.save((saveErr: any) => {
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
        dbModels.userAccountModel.find({authId: obj.authId}, (err: any, authIdUser: typings.IUserAccount[]) => {
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

                const fAObj = new dbModels.userAccountModel(firstAuthIdUser);
                fAObj.save((saveErr: any) => {
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
        dbModels.userAccountModel.find({authId: curAuthId}, (err: any, userAccount: typings.IUserAccount[]) => {
            if (err) { reject(err); }
            const firstUserAccount = userAccount[0];
            if (!firstUserAccount) {

                const useraccount = new dbModels.userAccountModel({
                    authId: curAuthId,
                    realName: obj.body.name,
                    firstName: obj.body.given_name,
                    lastName: obj.body.family_name,
                    nickName: obj.body.nickname,
                    picture: obj.body.picture,
                    gender: obj.body.gender,
                    locale: obj.body.locale
                });
                useraccount.save((saveErr: any) => {
                    if (saveErr) { reject(saveErr); }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}
