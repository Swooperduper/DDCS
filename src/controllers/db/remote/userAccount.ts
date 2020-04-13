/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {userAccountSchema} from "./schemas";
import {IUserAccount} from "../../../typings";
import * as _ from "lodash";

const userAccountTable = remoteConnection.model("useraccounts", userAccountSchema);

export async function userAccountActionsCreate(obj: IUserAccount) {
    return new Promise((resolve, reject) => {
        const useraccount = new userAccountTable(obj);
        useraccount.save((err, savedUserAccount) => {
            if (err) { reject(err); }
            resolve(savedUserAccount);
        });
    });
}

export async function userAccountActionsRead(obj: IUserAccount) {
    return new Promise((resolve, reject) => {
        userAccountTable.find(obj, (err, useraccount) => {
            if (err) { reject(err); }
            resolve(useraccount);
        });
    });
}

export async function userAccountActionsGetPerm(obj: IUserAccount) {
    return new Promise((resolve, reject) => {
        userAccountTable.find({authId: obj}, (err, useraccount) => {
            if (err) { reject(err); }
            resolve(useraccount);
        });
    });
}

export async function userAccountActionsUpdateSingleUCID(obj: IUserAccount) {
    return new Promise((resolve, reject) => {
        userAccountTable.findOneAndUpdate(
            {ucid: obj.ucid},
            {$set: obj},
            {new: true},
            (err, uaccount) => {
                if (err) { reject(err); }
                resolve(uaccount);
            }
        );
    });
}

export async function userAccountActionsUpdateSingleIP(obj: any) {
    return new Promise((resolve, reject) => {
        userAccountTable.findOneAndUpdate(
            {lastIp: obj.ipaddr},
            {$set: obj},
            {new: true},
            (err, uaccount) => {
                if (err) { reject(err); }
                resolve(uaccount);
            }
        );
    });
}

export async function userAccountActionsUpdate(obj: IUserAccount) {
    return new Promise((resolve, reject) => {
        userAccountTable.find({ucid: obj.ucid}, (err, ucidUser) => {
            if (err) {
                reject(err);
            }
            const firstUcidUser = _.first(ucidUser);
            if (!firstUcidUser) {
                userAccountTable.find({lastIp: obj.lastIp}, (findErr, ipUser) => {
                    if (findErr) {
                        reject(findErr);
                    }
                    const firstIpUser = _.first(ipUser);
                    if (firstIpUser) {
                        _.set(firstIpUser, "gameName", _.get(obj, "gameName"));
                        if (typeof obj.curSocket !== "undefined") {
                            _.set(firstIpUser, "curSocket", _.get(obj, "curSocket"));
                        }
                        firstIpUser.save((saveErr) => {
                            if (saveErr) {
                                reject(saveErr);
                            }
                            resolve(ipUser);
                        });
                    }
                });
            } else {
                _.set(firstUcidUser, "gameName", _.get(obj, "gameName"));
                _.set(firstUcidUser, "lastIp", _.get(obj, "lastIp"));
                if (typeof obj.curSocket !== "undefined") {
                    _.set(ucidUser, "curSocket", _.get(obj, "curSocket"));
                }
                firstUcidUser.save((saveErr: any) => {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve(ucidUser);
                });
            }
        });
    });
}

export async function userAccountActionsUpdateSocket(obj: IUserAccount) {
    // console.log('UA update socket line42: ', obj);
    return new Promise((resolve, reject) => {
        userAccountTable.find({authId: obj.authId}, (err, authIdUser) => {
            if (err) {
                reject(err);
            }
            const firstAuthIdUser = _.first(authIdUser);
            if (firstAuthIdUser) {
                _.set(firstAuthIdUser, "lastIp", _.get(obj, "lastIp"));
                _.set(firstAuthIdUser, "curSocket", _.get(obj, "curSocket"));
                firstAuthIdUser.save((saveErr) => {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve(firstAuthIdUser);
                });
            } else {
                console.log("User " + obj.authId + " does not exist in user database line111");
                // reject('User '+obj.authId+' does not exist in user database');
            }
        });
    });
}

export async function userAccountActionsCheckAccount(obj: IUserAccount) {
    const curAuthId = _.get(obj, "body.sub");
    return new Promise((resolve, reject) => {
        userAccountTable.find({authId: curAuthId}, (err, userAccount) => {
            if (err) { reject(err); }
            const firstUserAccount = _.first(userAccount);
            if (!firstUserAccount) {

                const useraccount = new userAccountTable({
                    authId: curAuthId,
                    realName: _.get(obj, "body.name"),
                    firstName: _.get(obj, "body.given_name"),
                    lastName: _.get(obj, "body.family_name"),
                    nickName: _.get(obj, "body.nickname"),
                    picture: _.get(obj, "body.picture"),
                    gender: _.get(obj, "body.gender"),
                    locale: _.get(obj, "body.locale")
                });
                useraccount.save((saveErr, saveUserAccount) => {
                    if (saveErr) { reject(saveErr); }
                    resolve(saveUserAccount);
                });
            } else {
                resolve(firstUserAccount);
            }
        });
    });
}
