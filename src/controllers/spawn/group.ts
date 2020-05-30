/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typing from "../../typings";
import * as ddcsControllers from "../";
import {spawn} from "child_process";
import DDCSServer from "../../server";

let openSAM: string;

export function spawnGrp(grpSpawn: string, country: string, category: string): string {
    return "coalition.addGroup(" + country + ", " + category + ", " + grpSpawn + ")" ;
}

export function spawnStatic(staticSpawn: string, country: string): string {
    return "coalition.addStaticObject(" + country + ", " + staticSpawn + ")";
}

export function turnOnEWRAuto(groupObj: typing.IUnit): string {
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
    return "" +
        "[\"route\"] = {" +
            "[\"spans\"] = {}," +
            "[\"points\"] = {" +
                "[1] = {" +
                    // "[\"alt\"] = 252," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"ETA\"] = 0," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"formation_template\"] = \"\"," +
                    // "[\"y\"] = 440640.41085714," +
                    // "[\"x\"] = -60694.918271202," +
                    "[\"name\"] = \"dontdisperse\"," +
                    "[\"ETA_locked\"] = true," +
                    "[\"speed\"] = 0," +
                    "[\"action\"] = \"Off Road\"," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"enabled\"] = true," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"number\"] = 1," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"name\"] = 8," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[2] = {" +
                                    "[\"number\"] = 2," +
                                    "[\"name\"] = \"ewr enroute task\"," +
                                    "[\"id\"] = \"EWR\"," +
                                    "[\"auto\"] = true," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {}," +
                                "}," +
                                "[3] = {" +
                                    "[\"number\"] = 3," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"SetFrequency\"," +
                                            "[\"params\"] = {" +
                                                "[\"power\"] = 10," +
                                                "[\"modulation\"] = 0," +
                                                "[\"frequency\"] = " + setFreq + "," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[4] = {" +
                                    "[\"enabled\"] = true," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"number\"] = 4," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"setCallSign\"," +
                                            "[\"params\"] = {" +
                                                "[\"callsign\"] = " + setCallSign + "," +
                                                "[\"callnameFlag\"] = false," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},";
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

export function turnOffDisperseUnderFire(): string {
    return "" +
        "[\"route\"] = {" +
            "[\"spans\"] = {}," +
            "[\"points\"] = {" +
                "[1] = {" +
                    // "[\"alt\"] = 252," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"ETA\"] = 0," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"formation_template\"] = \"\"," +
                    // "[\"y\"] = 440640.41085714," +
                    // "[\"x\"] = -60694.918271202," +
                    "[\"name\"] = \"dontdisperse\"," +
                    "[\"ETA_locked\"] = true," +
                    "[\"speed\"] = 0," +
                    "[\"action\"] = \"Off Road\"," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"enabled\"] = true," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"number\"] = 1," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"name\"] = 8," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},";
}

export function defenseHeliRouteTemplate(routes: typing.IConvoyRouteTemplate): string {
    return "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = true," +
                                    "[\"id\"] = \"EngageTargets\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"key\"] = \"CAS\"," +
                                    "[\"params\"] = {" +
                                        "[\"targetTypes\"] = {" +
                                            "[1] = \"Helicopters\"," +
                                            "[2] = \"Ground Units\"," +
                                            "[3] = \"Light armed ships\"," +
                                        "}," +
                                        "[\"priority\"] = 0," +
                                    "}," +
                                "}," +
                                "[2] = {" +
                                    "[\"number\"] = 2," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=2," +
                                                "[\"name\"]=1," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[3] = {" +
                                    "[\"number\"] = 3," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=0," +
                                                "[\"name\"]=0," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[3]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[2][1] + ", " + routes.routeLocs[2][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[2][1] + ", " + routes.routeLocs[2][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[4]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[3][1] + ", " + routes.routeLocs[3][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[3][1] + ", " + routes.routeLocs[3][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[5]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[4][1] + ", " + routes.routeLocs[4][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[4][1] + ", " + routes.routeLocs[4][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[6]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[5][1] + ", " + routes.routeLocs[5][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[5][1] + ", " + routes.routeLocs[5][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[7]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[6][1] + ", " + routes.routeLocs[6][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[6][1] + ", " + routes.routeLocs[6][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[8]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"SwitchWaypoint\"," +
                                            "[\"params\"] = {" +
                                                "[\"goToWaypointIndex\"] = 1," +
                                                "[\"fromWaypointIndex\"] = 8," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[7][1] + ", " + routes.routeLocs[7][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[7][1] + ", " + routes.routeLocs[7][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
}

export function atkHeliRouteTemplate(routes: typing.IConvoyRouteTemplate): string {
    return "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = true," +
                                    "[\"id\"] = \"EngageTargets\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"key\"] = \"CAS\"," +
                                    "[\"params\"] = {" +
                                        "[\"targetTypes\"] = {" +
                                            "[1] = \"Helicopters\"," +
                                            "[2] = \"Ground Units\"," +
                                            "[3] = \"Light armed ships\"," +
                                        "}," +
                                        "[\"priority\"] = 0," +
                                    "}," +
                                "}," +
                                "[2] = {" +
                                    "[\"number\"] = 2," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=2," +
                                                "[\"name\"]=1," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[3] = {" +
                                    "[\"number\"] = 3," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=0," +
                                                "[\"name\"]=0," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},";
}

export function capPlaneDefenseRouteTemplate(routes: any): string {
    return "" +
        "[\"route\"] = {" +
            "[\"routeRelativeTOT\"] = true," +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"action\"] = \"From Parking Area\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"enabled\"] = true," +
                                    "[\"auto\"] = true," +
                                    "[\"id\"] = \"EngageTargets\"," +
                                    "[\"number\"] = 1," +
                                    "[\"key\"] = \"CAP\"," +
                                    "[\"params\"] = {" +
                                        "[\"targetTypes\"] = {" +
                                            "[1] = \"Air\"," +
                                        "}," +
                                        "[\"priority\"] = 0," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"TakeOffParking\"," +
                    "[\"ETA\"] = 0," +
                    "[\"ETA_locked\"] = true," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").z, " +
                    "[\"formation_template\"] = \"\"," +
                    "[\"airdromeId\"] = " + routes.baseId + "," +
                "}," +
                "[2] = {" +
                    "[\"alt\"] = 3048," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = 256.94444444444," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"enabled\"] = true," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"Orbit\"," +
                                    "[\"number\"] = 1," +
                                    "[\"params\"] = {" +
                                        "[\"altitude\"] = 3048," +
                                        "[\"pattern\"] = \"Circle\"," +
                                        "[\"speed\"] = 179.86111111111," +
                                        "[\"speedEdited\"] = true," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").z, " +
                    "[\"formation_template\"] = \"\"," +
                "}," +
            "}," +
        "},";
}

export function capHeliDefenseRouteTemplate(routes: any): string {
    return "" +
    "[\"route\"] = {" +
        "[\"points\"] = {" +
            "[1] = {" +
                "[\"alt\"] = 30.48," +
                "[\"alt_type\"] = \"RADIO\"," +
                "[\"speed\"] = 55.555555555556," +
                "[\"action\"] = \"From Ground Area\"," +
                // "[\"helipadId\"] = StaticObject.getByName(" + _.get(routes, "baseName") + ").getID()," +
                "[\"task\"] = {" +
                    "[\"id\"] = \"ComboTask\"," +
                    "[\"params\"] = {" +
                        "[\"tasks\"] = {" +
                            "[1] = {" +
                                "[\"enabled\"] = true," +
                                "[\"key\"] = \"CAS\"," +
                                "[\"id\"] = \"EngageTargets\"," +
                                "[\"number\"] = 1," +
                                "[\"auto\"] = true," +
                                "[\"params\"] = {" +
                                    "[\"targetTypes\"] = {" +
                                        "[1] = \"Helicopters\"," +
                                        "[2] = \"Ground Units\"," +
                                        "[3] = \"Light armed ships\"," +
                                    "}," +
                                    "[\"priority\"] = 0," +
                                "}," +
                            "}," +
                            "[1] = {" +
                                "[\"number\"] = 1," +
                                "[\"auto\"] = false," +
                                "[\"id\"] = \"WrappedAction\"," +
                                "[\"enabled\"] = true," +
                                "[\"params\"] = {" +
                                    "[\"action\"] = {" +
                                        "[\"id\"] = \"Option\"," +
                                        "[\"params\"] = {" +
                                            "[\"value\"]=2," +
                                            "[\"name\"]=1," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                            "[2] = {" +
                                "[\"number\"] = 2," +
                                "[\"auto\"] = false," +
                                "[\"id\"] = \"WrappedAction\"," +
                                "[\"enabled\"] = true," +
                                "[\"params\"] = {" +
                                    "[\"action\"] = {" +
                                        "[\"id\"] = \"Option\"," +
                                        "[\"params\"] = {" +
                                            "[\"value\"]=0," +
                                            "[\"name\"]=0," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                "}," +
                "[\"type\"] = \"TakeOffGround\"," +
                "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").x, " +
                "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").z, " +
            "}," +
            "[2] = {" +
                "[\"alt\"] = 304.8," +
                "[\"action\"] = \"Turning Point\"," +
                "[\"alt_type\"] = \"RADIO\"," +
                "[\"speed\"] = 41.666666666667," +
                "[\"action\"] = \"Turning Point\"," +
                "[\"task\"] = {" +
                    "[\"id\"] = \"ComboTask\"," +
                    "[\"params\"] = {" +
                        "[\"tasks\"] = {" +
                            "[1] = {" +
                                "[\"enabled\"] = true," +
                                "[\"auto\"] = false," +
                                "[\"id\"] = \"Orbit\"," +
                                "[\"number\"] = 1," +
                                "[\"params\"] = {" +
                                    "[\"altitude\"] = 304.8," +
                                    "[\"pattern\"] = \"Circle\"," +
                                    "[\"speed\"] = 40.277777777778," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                "}," +
                "[\"type\"] = \"Turning Point\"," +
                "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").x, " +
                "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1] + ", " + routes.routeLocs[0] + ").z, " +
            "}," +
        "}," +
    "},";
}

export function bombersPlaneRouteTemplate(routes: typing.IConvoyRouteTemplate): string {
    return "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=true," +
                                                "[\"name\"]=15," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[2] = {" +
                                    "[\"number\"] = 2," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=2," +
                                                "[\"name\"]=1," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[3] = {" +
                                    "[\"number\"] = 3," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=4," +
                                                "[\"name\"]=0," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"EngageTargets\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"key\"] = \"CAS\"," +
                                    "[\"params\"] = {" +
                                        "[\"targetTypes\"] = {" +
                                            "[1] = \"Helicopters\"," +
                                            "[2] = \"Ground Units\"," +
                                            "[3] = \"Light armed ships\"," +
                                        "}," +
                                        "[\"priority\"] = 0," +
                                    "}," +
                                "}," +
                                "[2] = {" +
                                    "[\"number\"] = 2," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"]=0," +
                                                "[\"name\"]=0," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
}

export function awacsPlaneRouteTemplate(routes: typing.IConvoyRouteTemplate): string {
    const addTaskNum = (routes.eplrs) ? 1 : 0;
    let curRoute =  "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = true," +
                                    "[\"id\"] = \"AWACS\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"]={}," +
                                "},";
    if (routes.eplrs) {
                                    curRoute += "[2] = {" +
                                        "[\"number\"] = 2," +
                                        "[\"auto\"] = true," +
                                        "[\"id\"] = \"WrappedAction\"," +
                                        "[\"enabled\"] = true," +
                                        "[\"params\"] = {" +
                                            "[\"action\"] = {" +
                                                "[\"id\"] = \"EPLRS\"," +
                                                "[\"params\"] = {" +
                                                    "[\"value\"] = true," +
                                                "}," +
                                            "}," +
                                        "}," +
                                    "}," ;
                                }
    curRoute += "[" + (addTaskNum + 2) + "] = {" +
                                    "[\"number\"] = " + (addTaskNum + 2) + "," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"name\"] = \"RadioFreq\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"SetFrequency\"," +
                                            "[\"params\"] = {" +
                                                "[\"power\"]=10," +
                                                "[\"modulation\"]=0," +
                                                "[\"frequency\"]=" + routes.radioFreq + "," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[" + (addTaskNum + 3) + "] = {" +
                                    "[\"number\"] = " + (addTaskNum + 3) + "," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"Orbit\"," +
                                    "[\"enabled\"]=true," +
                                    "[\"params\"] = {" +
                                        "[\"altitude\"] = " + _.get(routes, "alt") + "," +
                                        "[\"pattern\"] = \"Race-Track\"," +
                                        "[\"speed\"] = " + _.get(routes, "speed") + "," +
                                        "[\"speedEdited\"] = true," +
                                    "}," +
                                "}," +
                         "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"]={}" +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
    return curRoute;
}

export function tankerPlaneRouteTemplate(routes: typing.IConvoyRouteTemplate): string {
    let tankerTemplate = "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = true," +
                                    "[\"id\"] = \"Tanker\"," +
                                    "[\"enabled\"]=true," +
                                    "[\"params\"]={}," +
                                "}," +
                                "[2] = {" +
                                    "[\"number\"] = 2," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"name\"] = \"RadioFreq\"," +
                                    "[\"enabled\"]=true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"SetFrequency\"," +
                                            "[\"params\"] = {" +
                                                "[\"power\"]=10," +
                                                "[\"modulation\"]=0," +
                                                "[\"frequency\"]=" + routes.radioFreq + "," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[3] = {" +
                                    "[\"number\"] = 3," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"Orbit\"," +
                                    "[\"enabled\"]=true," +
                                    "[\"params\"] = {" +
                                        "[\"altitude\"] = " + routes.alt + "," +
                                        "[\"pattern\"] = \"Race-Track\"," +
                                        "[\"speed\"] = " + routes.speed + "," +
                                        "[\"speedEdited\"] = true," +
                                    "}," +
                                "}," +
                                "#TACAN" +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + routes.alt + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + routes.speed + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"]={}" +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
        ;
    const tacanInfo = "[4] = {" +
        "[\"number\"] = 4," +
        "[\"auto\"] = true," +
        "[\"id\"] = \"WrappedAction\"," +
        "[\"name\"] = \"TACAN\"," +
        "[\"enabled\"] = true," +
        "[\"params\"] = {" +
            "[\"action\"] = {" +
                "[\"id\"] = \"ActivateBeacon\"," +
                "[\"params\"] = {" +
                    "[\"type\"] = 4," +
                    "[\"AA\"] = true," +
                    "[\"callsign\"] = \"BHABTKR\"," +
                    "[\"system\"] = 4," +
                    "[\"name\"] = \"BHABTKR\"," +
                    "[\"channel\"] = " + routes.tacan.channel + "," +
                    "[\"modeChannel\"] = \"" + routes.tacan.modeChannel + "\"," +
                    "[\"bearing\"] = true," +
                    "[\"frequency\"]= " + routes.tacan.frequency + "," +
                "}," +
            "}," +
        "}," +
    "},"
    ;

    if (routes.tacan.enabled) {
        tankerTemplate = _.replace(tankerTemplate, "#TACAN", tacanInfo);
    } else {
        tankerTemplate = _.replace(tankerTemplate, "#TACAN", "");
    }
    return tankerTemplate;
}

export function landPlaneRouteTemplate(routes: typing.IConvoyRouteTemplate) {
    return "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = 2000," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = 138," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                                "[1] = {" +
                                    "[\"enabled\"]=true," +
                                    "[\"auto\"]=false," +
                                    "[\"id\"]=\"WrappedAction\"," +
                                    "[\"number\"] = 1," +
                                    "[\"params\"]={" +
                                        "[\"action\"]={" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"] = 2," +
                                                "[\"name\"] = 1," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    // "[\"ETA\"] = 0," +
                    // "[\"ETA_locked\"] = true," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " + routes.routeLocs[0][0] + ").z, " +
                    // "[\"name\"] = \"waypoint 1\"," +
                    // "[\"formation_template\"] = \"\"," +
                    // "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = 25," +
                    "[\"action\"] = \"Landing\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = 168," +
                    "[\"task\"]={" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"]={" +
                                "[1] = {" +
                                    "[\"number\"] = 1," +
                                    "[\"auto\"] = false," +
                                    "[\"id\"] = \"WrappedAction\"," +
                                    "[\"enabled\"] = true," +
                                    "[\"params\"] = {" +
                                        "[\"action\"] = {" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"] = {" +
                                                "[\"value\"] = 2," +
                                                "[\"name\"] = 1," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Land\"," +
                    // "[\"ETA\"] = 712.36534243372," +
                    // "[\"ETA_locked\"] = false," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " + routes.routeLocs[1][0] + ").z, " +
                    // "[\"name\"] = \"DictKey_WptName_21362\"," +
                    // "[\"formation_template\"] = \"\"," +
                    "[\"airdromeId\"] = " + _.get(routes, "baseId") + "," +
                    // "[\"speed_locked\"] = true," +
                "}," +
            "}" +
        "},"
    ;
}

export function landHeliRouteTemplate(routes: typing.IConvoyRouteTemplate) {
    return 	"" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = 500," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = 70," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"]={" +
                            "[\"tasks\"]={" +
                                "[1]={" +
                                    "[\"enabled\"]=true," +
                                    "[\"auto\"]=false," +
                                    "[\"id\"]=\"WrappedAction\"," +
                                    "[\"number\"] = 1," +
                                    "[\"params\"]={" +
                                        "[\"action\"]={" +
                                            "[\"id\"] = \"Option\"," +
                                            "[\"params\"]={" +
                                                "[\"value\"] = 2," +
                                                "[\"name\"] = 1," +
                                            "}," +
                                        "}," +
                                    "}," +
                                "}," +
                                "[2] = {" +
                                    "[\"enabled\"] = true," +
                                    "[\"auto\"]=false," +
                                    "[\"id\"]=\"Land\"," +
                                    "[\"number\"]= 2," +
                                    "[\"params\"]={" +
                                        "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " +
                                            routes.routeLocs[1][0] + ").x, " +
                                        "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[1][1] + ", " +
                                            routes.routeLocs[1][0] + ").z, " +
                                        "[\"duration\"] = 300," +
                                        "[\"durationFlag\"] = false," +
                                    "}," +
                                "}," +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    // "[\"ETA\"] = 0," +
                    // "[\"ETA_locked\"] = true," +
                    "[\"x\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " +  routes.routeLocs[0][0] + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + routes.routeLocs[0][1] + ", " +  routes.routeLocs[0][0] + ").z, " +
                    // "[\"name\"] = \"waypoint 1\"," +
                    // "[\"formation_template\"] = \"\"," +
                    // "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
}

export function grndUnitGroup( groupObj: any, task?: string, routes?: string ): string {
    let curRoute: string;
    const curTask = (task) ? task : "Ground Nothing";
    const uncontrollable = !_.get(groupObj, "playerCanDrive", false);

    if (routes) {
        curRoute = routes;
    } else if (groupObj.type === "1L13 EWR" || groupObj.type === "55G6 EWR" ) {
        curRoute = turnOnEWRAuto(groupObj);
    } else {
        curRoute = turnOffDisperseUnderFire();
    }

    const visible = (groupObj.visible) ? groupObj.visible : "false";
    const hidden = (groupObj.hidden) ? groupObj.hidden : "false";
    const curTmpTask = (groupObj.task) ? groupObj.task : curTask;

    return "{" +
        "[\"communication\"] = true," +
        "[\"start_time\"] = 0," +
        "[\"frequency\"] = 251," +
        "[\"radioSet\"] = false," +
        "[\"modulation\"] = 0," +
        "[\"taskSelected\"] = true," +
        "[\"name\"] = \"" + groupObj.groupName + "\"," +
        "[\"visible\"] = " + visible + "," +
        "[\"hidden\"] = " + hidden + "," +
        "[\"uncontrollable\"] = " + uncontrollable + "," +
        "[\"hiddenOnPlanner\"] = true," +
        "[\"tasks\"] = {}," +
        "[\"task\"] = \"" + curTmpTask + "\"," +
        "[\"taskSelected\"] = true," +
        "[\"units\"] = {#UNITS}," +
        "[\"category\"] = " + groupObj.category + "," +
        "[\"country\"] = \"" + ddcsControllers.countryId[groupObj.country] + "\"," +
        curRoute +
    "}";
}

export function grndUnitTemplate( unitObj: typing.IUnit ): string {
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

export function staticTemplate(staticObj: typing.IStaticObject): string {
    let retObj = "{" +
        "[\"x\"] = coord.LLtoLO(" + staticObj.lonLatLoc[1] + ", " +  staticObj.lonLatLoc[0] + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + staticObj.lonLatLoc[1] + ", " +  staticObj.lonLatLoc[0] + ").z, " +
        "[\"category\"] = \"" + staticObj.category + "\"," +
        "[\"country\"] = \"" + staticObj.country + "\"," +
        "[\"type\"] = \"" + staticObj.type + "\"," +
        "[\"name\"] = \"" + staticObj.name + "\"," +
        "[\"heading\"] = " + (staticObj.hdg || 0) + "," +
        "[\"shape_name\"] = \"" + staticObj.shape_name + "\"," +
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
    const curEnabledCountrys = ddcsControllers.side[side] + "Countrys";
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
            if (_.intersection(_.get(unit, ["config", curTimePeriod, "country"]), curEnabledCountrys).length > 0) {
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
    // console.log('cu: ', curUnit);
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
                const curTimePeriodSpawnCount = cUnit.config.curTimePeriod.spawnCount;
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

export function spawnSupportVehiclesOnFarp( baseName: string, side: number ): typing.IUnit[] | void {
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
            const curObj = exports.getRndFromSpawnCat(val, side, false, true)[0];
            const sptUnit = {
                name: baseName + "_" + val,
                lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(curBase.centerLoc, curAng, 0.05),
                ...curObj
            };
            curAng += 15;
            curFarpArray.push(sptUnit);
        }
        return curFarpArray;
    } else {
        console.log("Cant find base, line: 1513");
    }
}

export async function spawnSupportBaseGrp( baseName: string, side: number ): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    let spawnArray: any[] = [];
    const farpBases = _.filter(engineCache.bases, (baseObj) => {
        return ((_.includes(baseObj._id, "_MOB") && _.get(baseObj, "initSide") === side) ||
            _.includes(baseObj._id, "_FOB")) && _.first(_.split(baseObj.name, " #")) === baseName;
    });
    for (const farp of farpBases) {
        spawnArray = _.concat(spawnArray, spawnSupportVehiclesOnFarp( _.get(farp, "name"), side ));
    }
    await spawnUnitGroup(_.compact(spawnArray), baseName, side);
}

export async function spawnBaseReinforcementGroup(side: number, baseName: string, forceSpawn?: boolean, init?: boolean): Promise<number> {
    const engineCache = ddcsControllers.getEngineCache();
    let curAngle = 0;
    let curCat;
    let curRndSpawn;
    const curServer = engineCache.config;
    let curSpokeDeg;
    let curSpokeNum;
    let infoSpwn;
    const curBaseSpawnCats: any = _.cloneDeep(curServer.spwnLimitsPerTick);
    let randLatLonInBase: number[];
    let groupedUnits = [];
    let totalUnits = 0;
    let compactUnits;
    let centerRadar;
    let polyCheck;
    for (const spawnCats of Object.keys(curBaseSpawnCats)) {
        const spawnTicks = curBaseSpawnCats[spawnCats];
        for (let i = 0; i < spawnTicks; i++) {
            curAngle = 0;
            curRndSpawn = _.sortBy(getRndFromSpawnCat(spawnCats, side, false, forceSpawn), "sort");
            compactUnits = [];
            infoSpwn = curRndSpawn[0];
            centerRadar = infoSpwn.centerRadar ? 1 : 0;
            polyCheck = infoSpwn.centerRadar ? "buildingPoly" : "unitPoly";

            if (infoSpwn.spoke) {
                randLatLonInBase = ddcsControllers.getRandomLatLonFromBase(baseName, polyCheck);
                groupedUnits = [];
                curSpokeNum = curRndSpawn.length - centerRadar;
                curSpokeDeg = 359 / curSpokeNum;

                if (infoSpwn.centerRadar) {
                    // main radar
                    curCat = _.cloneDeep(infoSpwn);
                    curCat.lonLatLoc = randLatLonInBase;
                    groupedUnits.push(curCat);
                }
                // secondary radar
                for (let j = _.cloneDeep(centerRadar); j < infoSpwn.secRadarNum + centerRadar; j++) {
                    curCat = _.cloneDeep(curRndSpawn[j]);
                    curCat.lonLatLoc = ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, curCat.spokeDistance / 2);
                    curAngle += curSpokeDeg;
                    groupedUnits.push(curCat);
                }
                // launchers
                for (let k = infoSpwn.secRadarNum + centerRadar; k < curSpokeNum + centerRadar; k++) {
                    curCat = _.cloneDeep(curRndSpawn[k]);
                    curCat.lonLatLoc = ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, curCat.spokeDistance);
                    curAngle += curSpokeDeg;
                    groupedUnits.push(curCat);
                }
                compactUnits = _.compact(groupedUnits);
            } else {
                compactUnits = _.compact(curRndSpawn);
            }
            totalUnits += compactUnits.length;
            await spawnUnitGroup(compactUnits, baseName, side);
        }
        if (name === "samRadar" && !init) {
            await spawnSAMNet(side, baseName);
            totalUnits += 3;
        }
        if (name === "antiAir" && spawnTicks > 0 && curServer.timePeriod === "1978ColdWar") {
            totalUnits += (spawnTicks * await spawnLayer2Reinforcements("antiAir", 2, spawnTicks, side, baseName));
        }

        if (name === "mobileAntiAir" && spawnTicks > 0 && curServer.timePeriod === "modern") {
            totalUnits += (spawnTicks * await spawnLayer2Reinforcements("mobileAntiAir", 2, spawnTicks, side, baseName));
        }
    }
    console.log("return total", totalUnits);
    return totalUnits;
}

export async function spawnSAMNet(side: number, baseName: string, init?: boolean): Promise<void> {
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
                await spawnStarSam(side, baseName, openSAM);
            } else {
                console.log("3+ missle batterys in place");
            }
        } else {
            console.log("");
        }
    } else {
        if (init) {
            for (const spawnPoint of (_.sample(spawnArray) || spawnArray[0])) {
                await spawnStarSam(side, baseName, spawnPoint[0]);
            }
        }
    }
}

export async function spawnStarSam(
    side: number,
    baseName: string,
    openStarSAM: string,
    launchers?: number,
    useUnitType?: string,
    lastLonLat?: number[]
): Promise<number> {
    let centerRadar;
    let compactUnits;
    let curAngle = 0;
    let curCat: any = {};
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
    if (infoSpwn.centerRadar) {
        // main radar
        curCat = {
            ..._.cloneDeep(infoSpwn),
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            lonLatLoc: randLatLonInBase
        };
        groupedUnits.push(curCat);
    }
    // secondary radar
    for (let j = _.cloneDeep(centerRadar); j < _.get(infoSpwn, "secRadarNum") + centerRadar; j++) {
        curCat = {
            ..._.cloneDeep(curRndSpawn[j]),
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, curCat.spokeDistance / 2)
        };
        curAngle += curSpokeDeg;
        groupedUnits.push(curCat);
    }
    // launchers
    for (let k = _.get(infoSpwn, "secRadarNum") + centerRadar; k < curSpokeNum + centerRadar; k++) {
        curCat = {
            ..._.cloneDeep(curRndSpawn[k]),
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            heading: _.floor(curAngle),
            lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, curCat.spokeDistance)
        };
        curAngle += curSpokeDeg;
        groupedUnits.push(curCat);
    }
    // add ammo truck
    curCat = {
        ..._.cloneDeep(exports.getRndFromSpawnCat("unarmedAmmo", side, false, true)[0]),
        name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
        lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, 180, curCat.spokeDistance / 2)
    };
    groupedUnits.push(curCat);
    compactUnits = _.compact(groupedUnits);
    await spawnUnitGroup(compactUnits, baseName, side);
    return compactUnits.length;
}

export async function spawnLayer2Reinforcements(
    catType: string,
    rndAmt: number,
    curTick: number,
    side: number,
    baseName: string
): Promise<number> {
    let curAngle = 0;
    let curCat;
    let curRndSpawn;
    let curSpokeDeg;
    let curSpokeNum;
    const curTickCnt = _.cloneDeep(curTick) * rndAmt;
    let curUnit;
    let randLatLonInBase;
    let groupedL2Units = [];
    console.log("spawnBase: ", baseName);
    for (let i = 0; i < curTickCnt; i++) {
        curAngle = 0;
        curRndSpawn = _.cloneDeep(getRndFromSpawnCat(catType, side, false, true));
        groupedL2Units = [];
        curSpokeNum = curRndSpawn.length;
        curSpokeDeg = 359 / curSpokeNum;

        randLatLonInBase = _.cloneDeep(ddcsControllers.getRandomLatLonFromBase(baseName, "layer2Poly"));
        curCat = {
            ..._.cloneDeep(getRndFromSpawnCat("unarmedAmmo", side, false, true)),
            lonLatLoc: randLatLonInBase
        };
        groupedL2Units.push(curCat);
        // launchers
        for (let j = 0; j < curSpokeNum; j++) {
            // console.log('run: ', i, curAngle);
            curUnit = {
                ..._.cloneDeep(curRndSpawn[j]),
                lonLatLoc: ddcsControllers.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, 0.05)
            };
            curAngle += curSpokeDeg;
            groupedL2Units.push(curUnit);
        }
        await spawnUnitGroup(_.compact(groupedL2Units), baseName, side);
    }
    return _.compact(groupedL2Units).length || 0;
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

    curGroupSpawn = grndUnitGroup(curGrpObj);
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
            curGroupSpawn = grndUnitGroup(curUnit, "CAP", capPlaneDefenseRouteTemplate(curUnit));
        }
        if (curCapTemp.type === "AH-1W") {
            curGroupSpawn = grndUnitGroup(curUnit, "CAS", capHeliDefenseRouteTemplate(curUnit));
        }
    }

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = spawnGrp(curGroupSpawn, ddcsControllers.defCountrys[convoySide], curUnit.category);
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
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj: any;
    let friendlyLoc;
    const curCategory = "HELICOPTER";

    curCountry = ddcsControllers.countryId[unitObj.country];
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
        country: curCountry,
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

    curGroupSpawn = grndUnitGroup( curGrpObj, "CAS", defenseHeliRouteTemplate(curGrpObj));

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
    const curCMD = spawnGrp(curGroupSpawn, curCountry, curCategory);
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
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj;
    let friendlyLoc;
    let enemyLoc;
    const curCategory = "HELICOPTER";

    curCountry = ddcsControllers.countryId[unitObj.country];
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
        country: curCountry,
        category: curCategory,
        alt: Number(unitObj.alt) + Number(friendlyBase.alt),
        routeLocs: [
            friendlyLoc,
            enemyLoc
        ]
    };

    curGroupSpawn = grndUnitGroup( curGrpObj, "CAS", atkHeliRouteTemplate(curGrpObj));

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
    const curCMD = spawnGrp(curGroupSpawn, curCountry, curCategory);
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
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj;
    let remoteLoc;
    let closeLoc;
    const curCategory = "AIRPLANE";
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
        country: curCountry,
        category: curCategory,
        alt: Number(bomberObj.alt) + Number(closeBase.alt),
        routeLocs: [
            remoteLoc,
            closeLoc
        ]
    };

    curGroupSpawn = grndUnitGroup( curGrpObj, "CAS", bombersPlaneRouteTemplate(curGrpObj));

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
    const curCMD = spawnGrp(curGroupSpawn, curCountry, curCategory);
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
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj;
    let remoteLoc;
    const curCategory = "AIRPLANE";

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
        country: curCountry,
        category: curCategory,
        routeLocs: [
            remoteLoc,
            playerUnitObj.lonLatLoc
        ]
    };

    curGroupSpawn = grndUnitGroup( curGrpObj, "AWACS", awacsPlaneRouteTemplate(curGrpObj));

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: remoteLoc,
        name: curTkrName,
        playerCanDrive: false,
        hidden: false
    };

    curUnitSpawn = airUnitTemplate(curSpwnUnit);

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = spawnGrp(curGroupSpawn, curCountry, curCategory);
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
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj: any;
    const curCategory = "AIRPLANE";

    curCountry = tankerObj.country;
    curTkrName = "AI|" + tankerObj.name + "|";
    curSpwnUnit = _.cloneDeep(tankerObj);

    const closeBase = await ddcsControllers.baseActionGetClosestBase({ unitLonLatLoc: playerLoc});
    curGrpObj = {
        ..._.cloneDeep(curSpwnUnit),
        groupName: curTkrName + "#" + _.random(1000000, 9999999),
        country: curCountry,
        category: curCategory,
        routeLocs: [
            remoteLoc,
            playerLoc
        ]
    };

    curGroupSpawn = grndUnitGroup( curGrpObj, "Refueling", tankerPlaneRouteTemplate(curGrpObj));

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: remoteLoc,
        name: curTkrName + "#" + _.random(1000000, 9999999),
        playerCanDrive: false,
        hidden: false
    };

    curUnitSpawn = airUnitTemplate(curSpwnUnit);

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    const curCMD = spawnGrp(curGroupSpawn, curCountry, curCategory);
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
        curGroupSpawn = grndUnitGroup( curGrpObj, "Transport", landHeliRouteTemplate(curRoutes));
    } else {
        curGroupSpawn = grndUnitGroup( curGrpObj, "Transport", landPlaneRouteTemplate(curRoutes));
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
    const curCMD = spawnGrp(curGroupSpawn, curSide, curGrpObj.category);
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

export async function spawnStaticBuilding(staticObj: any, init: any, baseObj?: any, side?: number, staticType?: string): Promise<void> {

    const curStaticObj: any = staticObj;
    if (init) {
        const engineCache = ddcsControllers.getEngineCache();
        const staticLookupLogiBuilding = await ddcsControllers.staticDictionaryActionsRead({_id: staticType});
        const curCountry = _.intersection(staticLookupLogiBuilding[0].config.modern.country, ddcsControllers.COUNTRY[(side || 0)]);
        if (curCountry.length > 0) {
            curStaticObj.country = ddcsControllers.countryId.indexOf(curCountry[0] as string);
            curStaticObj.coalition = side;
            curStaticObj.type = staticLookupLogiBuilding[0].type;
            curStaticObj.shape_name = staticLookupLogiBuilding[0].shape_name;
            curStaticObj.canCargo = staticLookupLogiBuilding[0].canCargo;
            curStaticObj.category = ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE");
            curStaticObj.name = baseObj.name + " " + curStaticObj.type;
            curStaticObj._id = curStaticObj.name;
            curStaticObj.hdg = _.random(0, 359);
            curStaticObj.alt = 0;
            curStaticObj.lonLatLoc = (curStaticObj.lonLatLoc) ? curStaticObj.lonLatLoc :
                ddcsControllers.getRandomLatLonFromBase(baseObj.name, "buildingPoly");
            // initial spawn, spawn in DB and sync over
            await ddcsControllers.unitActionSave(curStaticObj);
        } else {
            console.log("country not found: ", side, staticType);
        }
    } else {
        const curCMD = spawnStatic(staticTemplate(curStaticObj), curStaticObj.country);
        await ddcsControllers.sendUDPPacket("frontEnd", {actionObj: {action: "CMD", cmd: curCMD, reqID: 0}});
    }
}

export async function spawnUnitGroup(spawnArray: any[], baseName?: string, side?: number): Promise<void> {
    if (spawnArray.length > 0) {
        const groupNum = _.random(1000000, 9999999);
        const grpObj = spawnArray[0];
        const curBaseName = (baseName) ? baseName + " #" + groupNum : grpObj.groupName;
        grpObj.groupName = (baseName) ? baseName + " #" + grpObj.groupId || groupNum : grpObj.groupName;
        grpObj.coalition = (side) ? side : spawnArray[0].coalition;
        const groupTemplate = grndUnitGroup(grpObj);

        let unitTemplate = "";
        let unitNum = groupNum;
        for (const curUnit of spawnArray) {
            const unitObj = curUnit;
            unitObj.lonLatLoc = (curUnit.lonLatLoc) ? curUnit.lonLatLoc : ddcsControllers.getRandomLatLonFromBase(curBaseName, "unitPoly");
            unitObj.name = (curUnit.name) ? curUnit.name : baseName + " #" + unitNum;
            unitTemplate += ((unitNum !== groupNum) ? "," : "") + grndUnitTemplate(unitObj);
            unitNum++;
        }

        const curCMD = spawnGrp(_.replace(groupTemplate, "#UNITS", unitTemplate), grpObj.country, grpObj.category);
        const sendClient = {actionObj: {action: "CMD", cmd: curCMD, reqID: 0}};
        await ddcsControllers.sendUDPPacket("frontEnd", sendClient);
    }
}

export async function spawnNewMapObjs(): Promise<void> {
    // const engineCache = ddcsControllers.getEngineCache();
    // const curServer = engineCache.config;
    const bases = await ddcsControllers.baseActionRead({name: {$not: /#/}, enabled: true});
    for (const base of bases) {
        if (!_.includes(base.name, "Carrier")) {
            // const spawnArray: any[] = [];
            // const baseName = base.name;
            const baseStartSide = base.defaultStartSide || 0;

            await ddcsControllers.spawnStaticBuilding({}, true, base, baseStartSide, "Shelter");

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

export async function replenishUnits( baseName: string, side: number ): Promise<void> {
    await spawnBaseReinforcementGroup(side, baseName);
}

export async function destroyUnit( unitName: string ): Promise<void> {
    // DONT USE ON CLIENT AIRCRAFT
    const sendClient = {action: "REMOVEOBJECT", removeObject: unitName, reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
}

export async function healBase( baseName: string, curPlayerUnit: any): Promise<boolean> {
    const baseUnit = await ddcsControllers.baseActionRead({name: baseName});
    if (baseUnit.length > 0) {
        const curBase = baseUnit[0];
        if (curBase.baseType !== "MOB") {
            await exports.spawnSupportBaseGrp( curBase.name, curPlayerUnit.coalition); // return resp
        } else {
            const logiUnit = await ddcsControllers.unitActionRead({name: curBase.name + " Logistics", dead: false});
            const curUnit = logiUnit[0];
            if (curUnit) {
                curUnit.coalition = curBase.side;
                // await spawnLogisticCmdCenter(curUnit, false, curBase, curPlayerUnit.coalition);
            } else {
                // await spawnLogisticCmdCenter({}, false, curBase, curPlayerUnit.coalition);
            }
            const commUnit = await ddcsControllers.unitActionRead({name: curBase.name + " Communications", dead: false});
            const curCommUnit = commUnit[0];
            if (curCommUnit) {
                curCommUnit.coalition = curBase.side;
                await spawnRadioTower(curCommUnit, false, curBase, _.get(curPlayerUnit, "coalition"));
            } else {
                await spawnRadioTower({}, false, curBase, _.get(curPlayerUnit, "coalition"));
            }
            await spawnSupportBaseGrp( curBase.name, curPlayerUnit.coalition );
        }
        return true;
    }
    return false;
}
