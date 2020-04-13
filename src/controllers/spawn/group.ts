/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as masterDBController from "../db/masterDB";
import * as neutralCCController from "../action/neutralCC";
import * as DCSLuaCommands from "../player/DCSLuaCommands";
import * as zoneController from "../proxZone/zone";
import * as groupController from "../spawn/group";
import * as taskController from "../action/task";

let openSAM: string;

export function spawnGrp(grpSpawn: string, country: string, category: string) {
    return "coalition.addGroup(" + _.indexOf(constants.countryId, country) + ", Group.Category." + category + ", " + grpSpawn + ")";
}

export function spawnStatic(serverName: string, staticSpawn: string, country: string) {
    return [ "coalition.addStaticObject(" + _.indexOf(constants.countryId, country) + ", " + staticSpawn + ")" ];
}

export function turnOnEWRAuto(groupObj: any) {
    let setCallSign: any;
    let setFreq: any;
    if (_.includes(_.get(groupObj, "country"), "UKRAINE")) {
        setCallSign = 254;
        setFreq = 254000000;
    } else if (_.get(groupObj, "type") === "55G6 EWR") {
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

interface IPointsTemplate {
    type: string;
    action: string;
    x: string;
    y: string;
    speed: number;
    name: string;
    eplrs?: number;
}

interface IConvoyRouteTemplate {
    route: {
        points: IPointsTemplate[]
    };
}

export function convoyRouteTemplate(routes: any) {
    const buildTemplate: IConvoyRouteTemplate = {
        route: {
            points: []
        }
    };
    let cNum = 1;
    _.forEach(_.get(routes, "routeLocs"), (route) => {
        const routePayload: IPointsTemplate = {
            type: "Turning Point",
            action: _.get(route, "action"),
            x: "coord.LLtoLO(" + _.get(route, ["lonLat", 1]) + ", " + _.get(route, ["lonLat", 0]) + ").x",
            y: "coord.LLtoLO(" + _.get(route, ["lonLat", 1]) + ", " + _.get(route, ["lonLat", 0]) + ").z",
            speed: 20,
            name: "route" + cNum
        };

        buildTemplate.route.points.push(routePayload);
        cNum = cNum + 1;
    });
    // console.log("BT: ", buildTemplate.route.points);
    return buildTemplate;
}

export function turnOffDisperseUnderFire() {
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

export function defenseHeliRouteTemplate(routes: IPointsTemplate[]) {
    return "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[3]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 2, 1]) + ", " + _.get(routes, ["routeLocs", 2, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 2, 1]) + ", " + _.get(routes, ["routeLocs", 2, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[4]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 3, 1]) + ", " + _.get(routes, ["routeLocs", 3, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 3, 1]) + ", " + _.get(routes, ["routeLocs", 3, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[5]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 4, 1]) + ", " + _.get(routes, ["routeLocs", 4, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 4, 1]) + ", " + _.get(routes, ["routeLocs", 4, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[6]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 5, 1]) + ", " + _.get(routes, ["routeLocs", 5, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 5, 1]) + ", " + _.get(routes, ["routeLocs", 5, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[7]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {[\"tasks\"] = {}}" +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 6, 1]) + ", " + _.get(routes, ["routeLocs", 6, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 6, 1]) + ", " + _.get(routes, ["routeLocs", 6, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[8]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 7, 1]) + ", " + _.get(routes, ["routeLocs", 7, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 7, 1]) + ", " + _.get(routes, ["routeLocs", 7, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
}

export function atkHeliRouteTemplate(routes: IPointsTemplate[]) {
    return "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"] = {" +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
        ;
}

export function capPlaneDefenseRouteTemplate(routes: IPointsTemplate[]) {
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").z, " +
                    "[\"formation_template\"] = \"\"," +
                    "[\"airdromeId\"] = " + _.get(routes, "baseId") + "," +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").z, " +
                    "[\"formation_template\"] = \"\"," +
                "}," +
            "}," +
        "},";
}

export function capHeliDefenseRouteTemplate(routes: IPointsTemplate[]) {
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
                "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").x, " +
                "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").z, " +
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
                "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").x, " +
                "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1]) + ", " + _.get(routes, ["routeLocs", 0]) + ").z, " +
            "}," +
        "}," +
    "},";
}

export function bombersPlaneRouteTemplate(routes: IPointsTemplate[]) {
    return "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
}

export function awacsPlaneRouteTemplate(routes: IPointsTemplate[]) {
    const addTaskNum = (_.get(routes, "eplrs")) ? 1 : 0;
    let curRoute =  "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
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
    if (_.get(routes, "eplrs")) {
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
                                                "[\"frequency\"]=" + _.get(routes, "radioFreq") + "," +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"]={}" +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
    return curRoute;
}

export function tankerPlaneRouteTemplate(routes: IPointsTemplate[]) {
    let tankerTemplate = "" +
        "[\"route\"] = {" +
            "[\"points\"] = {" +
                "[1] = {" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
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
                                                "[\"frequency\"]=" + _.get(routes, "radioFreq") + "," +
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
                                        "[\"altitude\"] = " + _.get(routes, "alt") + "," +
                                        "[\"pattern\"] = \"Race-Track\"," +
                                        "[\"speed\"] = " + _.get(routes, "speed") + "," +
                                        "[\"speedEdited\"] = true," +
                                    "}," +
                                "}," +
                                "#TACAN" +
                            "}," +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").z, " +
                    "[\"speed_locked\"] = true," +
                "}," +
                "[2]={" +
                    "[\"alt\"] = " + _.get(routes, "alt") + "," +
                    "[\"action\"] = \"Turning Point\"," +
                    "[\"alt_type\"] = \"BARO\"," +
                    "[\"speed\"] = " + _.get(routes, "speed") + "," +
                    "[\"task\"] = {" +
                        "[\"id\"] = \"ComboTask\"," +
                        "[\"params\"] = {" +
                            "[\"tasks\"]={}" +
                        "}," +
                    "}," +
                    "[\"type\"] = \"Turning Point\"," +
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").z, " +
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
                    "[\"channel\"] = " + _.get(routes, "tacan.channel") + "," +
                    "[\"modeChannel\"] = \"" + _.get(routes, "tacan.modeChannel") + "\"," +
                    "[\"bearing\"] = true," +
                    "[\"frequency\"]= " + _.get(routes, "tacan.frequency") + "," +
                "}," +
            "}," +
        "}," +
    "},"
    ;

    if (_.get(routes, "tacan.enabled")) {
        tankerTemplate = _.replace(tankerTemplate, "#TACAN", tacanInfo);
    } else {
        tankerTemplate = _.replace(tankerTemplate, "#TACAN", "");
    }
    return tankerTemplate;
}

export function landPlaneRouteTemplate(routes: IPointsTemplate[]) {
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " + _.get(routes, ["routeLocs", 0, 0]) + ").z, " +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " + _.get(routes, ["routeLocs", 1, 0]) + ").z, " +
                    // "[\"name\"] = \"DictKey_WptName_21362\"," +
                    // "[\"formation_template\"] = \"\"," +
                    "[\"airdromeId\"] = " + _.get(routes, "baseId") + "," +
                    // "[\"speed_locked\"] = true," +
                "}," +
            "}" +
        "},"
    ;
}

export function landHeliRouteTemplate(routes: IPointsTemplate[]) {
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
                                        "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " +
                                            _.get(routes, ["routeLocs", 1, 0]) + ").x, " +
                                        "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 1, 1]) + ", " +
                                            _.get(routes, ["routeLocs", 1, 0]) + ").z, " +
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
                    "[\"x\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " +  _.get(routes, ["routeLocs", 0, 0]) + ").x, " +
                    "[\"y\"] = coord.LLtoLO(" + _.get(routes, ["routeLocs", 0, 1]) + ", " +  _.get(routes, ["routeLocs", 0, 0]) + ").z, " +
                    // "[\"name\"] = \"waypoint 1\"," +
                    // "[\"formation_template\"] = \"\"," +
                    // "[\"speed_locked\"] = true," +
                "}," +
            "}," +
        "},"
    ;
}

export function grndUnitGroup( groupObj: any, task: any, routes: any ) {

    let curRoute: string;
    const curTask = (task) ? task : "Ground Nothing";
    const uncontrollable = !_.get(groupObj, "playerCanDrive", false);
    // console.log("uncontrol: ", uncontrollable, curTask);

    // console.log("hidden: ", groupObj);

    if (routes) {
        curRoute = routes;
    } else if (groupObj.type === "1L13 EWR" || groupObj.type === "55G6 EWR" ) {
        // console.log("turningOnRouteEWRInstructions: ", groupObj);
        curRoute = exports.turnOnEWRAuto(groupObj);
    } else {
        curRoute = exports.turnOffDisperseUnderFire();
    }

    return "{" +
        // "[\"groupId\"] = " + _.get(groupObj, "groupId") + "," +
        "[\"communication\"] = true," +
        "[\"start_time\"] = 0," +
        "[\"frequency\"] = 251," +
        "[\"radioSet\"] = false," +
        "[\"modulation\"] = 0," +
        "[\"taskSelected\"] = true," +
        "[\"name\"] = \"" + _.get(groupObj, "groupName") + "\"," +
        "[\"visible\"] = " + _.get(groupObj, "visible", false) + "," +
        // "[\"hidden\"] = " + _.get(groupObj, "hidden", true) + "," +
        "[\"hidden\"] = " + _.get(groupObj, "hidden", false) + "," +
        "[\"uncontrollable\"] = " + uncontrollable + "," +
        "[\"hiddenOnPlanner\"] = true," +
        "[\"tasks\"] = {}," +
        "[\"task\"] = \"" + _.get(groupObj, "task", curTask) + "\"," +
        "[\"taskSelected\"] = true," +
        "[\"units\"] = {#UNITS}," +
        "[\"category\"] = Group.Category." + _.get(groupObj, "category") + "," +
        "[\"country\"] = \"" + _.get(groupObj, "country") + "\"," +
        curRoute +
    "}";
}

export function grndUnitTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"type\"] = \"" + _.get(unitObj, "type") + "\"," +
        "[\"transportable\"] = {" +
            "[\"randomTransportable\"] = true," +
        "}," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"playerCanDrive\"] = " + _.get(unitObj, "playerCanDrive", false) + "," +
        // "[\"playerCanDrive\"] = false," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
        "[\"country\"] = \"" + _.get(unitObj, "country") + "\"," +
        "}"
    ;
}

export function mi24vTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"livery_id\"] = \"standard 1\"," +
        "[\"type\"] = \"Mi-24V\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
        "[\"payload\"]={" +
            "[\"pylons\"]={}," +
            "[\"fuel\"] = \"1704\"," +
            "[\"flare\"] = 192," +
            "[\"chaff\"] = 0," +
            "[\"gun\"] = 100," +
        "}," +
    "},";
}

export function ah1wTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"livery_id\"] = \"USA X Black\"," +
        "[\"type\"] = \"AH-1W\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
        "[\"payload\"]={" +
            "[\"pylons\"]={}," +
                "[\"fuel\"] = \"1250\"," +
                "[\"flare\"] = 30," +
                "[\"chaff\"] = 30," +
                "[\"gun\"] = 100," +
            "}," +
        "},";
}

export function mi28nTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"type\"] = \"Mi-28N\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
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

export function ah64dTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"type\"] = \"AH-64D\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
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

export function b1bTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"type\"] = \"B-1B\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
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

export function su24mTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"type\"] = \"Su-24M\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
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

export function capPlaneDefenseTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["routeLocs", 1]) + ", " +  _.get(unitObj, ["routeLocs", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["routeLocs", 1]) + ", " +  _.get(unitObj, ["routeLocs", 0]) + ").z, " +
        "[\"type\"] = \"" + _.get(unitObj, "type") + "\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        "[\"parking_id\"] = \"" + _.get(unitObj, "parking_id") + "\"," +
        "[\"parking\"] = \"" + _.get(unitObj, "parking") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
        _.get(unitObj, "payload", "") +
        "}," +
    "},";
}

export function capHeliDefenseTemplate( unitObj: any ) {
    return "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["routeLocs", 1]) + ", " +  _.get(unitObj, ["routeLocs", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["routeLocs", 1]) + ", " +  _.get(unitObj, ["routeLocs", 0]) + ").z, " +
        "[\"type\"] = \"" + _.get(unitObj, "type") + "\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        "[\"parking_id\"] = \"" + _.get(unitObj, "parking_id") + "\"," +
        "[\"parking\"] = \"" + _.get(unitObj, "parking") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
        "[\"hardpoint_racks\"] = true," +
        "[\"payload\"]={" +
        _.get(unitObj, "payload", "") +
        "}," +
        "},";
}

export function airUnitTemplate( unitObj: any ) {
    // console.log("cOBJ: ", unitObj);
    let curAirTemplate = "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(unitObj, ["lonLatLoc", 1]) + ", " +  _.get(unitObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"type\"] = \"" + _.get(unitObj, "type") + "\"," +
        "[\"name\"] = \"" + _.get(unitObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(unitObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(unitObj, "heading", 0) + "," +
        "[\"skill\"] = \"" + _.get(unitObj, "skill", "Excellent") + "\"," +
        "[\"payload\"]={" +
            "[\"pylons\"]={}," +
            "[\"fuel\"] = \"100000\"," +
            "[\"flare\"] = 200," +
            "[\"chaff\"] = 200," +
            "[\"gun\"] = 200," +
        "},";

    if (unitObj.country === "USA" || unitObj.country === "AGGRESSORS") {
            // console.log("cs: ", unitObj);
            curAirTemplate = curAirTemplate + "[\"callsign\"] = {" +
            "[1] = " + _.get(unitObj, ["callsign", "1"]) + "," +
            "[2] = " + _.get(unitObj, ["callsign", "2"]) + "," +
            "[3] = " + _.get(unitObj, ["callsign", "3"]) + "," +
            "[\"name\"] = \"" + _.get(unitObj, "callsign.name") + "\"," +
            "}," +
            "[\"onboard_num\"] = \"" + _.get(unitObj, "onboard_num") + "\",";
        } else {
            curAirTemplate = curAirTemplate + "[\"callsign\"] = \"" + _.get(unitObj, "callsign") + "\"," +
            "[\"onboard_num\"] = \"" + _.get(unitObj, "onboard_num") + "\",";
        }
    return curAirTemplate + "}";
}

export function staticTemplate(staticObj: any) {
    let retObj = "{" +
        "[\"x\"] = coord.LLtoLO(" + _.get(staticObj, ["lonLatLoc", 1]) + ", " +  _.get(staticObj, ["lonLatLoc", 0]) + ").x, " +
        "[\"y\"] = coord.LLtoLO(" + _.get(staticObj, ["lonLatLoc", 1]) + ", " +  _.get(staticObj, ["lonLatLoc", 0]) + ").z, " +
        "[\"category\"] = \"" + _.get(staticObj, "category") + "\"," +
        "[\"country\"] = \"" + _.get(staticObj, "country") + "\"," +
        "[\"type\"] = \"" + _.get(staticObj, "type") + "\"," +
        "[\"name\"] = \"" + _.get(staticObj, "name") + "\"," +
        // "[\"unitId\"] = " + _.get(staticObj, "unitId") + "," +
        "[\"heading\"] = " + _.get(staticObj, "heading", 0) + "," +
        "[\"shape_name\"] = \"" + _.get(staticObj, "shape_name") + "\"," +
        "[\"canCargo\"] = " + _.get(staticObj, "canCargo", false) + ",";
    if (_.get(staticObj, "canCargo", false)) {
        retObj += "[\"mass\"] = \"" + _.get(staticObj, "mass") + "\",";
    }
    return retObj + "}";
}

export function getRndFromSpawnCat(
    serverName: string,
    spawnCat: string,
    side: number,
    spawnShow: boolean,
    spawnAlways: boolean,
    launchers: number,
    useUnitType: string
) {
    // console.log("getRndCat: ", serverName, spawnCat, side, spawnShow, spawnAlways, launchers, useUnitType);
    const curTimePeriod = _.get(constants, ["config", "timePeriod"]);
    const curEnabledCountrys = _.get(constants, [_.get(constants, ["side", side]) + "Countrys"]);
    let findUnits;
    const cPUnits: any[] = [];
    let randomIndex;
    const unitsChosen: any[] = [];
    let curLaunchSpawn: any;
    let curUnit: any;
    let curUnits: any[] = [];

    if (!_.isEmpty(useUnitType)) {
        const curComboName = _.get(_.find(_.get(constants, "unitDictionary"), {type: useUnitType}), "comboName");
        // console.log("lunitdict1");
        findUnits = _.filter(_.get(constants, "unitDictionary"), {comboName: curComboName});
    } else if (curTimePeriod === "modern" && spawnCat === "samRadar") {
        // console.log("lunitdict2: ");
        findUnits = _.filter(_.get(constants, "unitDictionary"), {spawnCat: "samRadar", spawnCatSec: "modern", enabled: true});
    } else {
        findUnits = _.filter(_.get(constants, "unitDictionary"), {spawnCat, enabled: true});
        // console.log("lunitdict3: ", findUnits, spawnCat);
    }
    // console.log("findUnits: ", findUnits);

    _.forEach(findUnits, (unit) => {
        // console.log("unitCountry: ", _.get(unit, ["config", curTimePeriod, "country"]));
        if (_.intersection(_.get(unit, ["config", curTimePeriod, "country"]), curEnabledCountrys).length > 0) {
            cPUnits.push(unit);
        }
    });
    if (cPUnits.length < 0) {
        return false;
    }
    if (spawnAlways) {
        randomIndex = _.random(0, cPUnits.length - 1);
    } else {
        randomIndex = _.random(0, cPUnits.length);
    }

    curUnit = cPUnits[randomIndex];
    // console.log('cu: ', curUnit);
    if (curUnit) {
        if (_.get(curUnit, "comboName").length > 0) {
            curUnits = _.filter(cPUnits, (curPUnit) => {
                return _.includes(_.get(curPUnit, "comboName"), _.sample(_.get(curUnit, "comboName")));
            });
        } else {
            curUnits.push(curUnit);
        }
        if (curUnits.length > 0) {
            _.forEach(curUnits, (cUnit) => {
                const curTimePeriodSpawnCount = _.get(cUnit, ["config", curTimePeriod, "spawnCount"]);
                if (_.get(cUnit, "launcher")) {
                    curLaunchSpawn = launchers ? launchers : curTimePeriodSpawnCount;
                } else {
                    curLaunchSpawn = curTimePeriodSpawnCount;
                }
                for (let y = 0; y < curLaunchSpawn; y++) {
                    unitsChosen.push(cUnit);
                }
            });
        }
        if (spawnShow) {
            _.forEach(unitsChosen, (unit) => {
                _.set(unit, "hidden", false);
            });
        }
        // console.log('unitsChosen: ', unitsChosen, spawnShow);
        return unitsChosen;
    } else {
        return false;
    }
}

export function spawnSupportVehiclesOnFarp( serverName: string, baseName: string, side: number ) {
    const curBase = _.find(_.get(constants, "bases"), {name: baseName});
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
    _.forEach(sptArray, (val) => {
        const curObj = exports.getRndFromSpawnCat(serverName, val, side, false, true)[0];
        const sptUnit = {
            name: baseName + "_" + val,
            lonLatLoc: zoneController.getLonLatFromDistanceDirection(curBase.centerLoc, curAng, 0.05),
            ...curObj
        };
        curAng += 15;
        curFarpArray.push(sptUnit);
    });
    return curFarpArray;
}

export function spawnSupportBaseGrp( baseName: string, side: number ) {
    let spawnArray: any[] = [];
    const curBases = _.get(constants, "bases");
    const farpBases = _.filter(curBases, (baseObj) => {
        return ((_.includes(baseObj._id, "_MOB") && _.get(baseObj, "initSide") === side) ||
            _.includes(_.get(baseObj, "_id"), "_FOB")) && _.first(_.split(_.get(baseObj, "name"), " #")) === baseName;
    });
    _.forEach(farpBases, (farp) => {
        spawnArray = _.concat(spawnArray, exports.spawnSupportVehiclesOnFarp( _.get(farp, "name"), side ));
    });
    exports.spawnGroup(_.compact(spawnArray), baseName, side);
    return true;
}

export function spawnBaseReinforcementGroup(serverName: string, side: number, baseName: string, forceSpawn: boolean, init: boolean) {
    let curAngle = 0;
    let curCat;
    let curRndSpawn;
    const curServer = _.get(constants, ["config"]);
    let curSpokeDeg;
    let curSpokeNum;
    let infoSpwn;
    const curBaseSpawnCats = _.get(curServer, "spwnLimitsPerTick");
    let randLatLonInBase;
    let groupedUnits = [];
    let totalUnits = 0;
    let compactUnits;
    let centerRadar;
    let polyCheck;
    _.forEach(curBaseSpawnCats, (tickVal, name) => {
        const curTickVal = _.cloneDeep(tickVal);
        for (let i = 0; i < curTickVal; i++) {
            curAngle = 0;
            curRndSpawn = _.sortBy(exports.getRndFromSpawnCat(serverName, name, side, false, forceSpawn), "sort");
            compactUnits = [];
            infoSpwn = _.first(curRndSpawn);
            centerRadar = _.get(infoSpwn, "centerRadar") ? 1 : 0;
            polyCheck = _.get(infoSpwn, "centerRadar") ? "buildingPoly" : "unitPoly";

            if (_.get(infoSpwn, "spoke")) {
                randLatLonInBase = zoneController.getRandomLatLonFromBase(serverName, baseName, polyCheck);
                groupedUnits = [];
                curSpokeNum = curRndSpawn.length - centerRadar;
                curSpokeDeg = 359 / curSpokeNum;

                if (_.get(infoSpwn, "centerRadar")) {
                    // main radar
                    curCat = _.cloneDeep(infoSpwn);
                    _.set(curCat, "lonLatLoc", randLatLonInBase);
                    groupedUnits.push(curCat);
                }
                // secondary radar
                for (let j = _.cloneDeep(centerRadar); j < _.get(infoSpwn, "secRadarNum") + centerRadar; j++) {
                    curCat = _.cloneDeep(curRndSpawn[j]);
                    _.set(curCat, "lonLatLoc", zoneController.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, _.get(curCat, "spokeDistance") / 2));
                    curAngle += curSpokeDeg;
                    groupedUnits.push(curCat);
                }
                // launchers
                for (let k = _.get(infoSpwn, "secRadarNum") + centerRadar; k < curSpokeNum + centerRadar; k++) {
                    curCat = _.cloneDeep(curRndSpawn[k]);
                    _.set(curCat, "lonLatLoc", zoneController.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, _.get(curCat, "spokeDistance")));
                    curAngle += curSpokeDeg;
                    groupedUnits.push(curCat);
                }
                compactUnits = _.compact(groupedUnits);
            } else {
                compactUnits = _.compact(curRndSpawn);
            }
            totalUnits += compactUnits.length;
            exports.spawnGroup(serverName, compactUnits, baseName, side);
        }
        if (name === "samRadar" && !init) {
            exports.spawnSAMNet(serverName, side, baseName);
            totalUnits += 3;
        }
        if (name === "antiAir" && curTickVal > 0 && _.get(curServer, "timePeriod") === "1978ColdWar") {
            totalUnits += (curTickVal * exports.spawnLayer2Reinforcements(serverName, "antiAir", 2, curTickVal, side, baseName));
        }

        if (name === "mobileAntiAir" && curTickVal > 0 && _.get(curServer, "timePeriod") === "modern") {
            totalUnits += (curTickVal * exports.spawnLayer2Reinforcements(serverName, "mobileAntiAir", 2, curTickVal, side, baseName));
        }
    });
    console.log("return total", totalUnits);
    return totalUnits;
}

export async function spawnSAMNet(serverName: string, side: number, baseName: string, init: boolean) {
    const spawnArray = [
        ["1SAM", "3SAM", "5SAM"],
        ["2SAM", "4SAM", "6SAM"]
    ];
    let realSAMArray: any[] = [];
    let rndRobinArray;

    // {$and: [{name: /Tuapse_FARP/}, {name: /EWR/}], dead: false}
    // first get working SAMS for base
    // console.log('sam for: ', baseName);
    return masterDBController.unitActions("read", serverName, {$and: [{name: new RegExp(baseName)}, {name: /SAM/}], dead: false})
        .then((samUnits: any[]) => {
            // console.log('misSAM: ', samUnits);
            if (samUnits.length > 0) {
                const curSamType = _.first(samUnits).type;
                const curUnitDict = _.find(constants.unitDictionary, {_id: curSamType});
                const curRealArray = _.get(curUnitDict, "reloadReqArray", []);
                const curSAMObj: any = {};
                let curSAMType;
                let curSAM;
                realSAMArray = [];
                _.forEach(samUnits, (samUnit) => {
                    curSAM = _.cloneDeep(samUnit);
                    curSAMType = _.split(_.get(curSAM, "name"), "|")[2];
                    _.set(curSAM, "samType", curSAMType);
                    _.set(curSAMObj, [curSAMType], _.get(curSAMObj, [curSAMType], []));
                    curSAMObj[curSAMType].push(curSAM);
                });
                // console.log('gSAMS: ', curSAMObj);
                _.forEach(curSAMObj, (samGroup, samKey) => {
                    // console.log('gSAMSINTER: ', samGroup.length, curRealArray, _.map(samGroup, 'type'),
                    // _.intersection(curRealArray, _.map(samGroup, 'type')).length);
                    if (curRealArray.length === _.intersection(curRealArray, _.map(samGroup, "type")).length) {
                        console.log("1 good sam: ", samKey);
                        realSAMArray.push(samKey);
                    }
                });
                // console.log('realSAM: ', realSAMArray);
                if (realSAMArray.length < 3) {
                    if (_.intersection(spawnArray[0], realSAMArray).length > 0) {
                        openSAM =  _.sample(_.difference(spawnArray[0], realSAMArray));
                        // console.log('1: ', openSAM, _.difference(spawnArray[0], realSAMArray), spawnArray[0], realSAMArray);
                    } else if (_.intersection(spawnArray[1], realSAMArray).length > 0) {
                        openSAM =  _.sample(_.difference(spawnArray[1], realSAMArray));
                        // console.log('2: ', openSAM, _.difference(spawnArray[1], realSAMArray), spawnArray[1], realSAMArray);
                    } else {
                        openSAM = _.sample(_.sample(spawnArray)) || spawnArray[0][0];
                    }
                    exports.spawnStarSam(serverName, side, baseName, openSAM);
                } else {
                    console.log("3+ missle batterys in place");
                }
            } else {
                if (init) {
                    rndRobinArray = _.sample(spawnArray);
                    _.forEach(rndRobinArray, (spwnPoint) => {
                        // console.log('rr: ', spwnPoint, spwnPoint[0]);
                        exports.spawnStarSam(serverName, side, baseName, spwnPoint[0]);
                    });
                }
            }
        })
        .catch((err: any) => {
            console.log("erroring line662: ", err);
            return 0;
        })
    ;
}

export function spawnStarSam(
    serverName: string,
    side: number,
    baseName: string,
    openStarSAM: string,
    launchers: number,
    useUnitType: string,
    lastLonLat: any[]
) {
    let centerRadar;
    let compactUnits;
    let curAngle = 0;
    let curCat;
    let curRndSpawn;
    let curSpokeDeg;
    let curSpokeNum;
    let randLatLonInBase;
    let infoSpwn;
    let groupedUnits: any[];
    randLatLonInBase = (lastLonLat) ? lastLonLat : zoneController.getRandomLatLonFromBase(serverName, baseName, "layer2Poly", openStarSAM);
    groupedUnits = [];
    curRndSpawn = _.sortBy(exports.getRndFromSpawnCat(serverName, "samRadar", side, false, true, launchers, useUnitType ), "sort");
    // console.log('RANDSPWN: ', curRndSpawn);
    infoSpwn = _.first(curRndSpawn);
    centerRadar = _.get(infoSpwn, "centerRadar") ? 1 : 0;
    curSpokeNum = curRndSpawn.length - centerRadar;
    curSpokeDeg = 359 / curSpokeNum;
    if (_.get(infoSpwn, "centerRadar")) {
        // main radar
        curCat = {
            ..._.cloneDeep(infoSpwn),
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            lonLatLoc: randLatLonInBase
        };
        groupedUnits.push(curCat);
    }
    // console.log('centerRadar: ', _.cloneDeep(groupedUnits));
    // secondary radar
    for (let j = _.cloneDeep(centerRadar); j < _.get(infoSpwn, "secRadarNum") + centerRadar; j++) {
        curCat = {
            ..._.cloneDeep(curRndSpawn[j]),
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            lonLatLoc: zoneController.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, _.get(curCat, "spokeDistance") / 2)
        };
        curAngle += curSpokeDeg;
        groupedUnits.push(curCat);
    }
    // console.log('seccenterRadar: ', _.cloneDeep(groupedUnits));
    // launchers
    for (let k = _.get(infoSpwn, "secRadarNum") + centerRadar; k < curSpokeNum + centerRadar; k++) {
        curCat = {
            ..._.cloneDeep(curRndSpawn[k]),
            name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
            heading: _.floor(curAngle),
            lonLatLoc: zoneController.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, _.get(curCat, "spokeDistance"))
        };
        // console.log('CA: ', curCat.name, curCat.heading);
        curAngle += curSpokeDeg;
        groupedUnits.push(curCat);
    }
    // console.log('launchers: ', _.cloneDeep(groupedUnits), _.get(infoSpwn, 'secRadarNum'), centerRadar, curSpokeNum, centerRadar);
    // add ammo truck
    curCat = {
        ..._.cloneDeep(exports.getRndFromSpawnCat(serverName, "unarmedAmmo", side, false, true)[0]),
        name: "|" + baseName + "|" + openStarSAM + "SAM|" + _.random(1000000, 9999999),
        lonLatLoc: zoneController.getLonLatFromDistanceDirection(randLatLonInBase, 180, _.get(curCat, "spokeDistance") / 2)
    };
    groupedUnits.push(curCat);
    // curAngle += curSpokeDeg;
    // console.log('ammo: ', _.cloneDeep(groupedUnits));
    // console.log('sg: ', serverName, _.compact(groupedUnits), baseName, side);
    compactUnits = _.compact(groupedUnits);
    exports.spawnGroup(serverName, compactUnits, baseName, side);
    return _.get(_.cloneDeep(compactUnits), "length", 0);
}

export function spawnLayer2Reinforcements(
    serverName: string,
    catType: string,
    rndAmt: number,
    curTick: number,
    side: number,
    baseName: string
) {
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
        curRndSpawn = _.cloneDeep(exports.getRndFromSpawnCat(serverName, catType, side, false, true));
        groupedL2Units = [];
        curSpokeNum = curRndSpawn.length;
        curSpokeDeg = 359 / curSpokeNum;

        randLatLonInBase = _.cloneDeep(zoneController.getRandomLatLonFromBase(serverName, baseName, "layer2Poly"));
        curCat = {
            ..._.cloneDeep(exports.getRndFromSpawnCat(serverName, "unarmedAmmo", side, false, true)),
            lonLatLoc: randLatLonInBase
        };
        groupedL2Units.push(curCat);
        // launchers
        for (let j = 0; j < curSpokeNum; j++) {
            // console.log('run: ', i, curAngle);
            curUnit = {
                ..._.cloneDeep(curRndSpawn[j]),
                lonLatLoc: zoneController.getLonLatFromDistanceDirection(randLatLonInBase, curAngle, 0.05)
            };
            curAngle += curSpokeDeg;
            groupedL2Units.push(curUnit);
        }
        exports.spawnGroup(serverName, _.compact(groupedL2Units), baseName, side);
    }
    return _.get(_.compact(groupedL2Units), "length", 0);
}

export async function spawnConvoy(
    serverName: string,
    groupName: string,
    convoySide: number,
    baseTemplate: any,
    aIConfig: any,
    mesg: string
) {
    const convoyMakeup: any[] = [];
    let curUnit;
    _.forEach(aIConfig.makeup, (units) => {
        curUnit = {
            ...exports.getRndFromSpawnCat(serverName, units.template, convoySide, false, true)[0],
            country: _.get(constants, ["defCountrys", convoySide]),
            speed: "55",
            hidden: false,
            playerCanDrive: false
        };
        for (let x = 0; x < units.count; x++) {
            _.set(curUnit, "name", groupName + units.template + "|" + x + "|");
            convoyMakeup.push(curUnit);
        }
    });

    const curConvoyMakeup = convoyMakeup;
    let groupArray: string = "";
    let curGroupSpawn;
    const defaultStartLonLat = _.get(_.first(_.get(baseTemplate, "route")), "lonLat");

    const curGrpObj = {
        groupName,
        country: curConvoyMakeup[0].country,
        routeLocs: baseTemplate.route,
        category: "GROUND"
    };

    // curGroupSpawn = exports.grndUnitGroup( curGrpObj, 'Ground Nothing', exports.convoyRouteTemplate(curGrpObj));
    curGroupSpawn = exports.grndUnitGroup(curGrpObj);
    // console.log('CGS: ', curGroupSpawn);
    let unitNum = 1;
    _.forEach(curConvoyMakeup, (convUnit) => {
        const curSpwnUnit = {
            ..._.cloneDeep(convUnit),
            hidden: false,
            name: groupName + unitNum + "|",
            lonLatLoc: defaultStartLonLat,
            playerCanDrive: false
        };
        groupArray += exports.grndUnitTemplate(curSpwnUnit) + ",";
        unitNum = unitNum + 1;
    });
    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", groupArray);
    // console.log('CGS: ', curGroupSpawn);
    const curCMD = exports.spawnGrp(curGroupSpawn, _.get(curGrpObj, "country"), _.get(curGrpObj, "category"));
    // console.log('CCD: ', curCMD);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    return masterDBController.cmdQueActions("save", serverName, actionObj)
        .then(() => {
            // save in que to move convoy in 1 min
            taskController.setMissionTask(serverName, groupName, JSON.stringify(exports.convoyRouteTemplate(curGrpObj)))
                .then(() => {
                    DCSLuaCommands.sendMesgToCoalition(
                        convoySide,
                        serverName,
                        mesg,
                        20
                    );
                })
                .catch((err: any) => {
                    console.log("erroring line1778: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("erroring line1783: ", err);
        })
    ;
}

export async function spawnCAPDefense(
    serverName: string,
    groupName: string,
    convoySide: number,
    baseTemplate: any,
    aIConfig: any,
    mesg: string
) {
    let curUnit;
    let capMakeup;
    let curUnitSpawn: string = "";
    let curGroupSpawn;
    let curCapTemp: any = {};
    // console.log('SCD: ', groupName, baseTemplate);

    for (let x = 0; x < aIConfig.makeup.length; x++) {
        const curUnitTemp = _.get(aIConfig, ["makeup", x]);
        const curCountry = _.get(constants, ["defCountrys", convoySide]);
        // grab template from first unit
        const aircraftTemplateType = _.get(baseTemplate, ["polygonLoc", "AICapTemplate", "units", 0, "type"]);
        const spawnTemplateName = _.get(curUnitTemp, ["template", aircraftTemplateType]);
        let curAngle = 0;

        capMakeup = [];
        curUnitSpawn = "";
        curUnit = {
            ..._.cloneDeep(exports.getRndFromSpawnCat(serverName, spawnTemplateName, convoySide, false, true)[0]),
            groupName,
            baseName: baseTemplate.name,
            country: curCountry,
            baseId: baseTemplate.baseId,
            hidden: false
        };

        for (let y = 0; y < curUnitTemp.count; y++) {

            curCapTemp = _.get(baseTemplate, ["polygonLoc", "AICapTemplate", "units", y]);
            // console.log('AICAPTEMPLATE: ', baseTemplate.polygonLoc.AICapTemplate.units, y, curCapTemp);
            curUnit = {
                ...curUnit,
                parking_id: curCapTemp.parking_id,
                parking: curCapTemp.parking,
                name: groupName + spawnTemplateName + "|" + y + "|"
            };
            if (curCapTemp.type === "F-15C") {
                curUnit.routeLocs = curCapTemp.lonLat;
                curUnitSpawn += exports.capPlaneDefenseTemplate(curUnit);
            }
            if (curCapTemp.type === "AH-1W") {
                curUnit.routeLocs = zoneController.getLonLatFromDistanceDirection(curCapTemp.lonLat, curAngle, 0.15);
                curAngle += 180;
                curUnitSpawn += exports.capHeliDefenseTemplate(curUnit);
            }
        }
        if (curCapTemp.type === "F-15C") {
            curGroupSpawn = exports.grndUnitGroup(curUnit, "CAP", exports.capPlaneDefenseRouteTemplate(curUnit));
        }
        if (curCapTemp.type === "AH-1W") {
            curGroupSpawn = exports.grndUnitGroup(curUnit, "CAS", exports.capHeliDefenseRouteTemplate(curUnit));
        }
    }

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    // console.log('theWholeThing: ', curGroupSpawn);
    const curCMD = exports.spawnGrp(curGroupSpawn, _.get(constants, ["defCountrys", convoySide]), curUnit.category);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    return masterDBController.cmdQueActions("save", serverName, actionObj)
        .then(() => {
            DCSLuaCommands.sendMesgToCoalition(
                convoySide,
                serverName,
                mesg,
                20
            );
        })
        .catch((err: any) => {
            console.log("erroring line1791: ", err);
        })
    ;
}

export async function spawnDefenseChopper(serverName: string, playerUnitObj: any, unitObj: any) {
    let curTkrName: any;
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj = {};
    let friendlyLoc;
    const curCategory = "HELICOPTER";

    curCountry = unitObj.country;
    curTkrName = "AI|" + unitObj.name + "|";
    curSpwnUnit = _.cloneDeep(unitObj);

    masterDBController.baseActions(
        "getClosestFriendlyBase",
        serverName,
        { unitLonLatLoc: playerUnitObj.lonLatLoc, playerSide: playerUnitObj.coalition}
    )
        .then((friendlyBase: any) => {
            const patrolDistance = 2;
            friendlyLoc = zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 0, patrolDistance);
            curGrpObj = _.cloneDeep(curSpwnUnit);
            _.set(curGrpObj, "groupName", curTkrName + "#" + _.random(1000000, 9999999));
            _.set(curGrpObj, "country", curCountry);
            _.set(curGrpObj, "category", curCategory);
            _.set(curGrpObj, "alt", _.parseInt(unitObj.alt) + _.parseInt(friendlyBase.alt));
            _.set(curGrpObj, "routeLocs", [
                friendlyLoc,
                zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 45, patrolDistance),
                zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 90, patrolDistance),
                zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 135, patrolDistance),
                zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 180, patrolDistance),
                zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 225, patrolDistance),
                zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 270, patrolDistance),
                zoneController.getLonLatFromDistanceDirection(friendlyBase.centerLoc, 315, patrolDistance)
            ]);

            curGroupSpawn = exports.grndUnitGroup( curGrpObj, "CAS", exports.defenseHeliRouteTemplate(curGrpObj));

            _.set(curSpwnUnit, "lonLatLoc", friendlyLoc);
            _.set(curSpwnUnit, "name", curTkrName + "#" + _.random(1000000, 9999999));
            _.set(curSpwnUnit, "playerCanDrive", false);
            _.set(curSpwnUnit, "hidden", false);

            if (unitObj.name === "RussianDefHeli") {
                for (let x = 0; x < 2; x++) {
                    curUnitSpawn += exports.mi24vTemplate(curSpwnUnit);
                }
            }
            if (unitObj.name === "USADefHeli") {
                for (let x = 0; x < 2; x++) {
                    curUnitSpawn += exports.ah1wTemplate(curSpwnUnit);
                }
            }

            curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
            const curCMD = exports.spawnGrp(curGroupSpawn, curCountry, curCategory);
            const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
            const actionObj = {actionObj: sendClient, queName: "clientArray"};
            masterDBController.cmdQueActions("save", serverName, actionObj)
                .then(() => {
                    const mesg = "C: A pair of " + unitObj.type + " is defending " + friendlyBase.name;
                    DCSLuaCommands.sendMesgToCoalition(
                        playerUnitObj.coalition,
                        serverName,
                        mesg,
                        20
                    );
                })
                .catch((err: any) => {
                    console.log("erroring line1400: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("erroring line1405: ", err);
        })
    ;
}

export async function spawnAtkChopper(serverName: string, playerUnitObj: any, unitObj: any) {
    let curTkrName: string;
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj = {};
    let friendlyLoc;
    let enemyLoc;
    const curCategory = "HELICOPTER";

    curCountry = unitObj.country;
    curTkrName = "AI|" + unitObj.name + "|";
    curSpwnUnit = _.cloneDeep(unitObj);

    masterDBController.baseActions(
        "getClosestEnemyBase",
        serverName,
        { unitLonLatLoc: playerUnitObj.lonLatLoc, playerSide: playerUnitObj.coalition}
    )
        .then((enemyBase: any) => {
            masterDBController.baseActions(
                "getClosestFriendlyBase",
                serverName,
                { unitLonLatLoc: playerUnitObj.lonLatLoc, playerSide: playerUnitObj.coalition}
            )
                .then((friendlyBase: any) => {
                    friendlyLoc = zoneController.getLonLatFromDistanceDirection(
                        friendlyBase.centerLoc,
                        zoneController.findBearing(
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
                        alt: _.parseInt(unitObj.alt) + _.parseInt(friendlyBase.alt),
                        routeLocs: [
                            friendlyLoc,
                            enemyLoc
                        ]
                    };

                    curGroupSpawn = exports.grndUnitGroup( curGrpObj, "CAS", exports.atkHeliRouteTemplate(curGrpObj));

                    curSpwnUnit = {
                        ...curSpwnUnit,
                        lonLatLoc: friendlyLoc,
                        name: curTkrName + "#" + _.random(1000000, 9999999),
                        playerCanDrive: false,
                        hidden: false
                    };

                    if (unitObj.name === "RussianAtkHeli") {
                        for (let x = 0; x < 2; x++) {
                            curUnitSpawn += exports.mi28nTemplate(curSpwnUnit);
                        }
                    }
                    if (unitObj.name === "USAAtkHeli") {
                        for (let x = 0; x < 2; x++) {
                            curUnitSpawn += exports.ah64dTemplate(curSpwnUnit);
                        }
                    }

                    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
                    const curCMD = exports.spawnGrp(curGroupSpawn, curCountry, curCategory);
                    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
                    const actionObj = {actionObj: sendClient, queName: "clientArray"};
                    return masterDBController.cmdQueActions("save", serverName, actionObj)
                        .then(() => {
                            const mesg = "C: " + unitObj.type + " Atk Heli is departed " + friendlyBase.name + " and it is patrolling toward " + enemyBase.name;
                            DCSLuaCommands.sendMesgToCoalition(
                                playerUnitObj.coalition,
                                serverName,
                                mesg,
                                20
                            );
                        })
                        .catch((err: any) => {
                            console.log("erroring line1026: ", err);
                        })
                    ;
                })
                .catch((err: any) => {
                    console.log("erroring line1031: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("erroring line1036: ", err);
        })
    ;
}

export async function spawnBomberPlane(serverName: string, playerUnitObj: any, bomberObj: any) {
    let curTkrName: string;
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj = {};
    let remoteLoc;
    let closeLoc;
    const curCategory = "AIRPLANE";
    const randomDir = _.random(0, 359);

    curCountry = bomberObj.country;
    curTkrName = "AI|" + bomberObj.name + "|";
    curSpwnUnit = _.cloneDeep(bomberObj);

    masterDBController.baseActions(
        "getClosestEnemyBase",
        serverName,
        { unitLonLatLoc: playerUnitObj.lonLatLoc, playerSide: playerUnitObj.coalition}
    )
        .then((closeBase: any) => {
            // console.log('CB: ', closeBase);
            remoteLoc = zoneController.getLonLatFromDistanceDirection(closeBase.centerLoc, randomDir, curSpwnUnit.spawnDistance);
            closeLoc = zoneController.getLonLatFromDistanceDirection(closeBase.centerLoc, randomDir, 7);

            curGrpObj = {
                ..._.cloneDeep(curSpwnUnit),
                groupName: curTkrName + "#" + _.random(1000000, 9999999),
                country: curCountry,
                category: curCategory,
                alt: _.parseInt(bomberObj.alt) + _.parseInt(closeBase.alt),
                routeLocs: [
                    remoteLoc,
                    closeLoc
                ]
            };

            curGroupSpawn = exports.grndUnitGroup( curGrpObj, "CAS", exports.bombersPlaneRouteTemplate(curGrpObj));

            curSpwnUnit = {
                ...curSpwnUnit,
                lonLatLoc: remoteLoc,
                name: curTkrName + "#" + _.random(1000000, 9999999),
                playerCanDrive: false,
                hidden: false
            };

            if (bomberObj.name === "RussianBomber") {
                for (let x = 0; x < 4; x++) {
                    curUnitSpawn += exports.su24mTemplate(curSpwnUnit);
                }
            }
            if (bomberObj.name === "USABomber") {
                curUnitSpawn = exports.b1bTemplate(curSpwnUnit);
            }

            curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
            const curCMD = exports.spawnGrp(curGroupSpawn, curCountry, curCategory);
            const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
            const actionObj = {actionObj: sendClient, queName: "clientArray"};
            return masterDBController.cmdQueActions("save", serverName, actionObj)
                .then(() => {
                    const mesg = "C: " + bomberObj.type + " Bomber is commencing its run BRA " +
                        randomDir + " from " + closeBase.name + " " + bomberObj.details;
                    DCSLuaCommands.sendMesgToCoalition(
                        playerUnitObj.coalition,
                        serverName,
                        mesg,
                        20
                    );
                })
                .catch((err: any) => {
                    console.log("erroring line428: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("erroring line632: ", err);
        })
    ;
}

export async function spawnAWACSPlane(serverName: string, playerUnitObj: any, awacsObj: any) {
    let curTkrName: string;
    let curUnitSpawn;
    let curGroupSpawn;
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj = {};
    let remoteLoc;
    const curCategory = "AIRPLANE";

    curCountry = awacsObj.country;
    curTkrName = "AI|" + awacsObj.name + "|";
    curSpwnUnit = _.cloneDeep(awacsObj);

    masterDBController.baseActions("getClosestBase", serverName, { unitLonLatLoc: playerUnitObj.lonLatLoc})
        .then((closeBase: any) => {
            // console.log('CB: ', closeBase);
            remoteLoc = zoneController.getLonLatFromDistanceDirection(
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

            curGroupSpawn = exports.grndUnitGroup( curGrpObj, "AWACS", exports.awacsPlaneRouteTemplate(curGrpObj));

            curSpwnUnit = {
                ...curSpwnUnit,
                lonLatLoc: remoteLoc,
                name: curTkrName,
                playerCanDrive: false,
                hidden: false
            };

            curUnitSpawn = exports.airUnitTemplate(curSpwnUnit);

            curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
            const curCMD = exports.spawnGrp(curGroupSpawn, curCountry, curCategory);
            const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
            const actionObj = {actionObj: sendClient, queName: "clientArray"};
            return masterDBController.cmdQueActions("save", serverName, actionObj)
                .then(() => {
                    const mesg = "C: A " + awacsObj.type + " AWACS Has Been Spawned " +
                        playerUnitObj.hdg + " from " + closeBase.name + " " + awacsObj.details;
                    DCSLuaCommands.sendMesgToCoalition(
                        playerUnitObj.coalition,
                        serverName,
                        mesg,
                        20
                    );
                })
                .catch((err: any) => {
                    console.log("erroring line428: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("erroring line632: ", err);
        })
    ;
}

export async function spawnTankerPlane(serverName: string, playerUnitObj: any, tankerObj: any, playerLoc: any, remoteLoc: any) {
    let curTkrName: string;
    let curUnitSpawn;
    let curGroupSpawn;
    let curCountry: string;
    let curSpwnUnit: any;
    let curGrpObj = {};
    const curCategory = "AIRPLANE";

    curCountry = tankerObj.country;
    curTkrName = "AI|" + tankerObj.name + "|";
    curSpwnUnit = _.cloneDeep(tankerObj);

    masterDBController.baseActions("getClosestBase", serverName, { unitLonLatLoc: playerLoc})
        .then((closeBase: any) => {
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

            curGroupSpawn = exports.grndUnitGroup( curGrpObj, "Refueling", exports.tankerPlaneRouteTemplate(curGrpObj));

            curSpwnUnit = {
                ...curSpwnUnit,
                lonLatLoc: remoteLoc,
                name: curTkrName + "#" + _.random(1000000, 9999999),
                playerCanDrive: false,
                hidden: false
            };

            curUnitSpawn = exports.airUnitTemplate(curSpwnUnit);

            curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
            const curCMD = exports.spawnGrp(curGroupSpawn, curCountry, curCategory);
            const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
            const actionObj = {actionObj: sendClient, queName: "clientArray"};
            return masterDBController.cmdQueActions("save", serverName, actionObj)
                .then(() => {
                    const mesg = "C: A " + tankerObj.type + " Tanker Has Been Spawned " +
                        playerUnitObj.hdg + " from " + closeBase.name + " " + tankerObj.details;
                    DCSLuaCommands.sendMesgToCoalition(
                        playerUnitObj.coalition,
                        serverName,
                        mesg,
                        20
                    );
                })
                .catch((err: any) => {
                    console.log("erroring line428: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("erroring line632: ", err);
        })
    ;
}

export async function spawnSupportPlane(serverName: string, baseObj: any, side: number) {
    // console.log('SPSUPP: ', serverName, baseObj, side);
    let curBaseName;
    let curUnitName;
    let curUnitSpawn;
    let curGroupSpawn;
    let curSide;
    let curSpwnUnit;
    let curGrpObj = {};
    let curRoutes;
    let baseLoc;
    let remoteLoc;
    const grpNum = _.random(1000000, 9999999);
    const randomDir = _.random(0, 359);

    curSide = (side) ? _.get(constants, ["defCountrys", side]) : _.get(constants, ["defCountrys", _.get(curGrpObj, "coalition")]);
    curBaseName = "AI|1010101|" + _.get(baseObj, "name") + "|LOGISTICS|";
    baseLoc = _.get(baseObj, "centerLoc");
    console.log("BASE: ", baseLoc);

    if (_.includes(_.get(baseObj, "_id"), "_MOB") || _.includes(_.get(baseObj, "_id"), "_FOB")) {
        curSpwnUnit = _.cloneDeep(exports.getRndFromSpawnCat(serverName, "transportHeli", side, true, true )[0]);
        // remoteLoc = zoneController.getLonLatFromDistanceDirection(baseLoc, _.get(baseObj, 'spawnAngle'), 40);
        remoteLoc = zoneController.getLonLatFromDistanceDirection(baseLoc, randomDir, 40);
    } else {
        curSpwnUnit = _.cloneDeep(exports.getRndFromSpawnCat(serverName, "transportAircraft", side, true, true )[0]);
        remoteLoc = zoneController.getLonLatFromDistanceDirection(baseLoc, randomDir, 70);
        // remoteLoc = zoneController.getLonLatFromDistanceDirection(baseLoc, _.random(0, 359), 70);
    }
    curGrpObj = {
        ..._.cloneDeep(curSpwnUnit),
        groupId: grpNum,
        groupName: curBaseName,
        country: curSide
    };

    curRoutes = {
        baseId: _.get(baseObj, "baseId"),
        routeLocs: [
            remoteLoc,
            baseLoc
        ]
    };
    if (_.includes(_.get(baseObj, "_id"), "_MOB") || _.includes(_.get(baseObj, "_id"), "_FOB")) {
        curGroupSpawn = exports.grndUnitGroup( curGrpObj, "Transport", exports.landHeliRouteTemplate(curRoutes));
    } else {
        curGroupSpawn = exports.grndUnitGroup( curGrpObj, "Transport", exports.landPlaneRouteTemplate(curRoutes));
    }

    curUnitName = "AI|1010101|" + _.get(baseObj, "name") + "|LOGISTICS|";

    curSpwnUnit = {
        ...curSpwnUnit,
        lonLatLoc: remoteLoc,
        name: curUnitName,
        playerCanDrive: false,
        hidden: false
    };

    curUnitSpawn = exports.airUnitTemplate(curSpwnUnit);

    curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
    // console.log('spawnSupportPlane: ', curGroupSpawn, curSide, curGrpObj.category);
    const curCMD = exports.spawnGrp(curGroupSpawn, curSide, curGrpObj.category);
    const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    return masterDBController.cmdQueActions("save", serverName, actionObj)
        .then(() => {
            const mesg = "C: Cargo Support Plane 10 mins out, BRA " + randomDir + " from " + _.get(baseObj, "name");
            DCSLuaCommands.sendMesgToCoalition(
                side,
                serverName,
                mesg,
                20
            );
        })
        .catch((err: any) => {
            console.log("erroring line428: ", err);
        })
    ;
}

export async function spawnLogiGroup(serverName: string, spawnArray: any[], side: number) {
    let curAng: number;
    let grpNum = 0;
    let unitNum = 0;
    let curBaseName = "";
    let curUnitName = "";
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curGrpObj: any;
    let curSide;
    let curSpwnUnit;
    const sArray = _.compact(_.cloneDeep(spawnArray));
    curGrpObj = sArray[0];
    if (curGrpObj) {
        curAng = _.cloneDeep(_.get(curGrpObj, "heading", 0));
        grpNum = _.get(curGrpObj, "groupId", _.random(1000000, 9999999));
        // console.log('logispawn ukraine: ', curGrpObj.country, side, side === 2, _.includes(curGrpObj.country, 'UKRAINE'));
        if (side === 2 && _.includes(curGrpObj.country, "UKRAINE")) {
            curSide = "UKRAINE";
        } else {
            curSide = (side) ? _.get(constants, ["defCountrys", side]) : _.get(constants, ["defCountrys", _.get(curGrpObj, "coalition")]);
        }
        _.set(curGrpObj, "country", curSide);
        curBaseName = curGrpObj.spwnName + " #" + grpNum;

        _.set(curGrpObj, "groupId", grpNum);
        _.set(curGrpObj, "groupName", curBaseName);
        curGroupSpawn = exports.grndUnitGroup( curGrpObj );
        unitNum = _.cloneDeep(grpNum);
        _.forEach(sArray, (curUnit) => {
            if (curAng > 359) {
                curAng = 15;
            }
            curSpwnUnit = _.cloneDeep(curUnit);
            if (unitNum !== grpNum) {
                curUnitSpawn += ",";
            }
            unitNum += 1;
            if (_.get(curSpwnUnit, "special") === "jtac") {
                curUnitName = curSpwnUnit.spwnName;
            } else {
                curUnitName = curSpwnUnit.spwnName + " #" + unitNum;
            }

            _.set(curSpwnUnit, "lonLatLoc", zoneController.getLonLatFromDistanceDirection(curSpwnUnit.lonLatLoc, curAng, 0.05));
            curAng += 15;
            // _.set(curSpwnUnit, 'unitId', _.get(curSpwnUnit, 'unitId', unitNum));
            _.set(curSpwnUnit, "name", curUnitName);
            _.set(curSpwnUnit, "playerCanDrive", _.get(curSpwnUnit, "playerCanDrive", true));
            curUnitSpawn += exports.grndUnitTemplate(curSpwnUnit);
        });
        curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
        // var curCMD = 'mist.dynAdd(' + curGroupSpawn + ')';
        const curCMD = exports.spawnGrp(curGroupSpawn, curSide, curGrpObj.category);
        const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
        const actionObj = {actionObj: sendClient, queName: "clientArray"};
        return masterDBController.cmdQueActions("save", serverName, actionObj)
            .catch((err: any) => {
                console.log("erroring line1816: ", err);
            })
        ;
    }
}

export async function spawnGroup(serverName: string, spawnArray: any[], baseName: string, side: number) {
    let grpNum = 0;
    let unitNum = 0;
    let curBaseName = "";
    let curUnitName = "";
    let curUnitSpawn = "";
    let curGroupSpawn;
    let curGrpObj: any = {};
    let curSide: string;
    let curSpwnUnit;
    const sArray = _.compact(_.cloneDeep(spawnArray));
    curGrpObj = sArray[0];
    if (curGrpObj) {
        grpNum = _.get(curGrpObj, "groupId", _.random(1000000, 9999999));
        curBaseName = (baseName) ? baseName + " #" + grpNum : _.get(curGrpObj, "groupName");
        _.set(curGrpObj, "groupId", grpNum);
        _.set(curGrpObj, "groupName", curBaseName);
        // console.log('logispawn ukraine2: ', curGrpObj.country, side, side === 2, _.includes(curGrpObj.country, 'UKRAINE'));
        if (side === 2 && _.includes(curGrpObj.country, "UKRAINE")) {
            _.set(curGrpObj, "country", "UKRAINE");
            curSide = "UKRAINE";
        } else {
            curSide = (side) ? _.get(constants, ["defCountrys", side]) :
                _.get(curGrpObj, "country", _.get(constants, ["defCountrys", _.get(curGrpObj, "coalition")]));
            _.set(curGrpObj, "country", curSide);
        }
        curGroupSpawn = exports.grndUnitGroup( curGrpObj );
        unitNum = _.cloneDeep(grpNum);
        _.forEach(sArray, (curUnit) => {
            curSpwnUnit = _.cloneDeep(curUnit);
            if (unitNum !== grpNum) {
                curUnitSpawn += ",";
            }
            unitNum += 1;
            curUnitName = baseName + " #" + unitNum;

            if (_.isUndefined(_.get(curSpwnUnit, "lonLatLoc"))) {
                _.set(curSpwnUnit, "lonLatLoc", zoneController.getRandomLatLonFromBase(serverName, baseName, "unitPoly"));
            }
            if (curGrpObj.country === "UKRAINE") {
                _.set(curSpwnUnit, "country", "UKRAINE");
            } else {
                _.set(curSpwnUnit, "country", curSide);
            }
            // _.set(curSpwnUnit, 'unitId', _.get(curSpwnUnit, 'unitId', unitNum));
            _.set(curSpwnUnit, "name", _.get(curSpwnUnit, "name", curUnitName));
            curUnitSpawn += exports.grndUnitTemplate(curSpwnUnit);
        });
        curGroupSpawn = _.replace(curGroupSpawn, "#UNITS", curUnitSpawn);
        // var curCMD = 'mist.dynAdd(' + curGroupSpawn + ')';
        const curCMD = exports.spawnGrp(curGroupSpawn, curSide, curGrpObj.category);
        // console.log('cmd: ', curCMD);
        const sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
        const actionObj = {actionObj: sendClient, queName: "clientArray"};
        return masterDBController.cmdQueActions("save", serverName, actionObj)
            .catch((err: any) => {
                console.log("erroring line525: ", err);
            })
        ;
    }
}

export async function spawnNewMapGrps( serverName: string ) {
    let totalUnitsSpawned = 0;
    const curServer = _.get(constants, ["config"]);
    let totalUnitNum;
    return masterDBController.baseActions("read", serverName, {name: {$not: /#/}, enabled: true})
        .then((bases: any[]) => {
            _.forEach(bases, (base) => {
                if (!_.includes(_.get(base, "name"), "Carrier")) {
                    const spawnArray: any[] = [];
                    const baseName = _.get(base, "name");
                    const baseStartSide = _.get(base, "defaultStartSide", 0);
                    totalUnitNum = 0;
                    groupController.spawnLogisticCmdCenter(serverName, {}, false, base, baseStartSide);
                    exports.spawnSupportBaseGrp(serverName, baseName, baseStartSide, true);
                    if (_.get(base, "baseType") === "MOB") {
                        while (spawnArray.length + totalUnitNum < curServer.replenThresholdBase) { // UNCOMMENT THESE
                            totalUnitNum += exports.spawnBaseReinforcementGroup(serverName, baseStartSide, baseName, true, true);
                        }
                        exports.spawnSAMNet(serverName, baseStartSide, baseName, true);
                        totalUnitNum += 3;
                        exports.spawnRadioTower(
                            serverName,
                            {},
                            true,
                            _.find(_.get(constants, "bases"),{name: baseName}),
                            baseStartSide
                        );
                    }
                    exports.spawnGroup(serverName, spawnArray, baseName, baseStartSide);
                    exports.spawnLogisticCmdCenter(
                        serverName,
                        {},
                        true,
                        _.find(_.get(constants, "bases"), {name: baseName}),
                        baseStartSide
                    );
                    totalUnitsSpawned += spawnArray.length + totalUnitNum + 1;
                    return totalUnitsSpawned;
                }
            });
        })
        .catch((err: any) => {
            console.log("erroring line2181: ", err);
        })
    ;
}

export async function spawnLogisticCmdCenter(staticObj: any, init: boolean, baseObj: any, side: number) {
    // console.log('spawnLogi: ', serverName, staticObj, init, baseObj, side);
    let curGrpObj = _.cloneDeep(staticObj);
    _.set(curGrpObj, "name", _.get(curGrpObj, "name", _.get(baseObj, "name", "") + " Logistics"));
    _.set(curGrpObj, "coalition", _.get(curGrpObj, "coalition", side));
    if (_.isUndefined(_.get(curGrpObj, "lonLatLoc"))) {
        _.set(curGrpObj, "lonLatLoc", zoneController.getRandomLatLonFromBase(_.get(baseObj, "name"), "buildingPoly"));
    }

    curGrpObj = {
        ..._.cloneDeep(staticObj),
        country: _.get(constants, ["defCountrys", curGrpObj.coalition]),
        category: "Fortifications",
        type: ".Command Center",
        shape_name: "ComCenter"
    };

    const curCMD = exports.spawnStatic(exports.staticTemplate(curGrpObj), curGrpObj.country, curGrpObj.name, init);
    const sendClient = {action: "CMD", cmd: curCMD, reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    masterDBController.cmdQueActions("save", actionObj)
        .catch((err: any) => {
            console.log("erroring line2176: ", err);
        })
    ;
    return masterDBController.unitActions(
        "updateByName",
        {name: curGrpObj.name, coalition: curGrpObj.coalition, country: curGrpObj.country, dead: false}
    )
        .catch((err: any) => {
            console.log("erroring line2181: ", err);
        })
    ;
}

export async function spawnRadioTower(staticObj: any, init: boolean, baseObj: any, side: number) {
    // console.log('spawnLogi: ', serverName, staticObj, init, baseObj, side);
    let curGrpObj = _.cloneDeep(staticObj);
    _.set(curGrpObj, "name", _.get(curGrpObj, "name", _.get(baseObj, "name", "") + " Communications"));
    _.set(curGrpObj, "coalition", _.get(curGrpObj, "coalition", side));
    _.set(curGrpObj, "country", _.get(constants, ["defCountrys", curGrpObj.coalition]));
    if (_.isUndefined(_.get(curGrpObj, "lonLatLoc"))) {
        _.set(curGrpObj, "lonLatLoc", zoneController.getRandomLatLonFromBase(_.get(baseObj, "name"), "buildingPoly"));
    }

    curGrpObj = {
        ...curGrpObj,
        category: "Fortifications",
        type: "Comms tower M",
        shape_name: "tele_bash_m"
    };

    const curCMD = exports.spawnStatic(serverName, exports.staticTemplate(curGrpObj), curGrpObj.country, curGrpObj.name, init);
    const sendClient = {action: "CMD", cmd: curCMD, reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    masterDBController.cmdQueActions("save", serverName, actionObj)
        .catch((err: any) => {
            console.log("erroring line2204: ", err);
        })
    ;
    return masterDBController.unitActions(
        "updateByName",
        serverName,
        {name: curGrpObj.name, coalition: curGrpObj.coalition, country: curGrpObj.country, dead: false}
    )
        .catch((err: any) => {
            console.log("erroring line2209: ", err);
        })
    ;
}

export async function spawnBaseEWR(serverName: string, type: string, baseName: string, side: number) {
    let unitStart;
    let pCountry = _.get(constants, ["defCountrys", side]);
    const curTimePeriod = _.get(constants, ["config", "timePeriod"]);
    const findUnit = _.find(_.get(constants, "unitDictionary"), {_id: type});
    if ((type === "1L13 EWR" || type === "55G6 EWR" || type === "Dog Ear radar") && side === 2) {
        console.log("EWR: UKRAINE");
        pCountry = "UKRAINE";
    }
    // console.log('FINDUNIT: ', findUnit, pCountry);
    const spawnUnitCount = _.get(findUnit, ["config", curTimePeriod, "spawnCount"]);
    for (let x = 0; x < spawnUnitCount; x++) {
        unitStart = {
            ..._.cloneDeep(findUnit),
            spwnName: baseName + " " + type,
            lonLatLoc: zoneController.getRandomLatLonFromBase(serverName, baseName, "buildingPoly"),
            heading: 0,
            country: pCountry,
            playerCanDrive: false
        };
    }
    // console.log('EWR Array: ', unitStart, side);
    return exports.spawnLogiGroup(serverName, [unitStart], side);
}

export async function replenishUnits( serverName: string, baseName: string, side: number ) {
    return exports.spawnBaseReinforcementGroup(serverName, side, baseName);
    // exports.spawnGroup(serverName, exports.spawnBaseReinforcementGroup(serverName, side, baseName), baseName, side);
}

export async function destroyUnit( serverName: string, unitName: string ) {
    // DONT USE ON CLIENT AIRCRAFT
    const sendClient = {action: "REMOVEOBJECT", removeObject: unitName, reqID: 0};
    const actionObj = {actionObj: sendClient, queName: "clientArray"};
    return masterDBController.cmdQueActions("save", serverName, actionObj)
        .catch((err: any) => {
            console.log("erroring line613: ", err);
        })
    ;
}

export async function healBase( serverName: string, baseName: string, curPlayerUnit: any) {
    // respawn farp tower to 'heal' it
    return new Promise((resolve, reject) => {
        masterDBController.baseActions("read", serverName, {name: baseName})
            .then((baseUnit: any) => {
                if (baseUnit) {
                    const curBase = baseUnit[0];
                    if (_.get(curBase, "baseType") !== "MOB") {
                        neutralCCController.spawnCCAtNeutralBase(serverName, curPlayerUnit)
                            .then((resp: any) => {
                                exports.spawnSupportBaseGrp( serverName, curBase.name, _.get(curPlayerUnit, "coalition") );
                                resolve(resp);
                            })
                            .catch((err: any) => {
                                console.log("line 32: ", err);
                                reject(err);
                            })
                        ;

                    } else {
                        masterDBController.unitActions("read", serverName, {name: _.get(curBase, "name") + " Logistics", dead: false})
                            .then((logiUnit: any[]) => {
                                const curUnit = logiUnit[0];
                                if (curUnit) {
                                    _.set(curUnit, "coalition", _.get(curBase, "side"));
                                    // console.log('creating logistics from existing: ', serverName, curUnit, false, curBase, curBase.side);
                                    exports.spawnLogisticCmdCenter(serverName, curUnit, false, curBase, _.get(curPlayerUnit, "coalition"));
                                } else {
                                    // console.log('creating NEW logistics: ', serverName, {}, false, curBase, curBase.side);
                                    exports.spawnLogisticCmdCenter(serverName, {}, false, curBase, _.get(curPlayerUnit, "coalition"));
                                }
                            })
                            .catch((err: any) => {
                                console.log("erroring line662: ", err);
                                reject(err);
                            })
                        ;
                        masterDBController.unitActions("read", serverName, {name: _.get(curBase, "name") + " Communications", dead: false})
                            .then((commUnit: any[]) => {
                                const curCommUnit = commUnit[0];
                                if (curCommUnit) {
                                    _.set(curCommUnit, "coalition", _.get(curBase, "side"));
                                    // console.log('creating logistics from existing:
                                    // ', serverName, curCommUnit, false, curBase, curBase.side);
                                    exports.spawnRadioTower(serverName, curCommUnit, false, curBase, _.get(curPlayerUnit, "coalition"));
                                } else {
                                    // console.log('creating NEW logistics: ', serverName, {}, false, curBase, curBase.side);
                                    exports.spawnRadioTower(serverName, {}, false, curBase, _.get(curPlayerUnit, "coalition"));
                                }
                            })
                            .catch((err: any) => {
                                console.log("erroring line662: ", err);
                                reject(err);
                            })
                        ;
                        /*
						if (_.get(curBase, 'side') === 2) {
							masterDBController.unitActions('read', serverName, {name: _.get(curBase, 'name') + ' 1L13 EWR', dead: false})
								.then(function (commUnit) {
									if (commUnit === 0) {
										exports.spawnBaseEWR(serverName, '1L13 EWR', _.get(curBase, 'name'), _.get(curPlayerUnit, 'coalition'));
									}
								})
								.catch(function (err) {
									console.log('erroring line662: ', err);
									reject(err);
								})
							;
						} else {
							masterDBController.unitActions('read', serverName, {name: _.get(curBase, 'name') + ' 55G6 EWR', dead: false})
								.then(function (commUnit) {
									if (commUnit === 0) {
										exports.spawnBaseEWR(serverName, '55G6 EWR', _.get(curBase, 'name'), _.get(curPlayerUnit, 'coalition'));
									}
								})
								.catch(function (err) {
									console.log('erroring line662: ', err);
									reject(err);
								})
							;
							masterDBController.unitActions('read', serverName, {name: _.get(curBase, 'name') + ' 1L13 EWR', dead: false})
								.then(function (commUnit) {
									if (commUnit === 0) {
										exports.spawnBaseEWR(serverName, '1L13 EWR', _.get(curBase, 'name'), _.get(curPlayerUnit, 'coalition'));
									}
								})
								.catch(function (err) {
									console.log('erroring line662: ', err);
									reject(err);
								})
							;
						}
						*/
                        // rebuild farp support vehicles
                        exports.spawnSupportBaseGrp( serverName, curBase.name, _.get(curPlayerUnit, "coalition") );
                        resolve(true);
                    }
                }
            })
            .catch((err: any) => {
                console.log("erroring line657: ", err);
                reject(err);
            })
        ;
    });
}
/*
export function loadOnDemandGroup( groupObj ) {

}

export function unloadOnDemandGroup( groupObj ) {

}
*/
