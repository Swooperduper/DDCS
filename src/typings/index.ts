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
    polygonLoc: IPolygonLoc;
    side: number;
    mapType: string;
    createdAt: Date;
    updatedAt: Date;
    baseMarkId: number;
    replenTime: string;
    underAttack: number;
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
    spawnLimitsPerTick: ISpawnCategoryTicks;
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
            config: IAIConfig[]
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
    spwnLimitsPerTick: number;
    fullServerRestartOnCampaignWin: boolean;
    isJtacLocked: boolean;
}

export interface IStaticDictionary {
    _id: string;
    type: string;
    objectCategory: number;
    unitCategory: number;
    shape_name: string;
    config: any;
    canCargo: boolean;
}

export interface IUnitDictionary {
    _id: string;
    type: string;
    objectCategory: number;
    unitCategory: number;
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
    centerRadar: boolean;
    secRadarNum: number;
    spoke: boolean;
    lonLatLoc: number[];
    spokeDistance: number;
    routeLocs: number[];
    LPCost: number;
    name: string;
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
    displayName: string;
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

export interface IMasterCue {
    _id: string;
    timeToExecute: string;
    actionObj: {
        action: string;
        cmd: string[];
        reqID: string;
    };
    side: number;
    queName: string;
    createdAt: Date;
    UpdatedAt: Date;
    payload: any;
}

export interface ISrvPlayers {
    _id: string;
    ucid: string;
    sideLockTime: number;
    cachedRemovedLPPoints: number;
    currentSessionMinutesPlayed_blue: number;
    currentSessionMinutesPlayed_red: number;
    side: number;
    playerId: string;
    redRSPoints: number;
    blueRSPoints: number;
    tmpRSPoints: number;
    sideLock: number;
    curLifePoints: number;
    gicTimeLeft: number;
    safeLifeActionTime: number;
    updatedAt: Date;
    virtualCrates: true;
    banned?: boolean;
    gciAllowed?: boolean;
    isGameMaster?: boolean;
    ipaddr?: string;
    lang?: string;
    name?: string;
    ping?: number;
    slot?: string;
    sessionName?: string;
    createdAt?: Date;
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

export interface IStaticObject {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    lonLatLoc: number[];
    objectCategory: number;
    unitCategory: number;
    country: string;
    config: any;
    type: string;
    name: string;
    hdg: number;
    shape_name: string;
    canCargo?: boolean;
    mass?: number;
}

export interface ICrate {
    _id: string;
    shapeName: string;
    category: string;
    type: string;
    canCargo: boolean;
    mass: number;
    isCombo: boolean;
    playerCanDrive: boolean;
    name: string;
    heading: number;
    playerOwnerId: string;
    templateName: string;
    special: string;
    crateAmt: number;
    country: string;
    side: number;
    coalition: number;
    lonLatLoc: number[];
    createdAt: Date;
    updatedAt: Date;
    shape_name: string;
}

export interface IAmmo {
    count: number;
    typeName: string;
}

export interface IUnit {
    jtacEnemyLocation: {
        laserCode: string;
        alt: number,
        type: string,
        lonLat: {
            lat: number,
            lon: number
        },
        mgrs: {
            Easting: string
            MGRSDigraph: string,
            Northing: string,
            UTMZone: string
        }
    };
    threatLvl: number;
    jtacReplenTime: number;
    jtacTarget: any;
    _id: string;
    playerCanDrive: boolean;
    hidden: boolean;
    enabled: boolean;
    dead: boolean;
    isActive: boolean;
    isTroop: boolean;
    isCrate: boolean;
    isCombo: boolean;
    isResync: boolean;
    isAI: boolean;
    ammo: IAmmo[];
    agl: number;
    alt: number;
    objectCategory: number;
    unitCategory: number;
    coalition: number;
    country: number;
    groupId: number;
    groupName: string;
    hdg: number;
    inAir: boolean;
    lonLatLoc: number[];
    name: string;
    playername: string;
    speed: number;
    surfType: number;
    type: string;
    unitId: number;
    createdAt: Date;
    updatedAt: Date;
    intCargoType: string;
    troopType: string;
    virtCrateType: string;
    playerOwnerId: string;
    spawnCat: string;
    unitDict: IUnitDictionary;
    proxChkGrp: string;
    routeLocs: number[][];
    baseId: number;
    visible: boolean;
    task: string;
    heading: number;
    skill: string;
    parking_id: number;
    parking: number;
    payload: string;
    callsign: {
        name: string;
        1: number;
        2: number;
        3: number;
    };
    onboard_num: number;
    samType: string;
    shape_name: string;
    canCargo: boolean;
    lateActivation?: boolean;
}

export interface IWebPush {
    payload: any;
    serverName: string;
    side: number;
}

export interface IRemoteComms {
    _id: string;
    isInSRS: boolean;
    isInDiscord: boolean;
    SRSData: any;
}

export interface ITheater {
    _id: string;
    name: string;
    lat: string;
    lon: string;
    zoom: string;
    removeSideZone: string;
}

export interface IUserAccount {
    authId: string;
    permLvl: number;
    gameName: string;
    realName: string;
    lastIp: string;
    lastServer: string;
    curSocket: string;
    ucid: string;
    firstName: string;
    lastName: string;
    nickName: string;
    picture: string;
    gender: string;
    locale: string;
}

export interface IWeaponScore {
    _id: string;
    name: string;
    displayName: string;
    category: string;
    unitType: string;
    score: number;
    tier: number;
    fox2ModUnder2: number;
}

export interface IProcess {
    firingTime: Date;
    queObj: object;
}

export interface IPlayerBalance {
    underdog: number;
    ratio: number;
}

export interface IAIConfig {
    name: string;
    AIType: string;
    functionCall: string;
    stackTrigger: string;
    makeup: IMakeup[];
}

export interface IMakeup {
    template: string;
    count: number;
}

export interface ISrvMessages {
    que: any[];
    unitCount: number;
    startAbsTime: number;
    curAbsTime: number;
    epoc: number;
}

export interface IBasePayload {
    action: string;
    callback: string;
    unitId: string;
    mapType: string;
    data: IBase[];
}

export interface IUnitPayload {
    action: string;
    callback: string;
    unitId: string;
    data: IUnit;
}

export interface ISrvCratesPayload {
    action: string;
    callback: string;
    unitId: string;
    data: ISrvCrate[];
}

export interface ISrvCrate {
    lat: number;
    lon: number;
    alive: boolean;
}

export interface ISrvPlayerBalance {
    side: number;
    modifier: number;
    players?: ISrvPlayers[];
}

export interface IPointsTemplate {
    type: string;
    action: string;
    x: string;
    y: string;
    speed: number;
    name: string;
    radioFreq: number;
    eplrs?: number;
}

export interface IConvoyRouteTemplate {
    route: {
        points: IPointsTemplate[]
    };
    routeLocs: any[];
    alt: number;
    speed: number;
    baseId: number;
    eplrs: number;
    radioFreq: number;
    tacan: {
        channel: number;
        enabled: boolean;
        modeChannel: number;
        frequency: number;
    };
    groupName: string;
    baseName: string;
    country: string;
    hidden: boolean;
}

export interface ISpawnCategoryTicks {
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
}

export interface IConvoyTemplate {
    sourceBase: string;
    destBase: string;
    route: [
        {
            action: string;
            lonLat: number[];
        }
    ];
    polygonLoc: any;
    name: string;
    baseId: number;
}

export interface IPolygonLoc {
    AICapTemplate: {
        sourceBase: string;
        units: ICapTemplate[];
    };
    buildingPoly: [
        [
            number[]
        ]
    ];
    convoyTemplate: {
        [key: string]: IConvoyTemplate;
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
}

export interface ICapTemplate {
    lonLat: number[];
    parking: number;
    parking_id: number;
    type: string;
}

export interface IUnitSpawnMin {
    playerCanDrive: boolean;
    hdg: number;
    alt: number;
    coalition: number;
    country: number;
    unitCategory: number;
    objectCategory: number;
    type: string;
    isActive?: boolean;
    lateActivation?: boolean;
    countryName?: string;
    skill?: string;
    lonLatLoc?: number[];
    groupName?: string;
    name?: string;
    _id?: string;
}

export interface IStaticSpawnMin {
    _id: string;
    name: string;
    country: number;
    type: string;
    shape_name: string;
    canCargo: boolean;
    unitCategory: number;
    objectCategory: number;
    hdg: number;
    alt: number;
    lonLatLoc: number[];
    isActive: boolean;
}

export interface IGroundUnitTemp {
    lonLatLoc: number[];
    type: string;
    name: string;
    country: number;
    hdg?: number;
    playerCanDrive?: boolean;
    skill?: string;
}

export interface IStaticUnitTemp {
    lonLatLoc: number[];
    unitCategory: number;
    country: number;
    type: string;
    name: string;
    shape_name: string;
    canCargo?: boolean;
    hdg?: number;
    mass?: number;
}

export interface ITemplate {
    _id: string;
    template: string;
}

export interface IMenuCommand {
    _id: string;
    sort: number;
    menuPath: string[];
    side: number;
    itemTitle: string;
    cmdProp: {
        cmd: string;
        type: string;
        unitId: number;
        crates: number;
        mobile: boolean;
        mass: boolean;
    };
    allowedUnitTypes: string[];
}
