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
local DATA_TIMEOUT_SEC = 0.1

package.path = package.path .. ";.\\LuaSocket\\?.lua"
package.cpath = package.cpath .. ";.\\LuaSocket\\?.dll"

local socket = require("socket")
local JSON = loadfile("Scripts\\JSON.lua")()

local udpClient = socket.udp()
assert(udpClient:setpeername(socket.dns.toip(ddcsHost),ddcsPort))

local udpMissionRuntime = socket.udp()
assert(udpMissionRuntime:settimeout(0))
assert(udpMissionRuntime:setsockname(socket.dns.toip(missionRuntimeHost), missionRuntimePort))

completeUnitAliveNames = {}
completeStaticAliveNames = {}

-- update groups section
local unitCache = {}
local unitCnt = 0
local checkUnitDead = {}

local function addGroups(groups, coalition)
    for groupIndex = 1, #groups do
        local group = groups[groupIndex]
        local units = group:getUnits()
        for unitIndex = 1, #units do
            local unit = units[unitIndex]
            if Unit.isActive(unit) then
                local unitPosition = unit:getPosition()
                local lat, lon, alt = coord.LOtoLL(unitPosition.p)
                local pos = unit:getPoint()
                local unitXYZNorthCorr = coord.LLtoLO(lat + 1, lon)
                local headingNorthCorr = math.atan2(unitXYZNorthCorr.z - unitPosition.p.z, unitXYZNorthCorr.x - unitPosition.p.x)
                local heading = math.atan2(unitPosition.x.z, unitPosition.x.x) + headingNorthCorr
                local velocity = unit:getVelocity()
                if heading < 0 then
                    heading = heading + 2 * math.pi
                end
                local PlayerName = unit:getPlayerName()
                local curUnit = {
                    ["uType"] = "unit",
                    ["data"] = {
                        ["category"] = unit:getDesc().category,
                        ["groupId"] = group:getID(),
                        ["unitId"] = tonumber(unit:getID()),
                        ["name"] = unit:getName(),
                        ["lonLatLoc"] = {
                            lon,
                            lat
                        },
                        ["alt"] = alt,
                        ["agl"] = pos.y - land.getHeight({x=pos.x, y = pos.z}),
                        ["surfType"] = land.getSurfaceType(pos),
                        ["hdg"] = math.floor(heading / math.pi * 180),
                        ["inAir"] = unit:inAir()
                    }
                }
                table.insert(completeUnitAliveNames, curUnit.data.name)
                if (velocity) then
                    curUnit.data.speed = math.sqrt(velocity.x ^ 2 + velocity.z ^ 2)
                end
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
                if unitCache[curUnit.data.name] ~= nil  then
                    if unitCache[curUnit.data.name].lat ~= lat or unitCache[curUnit.data.name].lon ~= lon then
                        unitCache[curUnit.data.name] = {
                            ["lat"] = lat,
                            ["lon"] = lon
                        }
                        curUnit.action = "U"
                        udpClient:send(JSON:encode(curUnit))
                    end
                else
                    unitCache[curUnit.data.name] = {}
                    unitCache[curUnit.data.name] = {
                        ["lat"] = lat,
                        ["lon"] = lon
                    }
                    curUnit.data.groupName = group:getName()
                    curUnit.data.type = unit:getTypeName()
                    curUnit.data.coalition = coalition
                    curUnit.data.country = unit:getCountry()
                    curUnit.action = "C"
                    udpClient:send(JSON:encode(curUnit))
                end
                checkUnitDead[curUnit.data.name] = 1
            end
        end
    end
end

function updateGroups(ourArgument, time)
    unitCnt = 0
    checkUnitDead = {}
    completeUnitAliveNames = {}

    local redGroups = coalition.getGroups(coalition.side.RED)
    if redGroups ~= nil then
        addGroups(redGroups, 1)
    end
    local blueGroups = coalition.getGroups(coalition.side.BLUE)
    if blueGroups ~= nil then
        addGroups(blueGroups, 2)
    end

    --check dead, send delete action to server if dead detected
    for k, v in pairs(unitCache) do
        if checkUnitDead[k] == nil then
            local curUnit = {
                action = "D",
                uType = "unit",
                data = {
                    name = k
                }
            }
            udpClient:send(JSON:encode(curUnit))
            unitCache[k] = nil
        end
        unitCnt = unitCnt + 1
    end
    return time + DATA_TIMEOUT_SEC
end

-- update Statics section
local staticCache = {}
local staticCnt = 0
local checkStaticDead = {}
completeStaticAliveNames = {}

local function addStatics(statics, coalition)
    for staticIndex = 1, #statics do
        local static = statics[staticIndex]
        local staticPosition = static:getPosition()
        local lat, lon, alt = coord.LOtoLL(staticPosition.p)
        local unitXYZNorthCorr = coord.LLtoLO(lat + 1, lon)
        local headingNorthCorr = math.atan2(unitXYZNorthCorr.z - staticPosition.p.z, unitXYZNorthCorr.x - staticPosition.p.x)
        local heading = math.atan2(staticPosition.x.z, staticPosition.x.x) + headingNorthCorr
        if heading < 0 then
            heading = heading + 2 * math.pi
        end
        local curStatic = {
            ["uType"] = "static",
            ["data"] = {
                ["name"] = static:getName(),
                ["lonLatLoc"] = {
                    lon,
                    lat
                },
                ["alt"] = alt,
                ["hdg"] = math.floor(heading / math.pi * 180),

            }
        }
        table.insert(completeStaticAliveNames, curStatic.data.name)
        if staticCache[curStatic.data.name] ~= nil then
            if staticCache[curStatic.data.name].lat ~= lat or staticCache[curStatic.data.name].lon ~= lon then
                staticCache[curStatic.data.name] = {}
                staticCache[curStatic.data.name].lat = lat
                staticCache[curStatic.data.name].lon = lon
                curStatic.action = "U"
                udpClient:send(JSON:encode(curStatic))
            end
        else
            staticCache[curStatic.data.name] = {}
            staticCache[curStatic.data.name].lat = lat
            staticCache[curStatic.data.name].lon = lon
            curStatic.data.groupName = curStatic.data.name
            curStatic.data.category = static:getDesc().category
            curStatic.data.type = static:getTypeName()
            curStatic.data.coalition = coalition
            curStatic.data.country = static:getCountry()
            curStatic.action = "C"
            udpClient:send(JSON:encode(curStatic))
        end
        checkStaticDead[curStatic.data.name] = 1
    end
end

function updateStatics(ourArgument, time)
    staticCnt = 0
    checkStaticDead = {}
    completeStaticAliveNames = {}


    local redStatics = coalition.getStaticObjects(1)
    if redStatics ~= nil then
        addStatics(redStatics, 1)
    end
    local blueStatics = coalition.getStaticObjects(2)
    if blueStatics ~= nil then
        addStatics(blueStatics, 2)
    end
    for k, v in pairs(staticCache) do
        if checkStaticDead[k] == nil then
            local curStatic = {
                action = "D",
                uType = "static",
                data = {
                    name = k
                }
            }
            udpClient:send(JSON:encode(curStatic))
            staticCache[k] = nil
        end
        if k:split(" #")[1] ~= 'New Static Object' then
            staticCnt = staticCnt + 1
        end
    end
    return time + DATA_TIMEOUT_SEC
end

-- command section
function commandExecute(s)
    return loadstring("return " ..s)()
end

local function runRequest(request)
    if request.action == "CMD" and request.cmd ~= nil and request.reqID ~= nil then
        local success, cmdResponse =  pcall(commandExecute, request.cmd)
        if not success then
            net.log("Error: " .. resp)
        end
        if request.reqID > 0 then
            udpClient:send(JSON:encode({
                ["reqId"] = request.reqID,
                ["cmdResp"] = cmdResponse
            }))
        end
    end
end

function runPerFrame(ourArgument, time)
    local request = udpMissionRuntime:receive()
    if request ~= nil then
        env.info(request)
        runRequest(request)
    end
    return time + DATA_TIMEOUT_SEC
end

timer.scheduleFunction(runPerFrame, {}, timer.getTime() + DATA_TIMEOUT_SEC)
timer.scheduleFunction(updateGroups, {}, timer.getTime() + DATA_TIMEOUT_SEC)
timer.scheduleFunction(updateStatics, {}, timer.getTime() + DATA_TIMEOUT_SEC)

-- world.addEventHandler(ddcs)
env.info("missionRuntimeDDCS loaded")
