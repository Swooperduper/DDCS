/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function processEventKill(eventObj: any): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const nowTime = new Date().getTime();
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
    let curInitiator: any = {};
    let curTarget: any = {};

    if (eventObj && eventObj.data) {
        console.log("eventObj:",eventObj);
        let initSide:Number = 0;
        let targetSide:Number = 0;
        let reward = 1
        if (eventObj.data.initiator && eventObj.data.initiator.unitId) {
            const iUnitId = eventObj.data.initiator.unitId;
            const iUnit = await ddcsControllers.unitActionRead({unitId: iUnitId});
            if (iUnit.length > 0) {
                curInitiator = {
                    unit: iUnit[0],
                    player: (!!iUnit[0].playername) ? _.find(playerArray, {name: iUnit[0].playername}) : undefined,
                    playerOwner: (!!iUnit[0].playerOwnerId) ? _.find(playerArray, {_id: iUnit[0].playerOwnerId}) : undefined,
                    isGroundTarget: (ddcsControllers.UNIT_CATEGORY[iUnit[0].unitCategory] === "GROUND_UNIT")
                };
                initSide = eventObj.data.initiator.side;
                targetSide = eventObj.data.target.side;
                if (ddcsControllers.UNIT_CATEGORY[iUnit[0].unitCategory] === "GROUND_UNIT") {
                    await ddcsControllers.baseUnitUnderAttack(iUnit[0]);
                }
                // console.log("playerOwner: ", !!curInitiator.playerOwner,
                // curInitiator.playerOwner, curInitiator.player, curInitiator.unit);
                console.log("eventObj.data.target.type:",eventObj.data.target.type);
                console.log("eventObj.data.weapon_name:",eventObj.data.weapon_name);
                const killedUnitDict = _.find(engineCache.unitDictionary, {type : eventObj.data.target.type});
                console.log("Test Case 1 - killedUnitDict:",killedUnitDict);
                const killingWeaponDict = _.find(engineCache.weaponsDictionary, {_id : eventObj.data.weapon_name});
                console.log("Test Case 2 - killingWeaponDict:",killingWeaponDict);
                if(killingWeaponDict === undefined){
                    
                }

                if (killedUnitDict){
                    console.log("warbondCost of Killed Unit",killedUnitDict.warbondCost)
                    reward = killedUnitDict.warbondCost
                }
                if (killingWeaponDict){
                    console.log("killing Weapon Multiplier:",killingWeaponDict.warbondKillMultiplier)
                    reward = killedUnitDict.warbondCost * killingWeaponDict.warbondKillMultiplier
                }
                if (targetSide === 0){
                    reward = 0
                }
                console.log("targetSide:",targetSide, " initSide:",initSide)
                if (initSide === targetSide){
                    reward = -Math.abs(reward)
                }
                if (!!curInitiator.playerOwner && !!curInitiator.unit.playerOwnerId) {
                    const playerOwnerUnit = await ddcsControllers.unitActionRead({playername: curInitiator.playerOwner.name});
                    if (playerOwnerUnit.length > 0) {
                        if(curInitiator.player){
                            console.log("curInitiator.player:",curInitiator.player)
                            console.log(iUnit[0])
                            await ddcsControllers.srvPlayerActionsUnitAddToWarbonds({
                                _id: curInitiator.player._id,
                                score: reward,
                                groupId: (iUnit[0].groupId) ? iUnit[0].groupId : undefined,
                                unitType: iUnit[0].type,
                                unitCoalition: iUnit[0].coalition
                            });
                        }else{
                            await ddcsControllers.srvPlayerActionsUnitAddToWarbonds({
                                _id: curInitiator.unit.playerOwnerId,
                                score: reward,
                                groupId: (playerOwnerUnit[0].groupId) ? playerOwnerUnit[0].groupId : undefined,
                                unitType: iUnit[0].type,
                                unitCoalition: iUnit[0].coalition
                            });
                        }
                    }
                }

                if (!!curInitiator.player && !!curInitiator.player._id) {
                    await ddcsControllers.srvPlayerActionsAddTempWarbonds({
                        _id: curInitiator.player._id,
                        groupId: curInitiator.unit.groupId,
                        score: reward
                    });
                }
            }
        }

        if (eventObj.data.target && !!eventObj.data.target.unitId) {
            const tUnitId = eventObj.data.target.unitId;
            const tUnit = await ddcsControllers.unitActionRead({unitId: tUnitId});
            if (tUnit.length > 0) {
                curTarget = {
                    unit: tUnit[0],
                    player: (!!tUnit[0].playername) ? _.find(playerArray, {name: tUnit[0].playername}) : undefined,
                    playerOwner: (!!tUnit[0].playerOwnerId) ? _.find(playerArray, {_id: tUnit[0].playerOwnerId}) : undefined,
                    isGroundTarget: (ddcsControllers.UNIT_CATEGORY[tUnit[0].unitCategory] === "GROUND_UNIT")
                };
                targetSide = eventObj.data.target.side;
            }
        }

        let initMesg: string = "";
        if (!!curInitiator.unit) {
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
        if (!!eventObj.data.weapon) {
            weaponMesg += eventObj.data.weapon.displayName;
        } else if (eventObj.data.weapon_name && eventObj.data.weapon_name !== "") {
            weaponMesg += eventObj.data.weapon_name;
        }
        


        await ddcsControllers.sendMessageToAll(
            initSide +" "+ initMesg + " has killed " + targetSide +" "+ targetMesg + " with " + weaponMesg + "("+ reward+ " Temp Warbonds)\n",
            10,
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
