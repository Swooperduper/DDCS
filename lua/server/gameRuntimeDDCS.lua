--function tprint(tbl, indent)
--	if not indent then indent = 0 end
--	for k, v in pairs(tbl) do
--		formatting = string.rep("  ", indent) .. k .. ": "
--		if type(v) == "table" then
--			net.log(formatting)
--			tprint(v, indent + 1)
--		elseif type(v) == 'boolean' then
--			net.log(formatting .. tostring(v))
--		else
--			net.log(formatting .. tostring(v))
--		end
--	end
--end

net.log("startGameRuntimeDDCS")

ddcs = {}
local ddcsHost = "localhost"
local ddcsPort = 3001
local gameRuntimeHost = "localhost"
local gameRuntimePort = 3003
local DATA_TIMEOUT_SEC = 1

local socket = require("socket")
local JSON = loadfile("Scripts\\JSON.lua")()

local udpClient = socket.udp()
assert(udpClient:setpeername(socket.dns.toip(ddcsHost),ddcsPort))

local udpGameRuntime = socket.udp()
assert(udpGameRuntime:settimeout(0))
assert(udpGameRuntime:setsockname(socket.dns.toip(gameRuntimeHost), gameRuntimePort))

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

function runPerFrame()
	local request = udpGameRuntime:receive()
	if request ~= nil then
		net.log(request)
		runRequest(request)
	end
end

function buildPlayers()
	playerTable = {}
	for k, v in pairs(net.get_player_list()) do
		if v ~= nil then
			table.insert(playerTable, net.get_player_info(v))
		end
	end
	return playerTable
end

local _lastSent = 0
function ddcs.onSimulationFrame()
	runPerFrame()

	--Run Once Every Second
	local _now = DCS.getRealTime()
	if _now > _lastSent + DATA_TIMEOUT_SEC then
		_lastSent = _now
		udpClient:send(JSON:encode({
			["action"] = "playerStats",
			["missionFileName"] = DCS.getMissionName(),
			["players"] = buildPlayers(),
		}))
	end
end

DCS.setUserCallbacks(ddcs)
net.log("GameRuntimeDDCS loaded")
