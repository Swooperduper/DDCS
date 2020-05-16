"use strict";
/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var _ = require("lodash");
var remote_1 = require("./db/remote");
exports.blueCountrys = [
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
exports.countryId = [
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
exports.defCountrys = {
    1: "RUSSIA",
    2: "USA"
};
exports.enemyCountry = [
    0,
    2,
    1
];
exports.maxLifePoints = 18;
exports.redCountrys = [
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
exports.seasons = [
    "Autumn",
    "Spring",
    "Summer",
    "Winter"
];
exports.side = [
    "neutral",
    "red",
    "blue"
];
exports.shortNames = {
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
exports.time = {
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
exports.crateTypes = [
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
exports.getBases = function (serverName) {
    return remote_1.airfieldTable.baseActionsRead(serverName)
        .then(function (curBases) {
        return new Promise(function (resolve) {
            if (curBases.length) {
                resolve(curBases);
            }
            else {
                console.log("Rebuilding Base DB");
                remote_1.cmdQueTable.cmdQueActions("save", serverName, {
                    actionObj: { action: "GETPOLYDEF" },
                    queName: "clientArray"
                })["catch"](function (err) {
                    console.log("erroring line790: ", err);
                });
                resolve("rebuild base DB");
            }
        });
    })["catch"](function (err) {
        console.log("err line110: ", err);
    });
};
exports.getServer = function (serverName) {
    return remote_1.airfieldTable.serverActionsRead({ _id: serverName })
        .then(function (server) {
        return new Promise(function (resolve) {
            resolve(_.first(server));
        });
    })["catch"](function (err) {
        console.log("err line101: ", err);
    });
};
exports.getStaticDictionary = function () {
    return remote_1.staticDictionaryTable.staticDictionaryActionsRead()
        .then(function (staticDic) {
        return new Promise(function (resolve) {
            resolve(staticDic);
        });
    })["catch"](function (err) {
        console.log("err line297: ", err);
    });
};
exports.getUnitDictionary = function (curTimePeriod) {
    return remote_1.unitDictionaryTable.unitDictionaryActions("read", { timePeriod: curTimePeriod })
        .then(function (unitsDic) {
        return new Promise(function (resolve) {
            resolve(unitsDic);
        });
    })["catch"](function (err) {
        console.log("err line310: ", err);
    });
};
exports.getWeaponDictionary = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, remote_1.weaponScoreTable.weaponScoreActionsRead()
                    .then(function (weaponsDic) {
                    return weaponsDic;
                })["catch"](function (err) {
                    console.log("err line310: ", err);
                })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.initServer = function (serverName) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.getServer(serverName)
                    .then(function (server) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        exports.config = server;
                        return [2 /*return*/];
                    });
                }); })];
            case 1:
                _a.sent();
                return [4 /*yield*/, exports.getStaticDictionary()
                        .then(function (staticDict) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            exports.staticDictionary = staticDict;
                            return [2 /*return*/];
                        });
                    }); })];
            case 2:
                _a.sent();
                return [4 /*yield*/, exports.getUnitDictionary(exports.config.timePeriod.modern)
                        .then(function (unitDict) {
                        exports.unitDictionary = unitDict;
                    })];
            case 3:
                _a.sent();
                return [4 /*yield*/, exports.getWeaponDictionary()
                        .then(function (weaponsDict) {
                        exports.weaponsDictionary = weaponsDict;
                    })];
            case 4:
                _a.sent();
                return [4 /*yield*/, exports.getBases(serverName)
                        .then(function (curBases) {
                        exports.bases = curBases;
                    })];
            case 5:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
