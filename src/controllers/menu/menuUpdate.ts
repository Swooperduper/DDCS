/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";

const checkMenuLevels = 5;

export async function initializeMenu(playerUnit: any): Promise<void> {
    const curMenuCommands = ddcsControllers.getEngineCache().menuCommands.filter((menuCommand: typings.IMenuCommand) => {
        return (menuCommand.allowedUnitTypes.length === 0 || _.includes(menuCommand.allowedUnitTypes, playerUnit.type) &&
            (menuCommand.side === 0 || menuCommand.side === playerUnit.side));
    });

    // build master menu levels, every first lvl, clear menu line out
    for (let i = 0; i < checkMenuLevels; i++) {
        const curMenuLvls = _.groupBy(curMenuCommands, (gb: any) => gb.menuPath[i]);
        for (const curMenuName of Object.keys(curMenuLvls)) {
            if ( curMenuName !== "undefined" ) {
                // start with clean slate
                const menuSpawnArray: string[] = [`missionCommands.removeItemForGroup(${playerUnit.groupId}, {"${curMenuName}"})`];
                const curMenu = curMenuLvls[curMenuName];
                // draw menu
                if ( i === 0 ) {
                    menuSpawnArray.push(`missionCommands.addSubMenuForGroup(${playerUnit.groupId}, "${curMenuName}")`);
                } else {
                    menuSpawnArray.push(
                    `missionCommands.addSubMenuForGroup(${playerUnit.groupId}, "${curMenuName}", {"${curMenu[0].menuPath[i - 1]}"})`);
                }

                // draw subPayload items
                for (const curSubMenu of curMenu) {
                    let cmdProps = `{["action"] = "f10Menu", `;
                    for (const [keyProp, valueProp] of Object.entries(curSubMenu.cmdProp)) {
                        cmdProps += `["${keyProp}"] = ${(typeof valueProp === "number") ? valueProp : '"' + valueProp + '"'}, `;
                    }
                    cmdProps += `["unitId"] = ${playerUnit.unitId}}`;
                    menuSpawnArray.push(
                        `missionCommands.addCommandForGroup(${playerUnit.groupId}, "${curSubMenu.itemTitle}", {"${curSubMenu.menuPath.join('","')}"}, sendRequest, ${cmdProps})`
                    );
                }

                await ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: menuSpawnArray,
                        reqID: 0
                    }
                });
            }
        }
    }
}
