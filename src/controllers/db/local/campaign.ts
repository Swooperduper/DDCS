import {localConnection} from "../common/connection";
import {campaignsSchema} from "./schemas";
import {ICampaigns} from "../../../typings";

const campaignsTable = localConnection.model(process.env.SERVERNAME + "_campaigns", campaignsSchema);

export async function campaignsActionsRead() {
    return new Promise((resolve, reject) => {
        campaignsTable.find((err, campaigns) => {
            if (err) { reject(err); }
            resolve(campaigns);
        });
    });
}

export async function campaignsActionsReadLatest() {
    return new Promise((resolve, reject) => {
        campaignsTable.findOne().sort({ field: "asc", createdAt: -1 }).limit(1).exec((err, campaigns) => {
            if (err) { reject(err); }
            resolve(campaigns);
        });
    });
}

export async function campaignsActionsUpdate(obj: any) {
    return new Promise((resolve, reject) => {
        campaignsTable.updateOne(
            {name: obj.name},
            {$set: obj},
            (err, campaigns) => {
                if (err) { reject(err); }
                resolve(campaigns);
            }
        );
    });
}

export async function campaignsActionsSave(obj: {
    _id: string
}) {
    return new Promise((resolve, reject) => {
        campaignsTable.find({_id: obj._id}, (err, campaignsObj) => {
            if (err) {reject(err); }
            if (campaignsObj.length === 0) {
                const campaigns = new campaignsTable(obj);
                campaigns.save((saveErr, campObj) => {
                    if (saveErr) {reject(saveErr); }
                    resolve(campObj);
                });
            } else {
                resolve("line53: no campoaigns with id: " + obj._id);
            }
        });
    });
}
