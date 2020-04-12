/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const	_ = require('lodash');
const constants = require('../constants');
const masterDBController = require('../db/masterDB');

var enableAction = false;
var allowedHelisForTroops = [
	'UH-1H',
	'Mi-8MT',
	'SA342M',
	'SA342L',
	'SA342Minigun'
];
var allowedPlanesForTroops = [
	'TF-51D',
	'Bf-109K-4',
	'P-51D',
	'F-86F Sabre',
	'MiG-15bis',
	'L-39ZA',
	'Hawk',
	'SA342Mistral',
	'C-101CC',
	'Yak-52'
];
var allowedTypesForCratesLight = [
	'UH-1H',
	'Mi-8MT',
	'Ka-50'
];

var allowedTypesForCratesHeavy = [
	'Mi-8MT',
	'Ka-50'
];

var allowedHelisForInternalCrates = [
	'UH-1H',
	'Mi-8MT',
	'TF-51D',
	'Bf-109K-4',
	'P-51D',
	'L-39ZA',
	'Hawk',
	'C-101CC',
	'Yak-52',
	'F-86F Sabre',
	'MiG-15bis'
];

_.set(exports, 'logisticsMenu', function (action, serverName, unit) {
	var aqMenuTitleHeavy;
	var aqMenuTitleLite;
	var trpMenuTitle;

	var curTimePeriod = _.get(constants, 'config.timePeriod', 'modern');
	console.log('TP: ', curTimePeriod);

	var cmdArray = [];
	var resetMenu = 'missionCommands.removeItemForGroup("' + unit.groupId + '", "ActionMenu", nil)';
	var actMenu = [
		'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "ActionMenu")',
		'missionCommands.addCommandForGroup("' + unit.groupId + '", "Is Troop Onboard", {"ActionMenu"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "isTroopOnboard", ["unitId"] = ' + unit.unitId + '})'
	];
	var aTroopMenu = [
		'missionCommands.addCommandForGroup("' + unit.groupId + '", "Unload / Extract Troops", {"ActionMenu"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unloadExtractTroops", ["unitId"] = ' + unit.unitId + '})'
	];
	var aUnpackMenu = [
		'missionCommands.addCommandForGroup("' + unit.groupId + '", "Unpack Crate", {"ActionMenu"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unpackCrate", ["unitId"] = ' + unit.unitId + '})',
	];

	if(_.includes(allowedHelisForTroops, unit.type)) {
		cmdArray = _.concat(cmdArray, aTroopMenu);
		enableAction = true;
	}
	if(_.includes(allowedPlanesForTroops, unit.type)) {
		cmdArray = _.concat(cmdArray, aTroopMenu);
		enableAction = true;
	}

	if (_.includes(allowedTypesForCratesLight, unit.type) || _.includes(allowedTypesForCratesHeavy, unit.type) || _.includes(allowedHelisForInternalCrates, unit.type)) {
		cmdArray = _.concat(cmdArray, aUnpackMenu);
		enableAction = true;
	}
	if (enableAction) {
		cmdArray = _.concat(actMenu, cmdArray);
		enableAction = false;
	}
	cmdArray.unshift(resetMenu);
	cmdArray = _.concat(cmdArray, [
		'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Lives")',
		'missionCommands.addCommandForGroup("' + unit.groupId + '", "Time Until Restart", {"Lives"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "serverTimeLeft", ["type"] = "Server Time Left", ["unitId"] = ' + unit.unitId + '})',
		'missionCommands.addCommandForGroup("' + unit.groupId + '", "Lookup Aircraft Costs", {"Lives"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "lookupAircraftCosts", ["type"] = "Lookup Aircraft LP Costs", ["unitId"] = ' + unit.unitId + '})',
		'missionCommands.addCommandForGroup("' + unit.groupId + '", "Check Life Resource", {"Lives"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "lookupLifeResource", ["type"] = "Check Life Resource", ["unitId"] = ' + unit.unitId + '})'
	]);

	if (curTimePeriod === 'modern') {
		cmdArray = _.concat(cmdArray, [
			'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "$Resource Points$")',
			'missionCommands.addCommandForGroup("' + unit.groupId + '", "Resource Points Acquired", {"$Resource Points$"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "resourcePoints", ["type"] = "Resource Points", ["unitId"] = ' + unit.unitId + '})'
		]);
	}

	if (curTimePeriod === 'modern') {
		if(unit.coalition === 1) {
			cmdArray = _.concat(cmdArray, [
				'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "$Offensive$")',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Bomber Raid(750rs)", {"$Offensive$"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnBomber", ["type"] = "RussianBomber", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 750})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Attack Heli Patrol(750rs)", {"$Offensive$"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnAtkHeli", ["type"] = "RussianAtkHeli", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 750})',

			]);

			cmdArray = _.concat(cmdArray, [
				'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "$Defensive$")',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Helicopter Base Patrol(500rs)", {"$Defensive$"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnDefHeli", ["type"] = "RussianDefHeli", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 500})'
			]);

			cmdArray = _.concat(cmdArray, [
				// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "$Support$")',
				// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AWACS", {"$Support$"})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "A-50 AWACS(200rs)", {"$Support$", "AWACS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnAWACS", ["type"] = "RussianAWACSA50", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 200})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "E-2A AWACS(200rs)", {"$Support$", "AWACS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnAWACS", ["type"] = "RussianAWACSE2C", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 200})',
				// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Refueling", {"$Support$"})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "IL-78M(HA Drogue)(50rs)", {"$Support$", "Refueling"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnTanker", ["type"] = "RHADTKR", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 50})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "KC-135(LA Boom)(50rs)", {"$Support$", "Refueling"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnTanker", ["type"] = "RLABTKR", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 50})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "KC-130(LA Drogue)(50rs)", {"$Support$", "Refueling"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnTanker", ["type"] = "RLADTKR", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 50})',
			]);
		}
		if(unit.coalition === 2) {
			cmdArray = _.concat(cmdArray, [
				'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "$Offensive$")',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Bomber Raid(Closest Enemy Base 750rs)", {"$Offensive$"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnBomber", ["type"] = "USABomber", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 750})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Attack Heli Patrol(Friendly->Enemy Base 750rs)", {"$Offensive$"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnAtkHeli", ["type"] = "USAAtkHeli", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 750})',
			]);

			cmdArray = _.concat(cmdArray, [
				'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "$Defensive$")',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Helicopter Base Patrol(500rs)", {"$Defensive$"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnDefHeli", ["type"] = "USADefHeli", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 500})'
			]);

			cmdArray = _.concat(cmdArray, [
				// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "$Support$")',
				// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AWACS", {"$Support$"})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "E-3A AWACS(200rs)", {"$Support$", "AWACS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnAWACS", ["type"] = "USAAWACS", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 200})',
				// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Refueling", {"$Support$"})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "KC-135(HA Boom)(50rs)", {"$Support$", "Refueling"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnTanker", ["type"] = "BHABTKR", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 50})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "IL-78M(HA Drogue)(50rs)", {"$Support$", "Refueling"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnTanker", ["type"] = "BHADTKR", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 50})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "KC-135(LA Boom)(50rs)", {"$Support$", "Refueling"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnTanker", ["type"] = "BLABTKR", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 50})',
				// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "KC-130(LA Drogue)(50rs)", {"$Support$", "Refueling"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "spawnTanker", ["type"] = "BLADTKR", ["unitId"] = ' + unit.unitId + ', ["rsCost"] = 50})',
			]);
		}
	}

	if (_.includes(allowedHelisForInternalCrates, unit.type)) {
		cmdArray = _.concat(cmdArray, [
			'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Internal Cargo")',
			'missionCommands.addCommandForGroup("' + unit.groupId + '", "Is Internal Cargo Loaded", {"Internal Cargo"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "InternalCargo", ["type"] = "loaded", ["unitId"] = ' + unit.unitId + '})',
			'missionCommands.addCommandForGroup("' + unit.groupId + '", "Unpack Internal Cargo", {"Internal Cargo"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "InternalCargo", ["type"] = "unpack", ["unitId"] = ' + unit.unitId + '})',
			'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load JTAC", {"Internal Cargo"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "InternalCargo", ["type"] = "loadJTAC", ["unitId"] = ' + unit.unitId + '})',
			'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load Base Building/Repair Kit", {"Internal Cargo"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "InternalCargo", ["type"] = "loadBaseRepair", ["unitId"] = ' + unit.unitId + '})'
		]);
	}

	if (_.includes(allowedHelisForTroops, unit.type) || _.includes(allowedPlanesForTroops, unit.type) || _.includes(allowedTypesForCratesLight, unit.type) || _.includes(allowedTypesForCratesHeavy, unit.type)) {
		masterDBController.srvPlayerActions('read', serverName, {name: unit.playername})
			.then(function(player) {
				var curPlayer = _.get(player, [0]);
				if (curPlayer) {
					if (_.includes(allowedHelisForTroops, unit.type)) {
						trpMenuTitle = '"Troops"';
						if (curTimePeriod === '1978ColdWar') {
							cmdArray = _.concat(cmdArray, [
								'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + trpMenuTitle + ')',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load Rifle Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "Soldier", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load MG Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MG Soldier", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load RPG Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "RPG", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load Mortar Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "Mortar Team", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
							]);
						} else {
							cmdArray = _.concat(cmdArray, [
								'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + trpMenuTitle + ')',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load Rifle Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "Soldier", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load MG Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MG Soldier", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load ManPad", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MANPAD", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load RPG Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "RPG", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
								'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load Mortar Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "Mortar Team", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})',
							]);
						}
					}
					if (_.includes(allowedPlanesForTroops, unit.type)) {
						trpMenuTitle = '"Troops"';
						cmdArray = _.concat(cmdArray, [
							'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + trpMenuTitle + ')',
							'missionCommands.addCommandForGroup("' + unit.groupId + '", "Load Rifle Troop", {' + trpMenuTitle + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "Soldier", ["type"] = "combo", ["unitId"] = ' + unit.unitId + '})'
						]);
					}

					if (curTimePeriod === '1978ColdWar') {
						if (_.includes(allowedTypesForCratesLight, unit.type)) {
							aqMenuTitleLite = '"Acquisitions Light"';
							if(unit.coalition === 1) {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleLite + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleLite + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "501"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar(MiG-15)(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "55G6 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "502"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "504"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "ATZ-10", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "506"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "Ural-375", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "507"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "MTLB(5Q-5C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "MTLB", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "true", ["mass"] = "520"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "BMP-1(1Q-3C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "BMP-1", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "523"})',

									// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleLite + '})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-55(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-55", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "530"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Gvozdika(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Gvozdika", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "542"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Grad-URAL(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Grad-URAL", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "544"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "548"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement Closed(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement Closed", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "549"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 on Ural-375(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Ural-375 ZU-23", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "550"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Shilka(1Q-2C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "ZSU-23-4 Shilka", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "551"})'
								]);
							} else {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleLite + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleLite + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Short(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "501"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "504"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "M978 HEMTT Tanker", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "506"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "M 818", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "507"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-113(5Q-5C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M-113", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "true", ["mass"] = "525"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "LAV-25(1Q-3C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "LAV-25", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "526"})',

									// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleLite + '})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-60(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "M-60", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "532"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-109(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "M-109", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "540"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleLite + '})',

									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "548"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement Closed(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement Closed", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "549"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Vulcan(1Q-2C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Vulcan", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "552"})'
								]);
							}
						}
						if (_.includes(allowedTypesForCratesHeavy, unit.type)) {
						aqMenuTitleHeavy = '"Acquisitions Heavy"';

							if(unit.coalition === 1) {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleHeavy + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleHeavy + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1401"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar(MiG-15)(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "55G6 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1402"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1404"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "ATZ-10", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1406"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "Ural-375", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1407"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "MTLB(5Q-5C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "MTLB", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "true", ["mass"] = "1423"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "BMP-1(1Q-3C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "BMP-1", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1425"})',

									// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleHeavy + '})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-55(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-55", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1430"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Gvozdika(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Gvozdika", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1442"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Grad-URAL(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Grad-URAL", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1444"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1448"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement Closed(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement Closed", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1449"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 on Ural-375(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Ural-375 ZU-23", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1450"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Shilka(1Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "ZSU-23-4 Shilka", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1451"})',
								]);
							} else {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleHeavy + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleHeavy + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Short(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1401"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1404"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "M978 HEMTT Tanker", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1406"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "M 818", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1407"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-113(5Q-5C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M-113(1Q-1C)", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "true", ["mass"] = "1425"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "LAV-25(1Q-3C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "LAV-25(1Q-2C)", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1426"})',

									// 'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleHeavy + '})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-60(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "M-60", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1432"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-109(1Q-1C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "M-109", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1440"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1448"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement Closed(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement Closed", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1449"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Vulcan(1Q-2C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Vulcan", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1452"})'
								]);
							}
						}
					} else {
						if (_.includes(allowedTypesForCratesLight, unit.type)) {
							aqMenuTitleLite = '"Acquisitions Light"';
							if(unit.coalition === 1) {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleLite + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleLite + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Short(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "501"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Long(1Q-2C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "55G6 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "502"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "504"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "ATZ-10", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "506"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "Ural-375", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "507"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Cobra(1Q-1C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "armoredCar", ["type"] = "Cobra", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "522"})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "BMP-2(1Q-1C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "BMP-2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "523"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZBD-04A", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "ZBD04A", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "524"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "BMP-3(1Q-1C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "BMP-3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "525"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-55(1Q-1C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-55", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "529"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-72B(1Q-2C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-72B", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "530"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-80UD(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-80UD", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "531"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-90(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-90", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "537"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZTZ96B(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "ZTZ96B", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "532"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Leclerc(1Q-4C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Leclerc", ["unitId"] = ' + unit.unitId + ', ["crates"] = 4, ["mobile"] = "true", ["mass"] = "533"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Msta(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Msta", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "539"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU 2-C9(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU 2-C9", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "541"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Gvozdika(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Gvozdika", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "542"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Akatsia(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Akatsia", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "543"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Grad-URAL(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Grad-URAL", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "544"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Uragan BM-27(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Uragan_BM-27", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "546"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Smerch(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Smerch", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "547"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "548"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement Closed(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement Closed", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "549"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 on Ural-375(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Ural-375 ZU-23", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "550"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Shilka(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "ZSU-23-4 Shilka", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "551"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Infrared SAM", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Strela-1 9P31(2Q-1C)", {' + aqMenuTitleLite + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "Strela-1 9P31", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "555"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Strela-10M3(2Q-2C)", {' + aqMenuTitleLite + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "Strela-10M3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "556"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Radar SAM", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SA-2(6Q-2C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "SA-2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "562"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SA-3(3Q-2C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "SA-3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "563"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "HQ-7(3Q-2C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "HQ-7", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "564"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Osa 9A33 ln(2Q-2C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "Osa 9A33 ln", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "559"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Tunguska(2Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "2S6 Tunguska", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "560"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Tor(2Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "Tor 9A331", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "561"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Kub(5Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Kub", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "564"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Buk(3Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "LRSAM", ["type"] = "Buk", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "565"})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "SA-10(4Q-5C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "LRSAM", ["type"] = "SA-10", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "true", ["mass"] = "566"})',
								]);
							} else {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleLite + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleLite + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Short(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "501"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "504"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "M978 HEMTT Tanker", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "506"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleLite + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "M 818", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "507"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M1043 HMMWV(1Q-1C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "armoredCar", ["type"] = "M1043 HMMWV Armament", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "525"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Stryker ATGM(1Q-1C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M1134 Stryker ATGM", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "526"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Stryker MGS(1Q-2C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M1128 Stryker MGS", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "527"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-2 Bradley(1Q-1C)", {' + aqMenuTitleLite + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M-2 Bradley", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "522"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-60(1Q-1C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "M-60", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "531"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Leopard1A3(1Q-2C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Leopard1A3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "532"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Leopard-2(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Leopard-2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "534"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Challenger2(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Challenger2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "536"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Merkava_Mk4(1Q-3C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Merkava_Mk4", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "537"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-1 Abrams(1Q-4C)", {' + aqMenuTitleLite + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "M-1 Abrams", ["unitId"] = ' + unit.unitId + ', ["crates"] = 4, ["mobile"] = "true", ["mass"] = "538"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-109(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "M-109", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "540"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "MLRS(1Q-2C)", {' + aqMenuTitleLite + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "MLRS", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "545"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Vulcan(3Q-1C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Vulcan", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "552"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Gepard(3Q-2C)", {' + aqMenuTitleLite + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Gepard", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "553"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Infrared SAM", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Avenger(1Q-2C)", {' + aqMenuTitleLite + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "M1097 Avenger", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "555"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Chaparral(2Q-3C)", {' + aqMenuTitleLite + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "M48 Chaparral", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "557"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Linebacker(1Q-3C)", {' + aqMenuTitleLite + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "M6 Linebacker", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "558"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Radar SAM", {' + aqMenuTitleLite + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Roland(3Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Roland", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "562"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Rapier(4Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Rapier", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "563"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Tor(2Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "Tor 9A331", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "561"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Hawk(5Q-3C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Hawk", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "564"})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Patriot(5Q-5C)", {' + aqMenuTitleLite + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "LRSAM", ["type"] = "Patriot", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "true", ["mass"] = "567"})',
								]);
							}
						}
						if (_.includes(allowedTypesForCratesHeavy, unit.type)) {
							aqMenuTitleHeavy = '"Acquisitions Heavy"';

							if(unit.coalition === 1) {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleHeavy + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleHeavy + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Short(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1401"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Long(1Q-2C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "55G6 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1402"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1404"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "ATZ-10", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1406"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "Ural-375", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1407"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Cobra(1Q-1C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "armoredCar", ["type"] = "Cobra", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1422"})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "BMP-2(1Q-1C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "BMP-2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1423"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZBD-04A(1Q-1C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "ZBD04A", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1424"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "BMP-3(1Q-1C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "BMP-3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1425"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-55(1Q-1C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-55", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1429"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-72B(1Q-2C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-72B", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1430"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-80UD(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-80UD", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1431"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "T-90(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "T-90", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1437"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZTZ96B(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "ZTZ96B", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1432"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Leclerc(1Q-4C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Leclerc", ["unitId"] = ' + unit.unitId + ', ["crates"] = 4, ["mobile"] = "true", ["mass"] = "1433"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Msta(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Msta", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1439"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU 2-C9(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU 2-C9", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1441"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Gvozdika(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Gvozdika", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1442"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SAU Akatsia(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "SAU Akatsia", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1443"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Grad-URAL(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Grad-URAL", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1444"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Uragan BM-27(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Uragan_BM-27", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1446"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Smerch(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "Smerch", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1447"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1448"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 Emplacement Closed(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "stationaryAntiAir", ["type"] = "ZU-23 Emplacement Closed", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1449"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "ZU-23 on Ural-375(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Ural-375 ZU-23", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1450"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Shilka(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "ZSU-23-4 Shilka", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1451"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Infrared SAM", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Strela-1 9P31(2Q-1C)", {' + aqMenuTitleHeavy + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "Strela-1 9P31", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1455"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Strela-10M3(2Q-2C)", {' + aqMenuTitleHeavy + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "Strela-10M3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1456"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Radar SAM", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SA-2(6Q-2C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "SA-2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1462"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "SA-3(3Q-2C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "SA-3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1463"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "HQ-7(3Q-2C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "HQ-7", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1458"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Osa 9A33 ln(2Q-2C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "Osa 9A33 ln", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1459"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Tunguska(2Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "2S6 Tunguska", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1460"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Tor(2Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "Tor 9A331", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1461"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Kub(5Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Kub", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1464"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Buk(3Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "LRSAM", ["type"] = "Buk", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1465"})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "SA-10(4Q-5C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "LRSAM", ["type"] = "SA-10", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "false", ["mass"] = "1466"})',
								]);
							} else {
								cmdArray = _.concat(cmdArray, [
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", ' + aqMenuTitleHeavy + ')',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Acquisition Count", {' + aqMenuTitleHeavy + '}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "acquisitionCnt", ["unitId"] = ' + unit.unitId + '})',
									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Support", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Early Warning Radar Short(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "EWR", ["type"] = "1L13 EWR", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1401"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Reload Group(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "reloadGroup", ["type"] = "", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1404"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Fuel Tanker(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedFuel", ["type"] = "M978 HEMTT Tanker", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1406"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Ammo Truck(1Q-1C)", {' + aqMenuTitleHeavy + ',"Support"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "unarmedAmmo", ["type"] = "M 818", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1407"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "IFVs", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M1043 HMMWV(1Q-1C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "armoredCar", ["type"] = "M1043 HMMWV Armament", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1425"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Stryker ATGM(1Q-1C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M1134 Stryker ATGM", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1426"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Stryker MGS(1Q-2C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M1128 Stryker MGS", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1427"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-2 Bradley(1Q-1C)", {' + aqMenuTitleHeavy + ', "IFVs"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "APC", ["type"] = "M-2 Bradley", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1422"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Tanks", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-60(1Q-1C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "M-60", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1431"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Leopard1A3(1Q-2C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Leopard1A3", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1432"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Leopard-2(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Leopard-2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1434"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Challenger2(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Challenger2", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1436"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Merkava_Mk4(1Q-3C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "Merkava_Mk4", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1437"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-1 Abrams(1Q-4C)", {' + aqMenuTitleHeavy + ', "Tanks"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "tank", ["type"] = "M-1 Abrams", ["unitId"] = ' + unit.unitId + ', ["crates"] = 4, ["mobile"] = "true", ["mass"] = "1438"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Artillary & MLRS", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "M-109(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "artillary", ["type"] = "M-109", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1440"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "MLRS(1Q-2C)", {' + aqMenuTitleHeavy + ', "Artillary & MLRS"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mlrs", ["type"] = "MLRS", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1445"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "AntiAir", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Vulcan(3Q-1C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Vulcan", ["unitId"] = ' + unit.unitId + ', ["crates"] = 1, ["mobile"] = "true", ["mass"] = "1452"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Gepard(3Q-2C)", {' + aqMenuTitleHeavy + ', "AntiAir"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileAntiAir", ["type"] = "Gepard", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1453"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Infrared SAM", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Avenger(1Q-2C)", {' + aqMenuTitleHeavy + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "M1097 Avenger", ["unitId"] = ' + unit.unitId + ', ["crates"] = 2, ["mobile"] = "true", ["mass"] = "1455"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Chaparral(2Q-3C)", {' + aqMenuTitleHeavy + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "M48 Chaparral", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1457"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Linebacker(1Q-3C)", {' + aqMenuTitleHeavy + ', "Infrared SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "samIR", ["type"] = "M6 Linebacker", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1458"})',

									'missionCommands.addSubMenuForGroup("' + unit.groupId + '", "Radar SAM", {' + aqMenuTitleHeavy + '})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Roland(3Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Roland", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1462"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Rapier(4Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Rapier", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1463"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Tor(2Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "mobileSAM", ["type"] = "Tor 9A331", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1461"})',
									'missionCommands.addCommandForGroup("' + unit.groupId + '", "Hawk(5Q-3C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "MRSAM", ["type"] = "Hawk", ["unitId"] = ' + unit.unitId + ', ["crates"] = 3, ["mobile"] = "true", ["mass"] = "1464"})',
									// 'missionCommands.addCommandForGroup("' + unit.groupId + '", "Patriot(5Q-5C)", {' + aqMenuTitleHeavy + ', "Radar SAM"}, sendCmd, {["action"] = "f10Menu", ["cmd"] = "LRSAM", ["type"] = "Patriot", ["unitId"] = ' + unit.unitId + ', ["crates"] = 5, ["mobile"] = "true", ["mass"] = "1467"})',
								]);
							}
						}
					}
					var sendClient = {action: "CMD", cmd: cmdArray, reqID: 0};
					var actionObj = {actionObj: sendClient, queName: 'clientArray'};
					masterDBController.cmdQueActions('save', serverName, actionObj)
						.catch(function (err) {
							console.log('erroring line208: ', err);
						})
					;
				}
			})
			.catch(function (err) {
				console.log('line :256', err);
			})
		;
	} else {
		var sendClient = {action: "CMD", cmd: cmdArray, reqID: 0};
		var actionObj = {actionObj: sendClient, queName: 'clientArray'};
		masterDBController.cmdQueActions('save', serverName, actionObj)
			.catch(function (err) {
				console.log('erroring line208: ', err);
			})
		;
	}
});
