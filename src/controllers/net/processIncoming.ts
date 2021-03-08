import * as ddcsController from "../";

export async function processingIncomingData(incomingObj: any) {
    if (incomingObj.action === "S_EVENT_KILL") {
        // switch scoring to this new kill event
        console.log("INC2: ", incomingObj);
    }
    switch (incomingObj.action) {
        case "serverInfo":
            await ddcsController.getLatestSession(incomingObj);
            break;
        case "C":
            await ddcsController.processUnitUpdates(incomingObj);
            break;
        case "U":
            await ddcsController.processUnitUpdates(incomingObj);
            break;
        case "D":
            await ddcsController.processUnitUpdates(incomingObj);
            break;
        case  "airbaseC":
            await ddcsController.processAirbaseUpdates(incomingObj);
            break;
        case  "airbaseU":
            await ddcsController.processAirbaseUpdates(incomingObj);
            break;
        case "f10Menu":
            await ddcsController.menuCmdProcess(incomingObj);
            break;
        case "S_EVENT_HIT":
            await ddcsController.processEventHit(incomingObj);
            break;
        case "S_EVENT_TAKEOFF":
            await ddcsController.processEventTakeoff(incomingObj);
            break;
        case "S_EVENT_LAND":
            await ddcsController.processEventLand(incomingObj);
            break;
        case "S_EVENT_EJECTION":
            await ddcsController.processEventEjection(incomingObj);
            break;
        case "S_EVENT_CRASH":
            await ddcsController.processEventCrash(incomingObj);
            break;
        case "S_EVENT_DEAD":
            await ddcsController.processEventDead(incomingObj);
            break;
        case "S_EVENT_PILOT_DEAD":
            await ddcsController.processEventPilotDead(incomingObj);
            break;
        case "S_EVENT_REFUELING":
            await ddcsController.processEventRefueling(incomingObj);
            break;
        case "S_EVENT_REFUELING_STOP":
            await ddcsController.processEventRefuelingStop(incomingObj);
            break;
        case "S_EVENT_BIRTH":
            // console.log("player unit birth: ", incomingObj);
            await ddcsController.processEventBirth(incomingObj);
            break;
        case "S_EVENT_PLAYER_ENTER_UNIT":
            // console.log("player enter unit1");
            await ddcsController.processEventPlayerEnterUnit(incomingObj);
            break;
        case "S_EVENT_PLAYER_LEAVE_UNIT":
            // console.log("player EXIT unit1");
            await ddcsController.processEventPlayerLeaveUnit(incomingObj);
            break;
        case "unitsAlive":
            await ddcsController.sendMissingUnits(incomingObj.data);
            break;
        case "playerStats":
            await ddcsController.processPlayerEvent(incomingObj);
            break;
        case "friendly_fire":
            await ddcsController.processFriendlyFire(incomingObj);
            break;
        case "self_kill":
            await ddcsController.processSelfKill(incomingObj);
            break;
        case "connect":
            await ddcsController.processConnect(incomingObj);
            break;
        case "disconnect":
            await ddcsController.processDisconnect(incomingObj);
            break;
        case "change_slot":
            // console.log('CHANGE EVENT SLOT HAPPENED: ', queObj);
            // await ddcsController.processDisconnect(incomingObj);
            break;
        case "processReq":
            const curReqJobObj = ddcsController.getRequestJob(incomingObj.reqId);
            if (curReqJobObj) {
                // @ts-ignore
                await ddcsController[curReqJobObj.callBack](incomingObj, incomingObj.reqId);

                // cleanup request job array
                console.log("req array size before: ", ddcsController.getRequestJobSize());
                ddcsController.cleanRequestJobArray(incomingObj.reqId);
                console.log("req array size after: ", ddcsController.getRequestJobSize());
            } else {
                console.log("Cant find req Id: ", incomingObj.reqId);
            }
            break;
    }
}
