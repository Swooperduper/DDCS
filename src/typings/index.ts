export interface IBase {
    _id: string;
    baseType: string;
    enabled: boolean;
    defaultStartSide: number;
    alt: number;
    baseId: number;
    centerLoc: number[];
    hdg: number;
    initSide: number;
    name: string;
    polygonLoc: {
        AICapTemplate: {
            sourceBase: string;
            units: [
                {
                    lonLat: number[];
                    parking: number;
                    parking_id: number;
                    type: string;
                }
            ]
        }
        buildingPoly: [
            [
                number[]
            ]
        ];
        convoyTemplate: {
            [key: string]: {
                destBase: string;
                route: [
                    {
                        action: string;
                        lonLat: number[];
                    }
                ]
            }
        };
        defaults: {
            baseType: string;
            defaultStartSide: number;
            enabled: boolean;
            sourceBase: string;
        };
        layer2Poly: [
            [
                number[]
            ]
        ];
        unitPoly: [
            [
                number[]
            ]
        ];
    };
    side: number;
    mapType: string;
    createdAt: Date;
    updatedAt: Date;
    baseMarkId: number;
    replenTime: string;
}

export interface IServer {
    _id: string;
    updatedAt: Date;
    createdAt: Date;
    name: string;
    enabled: boolean;
    dcsGameGuiPort: number;
    dcsClientPort: number;
    ip: string;
    theater: string;
    replenThresholdBase: number;
    replenThresholdFARP: number;
    minUnits: number;
    maxUnits: number;
    secsBwtTicks: number;
    replenTimer: number;
    spawnLimitsPerTick: {
        samRadar: number;
        samIR: number;
        mobileAntiAir: number;
        antiAir: number;
        tank: number;
        APC: number;
        armoredCar: number;
        troop: number;
        armedStructure: number;
        unarmedAmmo: number;
        unarmedFuel: number;
        unarmedPower: number;
        carrierShip: number;
        defenseShip: number;
    };
    maxCrates: number;
    maxTroops: number;
    maxUnitsMoving: number;
    startLifePoints: number;
    inGameHitMessages: boolean;
    mapRotation: [
        string[]
    ];
    pveAIConfig: [
        {
            config: [
                {
                    name: string;
                    AIType: string;
                    functionCall: string;
                    stackTrigger: number;
                    makeup: [
                        {
                            template: string;
                            count: number;
                        }
                    ]
                }
            ]
        }
    ];
    weaponRules: [
        {
            desc: string;
            maxTotalAllowed: number;
            weapons: string[];
        }
    ];
    isDiscordAllowed: boolean;
    canSeeUnits: boolean;
    restartTimer: number;
    curtimer: number;
    isServerUp: boolean;
    mapCount: number;
    curSeason: string;
    curFilePath: string;
    timePeriod: string;
    isDiscordOnline: boolean;
    fullServerResetOnCampaign: boolean;
    resetFullCampaign: boolean;
    lifePointsEnabled: boolean;
}

export interface IStaticDictionary {
    _id: string;
    type: string;
    country: string[];
    category: string;
    shape_name: string;
}

export interface IUnitDictionary {
    _id: string;
    type: string;
    category: string;
    config: {
        [key: string]: {
            country: string[];
            spawnCount: number;
        }
    };
    spawnCat: string;
    spawnCatSec: string;
    comboName: string[];
    threatLvl: number;
    reloadReqArray: string[];
    launcher: boolean;
    enabled: boolean;
    timePeriod: string[];
    sort: number;
}

export interface IWeaponDictionary {
    _id: string;
    score: number;
    tier: number;
    fox2ModUnder2: number;
    name: string;
    unitType: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICmdQue {
    _id: string;
    timeToExecute: string;
    actionObj: {
        action: string;
        cmd: string[];
        reqID: string;
    };
    queName: string;
    createdAt: Date;
    UpdatedAt: Date;
}

export interface ISrvPlayers {
    ucid: string;
    _id?: string;
    side?: number;
    sideLock?: number;
    sideLockTime?: number;
    curLifePoints?: number;
    gicTimeLeft?: number;
    redRSPoints?: number;
    blueRSPoints?: number;
    tmpRSPoints?: number;
    safeLifeActionTime?: number;
    banned?: boolean;
    gciAllowed?: boolean;
    isGameMaster?: boolean;
    cachedRemovedLPPoints?: number;
    currentSessionMinutesPlayed_blue?: number;
    currentSessionMinutesPlayed_red?: number;
    ipaddr?: string;
    lang?: string;
    name?: string;
    ping?: number;
    slot?: string;
    playerId?: string;
    sessionName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    lastLifeAction?: string;
}

export interface ICampaigns {
    _id: string;
    totalMinutesPlayed_blue: number;
    totalMinutesPlayed_red: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISessions {
    _id: string;
    totalMinutesPlayed_blue: number;
    totalMinutesPlayed_red: number;
    name: string;
    campaignName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISimpleStatEvents {
    _id: string;
    showInChart: boolean;
    sessionName: string;
    eventCode: string;
    iucid: string;
    iName: string;
    displaySide: string;
    roleCode: string;
    msg: string;
    createdAt: Date;
    updatedAt: Date;
}
