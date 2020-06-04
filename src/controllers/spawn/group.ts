/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typing from "../../typings";
import * as ddcsControllers from "../";
import {IGroundUnitTemp, IStaticSpawnMin} from "../../typings";

let openSAM: string;

export async function spawnGrp(grpSpawn: string, country: number, category: number): Promise<string> {
    const spawnTemplate = await ddcsControllers.templateRead({_id: "spawnGroup"});
    const compiled = _.template(spawnTemplate[0].template);
    return compiled({country, category, grpSpawn});
}

export async function spawnStatic(staticSpawn: string, country: number): Promise<string> {
    const spawnTemplate = await ddcsControllers.templateRead({_id: "spawnStatic"});
    const compiled = _.template(spawnTemplate[0].template);
    return compiled({country, staticSpawn});
}

// TODO: maybe combine this with the other route templates
export async function turnOnEWRAuto(groupObj: typing.IUnit): Promise<string> {
    let setCallSign: any;
    let setFreq: any;
    if (_.includes(ddcsControllers.countryId[groupObj.country], "UKRAINE")) {
        setCallSign = 254;
        setFreq = 254000000;
    } else if (groupObj.type === "55G6 EWR") {
        // Mig 15 freq
        setCallSign = 375;
        setFreq = 3750000;
    } else {
        setCallSign = 124;
        setFreq = 124000000;
    }

    const spawnTemplate = await ddcsControllers.templateRead({_id: "turnOnEWRAutoRoute"});
    const compiled = _.template(spawnTemplate[0].template);
    return compiled({setFreq, setCallSign});
}

export function convoyRouteTemplate(routes: typing.IConvoyRouteTemplate) {
    const buildTemplate: any = {
        route: {
            points: []
        },
        routeLocs: [],
        alt: 0,
        speed: 0,
        baseId: 0,
        eplrs: 0,
        radioFreq: 0,
        tacan: {
            channel: 0,
            enabled: false,
            modeChannel: 0,
            frequency: 0
        }
    };
    let cNum = 1;
    for (const route of routes.routeLocs) {
        const routePayload: typing.IPointsTemplate = {
            type: "Turning Point",
            action: route.action,
            x: "coord.LLtoLO(" + route.lonLat[1] + ", " + route.lonLat[0] + ").x",
            y: "coord.LLtoLO(" + route.lonLat[1] + ", " + route.lonLat[0] + ").z",
            speed: 20,
            name: "route" + cNum,
            radioFreq: 0
        };

        buildTemplate.route.points.push(routePayload);
        cNum = cNum + 1;
    }
    return buildTemplate;
}

export async function getRouteTemplate(routes: any, templateName: string): Promise<string> {
    const spawnTemplate = await ddcsControllers.templateRead({_id: templateName});
    const compiled = _.template(spawnTemplate[0].template);
    return compiled({routes});
}

export async function awacsPlaneRouteTemplate(routes: any): Promise<string> {
    const addTaskNum = (routes.eplrs) ? 1 : 0;

    let curRoute = await getRouteTemplate(routes, "awacsPlaneRoute1");

    if (routes.eplrs) {
        curRoute += await getRouteTemplate(routes, "awacsPlaneRoute2");
    }

    const spawnTemplate3 = await ddcsControllers.templateRead({_id: "awacsPlaneRoute3"});
    const compiled3 = _.template(spawnTemplate3[0].template);
    curRoute += compiled3({routes, num1: (addTaskNum + 2), num2: (addTaskNum + 3)});
    return curRoute;
}

export async function tankerPlaneRouteTemplate(routes: any): Promise<string> {

    let tankerTemplate = await getRouteTemplate(routes, "tankerPlaneRoute1");
    const tacanInfo = await getRouteTemplate(routes, "tankerPlaneRoute2");

    if (routes.tacan.enabled) {
        tankerTemplate = _.replace(tankerTemplate, "#TACAN", tacanInfo);
    } else {
        tankerTemplate = _.replace(tankerTemplate, "#TACAN", "");
    }
    return tankerTemplate;
}

export async function landPlaneRouteTemplate(routes: any) {
    return await getRouteTemplate(routes, "landPlaneRoute");
}

export async function landHeliRouteTemplate(routes: any) {
    return await getRouteTemplate(routes, "landHeliRoute");
}

export async function grndUnitGroup( groupObj: any, task?: string, routes?: string ): Promise<string> {
    let curRoute: string;
    const curTask = (task) ? task : "Ground Nothing";
    const uncontrollable = !_.get(groupObj, "playerCanDrive", false);

    if (routes) {
        curRoute = routes;
    } else if (groupObj.type === "1L13 EWR" || groupObj.type === "55G6 EWR" ) {
        curRoute = await turnOnEWRAuto(groupObj);
    } else {
        curRoute = await getRouteTemplate({} as typing.IConvoyRouteTemplate, "turnOffDisperseUnderFireRoute");
    }

    const visible = (groupObj.visible) ? groupObj.visible : "false";
    const hidden = (groupObj.hidden) ? groupObj.hidden : "false";
    const curTmpTask = (groupObj.task) ? groupObj.task : curTask;

    const spawnTemplate = await ddcsControllers.templateRead({_id: "groundGroup"});
    const compiled = _.template(spawnTemplate[0].template);
    return compiled({
        groupName: groupObj.groupName,
        visible,
        hidden,
        uncontrollable,
        curTmpTask,
        category: groupObj.category,
        country: groupObj.country,
        curRoute
    });
}

export function grndUnitTemplate( unitObj: typing.IGroundUnitTemp ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"type\"] = \"" + unitObj.type + "\"," +
        "[\"transportable\"] = {" +
            "[\"randomTransportable\"] = true," +
        "}," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        "[\"heading\"] = " + (unitObj.hdg || 0) + "," +
        "[\"playerCanDrive\"] = " + (unitObj.playerCanDrive || false) + "," +
        "[\"skill\"] = \"" + (unitObj.skill || "Excellent") + "\"," +
        "[\"country\"] = \"" + ddcsControllers.countryId[unitObj.country] + "\"," +
    "}";
}

export function mi24vTemplate( unitObj: typing.IUnit ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"livery_id\"] = \"standard 1\"," +
        "[\"type\"] = \"Mi-24V\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + unitObj.heading || 0 + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"payload\"]={" +
            "[\"pylons\"]={}," +
            "[\"fuel\"] = \"1704\"," +
            "[\"flare\"] = 192," +
            "[\"chaff\"] = 0," +
            "[\"gun\"] = 100," +
        "}," +
    "},";
}

export function ah1wTemplate( unitObj: typing.IUnit ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"livery_id\"] = \"USA X Black\"," +
        "[\"type\"] = \"AH-1W\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + unitObj.heading || 0 + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"payload\"]={" +
            "[\"pylons\"]={}," +
                "[\"fuel\"] = \"1250\"," +
                "[\"flare\"] = 30," +
                "[\"chaff\"] = 30," +
                "[\"gun\"] = 100," +
            "}," +
        "},";
}

export function mi28nTemplate( unitObj: typing.IUnit ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"type\"] = \"Mi-28N\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + unitObj.heading || 0 + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
            "[\"pylons\"]={" +
                "[1] = {" +
                    "[\"CLSID\"] = \"{57232979-8B0F-4db7-8D9A-55197E06B0F5}\"," +
                "}," +
            "}," +
            "[\"fuel\"] = \"1500\"," +
            "[\"flare\"] = 128," +
            "[\"chaff\"] = 0," +
            "[\"gun\"] = 100," +
        "}," +
    "},";
}

export function ah64dTemplate( unitObj: typing.IUnit ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"type\"] = \"AH-64D\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + unitObj.heading || 0 + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
            "[\"pylons\"]={" +
                "[1] = {" +
                    "[\"CLSID\"] = \"{88D18A5E-99C8-4B04-B40B-1C02F2018B6E}\"," +
                "}," +
                "[4] = {" +
                    "[\"CLSID\"] = \"{88D18A5E-99C8-4B04-B40B-1C02F2018B6E}\"," +
                "}," +
            "}," +
            "[\"fuel\"] = \"1157\"," +
            "[\"flare\"] = 30," +
            "[\"chaff\"] = 30," +
            "[\"gun\"] = 50," +
        "}," +
    "},";
}

export function b1bTemplate( unitObj: typing.IUnit ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"type\"] = \"B-1B\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + unitObj.heading || 0 + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
            "[\"pylons\"]={" +
                "[1] = {" +
                    "[\"CLSID\"] = \"B-1B_Mk-84*8\"," +
                "}," +
                "[2] = {" +
                    "[\"CLSID\"] = \"GBU-31V3B*8\"," +
                "}," +
                "[3] = {" +
                    "[\"CLSID\"] = \"B-1B_Mk-84*8\"," +
                "}," +
            "}," +
            "[\"fuel\"] = \"88450\"," +
            "[\"flare\"] = 30," +
            "[\"chaff\"] = 60," +
            "[\"gun\"] = 100," +
        "}," +
    "},";
}

export function su24mTemplate( unitObj: typing.IUnit ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"type\"] = \"Su-24M\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + unitObj.heading || 0 + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
            "[\"pylons\"]={" +
                "[1] = {" +
                    "[\"CLSID\"] = \"{3C612111-C7AD-476E-8A8E-2485812F4E5C}\"," +
                "}," +
                "[2] = {" +
                    "[\"CLSID\"] = \"{KAB_1500Kr_LOADOUT}\"," +
                "}," +
                "[3] = {" +
                    "[\"CLSID\"] = \"{E2C426E3-8B10-4E09-B733-9CDC26520F48}\"," +
                "}," +
                "[4] = {" +
                    "[\"CLSID\"] = \"{KAB_1500Kr_LOADOUT}\"," +
                "}," +
                "[5] = {" +
                    "[\"CLSID\"] = \"{3C612111-C7AD-476E-8A8E-2485812F4E5C}\"," +
                "}," +
                "[6] = {" +
                    "[\"CLSID\"] = \"{E2C426E3-8B10-4E09-B733-9CDC26520F48}\"," +
                "}," +
                "[7] = {" +
                    "[\"CLSID\"] = \"{KAB_1500Kr_LOADOUT}\"," +
                "}," +
                "[8] = {" +
                    "[\"CLSID\"] = \"{3C612111-C7AD-476E-8A8E-2485812F4E5C}\"," +
                "}," +
            "}," +
            "[\"fuel\"] = \"11700\"," +
            "[\"flare\"] = 96," +
            "[\"chaff\"] = 96," +
            "[\"gun\"] = 100," +
        "}," +
    "},";
}

export function capPlaneDefenseTemplate( unitObj: any ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.routeLocs[1] + ", " +  unitObj.routeLocs[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.routeLocs[1] + ", " +  unitObj.routeLocs[0] + ").z, " +
        "[\"type\"] = \"" + unitObj.type + "\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        "[\"parking_id\"] = \"" + unitObj.parking_id + "\"," +
        "[\"parking\"] = \"" + unitObj.parking + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
        unitObj.payload || "" +
        "}," +
    "},";
}

export function capHeliDefenseTemplate( unitObj: any ): string {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.routeLocs[1] + ", " +  unitObj.routeLocs[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.routeLocs[1] + ", " +  unitObj.routeLocs[0] + ").z, " +
        "[\"type\"] = \"" + unitObj.type + "\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        "[\"parking_id\"] = \"" + unitObj.parking_id + "\"," +
        "[\"parking\"] = \"" + unitObj.parking + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
        unitObj.payload || "" +
        "}," +
        "},";
}

export function airUnitTemplate( unitObj: typing.IUnit ): string {
    let curAirTemplate = "{" +
        "[\"x\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + unitObj.lonLatLoc[1] + ", " +  unitObj.lonLatLoc[0] + ").z, " +
        "[\"type\"] = \"" + unitObj.type + "\"," +
        "[\"name\"] = \"" + unitObj.name + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + unitObj.heading || 0 + "," +
        "[\"skill\"] = \"" + unitObj.skill || "Excellent" + "\"," +
        "[\"payload\"]={" +
            "[\"pylons\"]={}," +
            "[\"fuel\"] = \"100000\"," +
            "[\"flare\"] = 200," +
            "[\"chaff\"] = 200," +
            "[\"gun\"] = 200," +
        "},";

    if (ddcsControllers.countryId[unitObj.country] === "USA" || ddcsControllers.countryId[unitObj.country] === "AGGRESSORS") {
            // console.log("cs: ", unitObj);
            curAirTemplate = curAirTemplate + "[\"callsign\"] = {" +
            "[1] = " + unitObj.callsign[1] + "," +
            "[2] = " + unitObj.callsign[2] + "," +
            "[3] = " + unitObj.callsign[3] + "," +
            "[\"name\"] = \"" + unitObj.callsign.name + "\"," +
            "}," +
            "[\"onboard_num\"] = \"" + unitObj.onboard_num + "\",";
        } else {
            curAirTemplate = curAirTemplate + "[\"callsign\"] = \"" + unitObj.callsign + "\"," +
            "[\"onboard_num\"] = \"" + unitObj.onboard_num + "\",";
        }
    return curAirTemplate + "}";
}

export function staticTemplate(staticObj: typing.IStaticUnitTemp): string {
    let retObj = "{" +
        "[\"x\"] = coord.LLtoLO(" + staticObj.lonLatLoc[1] + ", " +  staticObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + staticObj.lonLatLoc[1] + ", " +  staticObj.lonLatLoc[0] + ").z, " +
        "[\"category\"] = \"" + staticObj.unitCategory + "\"," +
        "[\"country\"] = \"" + staticObj.country + "\"," +
        "[\"type\"] = \"" + staticObj.type + "\"," +
        "[\"name\"] = \"" + staticObj.name + "\"," +
        "[\"shape_name\"] = \"" + staticObj.shape_name + "\"," +
        "[\"heading\"] = " + (staticObj.hdg || 0) + "," +
        "[\"canCargo\"] = " + (staticObj.canCargo || "false") + ",";
    if (staticObj.canCargo) {
        retObj += "[\"mass\"] = \"" + staticObj.mass + "\",";
    }
    return retObj + "}";
}

export function getRndFromSpawnCat(
    spawnCat: string,
    side: number,
    spawnShow: boolean,
    spawnAlways?: boolean,
    launchers?: number,
    useUnitType?: string
): typing.IUnitDictionary[] {
    const engineCache = ddcsControllers.getEngineCache();
    const curTimePeriod = engineCache.config.timePeriod;
    let findUnits;
    const cPUnits: any[] = [];
    let randomIndex;
    const unitsChosen: any[] = [];
    let curLaunchSpawn: any;
    let curUnit: any;
    let curUnits: any[] = [];

    if (!_.isEmpty(useUnitType)) {
        const curComboUnit = _.find(engineCache.unitDictionary, {type: useUnitType});
        if (curComboUnit && curComboUnit.comboName) {
            findUnits = _.filter(engineCache.unitDictionary, {comboName: curComboUnit.comboName});
        }
    } else if (curTimePeriod === "modern" && spawnCat === "samRadar") {
        findUnits = _.filter(engineCache.unitDictionary, {spawnCat: "samRadar", spawnCatSec: "modern", enabled: true});
    } else {
        findUnits = _.filter(engineCache.unitDictionary, {spawnCat, enabled: true});
    }

    if (findUnits && findUnits.length > 0) {
        for (const unit of findUnits) {
            const curCountry =
                _.intersection(
                    unit.config[ddcsControllers.getEngineCache().config.timePeriod].country,
                    ddcsControllers.COUNTRY[(side || 0)]
                );
            if (curCountry.length > 0) {
                unit.country = curCountry[0];
                cPUnits.push(unit);
            }
        }
    }

    if (spawnAlways) {
        randomIndex = _.random(0, cPUnits.length - 1);
    } else {
        randomIndex = _.random(0, cPUnits.length);
    }

    curUnit = cPUnits[randomIndex];

    if (curUnit) {
        if (curUnit.comboName.length > 0) {
            curUnits = _.filter(cPUnits, (curPUnit) => {
                return _.includes(curPUnit.comboName, _.sample(curUnit.comboName));
            });
        } else {
            curUnits.push(curUnit);
        }
        if (curUnits.length > 0) {
            for (const cUnit of curUnits) {
                const curTimePeriodSpawnCount = cUnit.config[ddcsControllers.getEngineCache().config.timePeriod].spawnCount;
                if (cUnit.launcher) {
                    curLaunchSpawn = launchers ? launchers : curTimePeriodSpawnCount;
                } else {
                    curLaunchSpawn = curTimePeriodSpawnCount;
                }
                for (let y = 0; y < curLaunchSpawn; y++) {
                    unitsChosen.push(cUnit);
                }
            }
        }
        if (spawnShow) {
            for (const unit of unitsChosen) {
                unit.hidden = false;
            }
        }

        return unitsChosen;
    } else {
        return [];
    }
}

export function spawnSupportVehiclesOnFarp( baseName: string, side: number ): typing.IUnitSpawnMin[] {
    const engineCache = ddcsControllers.getEngineCache();
    const curBase = _.find(engineCache.bases, {name: baseName});

    if (curBase) {
        const curFarpArray: any[] = [];
        const sptArray = [
            "unarmedAmmo",
            "unarmedFuel"
        ];
        let curAng = _.cloneDeep(curBase.hdg);
        if (curAng > 180) {
            curAng = curAng - 90;
        } else {
            curAng = curAng + 270;
        }
        for ( const val of sptArray) {
            const curSpawnTemplate = getRndFromSpawnCat(val, side, false, true)[0];
            const curCountry = _.intersection(
                curSpawnTemplate.config[ddcsControllers.getEngineCache().config.timePeriod].country,
                ddcsControllers.COUNTRY[(side || 0)]
            );

            const newObj = {
                name: baseName + "_" + val,
                lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(curBase.centerLoc, curAng, 0.05),
                hdg: _.random(0, 359),
                alt: 0,
                coalition: side,
                country: ddcsControllers.countryId.indexOf(curCountry[0]),
                unitCategory: curSpawnTemplate.unitCategory,
                objectCategory: curSpawnTemplate.objectCategory,
                type: curSpawnTemplate.type,
                _id: baseName + "_" + val,
                groupName: baseName + "_Support"
            };
            curAng += 15;
            curFarpArray.push(newObj);
        }

        return curFarpArray;
    } else {
        console.log("Cant find base, line: 1513");
        return [];
    }
}

export async function spawnSupportBaseGrp( baseName: string, side: number, init: boolean ): Promise<void> {
    const farpBases = _.filter(ddcsControllers.getEngineCache().bases, (baseObj) => {
        return ((_.includes(baseObj._id, "_MOB") && baseObj.initSide === side) ||
            _.includes(baseObj._id, "_FOB")) && _.split(baseObj.name, " #")[0] === baseName;
    });
    for (const farp of farpBases) {
        await spawnUnitGroup(spawnSupportVehiclesOnFarp( farp.name, side ), init, baseName, side);
    }
}

export async function spawnBaseReinforcementGroup(side: number, baseName: string, init: boolean, forceSpawn?: boolean): Promise<number> {
    const engineCache = ddcsControllers.getEngineCache();
    let curAngle = 0;
    let curRndSpawn;
    const curServer = engineCache.config;
    let curSpokeDeg;
    let curSpokeNum;
    let infoSpwn;
    const curBaseSpawnCats: any = curServer.spwnLimitsPerTick;
    let randLatLonInBase: number[];
    let groupedUnits = [];
    let totalUnits = 0;
    let compactUnits: typing.IUnitSpawnMin[];
    let centerRadar;
    let polyCheck;
    for (const spawnCats of Object.keys(curBaseSpawnCats)) {
        const spawnTicks = curBaseSpawnCats[spawnCats];
        for (let i = 0; i < spawnTicks; i++) {
            curAngle = 0;
            curRndSpawn = _.sortBy(getRndFromSpawnCat(spawnCats, side, false, forceSpawn), "sort");
            if (curRndSpawn.length > 0) {
                compactUnits = [];
                infoSpwn = curRndSpawn[0];
                centerRadar = infoSpwn.centerRadar ? 1 : 0;
                polyCheck = infoSpwn.centerRadar ? "buildingPoly" : "unitPoly";
                const curCountry = _.intersection(
                    infoSpwn.config[ddcsControllers.getEngineCache().config.timePeriod].country,
                    ddcsControllers.COUNTRY[(side || 0)]
                );

                if (infoSpwn.spoke) {
                    randLatLonInBase = ddcsControllers.getRandomLatLonFromBase(baseName, polyCheck);
                    groupedUnits = [];
                    curSpokeNum = curRndSpawn.length - centerRadar;
                    curSpokeDeg = 359 / curSpokeNum;

                    if (infoSpwn.centerRadar) {
                        // main radar
                        groupedUnits.push({
                            hdg: _.random(0, 359),
                            alt: 0,
                            coalition: side,
                            country: ddcsControllers.countryId.indexOf(curCountry[0]),
                            unitCategory: infoSpwn.unitCategory,
                            objectCategory: infoSpwn.objectCategory,
                            type: infoSpwn.type,
                            lonLatLoc: ddcsControllers.getRandomLatLonFromBase(baseName, polyCheck)
                        });
                    }
                    // secondary radar
                    for (let j = _.cloneDeep(centerRadar); j < infoSpwn.secRadarNum + centerRadar; j++) {
                        curAngle += curSpokeDeg;
                        groupedUnits.push({
                            hdg: _.random(0, 359),
                            alt: 0,
                            coalition: side,
                            country: ddcsControllers.countryId.indexOf(curCountry[0]),
                            unitCategory: curRndSpawn[j].unitCategory,
                            objectCategory: curRndSpawn[j].objectCategory,
                            type: curRndSpawn[j].type,
                            lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(
                                randLatLonInBase,
                                curAngle,
                                curRndSpawn[j].spokeDistance / 2
                            )
                        });
                    }
                    // launchers
                    for (let k = infoSpwn.secRadarNum + centerRadar; k < curSpokeNum + centerRadar; k++) {
                        curAngle += curSpokeDeg;
                        groupedUnits.push({
                            hdg: _.random(0, 359),
                            alt: 0,
                            coalition: side,
                            country: ddcsControllers.countryId.indexOf(curCountry[0]),
                            unitCategory: curRndSpawn[k].unitCategory,
                            objectCategory: curRndSpawn[k].objectCategory,
                            type: curRndSpawn[k].type,
                            lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(
                                randLatLonInBase,
                                curAngle,
                                curRndSpawn[k].spokeDistance
                            )
                        });
                    }
                    compactUnits = _.compact(groupedUnits);
                } else {
                    compactUnits = _.compact([
                        {
                            hdg: _.random(0, 359),
                            alt: 0,
                            coalition: side,
                            country: ddcsControllers.countryId.indexOf(curCountry[0]),
                            unitCategory: infoSpwn.unitCategory,
                            objectCategory: infoSpwn.objectCategory,
                            type: infoSpwn.type,
                            lonLatLoc: ddcsControllers.getRandomLatLonFromBase(baseName, polyCheck)
                        }
                    ]);
                }
                totalUnits += compactUnits.length;
                await spawnUnitGroup(compactUnits, init, baseName, side);
            }
        }
        // if its not init, dont touch the SAMnet
        if (spawnCats === "samRadar" && !init) {
            await spawnSAMNet(side, baseName, init);
            totalUnits += 3;
        }
        if (spawnCats === "antiAir" && spawnTicks > 0 && curServer.timePeriod === "1978ColdWar") {
            totalUnits += await spawnLayer2Reinforcements("antiAir", 2, spawnTicks, side, baseName, init);
        }

        if (spawnCats === "mobileAntiAir" && spawnTicks > 0 && curServer.timePeriod === "modern") {
            totalUnits += await spawnLayer2Reinforcements("mobileAntiAir", 2, spawnTicks, side, baseName, init);
        }
    }
    return totalUnits;
}

export async function spawnSAMNet(side: number, baseName: string, init: boolean): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const spawnArray = [
        ["1SAM", "3SAM", "5SAM"],
        ["2SAM", "4SAM", "6SAM"]
    ];
    let realSAMArray: any[] = [];

    const samUnits = await ddcsControllers.unitActionRead({$and: [{name: new RegExp(baseName)}, {name: /SAM/}], dead: false});
    if (samUnits.length > 0) {
        const curSamType = samUnits[0].type;
        const curUnitDict = _.find(engineCache.unitDictionary, {_id: curSamType});
        if (curUnitDict) {
            const curRealArray = curUnitDict.reloadReqArray;
            const curSAMObj: any = {};
            let curSAMType;
            let curSAM;
            realSAMArray = [];
            for (const samUnit of samUnits) {
                curSAM = _.cloneDeep(samUnit);
                curSAMType = _.split(curSAM.name, "|")[2];
                curSAM.samType = curSAMType;
                curSAMObj[curSAMType] = curSAMObj[curSAMType] || [];
                curSAMObj[curSAMType].push(curSAM);
            }
            for (const samObjKey of Object.keys(curSAMObj)) {
                if (curRealArray.length === _.intersection(curRealArray, _.map(curSAMObj[samObjKey], "type")).length) {
                    console.log("1 good sam: ", samObjKey);
                    realSAMArray.push(samObjKey);
                }
            }
            if (realSAMArray.length < 3) {
                if (_.intersection(spawnArray[0], realSAMArray).length > 0) {
                    openSAM =  _.sample(_.difference(spawnArray[0], realSAMArray));
                } else if (_.intersection(spawnArray[1], realSAMArray).length > 0) {
                    openSAM =  _.sample(_.difference(spawnArray[1], realSAMArray));
                } else {
                    openSAM = _.sample(_.sample(spawnArray)) || spawnArray[0][0];
                }
                await spawnStarSam(side, baseName, openSAM, init);
            } else {
                console.log("3+ missle batterys in place");
            }
        } else {
            console.log("");
        }
    } else {
        if (init) {
            for (const spawnPoint of (_.sample(spawnArray) || spawnArray[0])) {
                await spawnStarSam(side, baseName, spawnPoint[0], init);
            }
        }
    }
}

export async function spawnStarSam(
    side: number,
    baseName: string,
    openStarSAM: string,
    init: boolean,
    launchers?: number,
    useUnitType?: string,
    lastLonLat?: number[]
): Promise<void> {
    let centerRadar;
    let compactUnits;
    let curAngle = 0;
    let curRndSpawn;
    let curSpokeDeg;
    let curSpokeNum;
    let randLatLonInBase;
    let infoSpwn;
    let groupedUnits: any[];
    randLatLonInBase = (lastLonLat) ? lastLonLat : ddcsControllers.getRandomLatLonFromBase(baseName, "layer2Poly", openStarSAM);
    groupedUnits = [];
    curRndSpawn = _.sortBy(getRndFromSpawnCat("samRadar", side, false, true, launchers, useUnitType ), "sort");
    infoSpwn = curRndSpawn[0];
    centerRadar = infoSpwn.centerRadar ? 1 : 0;
    curSpokeNum = curRndSpawn.length - centerRadar;
    curSpokeDeg = 359 / curSpokeNum;
    const curCountry = _.intersection(
        infoSpwn.config[ddcsControllers.getEngineCache().config.timePeriod].country,
        ddcsControllers.COUNTRY[(side || 0)]
    );
    if (infoSpwn.centerRadar) {
        groupedUnits.push({
            hdg: _.random(0, 359),
            alt: 0,
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            coalition: side,
            country: ddcsControllers.countryId.indexOf(curCountry[0]),
            unitCategory: infoSpwn.unitCategory,
            objectCategory: infoSpwn.objectCategory,
            type: infoSpwn.type,
            lonLatLoc: randLatLonInBase
        });
    }
    // secondary radar
    for (let j = _.cloneDeep(centerRadar); j < infoSpwn.secRadarNum + centerRadar; j++) {
        curAngle += curSpokeDeg;
        groupedUnits.push({
            hdg: _.random(0, 359),
            alt: 0,
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            coalition: side,
            country: ddcsControllers.countryId.indexOf(curCountry[0]),
            unitCategory: curRndSpawn[j].unitCategory,
            objectCategory: curRndSpawn[j].objectCategory,
            type: curRndSpawn[j].type,
            lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, infoSpwn.spokeDistance / 2)
        });
    }
    // launchers
    for (let k = _.get(infoSpwn, "secRadarNum") + centerRadar; k < curSpokeNum + centerRadar; k++) {
        curAngle += curSpokeDeg;
        groupedUnits.push({
            hdg: _.floor(curAngle),
            alt: 0,
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            coalition: side,
            country: ddcsControllers.countryId.indexOf(curCountry[0]),
            unitCategory: curRndSpawn[k].unitCategory,
            objectCategory: curRndSpawn[k].objectCategory,
            type: curRndSpawn[k].type,
            lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, infoSpwn.spokeDistance)
        });
    }
    // add ammo truck
    const ammoTruck = getRndFromSpawnCat("unarmedAmmo", side, false, true)[0];
    groupedUnits.push({
        hdg: _.floor(curAngle),
        alt: 0,
        name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
        coalition: side,
        country: ddcsControllers.countryId.indexOf(curCountry[0]),
        unitCategory: ammoTruck.unitCategory,
        objectCategory: ammoTruck.objectCategory,
        type: ammoTruck.type,
        lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, 180, infoSpwn.spokeDistance / 2)
    });
    compactUnits = _.compact(groupedUnits);
    await spawnUnitGroup(compactUnits, init, baseName, side);
}

export async function spawnLayer2Reinforcements(
    catType: string,
    rndAmt: number,
    curTick: number,
    side: number,
    baseName: string,
    init: boolean
): Promise<number> {
    let totalUnits = 0;
    const curTickCnt = curTick * rndAmt;
    console.log("spawnBase: ", baseName);
    for (let i = 0; i < curTickCnt; i++) {
        let curAngle = 0;
        const curRndSpawn = getRndFromSpawnCat(catType, side, false, true);
        const groupedL2Units = [];
        const curSpokeNum = curRndSpawn.length;
        const curSpokeDeg = 359 / curSpokeNum;
        const curCountry = _.intersection(
            curRndSpawn[0].config[ddcsControllers.getEngineCache().config.timePeriod].country,
            ddcsControllers.COUNTRY[(side || 0)]
        );

        const randLatLonInBase = _.cloneDeep(ddcsControllers.getRandomLatLonFromBase(baseName, "layer2Poly"));
        const curUnarmedAmmo = getRndFromSpawnCat("unarmedAmmo", side, false, true);
        groupedL2Units.push({
            hdg: _.random(0, 359),
            alt: 0,
            coalition: side,
            country: ddcsControllers.countryId.indexOf(curCountry[0]),
            unitCategory: curUnarmedAmmo[0].unitCategory,
            objectCategory: curUnarmedAmmo[0].objectCategory,
            type: curUnarmedAmmo[0].type,
            lonLatLoc: randLatLonInBase
        });
        // launchers
        for (let j = 0; j < curSpokeNum; j++) {
            curAngle += curSpokeDeg;
            groupedL2Units.push({
                hdg: _.random(0, 359),
                alt: 0,
                coalition: side,
                country: ddcsControllers.countryId.indexOf(curCountry[0]),
                unitCategory: curRndSpawn[j].unitCategory,
                objectCategory: curRndSpawn[j].objectCategory,
                type: curRndSpawn[j].type,
                lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, 0.05)
            });
        }
        const curGroupedUnits = _.compact(groupedL2Units);
        await spawnUnitGroup(curGroupedUnits, init, baseName, side);
        totalUnits += curGroupedUnits.length;
    }
    return totalUnits;
}

export async function spawnConvoy(
    groupName: string,
    convoySide: number,
    baseTemplate: typing.IConvoyTemplate,
    aIConfig: typing.IAIConfig,
    mesg: string
): Promise<void> {
    const convoyMakeup: any[] = [];
    let curUnit;
    for (const units of aIConfig.makeup) {
        curUnit = {
            ...exports.getRndFromSpawnCat(units.template, convoySide, false, true)[0],
            country: ddcsControllers.defCountrys[convoySide],
            speed: "55",
            hidden: false,
            playerCanDrive: false
        };
        for (let x = 0; x < units.count; x++) {
            curUnit.name = groupName + units.template + "|" + x + "|";
            convoyMakeup.push(curUnit);
        }
    }

    const curConvoyMakeup = convoyMakeup;
    let groupArray: string = "";
    let curGroupSpawn;
    const defaultStartLonLat = baseTemplate.route[0].lonLat;

    const curGrpObj = {
        groupName,
        country: curConvoyMakeup[0].country,
        routeLocs: baseTemplate.route,
        category: ddcsControllers.UNIT_CATEGORY.indexOf("GROUND_UNIT")
    };

    curGroupSpawn = await grndUnitGroup(curGrpObj);
    let unitNum = 1;
    for (const convUnit of curConvoyMakeup) {
        const curSpwnUnit = {
            ..._.cloneDeep(convUnit),
            hidden: false,
            name: groupName + unitNum + "|",
            lonLatLoc: defaultStartLonLat,
            playerCanDrive: false
        };
        groupArray += grndUnitTemplate(curSpwnUnit) + ",";
        unitNum = unitNum + 1;
    }
    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", groupArray);
    const curCMD = exports.spawnGrp(curGroupSpawn, _.get(curGrpObj, "country"), _.get(curGrpObj, "category"));
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    await ddcsControllers.setMissionTask(groupName, JSON.stringify(exports.convoyRouteTemplate(curGrpObj)));
    await ddcsControllers.sendMesgToCoalition(
        convoySide,
        mesg,
        20
    );
}

export async function spawnCAPDefense(
    groupName: string,
    convoySide: number,
    baseTemplate: any,
    aIConfig: typing.IAIConfig,
    mesg: string
): Promise<void> {
    let curUnit: any = {};
    let capMakeup;
    let curUnitSpawn: string = "";
    let curGroupSpawn = "";
    let curCapTemp: any = {};

    for (const aiMakeup of aIConfig.makeup) {
        const spawnTemplateName = aiMakeup.template[baseTemplate.polygonLoc.AICapTemplate.units[0].type];
        let curAngle = 0;

        capMakeup = [];
        curUnitSpawn = "";
        curUnit = {
            ..._.cloneDeep(getRndFromSpawnCat(spawnTemplateName, convoySide, false, true)[0]),
            groupName,
            baseName: baseTemplate.name,
            country: ddcsControllers.defCountrys[convoySide],
            baseId: baseTemplate.baseId,
            hidden: false
        };

        for (let y = 0; y < aiMakeup.count; y++) {

            curCapTemp = baseTemplate.polygonLoc.AICapTemplate.units[y];
            curUnit = {
                ...curUnit,
                parking_id: curCapTemp.parking_id,
                parking: curCapTemp.parking,
                name: groupName + spawnTemplateName + "|" + y + "|"
            };
            if (curCapTemp.type === "F-15C") {
                curUnit.routeLocs = curCapTemp.lonLat;
                curUnitSpawn += capPlaneDefenseTemplate(curUnit);
            }
            if (curCapTemp.type === "AH-1W") {
                curUnit.routeLocs = ddcsControllers.getLonLatFromDistanceDirection(curCapTemp.lonLat, curAngle, 0.15);
                curAngle += 180;
                curUnitSpawn += capHeliDefenseTemplate(curUnit);
            }
        }
        if (curCapTemp.type === "F-15C") {
            curGroupSpawn = await grndUnitGroup(curUnit, "CAP", await getRouteTemplate(curUnit, "capPlaneDefenseRoute"));
        }
        if (curCapTemp.type === "AH-1W") {
            curGroupSpawn = await grndUnitGroup(curUnit, "CAS", await getRouteTemplate(curUnit, "capHeliDefenseRoute"));
        }
    }

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = await spawnGrp(curGroupSpawn, ddcsControllers.defCountrys[convoySide], curUnit.category);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    await ddcsControllers.sendMesgToCoalition(
        convoySide,
        mesg,
        20
    );
}

export async function spawnDefenseChopper(playerUnitObj: typing.IUnit, unitObj: typing.IUnit): Promise<void> {
    let curTkrName: any;
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curCountry: number;
    let curSpwnUnit: any;
    let curGrpObj: any;
    let friendlyLoc;
    const curCategory = ddcsControllers.UNIT_CATEGORY.indexOf("HELICOPTER");

    curCountry = unitObj.country;
    curTkrName = "AI|" + unitObj.name + "|";
    curSpwnUnit = _.cloneDeep(unitObj);

    const friendlyBase = await ddcsControllers.baseActionGetClosestFriendlyBase({
        unitLonLatLoc: playerUnitObj.lonLatLoc,
        playerSide: playerUnitObj.coalition
    });
    const patrolDistance = 2;
    friendlyLoc = ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 0, patrolDistance);
    curGrpObj = {
        ..._.cloneDeep(curSpwnUnit),
        groupName: curTkrName + "#" + _.random(1000000, 9999999),
        country: ddcsControllers.countryId[curCountry],
        category: curCategory,
        alt: Number(unitObj.alt) + Number(friendlyBase.alt),
        routeLocs: [
            friendlyLoc,
            ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 45, patrolDistance),
            ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 90, patrolDistance),
            ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 135, patrolDistance),
            ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 180, patrolDistance),
            ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 225, patrolDistance),
            ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 270, patrolDistance),
            ddcsControllers.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 315, patrolDistance)
        ]
    };

    curGroupSpawn = await grndUnitGroup( curGrpObj, "CAS", await getRouteTemplate(curGrpObj, "defenseHeliRoute"));

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: friendlyLoc,
        name: curTkrName + "#" + _.random(1000000, 9999999),
        playerCanDrive: false,
        hidden: false
    };

    if (unitObj.name === "RussianDefHeli") {
        for (let x = 0; x < 2; x++) {
            curUnitSpawn += mi24vTemplate(curSpwnUnit);
        }
    }
    if (unitObj.name === "USADefHeli") {
        for (let x = 0; x < 2; x++) {
            curUnitSpawn += ah1wTemplate(curSpwnUnit);
        }
    }

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = await spawnGrp(curGroupSpawn, curCountry, curCategory);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    const mesg = "C: A pair of " + unitObj.type + " is defending " + friendlyBase.name;
    await ddcsControllers.sendMesgToCoalition(
        playerUnitObj.coalition,
        mesg,
        20
    );
}

export async function spawnAtkChopper(playerUnitObj: typing.IUnit, unitObj: typing.IUnit): Promise<void> {
    let curTkrName: string;
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curCountry: number;
    let curSpwnUnit: any;
    let curGrpObj;
    let friendlyLoc;
    let enemyLoc;
    const curCategory = ddcsControllers.UNIT_CATEGORY.indexOf("HELICOPTER");

    curCountry = unitObj.country;
    curTkrName = "AI|" + unitObj.name + "|";
    curSpwnUnit = _.cloneDeep(unitObj);

    const enemyBase = await ddcsControllers.baseActionGetClosestEnemyBase({
        unitLonLatLoc: playerUnitObj.lonLatLoc,
        playerSide: playerUnitObj.coalition
    });
    const friendlyBase = await ddcsControllers.baseActionGetClosestFriendlyBase({
        unitLonLatLoc: playerUnitObj.lonLatLoc,
        playerSide: playerUnitObj.coalition
    });
    friendlyLoc = ddcsControllers.getLonLatFromDistanceDirection(
        friendlyBase.centerLoc,
        ddcsControllers.findBearing(
            friendlyBase.centerLoc[1],
            friendlyBase.centerLoc[0],
            enemyBase.centerLoc[1],
            enemyBase.centerLoc[0]
        ),
        10
    );
    enemyLoc = enemyBase.centerLoc;
    curGrpObj = {
        ..._.cloneDeep(curSpwnUnit),
        groupName: curTkrName + "#" + _.random(1000000, 9999999),
        country: ddcsControllers.countryId[unitObj.country],
        category: curCategory,
        alt: Number(unitObj.alt) + Number(friendlyBase.alt),
        routeLocs: [
            friendlyLoc,
            enemyLoc
        ]
    };

    curGroupSpawn = await grndUnitGroup( curGrpObj, "CAS", await getRouteTemplate(curGrpObj, "atkHeliRoute"));

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: friendlyLoc,
        name: curTkrName + "#" + _.random(1000000, 9999999),
        playerCanDrive: false,
        hidden: false
    };

    if (unitObj.name === "RussianAtkHeli") {
        for (let x = 0; x < 2; x++) {
            curUnitSpawn += mi28nTemplate(curSpwnUnit);
        }
    }
    if (unitObj.name === "USAAtkHeli") {
        for (let x = 0; x < 2; x++) {
            curUnitSpawn += ah64dTemplate(curSpwnUnit);
        }
    }

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = await spawnGrp(curGroupSpawn, curCountry, curCategory);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    const mesg = "C: " + unitObj.type + " Atk Heli is departed " + friendlyBase.name + " and it is patrolling toward " + enemyBase.name;
    await ddcsControllers.sendMesgToCoalition(
        playerUnitObj.coalition,
        mesg,
        20
    );
}

export async function spawnBomberPlane(playerUnitObj: typing.IUnit, bomberObj: any): Promise<void> {
    let curTkrName: string;
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curCountry: number;
    let curSpwnUnit: any;
    let curGrpObj;
    let remoteLoc;
    let closeLoc;
    const curCategory = ddcsControllers.UNIT_CATEGORY.indexOf("AIRPLANE");
    const randomDir = _.random(0, 359);

    curCountry = bomberObj.country;
    curTkrName = "AI|" + bomberObj.name + "|";
    curSpwnUnit = _.cloneDeep(bomberObj);

    const closeBase = await ddcsControllers.baseActionGetClosestEnemyBase({
        unitLonLatLoc: playerUnitObj.lonLatLoc,
        playerSide: playerUnitObj.coalition
    });
    remoteLoc = ddcsControllers.getLonLatFromDistanceDirection(closeBase.centerLoc, randomDir, curSpwnUnit.spawnDistance);
    closeLoc = ddcsControllers.getLonLatFromDistanceDirection(closeBase.centerLoc, randomDir, 7);

    curGrpObj = {
        ..._.cloneDeep(curSpwnUnit),
        groupName: curTkrName + "#" + _.random(1000000, 9999999),
        country: ddcsControllers.countryId[curCountry],
        category: curCategory,
        alt: Number(bomberObj.alt) + Number(closeBase.alt),
        routeLocs: [
            remoteLoc,
            closeLoc
        ]
    };

    curGroupSpawn = await grndUnitGroup( curGrpObj, "CAS", await getRouteTemplate(curGrpObj, "bombersPlaneRoute"));

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: remoteLoc,
        name: curTkrName + "#" + _.random(1000000, 9999999),
        playerCanDrive: false,
        hidden: false
    };

    if (bomberObj.name === "RussianBomber") {
        for (let x = 0; x < 4; x++) {
            curUnitSpawn += su24mTemplate(curSpwnUnit);
        }
    }
    if (bomberObj.name === "USABomber") {
        curUnitSpawn = b1bTemplate(curSpwnUnit);
    }

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = await spawnGrp(curGroupSpawn, curCountry, curCategory);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    const mesg = "C: " + bomberObj.type + " Bomber is commencing its run BRA " +
        randomDir + " from " + closeBase.name + " " + bomberObj.details;
    await ddcsControllers.sendMesgToCoalition(
        playerUnitObj.coalition,
        mesg,
        20
    );
}

export async function spawnAWACSPlane(playerUnitObj: typing.IUnit, awacsObj: any): Promise<void> {
    let curTkrName: string;
    let curUnitSpawn;
    let curGroupSpawn;
    let curCountry: number;
    let curSpwnUnit: any;
    let curGrpObj;
    let remoteLoc;
    const curCategory = ddcsControllers.UNIT_CATEGORY.indexOf("AIRPLANE");

    curCountry = awacsObj.country;
    curTkrName = "AI|" + awacsObj.name + "|";
    curSpwnUnit = _.cloneDeep(awacsObj);

    const closeBase = await ddcsControllers.baseActionGetClosestBase({ unitLonLatLoc: playerUnitObj.lonLatLoc});
    remoteLoc = ddcsControllers.getLonLatFromDistanceDirection(
        playerUnitObj.lonLatLoc,
        playerUnitObj.hdg,
        curSpwnUnit.spawnDistance
    );

    curGrpObj = {
        ..._.cloneDeep(curSpwnUnit),
        groupName: curTkrName,
        country: ddcsControllers.countryId[curCountry],
        category: curCategory,
        routeLocs: [
            remoteLoc,
            playerUnitObj.lonLatLoc
        ]
    };

    curGroupSpawn = await grndUnitGroup( curGrpObj, "AWACS", await awacsPlaneRouteTemplate(curGrpObj));

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: remoteLoc,
        name: curTkrName,
        playerCanDrive: false,
        hidden: false
    };

    curUnitSpawn = airUnitTemplate(curSpwnUnit);

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = await spawnGrp(curGroupSpawn, curCountry, curCategory);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    const mesg = "C: A " + awacsObj.type + " AWACS Has Been Spawned " +
        playerUnitObj.hdg + " from " + closeBase.name + " " + awacsObj.details;
    await ddcsControllers.sendMesgToCoalition(
        playerUnitObj.coalition,
        mesg,
        20
    );
}

export async function spawnTankerPlane(
    playerUnitObj: typing.IUnit,
    tankerObj: any,
    playerLoc: number[],
    remoteLoc: number[]
): Promise<void> {
    let curTkrName: string;
    let curUnitSpawn;
    let curGroupSpawn;
    let curCountry: number;
    let curSpwnUnit: any;
    let curGrpObj: any;
    const curCategory = ddcsControllers.UNIT_CATEGORY.indexOf("AIRPLANE");

    curCountry = tankerObj.country;
    curTkrName = "AI|" + tankerObj.name + "|";
    curSpwnUnit = _.cloneDeep(tankerObj);

    const closeBase = await ddcsControllers.baseActionGetClosestBase({ unitLonLatLoc: playerLoc});
    curGrpObj = {
        ..._.cloneDeep(curSpwnUnit),
        groupName: curTkrName + "#" + _.random(1000000, 9999999),
        country: ddcsControllers.countryId[curCountry],
        category: curCategory,
        routeLocs: [
            remoteLoc,
            playerLoc
        ]
    };

    curGroupSpawn = await grndUnitGroup( curGrpObj, "Refueling", await tankerPlaneRouteTemplate(curGrpObj));

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: remoteLoc,
        name: curTkrName + "#" + _.random(1000000, 9999999),
        playerCanDrive: false,
        hidden: false
    };

    curUnitSpawn = airUnitTemplate(curSpwnUnit);

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = await spawnGrp(curGroupSpawn, curCountry, curCategory);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    const mesg = "C: A " + tankerObj.type + " Tanker Has Been Spawned " +
        playerUnitObj.hdg + " from " + closeBase.name + " " + tankerObj.details;
    await ddcsControllers.sendMesgToCoalition(
        playerUnitObj.coalition,
        mesg,
        20
    );
}

export async function spawnSupportPlane(baseObj: typing.IBase, side: number): Promise<void> {
    let curBaseName;
    let curUnitName;
    let curUnitSpawn;
    let curGroupSpawn;
    let curSide;
    let curSpwnUnit: any;
    let curGrpObj: any;
    let curRoutes: any;
    let baseLoc;
    let remoteLoc;
    const grpNum = _.random(1000000, 9999999);
    const randomDir = _.random(0, 359);

    curSide = ddcsControllers.defCountrys[side];
    curBaseName = "AI|1010101|" + baseObj.name + "|LOGISTICS|";
    baseLoc = baseObj.centerLoc;
    console.log("BASE: ", baseLoc);

    if (_.includes(baseObj._id, "_MOB") || _.includes(baseObj._id, "_FOB")) {
        curSpwnUnit = _.cloneDeep(getRndFromSpawnCat("transportHeli", side, true, true )[0]);
        remoteLoc = ddcsControllers.getLonLatFromDistanceDirection(baseLoc, randomDir, 40);
    } else {
        curSpwnUnit = _.cloneDeep(getRndFromSpawnCat("transportAircraft", side, true, true )[0]);
        remoteLoc = ddcsControllers.getLonLatFromDistanceDirection(baseLoc, randomDir, 70);
    }
    curGrpObj = {
        ...curSpwnUnit,
        groupId: grpNum,
        groupName: curBaseName,
        country: curSide
    };

    curRoutes = {
        baseId: baseObj.baseId,
        routeLocs: [
            remoteLoc,
            baseLoc
        ]
    };
    if (_.includes(baseObj._id, "_MOB") || _.includes(baseObj._id, "_FOB")) {
        curGroupSpawn = await grndUnitGroup( curGrpObj, "Transport", await landHeliRouteTemplate(curRoutes));
    } else {
        curGroupSpawn = await grndUnitGroup( curGrpObj, "Transport", await landPlaneRouteTemplate(curRoutes));
    }

    curUnitName = "AI|1010101|" + _.get(baseObj, "name") + "|LOGISTICS|";

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: remoteLoc,
        name: curUnitName,
        playerCanDrive: false,
        hidden: false
    };

    curUnitSpawn = airUnitTemplate(curSpwnUnit);

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    // console.log('spawnSupportPlane: ', curGroupSpawn, curSide, curGrpObj.category);
    const curCMD = await spawnGrp(curGroupSpawn, curSide, curGrpObj.category);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    const mesg = "C: Cargo Support Plane 10 mins out, BRA " + randomDir + " from " + baseObj.name;
    await ddcsControllers.sendMesgToCoalition(
        side,
        mesg,
        20
    );
}

/*
export async function spawnLogiGroup(spawnArray: typing.IUnit[], side: number): Promise<void> {
    let curAng: number;
    let grpNum = 0;
    let unitNum = 0;
    let curBaseName = "";
    let curUnitName = "";
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curGrpObj: any;
    let curSide;
    let curSpwnUnit: any;
    const sArray = _.compact(_.cloneDeep(spawnArray));
    curGrpObj = sArray[0];
    if (curGrpObj) {
        curAng = _.cloneDeep(curGrpObj.heading || 0);
        grpNum = curGrpObj.groupId || _.random(1000000, 9999999);
        if (side === 2 && _.includes(curGrpObj.country, "UKRAINE")) {
            curSide = "UKRAINE";
        } else {
            curSide = (side) ? ddcsControllers.defCountrys[side] : ddcsControllers.defCountrys[curGrpObj.coalition];
        }
        curGrpObj.country = curSide;
        curBaseName = curGrpObj.spwnName + " #" + grpNum;

        curGrpObj.groupId = grpNum;
        curGrpObj.groupName = curBaseName;
        curGroupSpawn = grndUnitGroup( curGrpObj );
        unitNum = _.cloneDeep(grpNum);
        for (const curUnit of sArray) {
            if (curAng > 359) {
                curAng = 15;
            }
            curSpwnUnit = _.cloneDeep(curUnit);
            if (unitNum !== grpNum) {
                curUnitSpawn += ",";
            }
            unitNum += 1;
            if (curSpwnUnit.special === "jtac") {
                curUnitName = curSpwnUnit.spwnName;
            } else {
                curUnitName = curSpwnUnit.spwnName + " #" + unitNum;
            }

            curSpwnUnit.lonLatLoc = ddcsControllers.getLonLatFromDistanceDirection(curSpwnUnit.lonLatLoc, curAng, 0.05);
            curAng += 15;

            curSpwnUnit.name = curUnitName;
            curSpwnUnit.playerCanDrive = curSpwnUnit.playerCanDrive || true;
            curUnitSpawn += grndUnitTemplate(curSpwnUnit);
        }
        curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
        // var curCMD = 'mist.dynAdd(' + curGroupSpawn + ')';
        const curCMD = spawnGrp(curGroupSpawn, curSide, curGrpObj.category);
        const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
        const actionObj = {actionObj: sendClient, queName: "clientArray"};
        await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    }
}
*/

export async function spawnStaticBuilding(
    staticObj: typing.IStaticSpawnMin,
    init: boolean,
    baseObj?: any,
    side?: number,
    staticType?: string
): Promise<void> {
    if (init) {
        const staticLookupLogiBuilding = await ddcsControllers.staticDictionaryActionsRead({_id: staticType});
        const curCountry =
            _.intersection(
                staticLookupLogiBuilding[0].config[ddcsControllers.getEngineCache().config.timePeriod].country,
                ddcsControllers.COUNTRY[(side || 0)]
            );
        if (curCountry.length > 0) {
            const curStaticObj = {
                country: ddcsControllers.countryId.indexOf(curCountry[0] as string),
                coalition: side,
                type: staticLookupLogiBuilding[0].type,
                shape_name: staticLookupLogiBuilding[0].shape_name,
                canCargo: staticLookupLogiBuilding[0].canCargo,
                unitCategory: staticLookupLogiBuilding[0].unitCategory,
                objectCategory: staticLookupLogiBuilding[0].objectCategory,
                name: baseObj.name + " " + staticType,
                _id: baseObj.name + " " + staticType,
                hdg: _.random(0, 359),
                alt: 0,
                lonLatLoc: ddcsControllers.getRandomLatLonFromBase(baseObj.name, "buildingPoly")
            };
            // initial spawn, spawn in DB and sync over
            await ddcsControllers.unitActionSave(curStaticObj);
        } else {
            console.log("country not found: ", side, staticType);
        }
    } else {
        const curCMD = await spawnStatic(
            staticTemplate(staticObj as typing.IStaticUnitTemp),
            staticObj.country
        );
        await ddcsControllers.sendUDPPacket("frontEnd", {actionObj: {action: "CMD", cmd: curCMD, reqID: 0}});
    }
}

export async function spawnUnitGroup(spawnArray: typing.IUnitSpawnMin[], init: boolean, baseName?: string, side?: number): Promise<void> {
    if (spawnArray.length > 0) {
        let groupTemplate: string = "";
        const groupNum = _.random(1000000, 9999999);
        const grpObj = spawnArray[0];
        const curBaseName = baseName || "";
        const curGroupName = (grpObj.groupName) ? grpObj.groupName : baseName + " #" + groupNum;
        grpObj.groupName = (grpObj.groupName) ? grpObj.groupName : baseName + " #" + groupNum;
        grpObj.coalition = (side) ? side : spawnArray[0].coalition;
        if (!init) {
            groupTemplate = await grndUnitGroup(grpObj);
        }

        let unitTemplate = "";
        let unitNum = groupNum;
        for (const curUnit of spawnArray) {
            const unitObj = curUnit;
            unitObj.lonLatLoc = (curUnit.lonLatLoc) ? curUnit.lonLatLoc : ddcsControllers.getRandomLatLonFromBase(curBaseName, "unitPoly");
            unitObj.name = (curUnit.name) ? curUnit.name : baseName + " #" + unitNum;
            unitObj._id = unitObj.name;
            unitObj.country = grpObj.country;
            unitObj.groupName = curGroupName;
            unitObj.type = curUnit.type;


            if (init) {
                await ddcsControllers.unitActionSave(unitObj);
            }

            unitTemplate += ((unitNum !== groupNum) ? "," : "") + grndUnitTemplate(unitObj as IGroundUnitTemp);
            unitNum++;
        }

        if (!init) {
            const curCMD = await spawnGrp(
                _.replace(groupTemplate, "#UNITS", unitTemplate),
                grpObj.country,
                grpObj.unitCategory
            );
            const sendClient = {actionObj: {action: "CMD", cmd: curCMD, reqID: 0}};
            await ddcsControllers.sendUDPPacket("frontEnd", sendClient);
        }
    }
}

export async function spawnNewMapObjs(): Promise<void> {
    const bases = await ddcsControllers.baseActionRead({name: {$not: /#/}, enabled: true});
    for (const base of bases) {
        if (!_.includes(base.name, "Carrier")) {
            const baseStartSide = base.defaultStartSide || 0;

            // ALL BASE ITEMS
            // command center
            await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, baseStartSide, "Shelter");
            // FARP Vehicles
            await spawnSupportBaseGrp(base._id, baseStartSide, true);

            // only MOB spawns
            if (base.baseType === "MOB") {
                // spawn radio towers
                await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, baseStartSide, "Comms tower M");
                await spawnSAMNet(baseStartSide, base._id, true);

                let totalUnitNum = 0;
                while (totalUnitNum < ddcsControllers.getEngineCache().config.replenThresholdBase) {
                    totalUnitNum += await spawnBaseReinforcementGroup(baseStartSide, base._id, true, true);
                    console.log("TOTLOG: ", totalUnitNum, ddcsControllers.getEngineCache().config.replenThresholdBase);
                }

            }





            // spawn support base units


            /*
            await spawnSupportBaseGrp(baseName, baseStartSide);
            if (_.get(base, "baseType") === "MOB") {
                while (spawnArray.length + totalUnitNum < curServer.replenThresholdBase) { // UNCOMMENT THESE
                    totalUnitNum += await spawnBaseReinforcementGroup(baseStartSide, baseName, true, true);
                }
                await spawnSAMNet(baseStartSide, baseName, true);
                totalUnitNum += 3;
                await spawnRadioTower(
                    {},
                    true,
                    _.find(engineCache.bases, { name: baseName } ),
                    baseStartSide
                );
            }
            await spawnUnitGroup(spawnArray, baseName, baseStartSide);
            await spawnLogisticCmdCenter(
                {},
                true,
                _.find(engineCache.bases, {name: baseName}),
                baseStartSide
            );
            totalUnitsSpawned += spawnArray.length + totalUnitNum + 1;
             */
        }
    }
}
/*
export async function spawnRadioTower(staticObj: any, init: boolean, baseObj?: typing.IBase, side?: number): Promise<void> {
    let curGrpObj = _.cloneDeep(staticObj);
    const curBaseName = baseObj ? baseObj.name : "";
    curGrpObj.name = (curGrpObj.name || curBaseName) + " Communications";
    curGrpObj.coalition = curGrpObj.coalition || side;
    curGrpObj.country = ddcsControllers.defCountrys[curGrpObj.coalition];
    if (_.isUndefined(curGrpObj.lonLatLoc)) {
        curGrpObj.lonLatLoc = ddcsControllers.getRandomLatLonFromBase(curBaseName, "buildingPoly");
    }

    curGrpObj = {
        ...curGrpObj,
        category: "Fortifications",
        type: "Comms tower M",
        shape_name: "tele_bash_m"
    };

    const curCMD = spawnStatic(exports.staticTemplate(curGrpObj), curGrpObj.country);
    const sendClient = {action: "CMD", cmd: curCMD, reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
    await ddcsControllers.unitActionUpdateByName({
        name: curGrpObj.name,
        coalition: curGrpObj.coalition,
        country: curGrpObj.country,
        dead: false
    });
}
*/
/*
export async function spawnBaseEWR(serverName: string, type: string, baseName: string, side: number): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    let unitStart: any = {};
    let pCountry = ddcsControllers.defCountrys[side];
    const curTimePeriod = engineCache.config.timePeriod;
    const findUnit = _.find(engineCache.unitDictionary, {_id: type});
    if ((type === "1L13 EWR" || type === "55G6 EWR" || type === "Dog Ear radar") && side === 2) {
        console.log("EWR: UKRAINE");
        pCountry = "UKRAINE";
    }

    if (findUnit) {
        const spawnUnitCount = findUnit.config[curTimePeriod].spawnCount;
        for (let x = 0; x < spawnUnitCount; x++) {
            unitStart = {
                ..._.cloneDeep(findUnit),
                spwnName: baseName + " " + type,
                lonLatLoc: ddcsControllers.getRandomLatLonFromBase(serverName, baseName, "buildingPoly"),
                heading: 0,
                country: pCountry,
                playerCanDrive: false
            };
        }
        await spawnLogiGroup([unitStart], side);
    }
}
 */

export async function replenishUnits( baseName: string, side: number, init: boolean ): Promise<void> {
    await spawnBaseReinforcementGroup(side, baseName, init);
}

export async function destroyUnit( unitName: string ): Promise<void> {
    // DONT USE ON CLIENT AIRCRAFT
    const sendClient = {action: "REMOVEOBJECT", removeObject: unitName, reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
}

export async function healBase( baseName: string, curPlayerUnit: any, init: boolean): Promise<boolean> {
    const baseUnit = await ddcsControllers.baseActionRead({name: baseName});
    if (baseUnit.length > 0) {
        const curBase = baseUnit[0];
        if (curBase.baseType !== "MOB") {
            await exports.spawnSupportBaseGrp( curBase.name, curPlayerUnit.coalition); // return resp
        } else {
            const commUnit = await ddcsControllers.unitActionRead({name: curBase.name + " Comms tower M", dead: false});
            const curCommUnit = commUnit[0];
            if (curCommUnit) {
                curCommUnit.coalition = curBase.side;
                await ddcsControllers.spawnStaticBuilding(curCommUnit, false, curBase, curPlayerUnit.coalition, "Comms tower M");
            } else {
                await ddcsControllers.spawnStaticBuilding({} as IStaticSpawnMin, false, curBase, curPlayerUnit.coalition, "Comms tower M");
            }
            await spawnSupportBaseGrp( curBase.name, curPlayerUnit.coalition, init );
        }
        return true;
    }
    return false;
}
