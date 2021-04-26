function tprint(tbl, indent)
    if not indent then indent = 0 end
    for k, v in pairs(tbl) do
        formatting = string.rep("  ", indent) .. k .. ": "
        if type(v) == "table" then
            env.info(formatting)
            tprint(v, indent + 1)
        elseif type(v) == 'boolean' then
            env.info(formatting .. tostring(v))
        else
            env.info(formatting .. tostring(v))
        end
    end
end

function TableComp(a,b) --algorithm is O(n log n), due to table growth.
    if #a ~= #b then return false end -- early out
    local t1,t2 = {}, {} -- temp tables
    for k,v in pairs(a) do -- copy all values into keys for constant time lookups
        t1[k] = (t1[k] or 0) + 1 -- make sure we track how many times we see each value.
    end
    for k,v in pairs(b) do
        t2[k] = (t2[k] or 0) + 1
    end
    for k,v in pairs(t1) do -- go over every element
        if v ~= t2[k] then return false end -- if the number of times that element was seen don't match...
    end
    return true
end

env.info("startMissionRuntimeDDCS")

ddcs = {}
laserSpots = {}
IRSpots = {}
local ddcsHost = "localhost"
local ddcsPort = 3001
local missionRuntimeHost = "localhost"
local missionRuntimePort = 3002

local missionStartTime = os.time()
local DATA_TIMEOUT_SEC = 0.1
local SEND_SERVER_INFO_SEC = 1

package.path = package.path .. ";.\\LuaSocket\\?.lua"
package.cpath = package.cpath .. ";.\\LuaSocket\\?.dll"

local socket = require("socket")
local JSON = loadfile("Scripts\\JSON.lua")()

local udpClient = socket.udp()
assert(udpClient:setpeername(socket.dns.toip(ddcsHost),ddcsPort))

local udpMissionRuntime = socket.udp()
assert(udpMissionRuntime:settimeout(0))
assert(udpMissionRuntime:setsockname(socket.dns.toip(missionRuntimeHost), missionRuntimePort))

function sendUDPPacket(payload)
    udpClient:send(JSON:encode(payload))
end

completeNames = {}
tempNames = {}
objCache = {}
checkDead = {}

function generateInitialUnitObj(group, unit, isActive, curName, coalition, lon, lat, alt, unitPosition, playername, ammo)
    local curUnit = {
        ["uType"] = "unit",
        ["data"] = {
            ["groupName"] = group:getName(),
            ["name"] = curName,
            ["isActive"] = isActive,
            ["unitPosition"] = unitPosition,
            ["unitXYZNorthCorr"] = coord.LLtoLO(lat + 1, lon),
            ["lonLatLoc"] = {
                lon,
                lat
            },
            ["alt"] = alt,
            ["unitCategory"] = unit:getDesc().category,
            ["groupCategory"] = group:getCategory(),
            ["objectCategory"] = unit:getCategory(),
            ["country"] = unit:getCountry(),
            ["coalition"] = coalition,
            ["type"] = unit:getTypeName(),
            ["playername"] = playername,
            ["ammo"] = ammo,
            ["groupId"] = group:getID(),
            ["unitId"] = unit:getID()
        }
    }

    if isActive then
        curUnit.data.agl = unitPosition.p.y - land.getHeight({x=unitPosition.p.x, y = unitPosition.p.z})
        curUnit.data.surfType = land.getSurfaceType(unitPosition.p)
        curUnit.data.inAir = unit:inAir()
        curUnit.data.velocity = unit:getVelocity()
        curUnit.data.coalition = coalition
    end
    return curUnit
end
function generateInitialStaticsObj(static, curStaticName, coalition, lon, lat, alt, staticPosition, country)
    local curStatic = {
        ["uType"] = "static",
        ["data"] = {
            ["isActive"] = true,
            ["name"] = curStaticName,
            ["lonLatLoc"] = {
                lon,
                lat
            },
            ["alt"] = alt,
            ["unitPosition"] = staticPosition,
            ["unitXYZNorthCorr"] = coord.LLtoLO(lat + 1, lon),
            ["unitCategory"] = static:getDesc().category,
            ["objectCategory"] = static:getCategory(),
            ["type"] = static:getTypeName(),
            ["coalition"] = coalition,
            ["country"] = country
        }
    }
    return curStatic
end

function addGroups(groups, coalition)
    for groupIndex = 1, #groups do
        local group = groups[groupIndex]
        local units = group:getUnits()
        for unitIndex = 1, #units do
            local unit = units[unitIndex]
            local curUnitName = unit:getName()
            if curUnitName ~= nil then
                local unitPosition = unit:getPosition()
                local lat, lon, alt = coord.LOtoLL(unitPosition.p)
                table.insert(tempNames, curUnitName)

                local playername = unit:getPlayerName()
                local ammo = {}
                if playername ~= nil and playername ~= "" then
                    local curFullAmmo = unit:getAmmo()
                    if curFullAmmo ~= nil then
                        for ammoIndex = 1, #curFullAmmo do
                            table.insert(ammo, {
                                ["typeName"] = curFullAmmo[ammoIndex].desc.typeName,
                                ["count"] = curFullAmmo[ammoIndex].count
                            })
                        end
                    end
                else
                    playername = ""
                end

                --if Unit.isActive(unit) or unit:getTypeName() == "Locomotive" then
                if Unit.isActive(unit) then
                    --env.info("ISACTIVE " .. curUnitName)
                    if objCache[curUnitName] ~= nil then
                        if objCache[curUnitName].lat ~= lat or objCache[curUnitName].lon ~= lon or objCache[curUnitName].playername ~= playername or objCache[curUnitName].isActive ~= true or not TableComp(objCache[curUnitName].ammo, ammo) then
                            objCache[curUnitName] = {
                                ["lat"] = lat,
                                ["lon"] = lon,
                                ["isActive"] = true,
                                ["playername"] = playername,
                                ["ammo"] = ammo
                            }
                            local curUnitObj = generateInitialUnitObj(group, unit, true, curUnitName, coalition, lon, lat, alt, unitPosition, playername, ammo)
                            curUnitObj.action = "U"
                            sendUDPPacket(curUnitObj)
                        end
                    else
                        objCache[curUnitName] = {
                            ["lat"] = lat,
                            ["lon"] = lon,
                            ["isActive"] = true,
                            ["playername"] = playername,
                            ["ammo"] = ammo
                        }
                        local curUnitObj = generateInitialUnitObj(group, unit, true, curUnitName, coalition, lon, lat, alt, unitPosition, playername, ammo)
                        curUnitObj.action = "C"
                        sendUDPPacket(curUnitObj)
                    end
                else
                    --env.info("NOTACTIVE " .. curUnitName)
                    if objCache[curUnitName] == nil or objCache[curUnitName].isActive ~= false then
                        objCache[curUnitName] = {
                            ["lat"] = lat,
                            ["lon"] = lon,
                            ["isActive"] = false,
                            ["playername"] = playername,
                            ["ammo"] = ammo
                        }
                        local curUnitObj = generateInitialUnitObj(group, unit, false, curUnitName, coalition, lon, lat, alt, unitPosition, playername, ammo)
                        curUnitObj.action = "C"
                        sendUDPPacket(curUnitObj)
                    end
                end
                checkDead[curUnitName] = 1
            end
        end
    end
end
function addStatics(statics, coalition)
    for staticIndex = 1, #statics do
        local static = statics[staticIndex]
        local curStaticName = static:getName()
        if curStaticName ~= nil then
            local staticPosition = static:getPosition()
            local lat, lon, alt = coord.LOtoLL(staticPosition.p)
            local country = static:getCountry()
            table.insert(tempNames, curStaticName)

            if objCache[curStaticName] ~= nil then
                if objCache[curStaticName].lat ~= lat or objCache[curStaticName].lon ~= lon or objCache[curStaticName].coalition ~= coalition or objCache[curStaticName].country ~= country then
                    local curStaticObj = generateInitialStaticsObj(static, curStaticName, coalition, lon, lat, alt, staticPosition, country)
                    objCache[curStaticName] = {
                        ["lat"] = lat,
                        ["lon"] = lon,
                        ["coalition"] = coalition,
                        ["country"] = country
                    }
                    curStaticObj.action = "U"
                    sendUDPPacket(curStaticObj)
                end
            else
                local curStaticObj = generateInitialStaticsObj(static, curStaticName, coalition, lon, lat, alt, staticPosition, country)
                objCache[curStaticName] = {
                    ["lat"] = lat,
                    ["lon"] = lon,
                    ["coalition"] = coalition,
                    ["country"] = country
                }
                curStaticObj.action = "C"
                sendUDPPacket(curStaticObj)
            end
            checkDead[curStaticName] = 1
        end
    end
end

function updateObjs(ourArgument, time)
    checkDead = {}
    tempNames = {}

    local redGroups = coalition.getGroups(1)
    if redGroups ~= nil then
        addGroups(redGroups, 1)
    end
    local blueGroups = coalition.getGroups(2)
    if blueGroups ~= nil then
        addGroups(blueGroups, 2)
    end
    local redStatics = coalition.getStaticObjects(1)
    if redStatics ~= nil then
        addStatics(redStatics, 1)
    end
    local blueStatics = coalition.getStaticObjects(2)
    if blueStatics ~= nil then
        addStatics(blueStatics, 2)
    end

    completeNames = tempNames
    --check dead, send delete action to server if dead detected
    for k, v in pairs(objCache) do
        if checkDead[k] == nil then
            local curUnit = {
                action = "D",
                uType = "unit",
                data = {
                    name = k
                }
            }
            sendUDPPacket(curUnit)
            objCache[k] = nil
        end
    end

    return time + DATA_TIMEOUT_SEC
end

function updateObjsByName(unitNames, objType)
    for k, v in pairs(unitNames) do
        local curObj
        if objType == "unit" then
            curObj = Unit.getByName(v)
        end
        if objType == "static" then
            curObj = StaticObject.getByName(v)
        end
        if curObj ~= nil then
            -- removing from unit cache makes the server think its a new unit, forcing reSync
            objCache[v] = nil
        else
            -- if dead, add unit back to uniCache, it will send dead packet when it detects unit not exist
            objCache[v] = "deadUnit"
        end
    end
end

function sendRequest(outObj)
    if outObj.action ~= nil then
        sendUDPPacket(outObj)
    end
end
function commandExecute(s)
    return loadstring("return " ..s)()
end

function hasRemainingAmmo(group)
    local units = group:getUnits()
    for unitIndex = 1, #units do
        local unit = units[unitIndex]
        local curFullAmmo = unit:getAmmo()
        if curFullAmmo ~= nil then
            for ammoIndex = 1, #curFullAmmo do
                if curFullAmmo[ammoIndex].count > 0 then
                    return true
                end
            end
        end
    end
    return false
end

function runRequest(request)
    if request.action ~= nil and request.reqID ~= nil then

        local outObj = {
            ["action"] = "processReq",
            ["reqId"] = request.reqID
        }

        if request.action == "groupAIControl" then
            if request.aiCommand == "groupGoLive" then
                local taskGroup = Group.getByName(request.groupName)
                if taskGroup ~= nil then
                    local  cont = taskGroup:getController()
                    if cont ~= nil then
                        cont:setOnOff(true)
                        cont:setOption(AI.Option.Ground.id.ALARM_STATE, AI.Option.Ground.val.ALARM_STATE.RED)
                        cont:setOption(AI.Option.Air.id.ROE, AI.Option.Air.val.ROE.WEAPON_FREE)
                    end
                end
            end
            if request.aiCommand == "groupGoDark" then
                local taskGroup = Group.getByName(request.groupName)
                if taskGroup ~= nil then
                    local  cont = taskGroup:getController()
                    if cont ~= nil then
                        if request.isEWR or hasRemainingAmmo(taskGroup) then
                            cont:setOnOff(false)
                        else
                            cont:setOption(AI.Option.Ground.id.ALARM_STATE, AI.Option.Ground.val.ALARM_STATE.GREEN)
                            cont:setOption(AI.Option.Air.id.ROE, AI.Option.Air.val.ROE.WEAPON_HOLD)
                        end
                    end
                end
            end
        end

        if request.action == "addTask" then
            local taskGroup = Group.getByName(request.groupName)
            if taskGroup ~= nil then
                local taskController = taskGroup:getController()
                if request.mission ~= nil then
                    if request.verbose ~= nil then
                        env.info("curMissionNotTable: "..request.mission)
                    end
                    local curMission = JSON:decode(request.mission)
                    if type(curMission) == 'table' then
                        if taskController ~= nil then
                            for nIndex = 1, #curMission.params.route.points do
                                if curMission.params.route.points[nIndex].lat ~= nil and curMission.params.route.points[nIndex].lon ~= nil then
                                    curMission.params.route.points[nIndex].x = coord.LLtoLO(curMission.params.route.points[nIndex].lat, curMission.params.route.points[nIndex].lon).x
                                    curMission.params.route.points[nIndex].y = coord.LLtoLO(curMission.params.route.points[nIndex].lat, curMission.params.route.points[nIndex].lon).z
                                end
                            end
                            if request.verbose ~= null then
                                tprint(curMission, 1)
                            end
                            taskController:setTask(curMission)
                        end
                    else
                        env.info("curMissionNotTable: "..request.mission)
                    end
                end
            end
        end

        if request.action == "getGroundRoute" then
            if request.lat1 ~= nil and request.lon1 ~= nil and request.lat2 ~= nil and request.lon2 ~= nil and request.type ~= nil then
                local curStart = coord.LLtoLO(request.lat1, request.lon1)
                local curEnd = coord.LLtoLO(request.lat2, request.lon2)

                local x1, y1 = land.getClosestPointOnRoads(request.type, curStart.x, curStart.z)
                local x2, y2 = land.getClosestPointOnRoads(request.type, curEnd.x, curEnd.z)
                if request.verbose ~= null then
                    env.info("getRoute: "..request.type.." "..x1.." "..y1.." "..x2.." "..y2)
                end
                if request.reqID > 0 then
                    outObj.returnObj ={
                        {["x"] = x1, ["y"] = y1},
                        {["x"] = x2, ["y"] = y2}
                    }
                    sendUDPPacket(outObj)
                end
            end
        end

        if request.action == "getNames" then
            outObj.returnObj = completeNames
            sendUDPPacket(outObj)
        end

        if request.action == "reSyncInfo" then
            updateObjsByName(request.missingNames, request.objType)
        end

        if request.action == "CMD" then
            if type(request.cmd) == 'table' then
                cmdResponses = {}
                for rIndex = 1, #request.cmd do
                    if request.verbose ~= null then
                        env.info("cmd: ".. request.cmd[rIndex])
                    end
                    local success, retVal = pcall(commandExecute, request.cmd[rIndex])
                    if not success then
                        env.info("Error: " .. retVal)
                    end
                    table.insert(cmdResponses, retVal)
                end
                if request.reqID > 0 then
                    outObj.returnObj = cmdResponses
                    sendUDPPacket(outObj)
                end
            end
        end

        if request.action == "processLOS" then
            if request.jtacUnitName ~= nil then
                local jtacUnit = Unit.getByName(request.jtacUnitName)
                if jtacUnit ~= nil then
                    local jtacPOS = jtacUnit:getPoint()
                    local visableUnits = {}
                    if type(request.enemyUnitNames) == 'table' then
                        for nIndex = 1, #request.enemyUnitNames do
                            local curUnit = Unit.getByName(request.enemyUnitNames[nIndex])
                            if curUnit ~= nil then
                                local enemyPOS = curUnit:getPoint()
                                local offsetEnemyPos = { x = enemyPOS.x, y = enemyPOS.y + 2.0, z = enemyPOS.z }
                                local offsetJTACPos = { x = jtacPOS.x, y = jtacPOS.y + 2.0, z = jtacPOS.z }
                                if land.isVisible(offsetEnemyPos, offsetJTACPos) then
                                    table.insert(visableUnits, request.enemyUnitNames[nIndex])
                                end
                            end
                        end
                        if request.reqID > 0 then
                            outObj.jtacUnit = request.jtacUnitName
                            outObj.returnObj = visableUnits
                            sendUDPPacket(outObj)
                        end
                    end
                end
            end
        end

        if request.action == "setSmoke" then
            local curEnemyUnit = Unit.getByName(request.enemyUnitName)
            if curEnemyUnit ~= nil then
                local _enemyVector = curEnemyUnit:getPoint()
                local _enemyVectorUpdated = { x = _enemyVector.x, y = _enemyVector.y + 2.0, z = _enemyVector.z }

                if request.coalition == 1 then
                    trigger.action.smoke(_enemyVectorUpdated, 4 )
                end
                if request.coalition == 2 then
                    trigger.action.smoke(_enemyVectorUpdated, 1 )
                end
            end
        end

        if request.action == "setLaserSmoke" then
            local curJtacUnit = Unit.getByName(request.jtacUnitName)
            local curEnemyUnit = Unit.getByName(request.enemyUnitName)

            if curJtacUnit ~= nil and curEnemyUnit ~= nil then
                local _enemyVector = curEnemyUnit:getPoint()
                local _enemyVectorUpdated = { x = _enemyVector.x, y = _enemyVector.y + 2.0, z = _enemyVector.z }
                local _oldLase = laserSpots[curJtacUnit]
                --local _oldIR = IRSpots[curJtacUnit]

                if _oldLase == nil then
                    local _status, _result = pcall(function()
                        return Spot.createLaser(curJtacUnit, { x = 0, y = 2.0, z = 0 }, _enemyVectorUpdated, request.laserCode)
                    end)
                    if not _status then
                        env.error('ERROR: ' .. _result, false)
                    else
                        if _result then
                            laserSpots[curJtacUnit] = _result
                        end
                    end
                else
                    _oldLase:setPoint(_enemyVectorUpdated)
                end

                --if _oldIR == nil then
                --    local _status, _result = pcall(function()
                --        return Spot.createInfraRed(curJtacUnit, { x = 0, y = 2.0, z = 0 }, _enemyVectorUpdated)
                --    end)
                --    if not _status then
                --        env.error('ERROR: ' .. _result, false)
                --    else
                --        if _result then
                --            IRSpots[curJtacUnit] = _result
                --        end
                --    end
                --else
                --    _oldIR:setPoint(_enemyVectorUpdated)
                --end

                local elat, elon, ealt = coord.LOtoLL(_enemyVectorUpdated)
                local MGRS = coord.LLtoMGRS(coord.LOtoLL(_enemyVectorUpdated))
                local enemyType = curEnemyUnit:getTypeName()
                --local mesg = "JTAC Has Placed Smoke And Is Now Lasing a "..enemyType.." on "..request.laserCode.." Lat:"..elat.." Lon:"..elon.." MGRS:"..MGRS.UTMZone..MGRS.MGRSDigraph.." "..MGRS.Easting.." "..MGRS.Northing
                --trigger.action.outTextForCoalition(request.coalition, mesg, 15)
                if request.coalition == 1 then
                    trigger.action.smoke(_enemyVectorUpdated, 4 )
                end
                if request.coalition == 2 then
                    trigger.action.smoke(_enemyVectorUpdated, 1 )
                end
                if request.reqID > 0 then
                    outObj.jtacUnit = request.jtacUnitName
                    outObj.returnObj = {
                        mgrs = MGRS,
                        lonLat = {
                            lon = elon,
                            lat = elat
                        },
                        alt = ealt,
                        type = enemyType,
                        laserCode = request.laserCode
                    }
                    sendUDPPacket(outObj)
                end
            end
        end

        if request.action == "removeLaserIR" then
            local _tempLase = laserSpots[request.jtacUnitName]
            if _tempLase ~= nil then
                Spot.destroy(_tempLase)
                laserSpots[request.jtacUnitName] = nil
                _tempLase = nil
            end

            local _tempIR = IRSpots[request.jtacUnitName]
            if _tempIR ~= nil then
                Spot.destroy(_tempIR)
            	IRSpots[request.jtacUnitName] = nil
            	_tempIR = nil
            end
        end

        if request.action == "processGCIDetectionByName" then
            local detectedUnitNames = {}
            if type(request.ewrNames) == 'table' then
                for nIndex = 1, #request.ewrNames do
                    local curUnit = Unit.getByName(request.ewrNames[nIndex])
                    if curUnit ~= nil then
                        local ewrController = curUnit:getGroup():getController()
                        local detectedTargets = ewrController:getDetectedTargets(Controller.Detection.RADAR)
                        for k,v in pairs (detectedTargets) do
                            if v["object"] ~= nil then
                                if v["object"]:getCategory() == Object.Category.UNIT then
                                    table.insert(detectedUnitNames, v["object"]:getName())
                                end
                            end
                        end
                    end
                end
                if request.reqID > 0 then
                    outObj.detectedUnitNames = detectedUnitNames
                    sendUDPPacket(outObj)
                end
            end
        end

        if request.action == "destroyObj" then
            if request.type == "static" then
                if request.verbose ~= null then
                    env.info("staticDel: ".. request.unitName.." "..request.type)
                end
                delObj = StaticObject.getByName(request.unitName)
            else
                if request.verbose ~= null then
                    env.info("unitDel: ".. request.unitName.." "..request.type)
                end
                delObj = Unit.getByName(request.unitName)
            end
            if delObj ~= nil then
                delObj:destroy()
            end
        end
    end
end
function runPerFrame(ourArgument, time)
    local request = udpMissionRuntime:receive()
    if request ~= nil then
        if request.verbose ~= null then
            env.info(request)
        end
        requestObj = JSON:decode(request)
        if requestObj.actionObj ~= nil then
            runRequest(requestObj.actionObj)
        end
    end
    return time + DATA_TIMEOUT_SEC
end
function sendServerInfo(ourArgument, time)
    sendUDPPacket({
        ["action"] = "serverInfo",
        ["serverCount"] = table.getn(completeNames),
        ["startAbsTime"] = timer.getTime0(),
        ["curAbsTime"] = timer.getAbsTime(),
        ["epoc"] = missionStartTime * 1000
    })
    return time + SEND_SERVER_INFO_SEC
end

timer.scheduleFunction(sendServerInfo, {}, timer.getTime() + SEND_SERVER_INFO_SEC)
timer.scheduleFunction(runPerFrame, {}, timer.getTime() + DATA_TIMEOUT_SEC)
timer.scheduleFunction(updateObjs, {}, timer.getTime() + DATA_TIMEOUT_SEC)

--Send Mission Events Back
eventTypes = {
    --[0] = "S_EVENT_INVALID",
    [1] = "S_EVENT_SHOT",
    [2] = "S_EVENT_HIT",
    [3] = "S_EVENT_TAKEOFF",
    [4] = "S_EVENT_LAND",
    [5] = "S_EVENT_CRASH",
    [6] = "S_EVENT_EJECTION",
    [7] = "S_EVENT_REFUELING",
    [8] = "S_EVENT_DEAD",
    [9] = "S_EVENT_PILOT_DEAD",
    [10] = "S_EVENT_BASE_CAPTURED",
    [11] = "S_EVENT_MISSION_START",
    [12] = "S_EVENT_MISSION_END",
    [13] = "S_EVENT_TOOK_CONTROL",
    [14] = "S_EVENT_REFUELING_STOP",
    [15] = "S_EVENT_BIRTH",
    [16] = "S_EVENT_HUMAN_FAILURE",
    [17] = "S_EVENT_DETAILED_FAILURE",
    [18] = "S_EVENT_ENGINE_STARTUP",
    [19] = "S_EVENT_ENGINE_SHUTDOWN",
    [20] = "S_EVENT_PLAYER_ENTER_UNIT",
    [21] = "S_EVENT_PLAYER_LEAVE_UNIT",
    [22] = "S_EVENT_PLAYER_COMMENT",
    [23] = "S_EVENT_SHOOTING_START",
    [24] = "S_EVENT_SHOOTING_END",
    [25] = "S_EVENT_MARK_ADDED",
    [26] = "S_EVENT_MARK_CHANGE",
    [27] = "S_EVENT_MARK_REMOVED",
    [28] = "S_EVENT_KILL",
    [29] = "S_EVENT_SCORE",
    [30] = "S_EVENT_UNIT_LOST",
    [31] = "S_EVENT_LANDING_AFTER_EJECTION",
    -- Redacted for now.
    [33] = "S_EVENT_MAX"
}
birthTypes = {
    "wsBirthPlace_Air",
    "wsBirthPlace_RunWay",
    "wsBirthPlace_Park",
    "wsBirthPlace_Heliport_Hot",
    "wsBirthPlace_Heliport_Cold"
}

weaponCategory = {
    "SHELL",
    "MISSILE",
    "ROCKET",
    "BOMB"
}

clientEventHandler = {}
function clientEventHandler:onEvent(_event)
    local status, err = pcall(function(_event)
        if _event == nil or eventTypes[_event.id] == nil then
            return false
        else
            local curEvent = {

            }
            if _event.id ~= nil then
                curEvent.name = eventTypes[_event.id]
                curEvent.id = _event.id
            end
            if _event.idx ~= nil then
                curEvent.idx = _event.idx
            end
            if _event.time ~= nil then
                curEvent.time = _event.time
            end
            if _event.initiator ~= nil then
                local getIId = _event.initiator:getID()
                if getIId ~= nil then
                    curEvent.initiatorId = tonumber(getIId)
                    curEvent.initiator = {
                        ["type"] = _event.initiator:getTypeName(),
                        ["category"] = tonumber(_event.initiator:getCategory()),
                        ["side"] = tonumber(_event.initiator:getCoalition()),
                        ["unitId"] = tonumber(getIId)
                    }
                    -- if object is not a static(3) or container(6) grab its group
                    if curEvent.initiator.category ~= 3 and curEvent.initiator.category ~= 6 then
                        curEvent.initiator.groupId = tonumber(_event.initiator:getGroup():getID())
                    end
                end
            end
            if _event.target ~= nil then
                local getTId = _event.target:getID()
                if getTId ~= nil then
                    curEvent.targetId = tonumber(getTId)
                    curEvent.target = {
                        ["type"] = _event.target:getTypeName(),
                        ["category"] = tonumber(_event.target:getCategory()),
                        ["side"] = tonumber(_event.target:getCoalition()),
                        ["unitId"] = tonumber(getTId)
                    }
                    -- if object is not a static(3) or container(6) grab its group
                    if curEvent.target.category ~= 3 and curEvent.target.category ~= 6 then
                        curEvent.target.groupId = tonumber(_event.target:getGroup():getID())
                    end
                else
                    local targetObject = _event.target:getDesc()
                    curEvent.targetId = {
                        ["typeName"] = targetObject.typeName,
                        ["displayName"] = targetObject.displayName,
                        ["category"] = targetObject.category
                    }
                end
            end
            if _event.place ~= nil then
                curEvent.place = _event.place:getName()
            end
            if _event.subPlace ~= nil then
                curEvent.subPlace = birthTypes[_event.subPlace]
            end
            if _event.weapon ~= nil then
                local curWeapon = _event.weapon:getDesc()
                curEvent.weapon = {
                    ["typeName"] = curWeapon.typeName,
                    ["displayName"] = curWeapon.displayName,
                    ["category"] = weaponCategory[curWeapon.category + 1]
                }
                local targetObject = _event.weapon:getTarget()
                if targetObject ~= nil then
                    curEvent.weapon.targetName = targetObject:getName()
                else
                    local weaponPos = _event.weapon:getPosition()
                    if weaponPos ~= nil then
                        local impactPoint = land.getIP(weaponPos.p, weaponPos.x, 100000)
                        if impactPoint ~= nil then
                            local lat, lon, alt = coord.LOtoLL(impactPoint)
                            curEvent.weapon.impactPoint = {
                               ["lon"] = lon,
                               ["lat"] = lat,
                               ["alt"] = alt
                            }
                        end
                    end
                end
            end
            if _event.weapon_name ~= nil then
                curEvent.weapon_name = _event.weapon_name
            end
            if _event.coalition ~= nil then
                curEvent.coalition = _event.coalition
            end
            if _event.groupID ~= nil then
                curEvent.groupID = _event.groupID
            end
            if _event.text ~= nil then
                curEvent.text = _event.text
            end
            if _event.pos ~= nil then
                curEvent.pos = _event.pos
            end
            sendUDPPacket({
                ["action"] = eventTypes[_event.id],
                ["data"] = curEvent,
                ["type"] = "event"
            })
            return true
        end
    end, _event)
    if (not status) then
        env.info("failEvent: ".. err)
    end
end


world.addEventHandler(clientEventHandler)
env.info("missionRuntimeDDCS loaded")
