/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function serverModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("server", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            displayName: {
                type: String,
                required: true
            },
            theater: {
                type: String,
                required: true,
                default: "Caucasus"
            },
            totalTicks: {
                type: Number
            },
            secsBwtTicks: {
                type: Number
            },
            replenThresholdFARP: {
                type: Number
            },
            replenThresholdBase: {
                type: Number
            },
            replenTimer: {
                type: Number
            },
            minUnits: {
                type: Number
            },
            maxUnits: {
                type: Number
            },
            jtacSpotDistance: {
                type: Number,
                default: 10
            },
            baseSpotDistance: {
                type: Number,
                default: 10
            },
            troopUnloadDistance:{
                type: Number,
                default: 3.4
            },
            troopLoadDistance:{
                type: Number,
                default: 3.4
            },
            crateUnpackDistance:{
                type: Number,
                default: 0.8
            },
            intCargoUnloadDistance:{
                type: Number,
                default: 3.4
            },
            intCargoLoadDistance:{
                type: Number,
                default: 3.4
            },
            baseCaptureProximity:{
                type: Number,
                default: 3
            },
            heliOnlyResupply:{
                type: Boolean,
                default: false
            },
            tacCommAccessAcqCount:{
                type: Number,
                default:8
            },
            spwnLimitsPerTick: {
                type: Object
            },
            ip: {
                type: String,
                required: true,
                default: "localhost"
            },
            dcsClientPort: {
                type: Number,
                required: true,
                default: 3001
            },
            dcsGameGuiPort: {
                type: Number,
                required: true,
                default: 3002
            },
            enabled: {
                type: Boolean,
                default: false
            },
            maxCrates: {
                type: Number,
                required: true,
                default: 10
            },
            maxTroops: {
                type: Number,
                required: true,
                default: 1
            },
            maxUnitsMoving: {
                type: Number,
                required: true,
                default: 7
            },
            startLifePoints: {
                type: Number,
                required: true,
                default: 12
            },
            inGameHitMessages: {
                type: Boolean,
                default: true
            },
            SRSFilePath: {
                type: String,
                required: true,
                default: "C:/Program Files/DCS-SimpleRadio-Standalone/clients-list.json"
            },
            isDiscordAllowed: {
                type: Boolean,
                default: false
            },
            weaponRules: {
                type: Array,
                required: true,
                default: []
            },
            pveAIConfig: {
                type: Array,
                required: true,
                default: []
            },
            curTimer: {
                type: Number
            },
            isServerUp: {
                type: Boolean,
                default: false
            },
            isDiscordOnline: {
                type: Boolean,
                default: false
            },
            restartTime: {
                type: Number,
                required: true,
                default: 18000
            },
            canSeeUnits: {
                type: Boolean,
                default: false
            },
            curSeason: {
                type: String,
                required: true,
                default: "Summer"
            },
            mapCount: {
                type: Number,
                required: true,
                default: 1
            },
            curFilePath: {
                type: String
            },
            timePeriod: {
                type: String,
                required: true,
                default: "modern"
            },
            fullServerRestartOnCampaignWin: {
                type: Boolean,
                default: false
            },
            isJtacLocked: {
                type: Boolean,
                default: true
            },
            resetFullCampaign: {
                type: Boolean,
                default: false
            },
            lifePointsEnabled: {
                type: Boolean,
                default: true
            },
            aiConvoysEnabled: {
                type: Boolean,
                default: true
            },
            reactiveConvoyAI: {
                type: Boolean,
                default: true
            },
            reactiveBaseAI: {
                type: Boolean,
                default: true
            },
            GCIDetectTypes: {
                type: Array,
                required: true,
                default: []
            },
            countrySides: {
                type: Array,
                required: true,
                default: []
            },
            baseAwacs: {
                type: Array,
                required: true,
                default: []
            },
            mainCampaignBases: {
                type: Array,
                required: true,
                default: []
            },
            guildedSubGroups: {
                type: Array,
                required: true,
                default: []
            },
            lockedUsernames: {
                type: Array,
                required: true,
                default: []
            }
        },
        {
            timestamps: true
        }
    ));
}
