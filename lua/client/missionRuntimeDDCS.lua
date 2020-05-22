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
local SEND_SERVER_INFO_SEC = 60

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
tempUnitAliveNames = {}
tempStaticAliveNames = {}

function sendUDPPacket(payload)
    udpClient:send(JSON:encode(payload))
end

-- update groups section
unitCache = {}
checkUnitDead = {}

function generateInitialUnitObj(group, unit, curName, coalition, lon, lat, alt, unitPosition)
    local curUnit = {
        ["uType"] = "unit",
        ["data"] = {
            ["category"] = unit:getDesc().category,
            ["groupId"] = group:getID(),
            ["unitId"] = unit:getID(),
            ["name"] = curName,
            ["lonLatLoc"] = {
                lon,
                lat
            },
            ["alt"] = alt,
            ["agl"] = unitPosition.p.y - land.getHeight({x=unitPosition.p.x, y = unitPosition.p.z}),
            ["surfType"] = land.getSurfaceType(unitPosition.p),
            ["inAir"] = unit:inAir(),
            ["unitPosition"] = unitPosition,
            ["unitXYZNorthCorr"] = coord.LLtoLO(lat + 1, lon),
            ["velocity"] = unit:getVelocity(),
            ["groupName"] = group:getName(),
            ["type"] = unit:getTypeName(),
            ["coalition"] = coalition,
            ["country"] = unit:getCountry()
        }
    }

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
    return curUnit
end

local function addGroups(groups, coalition)
    for groupIndex = 1, #groups do
        local group = groups[groupIndex]
        local units = group:getUnits()
        for unitIndex = 1, #units do
            local unit = units[unitIndex]
            if Unit.isActive(unit) then
                local unitPosition = unit:getPosition()
                local lat, lon, alt = coord.LOtoLL(unitPosition.p)
                local curName = unit:getName()
                table.insert(tempUnitAliveNames, curName)

                if unitCache[curName] ~= nil then
                    if unitCache[curName].lat ~= lat or unitCache[curName].lon ~= lon then
                        unitCache[curName] = {
                            ["lat"] = lat,
                            ["lon"] = lon
                        }
                        local curUnit = generateInitialUnitObj(group, unit, curName, coalition, lon, lat, alt, unitPosition)
                        curUnit.action = "U"
                        sendUDPPacket(curUnit)
                    end
                else
                    unitCache[curName] = {
                        ["lat"] = lat,
                        ["lon"] = lon
                    }
                    local curUnit = generateInitialUnitObj(group, unit, curName, coalition, lon, lat, alt, unitPosition)
                    curUnit.action = "C"
                    sendUDPPacket(curUnit)
                end
                checkUnitDead[curName] = 1
            end
        end
    end
end

function updateGroups(ourArgument, time)
    checkUnitDead = {}
    tempUnitAliveNames = {}

    local redGroups = coalition.getGroups(1)
    if redGroups ~= nil then
        addGroups(redGroups, 1)
    end
    local blueGroups = coalition.getGroups(2)
    if blueGroups ~= nil then
        addGroups(blueGroups, 2)
    end

    completeUnitAliveNames = tempUnitAliveNames
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
            sendUDPPacket(curUnit)
            unitCache[k] = nil
        end
    end

    return time + DATA_TIMEOUT_SEC
end

-- update Statics section
staticCache = {}
checkStaticDead = {}

function generateInitialStaticsObj(static, coalition, lon, lat, alt, staticPosition)
    local curStatic = {
        ["uType"] = "static",
        ["data"] = {
            ["name"] = static.name,
            ["lonLatLoc"] = {
                lon,
                lat
            },
            ["alt"] = alt,
            ["position"] = position,
            ["unitPosition"] = staticPosition,
            ["unitXYZNorthCorr"] = coord.LLtoLO(lat + 1, lon),
            ["category"] = static:getDesc().category,
            ["type"] = static:getTypeName(),
            ["coalition"] = coalition,
            ["country"] = static:getCountry()
        }
    }
    return curStatic
end


local function addStatics(statics, coalition)
    for staticIndex = 1, #statics do
        local static = statics[staticIndex]
        local staticPosition = static:getPosition()
        local lat, lon, alt = coord.LOtoLL(staticPosition.p)
        local curStaticName = static:getName()
        table.insert(tempStaticAliveNames, curStaticName)

        if staticCache[curStaticName] ~= nil then
            if staticCache[curStaticName].lat ~= lat or staticCache[curStaticName].lon ~= lon then
                --local headingNorthCorr = math.atan2(unitXYZNorthCorr.z - staticPosition.p.z, unitXYZNorthCorr.x - staticPosition.p.x)
                --local heading = math.atan2(staticPosition.x.z, staticPosition.x.x) + headingNorthCorr
                --if heading < 0 then
                --    heading = heading + 2 * math.pi
                --end
                local curStatic = generateInitialStaticsObj(static, coalition, lon, lat, alt, staticPosition)
                staticCache[curStaticName] = {
                    ["lat"] = lat,
                    ["lon"] = lon
                }
                curStatic.action = "U"
                sendUDPPacket(curStatic)
            end
        else
            local curStatic = generateInitialStaticsObj(static, coalition, lon, lat, alt, staticPosition)
            staticCache[curStaticName] = {
                ["lat"] = lat,
                ["lon"] = lon
            }
            curStatic.action = "C"
            sendUDPPacket(curStatic)
        end
        checkStaticDead[curStaticName] = 1
    end
end

function updateStatics(ourArgument, time)
    checkStaticDead = {}
    tempStaticAliveNames = {}


    local redStatics = coalition.getStaticObjects(1)
    if redStatics ~= nil then
        addStatics(redStatics, 1)
    end
    local blueStatics = coalition.getStaticObjects(2)
    if blueStatics ~= nil then
        addStatics(blueStatics, 2)
    end

    completeStaticAliveNames = tempStaticAliveNames

    for k, v in pairs(staticCache) do
        if checkStaticDead[k] == nil then
            local curStatic = {
                action = "D",
                uType = "static",
                data = {
                    name = k
                }
            }
            sendUDPPacket(curStatic)
            staticCache[k] = nil
        end
    end

    return time + DATA_TIMEOUT_SEC
end

-- command section
function commandExecute(s)
    return loadstring("return " ..s)()
end

local function runRequest(request)
    tprint(request, 1)
    if request.action ~= nil and request.cmd ~= nil and request.reqID ~= nil then

        local outObj = {
            ["reqId"] = request.reqID,
        }

        if request.action == "getUnitNames" then
            outObj.completeUnitAliveNames = completeUnitAliveNames
            sendUDPPacket(outObj)
        end

        if request.action == "getStaticNames" then
            outObj.completeStaticAliveNames = completeStaticAliveNames
            sendUDPPacket(outObj)
        end

        if request.action == "CMD" then
            local success, cmdResponse =  pcall(commandExecute, request.cmd)
            if not success then
                net.log("Error: " .. resp)
            end
            if request.reqID > 0 then
                outObj.cmdResp = cmdResponse
                sendUDPPacket(outObj)
            end
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

function sendServerInfo(ourArgument, time)
    sendUDPPacket({
        ["action"] = "serverInfo",
        ["unitCount"] = table.getn(completeUnitAliveNames),
        ["staticCount"] = table.getn(completeStaticAliveNames),
        ["startAbsTime"] = timer.getTime0(),
        ["curAbsTime"] = timer.getAbsTime(),
        ["epoc"] = missionStartTime * 1000
    })
    return time + SEND_SERVER_INFO_SEC
end

timer.scheduleFunction(sendServerInfo, {}, timer.getTime() + SEND_SERVER_INFO_SEC)
timer.scheduleFunction(runPerFrame, {}, timer.getTime() + DATA_TIMEOUT_SEC)
timer.scheduleFunction(updateGroups, {}, timer.getTime() + DATA_TIMEOUT_SEC)
timer.scheduleFunction(updateStatics, {}, timer.getTime() + DATA_TIMEOUT_SEC)

-- world.addEventHandler(ddcs)
env.info("missionRuntimeDDCS loaded")
