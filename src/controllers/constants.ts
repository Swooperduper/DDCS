/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// setup defaults to satisfy config object
import * as typings from "../typings";

export const engineCache = {
    staticDictionary: [],
    unitDictionary: [],
    weaponsDictionary: [],
    bases: [],
    menuCommands: [],
    config: {} as typings.IServer,
    i18n: {} as any
};

export const OBJECT_CATEGORY: string[] = [
    "VOID",
    "UNIT",
    "WEAPON",
    "STATIC",
    "BASE",
    "SCENERY",
    "Cargo"
];

export const SURFACE_TYPE_CATEGORY: string[] = [
    "LAND",
    "SHALLOW_WATER",
    "WATER",
    "ROAD",
    "RUNWAY"
];

export const WEAPON_CATEGORY: string[] = [
    "SHELL",
    "MISSILE",
    "ROCKET",
    "BOMB"
];

export const GROUP_CATEGORY: string[] = [
    "AIRPLANE",
    "HELICOPTER",
    "GROUND",
    "SHIP",
    "TRAIN"
];

export const UNIT_CATEGORY: string[] = [
    "AIRPLANE",
    "HELICOPTER",
    "GROUND_UNIT",
    "SHIP",
    "STRUCTURE"
];

/* not used, put in server
export const COUNTRY: any = [
    [],
    [
        "RUSSIA",
        "UK",
        "AGGRESSORS",
        "BLANK",
        "INSURGENTS",
        "ABKHAZIA",
        "SOUTH_OSETIA",
        "SWITZERLAND",
        "AUSTRIA",
        "BELARUS",
        "BULGARIA",
        "CHINA",
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
        "ROMANIA",
        "SAUDI_ARABIA",
        "SERBIA",
        "SLOVAKIA",
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
    ],
    [
        "USA",
        "AUSTRALIA",
        "BELGIUM",
        "CANADA",
        "CROATIA",
        "CHEZH_REPUBLIC",
        "DENMARK",
        "FRANCE",
        "GEORGIA",
        "GERMANY",
        "ISRAEL",
        "ITALY",
        "NORWAY",
        "POLAND",
        "SOUTH_KOREA",
        "SPAIN",
        "SWEDEN",
        "THE_NETHERLANDS",
        "TURKEY",
        "UKRAINE"
    ]
];
*/

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
    "BLANK",
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
    "UNITED_ARAB_EMIRATES",
    "SOUTH_AFRICA",
    "CUBA",
    "PORTUGAL",
    "GDR",
    "LEBANON",
    "CJTF_BLUE",
    "CJTF_RED",
    "UN_PEACEKEEPERS"
];

export const defCountrys: number[] = [
    0,
    0,
    2
];

export const defCountriesByName: string[] = [
    "",
    "RUSSIA",
    "USA"
];

export const enemyCountry: number[] = [
    0,
    2,
    1
];

export const enemySide: number[] = [
    0,
    2,
    1
];

export const maxLifePoints: number = getEngineCache().config.startMaxPoints;

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
    "container_cargo",
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

export function setI18n(i18nLocalization: any): void {
    engineCache.i18n = {
        default: i18nLocalization.find((loc: any) => loc._id === "en").definitions,
        en: i18nLocalization.find((loc: any) => loc._id === "en").definitions,
        it: i18nLocalization.find((loc: any) => loc._id === "it").definitions,
        cn: i18nLocalization.find((loc: any) => loc._id === "cn").definitions,
        us: i18nLocalization.find((loc: any) => loc._id === "en").definitions,
        de: i18nLocalization.find((loc: any) => loc._id === "de").definitions,
        ru: i18nLocalization.find((loc: any) => loc._id === "ru").definitions,
        es: i18nLocalization.find((loc: any) => loc._id === "es").definitions,
        cs: i18nLocalization.find((loc: any) => loc._id === "cs").definitions,
        fr: i18nLocalization.find((loc: any) => loc._id === "fr").definitions
        // ko: i18nLocalization.find((loc: any) => loc._id === "ko").definitions,
        // jp: i18nLocalization.find((loc: any) => loc._id === "jp").definitions,
        // pl: i18nLocalization.find((loc: any) => loc._id === "pl").definitions,
    };
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

export function setMenuCommands(menuCommands: any): void {
    engineCache.menuCommands = menuCommands;
}
