/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function campaignsActionsRead(): Promise<typings.ICampaigns[]> {
    return new Promise((resolve, reject) => {
        dbModels.campaignsModel.find((err: any, campaigns: typings.ICampaigns[]) => {
            if (err) { reject(err); }
            resolve(campaigns);
        });
    });
}

export async function campaignsActionsReadLatest(): Promise<typings.ICampaigns> {
    return new Promise((resolve, reject) => {
        dbModels.campaignsModel.findOne().sort({ field: "asc", createdAt: -1 }).limit(1)
            .exec((err: any, campaigns: typings.ICampaigns) => {
            if (err) { reject(err); }
            resolve(campaigns);
        });
    });
}

export async function campaignsActionsUpdate(obj: any): Promise<typings.ICampaigns[]> {
    return new Promise((resolve, reject) => {
        dbModels.campaignsModel.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err: any, campaigns: typings.ICampaigns[]) => {
                if (err) { reject(err); }
                resolve(campaigns);
            }
        );
    });
}

export async function campaignsActionsSave(obj: {
    _id: string,
    name: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.campaignsModel.find({_id: obj._id, name: obj.name}, (err: any, campaignsObj: typings.ICampaigns[]) => {
            if (err) {reject(err); }
            if (campaignsObj.length === 0) {
                const campaigns = new dbModels.campaignsModel(obj);
                campaigns.save((saveErr: any) => {
                    if (saveErr) {reject(saveErr); }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}
