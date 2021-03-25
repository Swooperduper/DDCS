function tprint(tbl, indent)
	if not indent then indent = 0 end
	for k, v in pairs(tbl) do
		formatting = string.rep("  ", indent) .. k .. ": "
		if type(v) == "table" then
			net.log(formatting)
			tprint(v, indent + 1)
		elseif type(v) == 'boolean' then
			net.log(formatting .. tostring(v))
		else
			net.log(formatting .. tostring(v))
		end
	end
end

function string:split(inSplitPattern, outResults)
	if not outResults then
		outResults = {}
	end
	local theStart = 1
	local theSplitStart, theSplitEnd = string.find(self, inSplitPattern, theStart)
	while theSplitStart do
		table.insert(outResults, string.sub(self, theStart, theSplitStart - 1))
		theStart = theSplitEnd + 1
		theSplitStart, theSplitEnd = string.find(self, inSplitPattern, theStart)
	end
	table.insert(outResults, string.sub(self, theStart))
	return outResults
end

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

playerSlots = {}

function commandExecute(s)
	return loadstring("return " ..s)()
end

function refreshPlayerSlots()
	local redSlots = DCS.getAvailableSlots("red")
	local blueSlots = DCS.getAvailableSlots("blue")

	for redSlotIndex = 1, #redSlots do
		local curSlot = redSlots[redSlotIndex]
		--net.log("RED: "..JSON:encode(curSlot))
		playerSlots[curSlot.unitId] = {
			["countryName"] = curSlot.countryName,
			["groupName"] = curSlot.groupName
		}
	end

	for blueSlotIndex = 1, #blueSlots do
		local curSlot = blueSlots[blueSlotIndex]
		--net.log("BLUE: "..JSON:encode(curSlot))
		playerSlots[curSlot.unitId] = {
			["countryName"] = curSlot.countryName,
			["groupName"] = curSlot.groupName
		}
	end
end

local function runRequest(request)
	if request.action == "refreshPlayerSlots" then
		refreshPlayerSlots()
	end

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
		decodeJSON = JSON:decode(request)
		net.log(decodeJSON)
		runRequest(decodeJSON)
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

function getSlotSide(curSlot)
	if curSlot ~= nil then
		local curPlayerSlot = playerSlots[curSlot]
		net.log("slot2"..JSON:encode(curPlayerSlot))
		if curPlayerSlot.groupName ~= nil then
			net.log("return slot: "..JSON:encode(curPlayerSlot))
			return curPlayerSlot
		else
			net.log("slot3")
			return 0
		end
	else
		net.log("slot1")
		return 0
	end
end

function ddcs.onPlayerChangeSlot(id)
	local playerInfo = net.get_player_info(id)
	net.log("player change: "..playerInfo.slot.." "..JSON:encode(getSlotSide(playerInfo.slot)))
	if playerInfo.ucid ~= nil then
		udpClient:send(JSON:encode({
			["action"] = "playerChangeSlot",
			["playerInfo"] = playerInfo,
			["occupiedUnitSide"] = getSlotSide(playerInfo.slot)
		}))
	end
end

function ddcs.onChatMessage(message, from)
	local playerInfo = net.get_player_info(from)
	if playerInfo.ucid ~= nil then
		udpClient:send(JSON:encode({
			["action"] = "incomingMessage",
			["message"] = message,
			["from"] = playerInfo.ucid
		}))
	end
end

function ddcs.onMissionLoadBegin()
	refreshPlayerSlots()
end

DCS.setUserCallbacks(ddcs)
net.log("GameRuntimeDDCS loaded")
