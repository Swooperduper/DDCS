/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

export async function processEventShot(eventObj: any): Promise<void> {
    /*
    EVENT_SHOT:  { action: 'S_EVENT_SHOT',
  data:
   { id: 1,
     initiator:
      { category: 1,
        groupId: 8076,
        side: 2,
        type: 'F-16C_50',
        unitId: 13437 },
     initiatorId: 13437,
     name: 'S_EVENT_SHOT',
     time: 47727.693,
     weapon:
      { category: 'MISSILE',
        displayName: 'AIM-120C',
        targetName: 'Maykop-Khanskaya #130',
        typeName: 'weapons.missiles.AIM_120C' },
     weapon_name: 'AIM_120C' },
  type: 'event' }
     */

    console.log("EVENT_SHOT: ", eventObj);



}
