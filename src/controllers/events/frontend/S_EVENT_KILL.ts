/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function processEventKill(eventObj: any): Promise<void> {
    const nowTime = new Date().getTime();
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
    let curInitiator: any = {};
    let curTarget: any = {};

    if (eventObj && eventObj.data) {
        if (eventObj.data.initiator && eventObj.data.initiator.unitId) {
            const iUnitId = eventObj.data.initiator.unitId;
            const iUnit = await ddcsControllers.unitActionRead({unitId: iUnitId});
            curInitiator = {
                unit: iUnit[0],
                player: _.find(playerArray, {name: iUnit[0].playername}),
                playerOwner: _.find(playerArray, {_id: iUnit[0].playerOwnerId}),
                isGroundTarget: (ddcsControllers.UNIT_CATEGORY[iUnit[0].unitCategory] === "GROUND_UNIT")
            };
        }

        if (eventObj.data.target && eventObj.data.target.unitId) {
            const tUnitId = eventObj.data.target.unitId;
            const tUnit = await ddcsControllers.unitActionRead({unitId: tUnitId});
            curTarget = {
                unit: tUnit[0],
                player: _.find(playerArray, {name: tUnit[0].playername}),
                playerOwner: _.find(playerArray, {_id: tUnit[0].playerOwnerId}),
                isGroundTarget: (ddcsControllers.UNIT_CATEGORY[tUnit[0].unitCategory] === "GROUND_UNIT")
            };
        }

        let initMesg: string = "";
        if (curInitiator.unit) {
            if (curInitiator.playerOwner) {
                initMesg += eventObj.data.initiator.type + "(" + curInitiator.playerOwner.name + ")";
            } else if (curInitiator.player) {
                initMesg += eventObj.data.initiator.type + "(" + curInitiator.player.name + ")";
            } else {
                initMesg += eventObj.data.initiator.type;
            }
        } else {
            initMesg += "Something";
        }

        let targetMesg: string = "";
        if (curTarget.unit) {
            if (curTarget.playerOwner) {
                targetMesg += eventObj.data.target.type + "(" + curTarget.playerOwner.name + ")";
            } else if (curTarget.player) {
                targetMesg += eventObj.data.target.type + "(" + curTarget.player.name + ")";
            } else {
                targetMesg += eventObj.data.target.type;
            }
        } else {
            targetMesg += "Something";
        }

        let weaponMesg: string = "";
        if (eventObj.data.weapon) {
            weaponMesg += eventObj.data.weapon.displayName;
        } else if (eventObj.data.weapon_name && eventObj.data.weapon_name !== "") {
            weaponMesg += eventObj.data.weapon_name;
        }

        await ddcsControllers.sendMesgToAll(
            "HASKILLED",
            [
                "#" + eventObj.data.initiator.side,
                initMesg,
                "#" + eventObj.data.target.side,
                targetMesg,
                weaponMesg
            ],
            20,
            nowTime + ddcsControllers.time.oneMin
        );
    }
}

/*
    INC2:  { action: 'S_EVENT_KILL',
  data:
   { id: 28,
     initiator:
      { category: 1,
        groupId: 4700,
        side: 1,
        type: 'Su-25T',
        unitId: 10022 },
     initiatorId: 10022,
     name: 'S_EVENT_KILL',
     target: { category: 3, side: 2, type: 'Shelter', unitId: 1000092 },
     targetId: 1000092,
     time: 47686.898,
     weapon: { category: 'SHELL', displayName: 'su-25T', typeName: 'Su-25T' },
     weapon_name: 'Su-25T' },
  type: 'event' }

    Event Kill:  { action: 'S_EVENT_KILL',
  data:
   { id: 28,
     initiator:
      { category: 1,
        groupId: 6564,
        side: 1,
        type: 'Ka-50',
        unitId: 11886 },
     initiatorId: 11886,
     name: 'S_EVENT_KILL',
     target:
      { category: 1,
        groupId: 1001052,
        side: 2,
        type: 'Hawk ln',
        unitId: 1001060 },
     targetId: 1001060,
     time: 52935.23,
     weapon_name: 'Vikhr_M' },
  type: 'event' }

  Event Kill:  { action: 'S_EVENT_KILL',
  data:
   { id: 28,
     name: 'S_EVENT_KILL',
     target:
      { category: 1,
        groupId: 4704,
        side: 1,
        type: 'Su-25T',
        unitId: 10026 },
     targetId: 10026,
     time: 46565.944,
     weapon_name: '' },
  type: 'event' }
     */
