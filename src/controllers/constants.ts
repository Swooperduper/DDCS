/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import {airfieldTable, cmdQueTable, staticDictionaryTable, unitDictionaryTable, weaponScoreTable} from "./db/remote";
import {IBase, IServer, IStaticDictionary, IUnitDictionary, IWeaponDictionary} from "../typings/index";

export const blueCountrys = [
    "AUSTRALIA",
    "AUSTRIA",
    "BELGIUM",
    "BULGARIA",
    "CANADA",
    "CROATIA",
    "CHEZH_REPUBLI",
    "DENMARK",
    "IRAQ",
    "GEORGIA",
    "GERMANY",
    "GREECE",
    "INDIA",
    "ITALY",
    "NORWAY",
    "POLAND",
    "SOUTH_KOREA",
    "SPAIN",
    "SWEDEN",
    "SWITZERLAND",
    "THE_NETHERLANDS",
    "SWITZERLAND",
    "UK",
    "USA",
    "KAZAKHSTAN",
    "UKRAINE",
    "INSURGENTS"
];

export const countryId = [
    "RUSSIA",
    "UKRAINE",
    "USA",
    "TURKEY",
    "UK",
    "FRANCE",
    "GERMANY",
    "AGGRESSORS",
    "CANADA",
    "SPAIN",
    "THE_NETHERLANDS",
    "BELGIUM",
    "NORWAY",
    "DENMARK",
    "ISRAEL",
    "GEORGIA",
    "INSURGENTS",
    "ABKHAZIA",
    "SOUTH_OSETIA",
    "ITALY",
    "AUSTRALIA",
    "SWITZERLAND",
    "AUSTRIA",
    "BELARUS",
    "BULGARIA",
    "CHEZH_REPUBLIC",
    "CHINA",
    "CROATIA",
    "EGYPT",
    "FINLAND",
    "GREECE",
    "HUNGARY",
    "INDIA",
    "IRAN",
    "IRAQ",
    "JAPAN",
    "KAZAKHSTAN",
    "NORTH_KOREA",
    "PAKISTAN",
    "POLAND",
    "ROMANIA",
    "SAUDI_ARABIA",
    "SERBIA",
    "SLOVAKIA",
    "SOUTH_KOREA",
    "SWEDEN",
    "SYRIA",
    "YEMEN",
    "VIETNAM",
    "VENEZUELA",
    "TUNISIA",
    "THAILAND",
    "SUDAN",
    "PHILIPPINES",
    "MOROCCO",
    "MEXICO",
    "MALAYSIA",
    "LIBYA",
    "JORDAN",
    "INDONESIA",
    "HONDURAS",
    "ETHIOPIA",
    "CHILE",
    "BRAZIL",
    "BAHRAIN",
    "THIRDREICH",
    "YUGOSLAVIA",
    "USSR",
    "ITALIAN_SOCIAL_REPUBLIC",
    "ALGERIA",
    "KUWAIT",
    "QATAR",
    "OMAN",
    "UNITED_ARAB_EMIRATES"
];

export const defCountrys = {
    1: "RUSSIA",
    2: "USA"
};

export const enemyCountry = [
    0,
    2,
    1
];

export const maxLifePoints = 18;

export const redCountrys = [
    "ABKHAZIA",
    "BELARUS",
    "CHINA",
    "EGYPT",
    "FINLAND",
    "HUNGARY",
    "IRAN",
    "FRANCE",
    "ISRAEL",
    "JAPAN",
    "NORTH_KOREA",
    "PAKISTAN",
    "ROMANIA",
    "RUSSIA",
    "SAUDI_ARABIA",
    "SERBIA",
    "SLOVAKIA",
    "SOUTH_OSETIA",
    "SYRIA",
    "ALGERIA",
    "KUWAIT",
    "QATAR",
    "OMAN",
    "UNITED_ARAB_EMIRATES",
    "TURKEY",
    "AGGRESSORS"
];

export const seasons = [
    "Autumn",
    "Spring",
    "Summer",
    "Winter"
];

export const side = [
    "neutral",
    "red",
    "blue"
];

export const shortNames = {
    players: "TR",
    friendly_fire: "FF",
    self_kill: "SK",
    connect: "C",
    disconnect: "D",
    S_EVENT_SHOT: "ST",
    S_EVENT_HIT: "HT",
    S_EVENT_TAKEOFF: "TO",
    S_EVENT_LAND: "LA",
    S_EVENT_CRASH: "CR",
    S_EVENT_EJECTION: "EJ",
    S_EVENT_REFUELING: "SR",
    S_EVENT_DEAD: "D",
    S_EVENT_PILOT_DEAD: "PD",
    S_EVENT_REFUELING_STOP: "RS",
    S_EVENT_BIRTH: "B",
    S_EVENT_PLAYER_ENTER_UNIT: "EU",
    S_EVENT_PLAYER_LEAVE_UNIT: "LU"
};

export const time = {
    sec: 1000,
    twoSec: 2 * 1000,
    fifteenSecs: 15 * 1000,
    fiveMins: 5 * 60 * 1000,
    fiveSecs: 5 * 1000,
    fourMins: 4 * 60 * 1000,
    oneHour: 60 * 60 * 1000,
    oneMin: 60 * 1000,
    thirtyMinutes: 30 * 60 * 1000,
    thirtySecs: 30 * 1000,
    tenMinutes: 10 * 60 * 1000,
    twoMinutes: 2 * 60 * 1000
};

export const crateTypes = [
    "iso_container_small",
    "iso_container",
    "ammo_cargo",
    "barrels_cargo",
    "container_cargo",
    "fueltank_cargo",
    "f_bar_cargo",
    "m117_cargo",
    "oiltank_cargo",
    "pipes_big_cargo",
    "pipes_small_cargo",
    "tetrapod_cargo",
    "trunks_long_cargo",
    "trunks_small_cargo",
    "uh1h_cargo"
];

export const getBases = (serverName: string) => {
    return airfieldTable.baseActionsRead(serverName)
        .then((curBases: IBase[]) => {
            return new Promise((resolve) => {
                if (curBases.length) {
                    resolve(curBases);
                } else {
                    console.log("Rebuilding Base DB");
                    cmdQueTable.cmdQueActions(
                        "save",
                        serverName,
                        {
                            actionObj: { action: "GETPOLYDEF" },
                            queName: "clientArray"
                        }
                    )
                    .catch((err: any) => {
                        console.log("erroring line790: ", err);
                    })
                    ;
                    resolve("rebuild base DB");
                }
            });
        })
        .catch((err: any) => {
            console.log("err line110: ", err);
        });
};

export const getServer = (serverName: string) => {
    return airfieldTable.serverActionsRead({ _id: serverName })
        .then((server: IServer[]) => {
            return new Promise((resolve) => {
                resolve(_.first(server));
            });
        })
        .catch((err: any) => {
            console.log("err line101: ", err);
        })
        ;
};

export const getStaticDictionary = () => {
    return staticDictionaryTable.staticDictionaryActionsRead()
        .then((staticDic: IStaticDictionary[]) => {
            return new Promise((resolve) => {
                resolve(staticDic);
            });
        })
        .catch((err: any) => {
            console.log("err line297: ", err);
        })
        ;
};

export const getUnitDictionary = (curTimePeriod: string) => {
    return unitDictionaryTable.unitDictionaryActions("read", { timePeriod: curTimePeriod })
        .then((unitsDic: IUnitDictionary[]) => {
            return new Promise((resolve) => {
                resolve(unitsDic);
            });
        })
        .catch((err: any) => {
            console.log("err line310: ", err);
        })
        ;
};

export const getWeaponDictionary = async () => {
    return await weaponScoreTable.weaponScoreActionsRead()
        .then((weaponsDic: IWeaponDictionary[]) => {
            return weaponsDic;
        })
        .catch ((err: any) => {
            console.log("err line310: ", err);
        });
};

export let config: any;
export let staticDictionary: any[];
export let unitDictionary: any[];
export let weaponsDictionary: any[];
export let bases: any[];

export const initServer = async (serverName: string) => {
    await exports.getServer(serverName)
        .then( async (server: IServer) => {
            config = server;
        });
    await exports.getStaticDictionary()
        .then( async (staticDict: IStaticDictionary[]) => {
            staticDictionary = staticDict;
        });
    await exports.getUnitDictionary(exports.config.timePeriod.modern)
        .then((unitDict: IUnitDictionary[]) => {
            unitDictionary = unitDict;
        });
    await exports.getWeaponDictionary()
        .then((weaponsDict: IWeaponDictionary[]) => {
            weaponsDictionary = weaponsDict;
        });
    await exports.getBases(serverName)
        .then((curBases: IBase[]) => {
            bases = curBases;
        });
};

