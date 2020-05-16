/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {localConnection} from "../../../";

const campaignsTable = localConnection.model(process.env.SERVERNAME + "_campaigns", schemas.campaignsSchema);

export async function campaignsActionsRead(): Promise<typings.ICampaigns[]> {
    return new Promise((resolve, reject) => {
        campaignsTable.find((err, campaigns: typings.ICampaigns[]) => {
            if (err) { reject(err); }
            resolve(campaigns);
        });
    });
}

export async function campaignsActionsReadLatest(): Promise<typings.ICampaigns[]> {
    return new Promise((resolve, reject) => {
        campaignsTable.findOne().sort({ field: "asc", createdAt: -1 }).limit(1).exec((err, campaigns: typings.ICampaigns[]) => {
            if (err) { reject(err); }
            resolve(campaigns);
        });
    });
}

export async function campaignsActionsUpdate(obj: any): Promise<typings.ICampaigns[]> {
    return new Promise((resolve, reject) => {
        campaignsTable.updateOne(
            {name: obj.name},
            {$set: obj},
            (err, campaigns: typings.ICampaigns[]) => {
                if (err) { reject(err); }
                resolve(campaigns);
            }
        );
    });
}

export async function campaignsActionsSave(obj: {
    _id: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        campaignsTable.find({_id: obj._id}, (err, campaignsObj: typings.ICampaigns[]) => {
            if (err) {reject(err); }
            if (campaignsObj.length === 0) {
                const campaigns = new campaignsTable(obj);
                campaigns.save((saveErr) => {
                    if (saveErr) {reject(saveErr); }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}
