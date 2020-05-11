env.info("startGameRuntimeDDCS")

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

-- world.addEventHandler(ddcs)
env.info("missionRuntimeDDCS loaded")
