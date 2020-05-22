/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// setup defaults to satisfy config object
import * as typings from "../typings";
import {IWeaponDictionary} from "../typings";

export const engineCache = {
    config: {},
    staticDictionary: [],
    unitDictionary: [],
    weaponsDictionary: [],
    bases: []
};

export const blueCountrys: string[] = [
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

export const countryId: string[] = [
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

export const defCountrys: string[] = [
    "default",
    "RUSSIA",
    "USA"
];

export const enemyCountry: number[] = [
    0,
    2,
    1
];

export const maxLifePoints: number = 18;

export const redCountrys: string[] = [
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

export const seasons: string[] = [
    "Autumn",
    "Spring",
    "Summer",
    "Winter"
];

export const side: string[] = [
    "neutral",
    "red",
    "blue"
];

export const shortNames: any = {
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

export const time: any = {
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

export const crateTypes: string[] = [
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

export function getEngineCache(): any {
    return engineCache;
}

export function setConfig(curConfig: typings.IServer): void {
    engineCache.config = curConfig;
}

export function setStaticDictionary(curStaticDictionary: any): void {
    engineCache.staticDictionary = curStaticDictionary;
}

export function setUnitDictionary(curUnitDictionary: any): void {
    engineCache.unitDictionary = curUnitDictionary;
}

export function setWeaponDictionary(curWeaponDictionary: any): void {
    engineCache.weaponsDictionary = curWeaponDictionary;
}

export function setBases(curBases: any): void {
    engineCache.bases = curBases;
}
