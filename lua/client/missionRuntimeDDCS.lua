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

env.info("startMissionRuntimeDDCS")

ddcs = {}
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

function generateInitialUnitObj(group, unit, isActive, curName, coalition, lon, lat, alt, unitPosition)
    local curUnit = {
        ["uType"] = "unit",
        ["data"] = {
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
            ["objectCategory"] = unit:getCategory(),
            ["country"] = unit:getCountry(),
            ["coalition"] = coalition,
            ["type"] = unit:getTypeName(),
        }
    }

    if isActive then
        curUnit.data.groupId = group:getID()
        curUnit.data.unitId = unit:getID()
        curUnit.data.agl = unitPosition.p.y - land.getHeight({x=unitPosition.p.x, y = unitPosition.p.z})
        curUnit.data.surfType = land.getSurfaceType(unitPosition.p)
        curUnit.data.inAir = unit:inAir()
        curUnit.data.velocity = unit:getVelocity()
        curUnit.data.groupName = group:getName()
        curUnit.data.coalition = coalition

        local PlayerName = unit:getPlayerName()
        if PlayerName ~= nil then
            curUnit.data.playername = PlayerName
            local curFullAmmo = unit:getAmmo()
            if curFullAmmo ~= nil then
                curUnit.data.ammo = {}
                for ammoIndex = 1, #curFullAmmo do
                    table.insert(curUnit.data.ammo, {
                        ["typeName"] = curFullAmmo[ammoIndex].desc.typeName,
                        ["count"] = curFullAmmo[ammoIndex].count
                    })
                end
            end
        else
            curUnit.data.playername = ""
        end
    end
    return curUnit
end
function generateInitialStaticsObj(static, curStaticName, coalition, lon, lat, alt, staticPosition)
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
            ["country"] = static:getCountry()
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
            local unitPosition = unit:getPosition()
            local lat, lon, alt = coord.LOtoLL(unitPosition.p)
            table.insert(tempNames, curUnitName)
            if Unit.isActive(unit) then
                --env.info("ISACTIVE " .. curUnitName)
                if objCache[curUnitName] ~= nil then
                    if objCache[curUnitName].lat ~= lat or objCache[curUnitName].lon ~= lon or objCache[curUnitName].isActive ~= true then
                        objCache[curUnitName] = {
                            ["lat"] = lat,
                            ["lon"] = lon,
                            ["isActive"] = true
                        }
                        local curUnitObj = generateInitialUnitObj(group, unit, true, curUnitName, coalition, lon, lat, alt, unitPosition)
                        curUnitObj.action = "U"
                        sendUDPPacket(curUnitObj)
                    end
                else
                    objCache[curUnitName] = {
                        ["lat"] = lat,
                        ["lon"] = lon,
                        ["isActive"] = true
                    }
                    local curUnitObj = generateInitialUnitObj(group, unit, true, curUnitName, coalition, lon, lat, alt, unitPosition)
                    curUnitObj.action = "C"
                    sendUDPPacket(curUnitObj)
                end
            else
                --env.info("NOTACTIVE " .. curUnitName)
                if objCache[curUnitName] == nil or objCache[curUnitName].isActive ~= false then
                    objCache[curUnitName] = {
                        ["lat"] = lat,
                        ["lon"] = lon,
                        ["isActive"] = false
                    }
                    local curUnitObj = generateInitialUnitObj(group, unit, false, curUnitName, coalition, lon, lat, alt, unitPosition)
                    curUnitObj.action = "C"
                    sendUDPPacket(curUnitObj)
                end
            end
            checkDead[curUnitName] = 1
        end
    end
end
function addStatics(statics, coalition)
    for staticIndex = 1, #statics do
        local static = statics[staticIndex]
        local staticPosition = static:getPosition()
        local lat, lon, alt = coord.LOtoLL(staticPosition.p)
        local curStaticName = static:getName()
        table.insert(tempNames, curStaticName)

        if objCache[curStaticName] ~= nil then
            if objCache[curStaticName].lat ~= lat or objCache[curStaticName].lon ~= lon then
                local curStaticObj = generateInitialStaticsObj(static, curStaticName, coalition, lon, lat, alt, staticPosition)
                objCache[curStaticName] = {
                    ["lat"] = lat,
                    ["lon"] = lon
                }
                curStaticObj.action = "U"
                sendUDPPacket(curStaticObj)
            end
        else
            local curStaticObj = generateInitialStaticsObj(static, curStaticName, coalition, lon, lat, alt, staticPosition)
            objCache[curStaticName] = {
                ["lat"] = lat,
                ["lon"] = lon
            }
            curStaticObj.action = "C"
            sendUDPPacket(curStaticObj)
        end
        checkDead[curStaticName] = 1
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
function runRequest(request)
    if request.action ~= nil and request.reqID ~= nil then

        local outObj = {
            ["action"] = "processReq",
            ["reqId"] = request.reqID
        }

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
        -- env.info(request)
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
        --env.info("EVENT: "..eventTypes[_event.id])
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
