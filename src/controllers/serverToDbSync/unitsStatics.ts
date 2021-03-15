/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

export async function processUnitUpdates(unitObj: any): Promise<void> {
    if (unitObj.data.name === "~TRAIN-3-1") {
        console.log("unitUp: ", unitObj);
    }
/*
    if (unitObj.data.unitCategory === ddcsControllers.UNIT_CATEGORY("STRUCTURE")) {
        console.log("STRUCT: ", unitObj);
    }
*/
    const unit = await ddcsControllers.unitActionRead({_id: unitObj.data.name});
    let stParse;
    let iCurObj: any;
    const curData = unitObj.data;
    if (_.includes(curData.name, "AI|")) {
        stParse = _.split(curData.name, "|");
        curData.playerOwnerId = stParse[1];
        curData.isAI = true;
        curData.hidden = true;
    }
    if (_.includes(curData.name, "TU|")) {
        stParse = _.split(curData.name, "|");
        curData.playerOwnerId = stParse[1];
        curData.playerCanDrive = false;
        curData.isTroop = true;
        curData.spawnCat = stParse[2];
    }
    if (_.includes(curData.name, "CU|")) {
        stParse = _.split(curData.name, "|");
        curData.playerOwnerId = stParse[1];
        curData.crateAmt = Number(stParse[2]);
        curData.isCombo = stParse[3];
        curData.templateName = stParse[4];
        curData.playerCanDrive = false;
        curData.isCrate = true;
        curData.hidden = false;
    }
    if (_.includes(curData.name, "DU|")) {
        // console.log("spawn: ", unitObj, unit);
        stParse = _.split(curData.name, "|");
        const isAllowedToDrive = (stParse[5] === "true");
        curData.playerOwnerId = stParse[1];
        curData.proxChkGrp = stParse[3];
        curData.playerCanDrive = isAllowedToDrive;
    }

    if (unit.length > 0) {
        const curUnit = unit[0];
        const curUnitName = curUnit.name;
        // console.log("CU: ", curUnit);

        // update location of carrier in aircraft DB
        if (_.includes(curData.name, "Carrier")) {
            // console.log("carrier update location: ", curUnitName, curData.lonLatLoc);
            await ddcsControllers.baseActionUpdate({_id: curUnitName, centerLoc: curData.lonLatLoc, isResync: true});
        }

        /*
        if (curData.playername && unitObj.action === "C") {
            console.log("ADD MENU: ", curData.playername, unitObj.action === "C");
            await ddcsControllers.initializeMenu(unitObj.data);
        }
         */

        if (unitObj.action !== "D") {
            iCurObj = {
                action: "U",
                sessionName: ddcsControllers.getSessionName(),
                data: {
                    _id: curData.name,
                    alt: curData.alt,
                    agl: curData.agl,
                    dead: false,
                    hdg: curData.hdg,
                    groupId: curData.groupId,
                    inAir: curData.inAir,
                    name: curData.name,
                    lonLatLoc: curData.lonLatLoc,
                    playername: curData.playername,
                    speed: curData.speed,
                    unitId: curData.unitId,
                    isCrate: (curData.isCrate || false),
                    isCombo: (curData.isCombo || false),
                    crateAmt: (curData.crateAmt || 0),
                    playerCanDrive: (curData.playerCanDrive || false),
                    hidden: (curData.hidden || false),
                    playerOwnerId: (curData.playerOwnerId || ""),
                    templateName: (curData.templateName || ""),
                    isResync: true
                }
            };
            iCurObj.data.isActive = curData.isActive;

            if (curData.type) {
                iCurObj.data.type = curData.type;
            }
            if (curData.groupName) {
                iCurObj.data.groupName = curData.groupName;
            }
            if (curData.ammo) {
                iCurObj.data.ammo = curData.ammo;
            }
            if (curData.coalition) {
                iCurObj.data.coalition = curData.coalition;
            } else {
                iCurObj.data.coalition = curUnit.coalition;
            }
            if (curData.country) {
                iCurObj.data.country = curData.country;
            }

            await ddcsControllers.unitActionUpdate(iCurObj.data);
            await ddcsControllers.sendToCoalition({payload: {
                    action: "U",
                    data: {
                        _id: iCurObj.data._id,
                        lonLatLoc: iCurObj.data.lonLatLoc,
                        alt: iCurObj.data.alt,
                        agl: iCurObj.data.agl,
                        hdg: iCurObj.data.hdg,
                        speed: iCurObj.data.speed,
                        coalition: iCurObj.data.coalition
                    }
                }});
            if (ddcsControllers.UNIT_CATEGORY[curData.unitCategory] === "STRUCTURE") {
                await ddcsControllers.setUnitMark(curData);
            }
        } else if (unitObj.action === "D") {
            if (curData.name) {
                iCurObj = {
                    action: "D",
                    sessionName: ddcsControllers.getSessionName(),
                    data: {
                        _id: curData.name,
                        name: curData.name,
                        troopType: null,
                        intCargoType: null,
                        virtCrateType: null,
                        dead: true,
                        isResync: true
                    }
                };

                if (curData.coalition) {
                    iCurObj.data.coalition = curData.coalition;
                }

                await ddcsControllers.unitActionUpdate(iCurObj.data);
                iCurObj.data.coalition = iCurObj.data.coalition || curUnit.coalition;
                if (iCurObj.data.coalition) {
                    // console.log('get side: ', _.get(iCurObj, 'data.coalition'));
                    ddcsControllers.sendToCoalition({payload: _.cloneDeep(iCurObj)});
                }
            } else {
                console.log("is not a number: ", curData.unitId, curData);
            }
        }
    } else {
        if (unitObj.action !== "D") {
            if (curData.name) {
                console.log("NAME: ", curData.name, curData);
                curData._id = curData.name;
                curData.isResync = true;
                iCurObj = {
                    action: "C",
                    sessionName: ddcsControllers.getSessionName(),
                    data: curData
                };
                if (ddcsControllers.UNIT_CATEGORY[curData.unitCategory] === "STRUCTURE") {
                    if (_.includes(curData.name, " Shelter")) {
                        curData.proxChkGrp = "logisticTowers";
                    }
                }
                await ddcsControllers.unitActionSave(iCurObj.data);
                await ddcsControllers.sendToCoalition({
                    payload: {
                        action: "C",
                        data: {
                            _id: iCurObj.data._id,
                            lonLatLoc: iCurObj.data.lonLatLoc,
                            alt: iCurObj.data.alt,
                            agl: iCurObj.data.agl,
                            hdg: iCurObj.data.hdg,
                            speed: iCurObj.data.speed,
                            coalition: iCurObj.data.coalition,
                            type: iCurObj.data.type,
                            playername: iCurObj.data.playername,
                            playerOwnerId: iCurObj.data.playerOwnerId,
                            isCrate: (iCurObj.data.isCrate || false),
                            isCombo: (iCurObj.data.isCombo || false),
                            playerCanDrive: (iCurObj.data.playerCanDrive || false),
                            hidden: (iCurObj.data.hidden || false),
                            crateAmt: (iCurObj.data.crateAmt || 0),
                            templateName: (iCurObj.data.templateName || ""),
                            isResync: true
                        }
                    }
                });
                if (ddcsControllers.UNIT_CATEGORY[curData.unitCategory] === "STRUCTURE") {
                    // console.log('SUM: ', curData);
                    await ddcsControllers.setUnitMark(curData);
                }
                if (curData.playername !== "" && curData.groupId) {
                    // Only players can get a menu
                    // console.log("spawning player menu");
                    await ddcsControllers.initializeMenu(curData);
                }
            }
        }
    }
}
