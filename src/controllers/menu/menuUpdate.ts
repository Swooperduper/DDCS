/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";

const checkMenuLevels = 2;
const startLightCrateWeight = 500;
const startHeavyCrateWeight = 4900;

export async function spawnNewMenuCategory(
    playerUnit: any,
    curMenuLvls: any,
    curMenuName: string,
    menuLevel: number,
    massType?: string,
    startingWeight?: number
): Promise<number> {
    const massTypeString = (massType) ? " " + massType : "";
    let curWeight = _.cloneDeep(startingWeight);
    // start with clean slate
    const menuSpawnArray: string[] = [];
    const curMenu = curMenuLvls[curMenuName];
    // draw menu
    if ( menuLevel === 0 ) {
        menuSpawnArray.push(`missionCommands.removeItemForGroup(${playerUnit.groupId},{"${curMenuName + massTypeString}"})`);
        menuSpawnArray.push(`missionCommands.addSubMenuForGroup(${playerUnit.groupId},"${curMenuName + massTypeString}")`);
    } else {
        menuSpawnArray.push(`missionCommands.removeItemForGroup(${playerUnit.groupId},{"${curMenuName}"})`);
        menuSpawnArray.push(`missionCommands.addSubMenuForGroup(${playerUnit.groupId}, "${curMenuName}",{"${curMenu[0].menuPath[menuLevel - 1] + massTypeString}"})`);
    }

    // without this, the menu draws itself 2x
    if (menuLevel !== 0 || !curMenuLvls[curMenuName][0].cmdProp.mass) {
        // draw subPayload items
        for (const curSubMenu of curMenu) {
            let curUnitDictionary = ddcsControllers.getEngineCache().unitDictionary.filter(
                (unit: any) => unit.type === curSubMenu.cmdProp.type
            );
            let spawnAmount = 1;
            if (curUnitDictionary.length === 1) {
                spawnAmount = curUnitDictionary[0].config[ddcsControllers.getEngineCache().config.timePeriod].spawnCount;
            } else {
                curUnitDictionary = ddcsControllers.getEngineCache().unitDictionary.filter(
                    (unit: any) => {
                        return _.includes(unit.comboName, curSubMenu.cmdProp.type);
                    }
                );
                if (curUnitDictionary.length > 1) {

                    const launcher = curUnitDictionary.find((rec: any) => rec.launcher);
                    spawnAmount = launcher.config[ddcsControllers.getEngineCache().config.timePeriod].spawnCount;
                }
            }

            let cmdProps = `{["action"]="f10Menu",`;
            for (const [keyProp, valueProp] of Object.entries(curSubMenu.cmdProp)) {
                if (keyProp === "mass" && curWeight) {
                    cmdProps += `["${keyProp}"]=${curWeight},`;
                    curWeight++;
                } else {
                    cmdProps += `["${keyProp}"]=${(typeof valueProp === "number") ? valueProp : '"' + valueProp + '"'},`;
                }
            }
            cmdProps += `["unitId"]=${playerUnit.unitId}}`;
            const curMenuArray = _.cloneDeep(curSubMenu.menuPath);
            if (curSubMenu.cmdProp.mass) {
                curMenuArray[0] += massTypeString;
            }
            const curCrates = (curSubMenu.cmdProp.crates) ? "(" + spawnAmount + "Q-" + curSubMenu.cmdProp.crates + "C)" : "";

            // tslint:disable-next-line:max-line-length
            menuSpawnArray.push(`missionCommands.addCommandForGroup(${playerUnit.groupId},"${curSubMenu.itemTitle}${curCrates}",{"${curMenuArray.join('","')}"},sendRequest,${cmdProps})`);
        }
    }
    // console.log("drawnMenu: ", menuSpawnArray);
    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "CMD",
            cmd: menuSpawnArray,
            reqID: 0
        }
    });
    return curWeight || 0;
}

export async function initializeMenu(playerUnit: any): Promise<void> {
    let lightCrateWeight = _.cloneDeep(startLightCrateWeight);
    let heavyCrateWeight = _.cloneDeep(startHeavyCrateWeight);

    const curMenuCommands = ddcsControllers.getEngineCache().menuCommands.filter((menuCommand: typings.IMenuCommand) => {
        return (menuCommand.allowedUnitTypes.length === 0 || _.includes(menuCommand.allowedUnitTypes, playerUnit.type)) &&
            (menuCommand.side === 0 || menuCommand.side === playerUnit.coalition);
    });
    // build master menu levels, every first lvl, clear menu line out
    for (let i = 0; i < checkMenuLevels; i++) {
        const curMenuLvls = _.groupBy(curMenuCommands, (gb: any) => gb.menuPath[i]);
        for (const curMenuName of Object.keys(curMenuLvls)) {
            if ( curMenuName !== "undefined" ) {
                if (curMenuLvls[curMenuName][0].cmdProp.mass) {
                    // dirty fix for light crate menu, drex to revisit ~Kirkwood
                    if (playerUnit.type === "UH-1H") {
                        lightCrateWeight = await spawnNewMenuCategory(playerUnit, curMenuLvls, curMenuName, i, "Light", lightCrateWeight);
                    } else {
                        heavyCrateWeight = await spawnNewMenuCategory(playerUnit, curMenuLvls, curMenuName, i, "Heavy", heavyCrateWeight);
                    }
                } else {
                    await spawnNewMenuCategory(playerUnit, curMenuLvls, curMenuName, i);
                }
            }
        }
    }
}
