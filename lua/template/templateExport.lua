clientEventHandler = {}

--in missionScripting.lua file: dynamicDCS = { require = require }
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

do
	--
	local PORT = 3001
	local DATA_TIMEOUT_SEC = 1

	local updateQue = { ["que"] = {} }

	package.path = package.path .. ";.\\LuaSocket\\?.lua"
	package.cpath = package.cpath .. ";.\\LuaSocket\\?.dll"

	require = dynamicDCS.require
	local socket = require("socket")
	local JSON = loadfile("Scripts\\JSON.lua")()
	require = nil
	local missionStartTime = os.time()

	local function log(msg)
		--env.info("DynamicDCS (t=" .. timer.getTime() .. "): " .. msg)
	end

	log('REALTIME ' .. missionStartTime)

	local function getAllDefzone ()
		local polyArray = {}
		if env.mission.coalition then
			for coa,coaTable in pairs(env.mission.coalition) do
				if type(coaTable) == 'table' and coaTable.country and coa == 'blue' then
					for i=1,#coaTable.country do
						local country = coaTable.country[i]
						for uType,uTable in pairs(country) do
							env.info('TYPE: ' .. uType)
							if uType == 'plane' or uType == 'helicopter' or uType == 'vehicle' then
								if type(uTable)=='table' and uTable.group then
									for j=1,#uTable.group do
										local group = uTable.group[j]
										local gName = env.getValueDictByKey(group.name)
										if gName and group.route.points and string.find(gName, '|POLY|UNIT|', 1, true) then
											local nArry = gName:split("|")
											if polyArray[nArry[4]] == nil then
												polyArray[nArry[4]] = {["unitPoly"] = {}}
											end
											if polyArray[nArry[4]].unitPoly == nil then
												polyArray[nArry[4]].unitPoly = {}
											end
											if polyArray[nArry[4]].unitPoly[nArry[5]] == nil then
												polyArray[nArry[4]].unitPoly[nArry[5]] = {}
											end
											--env.info('poly1: '..gName)
											for pIndex = 1, #group.route.points do
												local lat, lon, alt = coord.LOtoLL({x = group.route.points[pIndex].x, y = 0, z = group.route.points[pIndex].y})
												polyArray[nArry[4]].unitPoly[nArry[5]][pIndex] = {
													[1] = lon,
													[2] = lat
												}
											end
										end
										if gName and group.route.points and string.find(gName, '|POLY|BUILDING|', 1, true) then
											local nArry = gName:split("|")
											if polyArray[nArry[4]] == nil then
												polyArray[nArry[4]] = {["buildingPoly"] = {}}
											end
											if polyArray[nArry[4]].buildingPoly == nil then
												polyArray[nArry[4]].buildingPoly = {}
											end
											if polyArray[nArry[4]].buildingPoly[nArry[5]] == nil then
												polyArray[nArry[4]].buildingPoly[nArry[5]] = {}
											end
											--env.info('poly2: '..gName)
											for pIndex = 1, #group.route.points do
												local lat, lon, alt = coord.LOtoLL({x = group.route.points[pIndex].x, y = 0, z = group.route.points[pIndex].y})
												polyArray[nArry[4]].buildingPoly[nArry[5]][pIndex] = {
													[1] = lon,
													[2] = lat
												}
											end
										end
										if gName and group.route.points and string.find(gName, '|POLY|LAYER2|', 1, true) then
											local nArry = gName:split("|")
											if polyArray[nArry[4]] == nil then
												polyArray[nArry[4]] = {["layer2Poly"] = {}}
											end
											if polyArray[nArry[4]].layer2Poly == nil then
												polyArray[nArry[4]].layer2Poly = {}
											end
											if polyArray[nArry[4]].layer2Poly[nArry[5]] == nil then
												polyArray[nArry[4]].layer2Poly[nArry[5]] = {}
											end
											--env.info('poly3: '..gName)
											for pIndex = 1, #group.route.points do
												local lat, lon, alt = coord.LOtoLL({x = group.route.points[pIndex].x, y = 0, z = group.route.points[pIndex].y})
												polyArray[nArry[4]].layer2Poly[nArry[5]][pIndex] = {
													[1] = lon,
													[2] = lat
												}
											end
										end
										if gName and group.route.points and string.find(gName, '|CONVOY|', 1, true) then
											env.info("groupName: "..gName)
											local nArry = gName:split("|")
											local sourceName = nArry[3]
											local destName = nArry[4]
											if polyArray[sourceName] == nil then
												polyArray[sourceName] = {["convoyTemplate"] = {}}
											end
											if polyArray[sourceName].convoyTemplate == nil then
												polyArray[sourceName].convoyTemplate = {}
											end
											if polyArray[sourceName].convoyTemplate[destName] == nil then
												polyArray[sourceName].convoyTemplate[destName] = {
													["sourceBase"] = sourceName,
													["destBase"] = destName,
													["route"] = {}
												}
											end
											-- env.info('poly3: '..polyArray[convoyBaseName])
											for pIndex = 1, #group.route.points do
												local lat, lon, alt = coord.LOtoLL({x = group.route.points[pIndex].x, y = 0, z = group.route.points[pIndex].y})
												polyArray[sourceName].convoyTemplate[destName].route[pIndex] = {
													["lonLat"] = {
														[1] = lon,
														[2] = lat
													},
													["action"] = group.route.points[pIndex].action
												}
											end
										end
										if gName and group.units and string.find(gName, '|AICAP|', 1, true) then
											local nArry = gName:split("|")
											local sourceName = nArry[3]
											if polyArray[sourceName] == nil then
												polyArray[sourceName] = {["AICapTemplate"] = {}}
											end
											if polyArray[sourceName].AICapTemplate == nil then
												polyArray[sourceName].AICapTemplate = {
													["sourceBase"] = sourceName,
													["units"] = {}
												}
											end

											-- env.info('poly3: '..polyArray[convoyBaseName])
											-- tprint(group, 1)
											for pIndex = 1, #group.units do
												local lat, lon, alt = coord.LOtoLL({x = group.units[pIndex].x, y = 0, z = group.units[pIndex].y})
												table.insert(polyArray[sourceName].AICapTemplate.units,{
													["lonLat"] = {
														[1] = lon,
														[2] = lat
													},
													["type"] = group.units[pIndex].type,
													["parking"] = group.units[pIndex].parking,
													["parking_id"] = group.units[pIndex].parking_id,
													["frequency"] = group.units[pIndex].frequency,
												})
											end
										end
										if gName and group.units and string.find(gName, '|DEFAULTS|', 1, true) then
											env.info("groupName: "..gName)
											local nArry = gName:split("|")
											local sourceName = nArry[3]
											if polyArray[sourceName] == nil then
												polyArray[sourceName] = {["defaults"] = {}}
											end
											if polyArray[sourceName].defaults == nil then
												polyArray[sourceName].defaults = {
													["sourceBase"] = sourceName,
													["baseType"] = nArry[4],
													["defaultStartSide"] = nArry[5],
													["enabled"] = nArry[6],
													["initSide"] = nArry[5]
												}
											end
										end
									end
								end
							end
						end
					end
				end
			end
		end
		return polyArray
	end

	local polyArray = getAllDefzone()

	local function updateAirbases(airbases, coalition)
		for airbaseIndex = 1, #airbases do
			local baseId = tonumber(airbases[airbaseIndex]:getID())
			local unitPosition = airbases[airbaseIndex]:getPosition()
			local x = unitPosition.p.x
			local y = unitPosition.p.z
			local lat, lon, alt = coord.LOtoLL(unitPosition.p)
			local unitXYZNorthCorr = coord.LLtoLO(lat + 1, lon)
			local headingNorthCorr = math.atan2(unitXYZNorthCorr.z - unitPosition.p.z, unitXYZNorthCorr.x - unitPosition.p.x)
			local heading = math.atan2(unitPosition.x.z, unitPosition.x.x) + headingNorthCorr
			if heading < 0 then
				heading = heading + 2 * math.pi
			end
			local hdg = math.floor(heading / math.pi * 180);
			local baseName = airbases[airbaseIndex]:getName()
			env.info('BASENAME: '..baseName..' : '..baseId..' : '..lat..' : '..lon..' : '..hdg)
			--tprint(polyArray[baseName], 1)
			local curObj = {
				["_id"] = baseName,
				["baseId"] = baseId,
				["name"] = baseName,
				["hdg"] = hdg,
				["side"] = 0,
				["initSide"] = coalition,
				["centerLoc"] = {
					lon,
					lat
				},
				["polygonLoc"] = {},
				["alt"] = alt,
				["enabled"] = false
			}
			if polyArray[baseName] ~= nil then
				local curPoly = polyArray[baseName]
				curObj["polygonLoc"] = curPoly
				if curPoly.defaults ~= nil then
					env.info('1')
					if curPoly.defaults.baseType ~= nil then
						curObj["baseType"] = curPoly.defaults.baseType
					end
					env.info('2')
					if curPoly.defaults.defaultStartSide ~= nil then
						curObj["defaultStartSide"] = curPoly.defaults.defaultStartSide
					end
					env.info('3')
					if curPoly.defaults.enabled then
						curObj["enabled"] = curPoly.defaults.enabled
					end
					env.info('4')
				end
				env.info('MADE IT')
				tprint(curObj, 1)
			end
			table.insert(updateQue.que, {
				action = 'airbaseC',
				data = curObj
			})
		end
	end

	local function initAirbases()
		local neutralAirbases = coalition.getAirbases(coalition.side.NEUTRAL)
		if neutralAirbases ~= nil then
			updateAirbases(neutralAirbases, 0)
		end
		local redAirbases = coalition.getAirbases(coalition.side.RED)
		if redAirbases ~= nil then
			updateAirbases(redAirbases, 1)
		end
		local blueAirbases = coalition.getAirbases(coalition.side.BLUE)
		if blueAirbases ~= nil then
			updateAirbases(blueAirbases, 2)
		end
	end

	local function getDataMessage()
		--env.info('paySize: '..table.getn(updateQue.que));
		local chkSize = 10
		local payload = {}
		payload.que = {}
		for i = 1, chkSize do
			table.insert(payload.que, updateQue.que[i])
			table.remove(updateQue.que, i)
		end
		return payload
	end

	local function runRequest(request)
		env.info('REQUEST: '..request.action)
		if request.action ~= nil then
			if request.action == "GETPOLYDEF" then
				env.info('GET POLY')
				initAirbases()
			end
		end
	end

	log("Starting DCS Template Export Server")

	local tcp = socket.tcp()
	tcp:settimeout(0)
	local bound, error = tcp:bind('*', PORT)
	if not bound then
		log("Could not bind: " .. error)
		return
	end
	log("Port " .. PORT .. " bound")

	local serverStarted, error = tcp:listen(1)
	if not serverStarted then
		log("Could not start server: " .. error)
		return
	end
	log("Server started")

	local function checkJSON(jsonstring, code)
		if code == 'encode' then
			if type(JSON:encode(jsonstring)) ~= "string" then
				error("encode expects a string after function")
			end
		end
		if code == 'decode' then
			if type(jsonstring) ~= "string" then
				error("decode expects string")
			end
		end
	end

	local client
	local function step()
		if not client then
			client = tcp:accept()
			tcp:settimeout(0)

			if client then
				log("Connection established")
			end
		end

		if client then
			local line, err = client:receive('*l')
			if line ~= nil then
				--log(line)
				local success, error = pcall(checkJSON, line, 'decode')
				if success then
					local incMsg = JSON:decode(line)
					runRequest(incMsg);
				else
					log("Error: " .. error)
				end
			end
			-- if there was no error, send it back to the client
			if not err then
				local dataPayload = getDataMessage()
				local success, error = pcall(checkJSON, dataPayload, 'encode')
				if success then
					local outMsg = JSON:encode(dataPayload)
					local bytes, status, lastbyte = client:send(outMsg .. "\n")
					if not bytes then
						log("Connection lost")
						client = nil
					end;
				else
					log("Error: " .. error)
				end
			else
				log("Connection lost")
				client = nil
			end
		end
	end

	timer.scheduleFunction(function(arg, time)
		local success, error = pcall(step)
		if not success then
			log("Error: " .. error)
		end
		return timer.getTime() + DATA_TIMEOUT_SEC
	end, nil, timer.getTime() + DATA_TIMEOUT_SEC)
end
env.info("dynamicDCSTrue event handler added")
