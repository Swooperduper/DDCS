/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

(function (angular) {
	'use strict';

	function controlService (
		$q,
		$window,
		$http,
		userAccountService,
		unitStaticService,
		uiGmapIsReady,
		uiGmapGoogleMapApi
	) {
		var gSrv = this;
		_.set(gSrv, 'clearBaseOverlay', function () {
			_.forEach(gSrv.baseOverlay, function (base) {
				base.setMap(null);
			});
			_.set(gSrv, 'baseOverlay', {});
		});
		_.set(gSrv, 'clearCircleOverlay', function () {
			_.forEach(gSrv.circleOverlay, function (circle) {
				circle.setMap(null);
			});
			_.set(gSrv, 'circleOverlay', {});
		});
		_.set(gSrv, 'getOverlayJSON', function (theaterObj) {
			return $http.get(theaterObj.overlayFile)
				.then(function (overlayCoordsJSON) {
					_.set(gSrv, 'overlayCoords', overlayCoordsJSON.data);
				})
				.catch(function(err){
					/* eslint-disable no-console */
					console.log('line29', err);
					/* eslint-enable no-console */
				})
			;
		});
		_.set(gSrv, 'getSIDCJSON', function () {
			return $http.get('json/sidc.json')
				.then(function (sidJSON) {
					_.set(gSrv, 'SIDC', sidJSON.data);
				})
				.catch(function(err){
					/* eslint-disable no-console */
					console.log('line49', err);
					/* eslint-enable no-console */
				})
			;
		});
		_.set(gSrv, 'mapStyles', function () {
			return [
				{
					"featureType": "administrative.neighborhood",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "poi",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "poi",
					"elementType": "labels.text",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "road",
					"elementType": "labels",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "transit.line",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "transit.station.bus",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "transit.station.rail",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "water",
					"elementType": "labels.text",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				}
			];
		});
		_.set(gSrv, 'setupGmapObj', function (theaterObj) {
			_.set(gSrv, 'gmapObj', {
				center: {
					latitude: _.toNumber(_.get(theaterObj, 'lat')),
					longitude: _.toNumber(_.get(theaterObj, 'lon'))
				},
				zoom: _.toNumber(_.get(theaterObj, 'zoom')),
				window: {
					model: {}
				},
				options: {
					mapTypeId: 'terrain',
					styles: gSrv.mapStyles()
				},
				markers: [],
				markersEvents: {
					click: function(marker, eventName, model) {
						gSrv.gmapObj.window = {
							coords: {
								latitude: model.latitude,
								longitude: model.longitude
							},
							options: {
								visible: true,
								pixelOffset: {height: -32, width: 0}
							},
							model: model,
							show: true
						};
					},
					rightclick:  function(marker, eventName, model) {
						var curLatLng = new gSrv.googleMaps.LatLng(model.latitude, model.longitude);
						gSrv.displayCoordinates(curLatLng);
					}
				}
			});
		});
		_.set(gSrv, 'processBases', function (basesArray) {
			gSrv.clearBaseOverlay();
			gSrv.clearCircleOverlay();
			_.forEach(basesArray, function (base) {
				gSrv.addOverlay(base, base.side);
			});
		});
		_.set(gSrv, 'processUnitsStatics', function (unitArray) {
			_.set(gSrv, 'gmapObj.markers', []);
			_.forEach(unitArray, function (unit) {
				gSrv.createMarker(unit);
			});
		});
		_.set(gSrv, 'createMarker', function (unit) {
			var curSymbol = gSrv.buildSIDC(unit);
			if (!curSymbol) {
				/* eslint-disable no-console */
				console.log('undefinedSymbol: ', unit);
				/* eslint-enable no-console */
			}
			var curMarker = _.cloneDeep(unit);
			_.assign(curMarker, {
				id: unit._id,
				anchorPoint: curSymbol.getAnchor(),
				icon: curSymbol.asCanvas().toDataURL(),
				coords: unit.lonLatLoc,
				latitude: unit.lonLatLoc[1],
				longitude: unit.lonLatLoc[0],
				zIndex: unit.unitId
			});
			_.get(gSrv, 'gmapObj.markers').push(curMarker);
		});
		_.set(gSrv, 'updateMarker', function (unit) {
			var curMarker = _.find(_.get(gSrv, 'gmapObj.markers'), {id: unit._id});
			_.set(curMarker, 'latitude', unit.lonLatLoc[1]);
			_.set(curMarker, 'longitude', unit.lonLatLoc[0]);
			_.set(curMarker, 'alt', unit.alt);
			_.set(curMarker, 'hdg', unit.hdg);
			_.set(curMarker, 'speed', unit.speed);
			if (typeof _.get(curMarker, 'type') !== 'undefined') {
				var curSymbol = gSrv.buildSIDC(curMarker);
				_.set(curMarker, 'anchorPoint', curSymbol.getAnchor());
				_.set(curMarker, 'icon', curSymbol.asCanvas().toDataURL());
			}
		});
		_.set(gSrv, 'delMarker', function (unit) {
			_.remove(_.get(gSrv, 'gmapObj.markers'), {id: unit._id});
		});
		//process inbound Unit Stream
		_.set(gSrv, 'processUnitStream', function (update) {
			if(update.action === 'C') {
				gSrv.createMarker(update.data);
			}
			if(update.action === 'U') {
				gSrv.updateMarker(update.data);
			}
			if(update.action === 'D') {
				gSrv.delMarker(update.data);
			}
		});
		//process inbound Unit Stream
		_.set(gSrv, 'buildSIDC', function (unit) {
			// console.log('uu: ', unit);
			var _sidcObject = {};
			_sidcObject["codingScheme"] = 'S';
			_sidcObject["affiliation"] = 'U';
			_sidcObject["battleDimension"] = 'G';
			_sidcObject["status"] = '-';
			_sidcObject["functionID"] = '-----';
			_sidcObject["modifier1"] = '-';
			_sidcObject["modifier2"] = '-';
			_sidcObject["modifier3"] = '*';

			var lookup = gSrv.SIDC[unit.type];
			if (!lookup)
				return;
			var atr;
			for (atr in lookup) {
				if (lookup[atr])
					_sidcObject[atr] = lookup[atr];
			}

			var markerColor;
			if (unit.coalition === 1) {
				markerColor = 'rgb(255, 88, 88)';
				_sidcObject["affiliation"] = 'H';
			}
			if (unit.coalition === 2) {
				markerColor = 'rgb(128, 224, 255)';
				_sidcObject["affiliation"] = 'F';
			}

			// Generate final SIDC string
			var _sidc = "";
			for (atr in _sidcObject) {
				_sidc += _sidcObject[atr];
			}

			var ratio = window.devicePixelRatio || 1;
			var sidOpt = {
				size: 25 * ratio,
				fill: markerColor,
				stroke: 'rgb(0, 0, 0)',
				infoColor: 'black'
			};
			if (unit.playername !== '') {
				_.set(sidOpt, 'type', unit.playername);
			}

			return new $window.ms.Symbol( _sidc + '****', sidOpt );
		});
		_.set(gSrv, 'addOverlay', function (base, side) {
			//console.log('addoverlay gmap: ',base,side);
			var baseName = _.get(base, 'name');
			if (  gSrv.overlayCoords[baseName] && gSrv.googleMaps ) {
				if ( typeof gSrv.overlayCoords[baseName].lat1 !== "undefined" && side !== 0 ) {
					var imageBounds = new gSrv.googleMaps.LatLngBounds(
						new gSrv.googleMaps.LatLng(gSrv.overlayCoords[baseName].lat1,
							gSrv.overlayCoords[baseName].lng1),
						new gSrv.googleMaps.LatLng(gSrv.overlayCoords[baseName].lat2,
							gSrv.overlayCoords[baseName].lng2)
					);

					_.set(gSrv, ['baseOverlay', baseName],
						new gSrv.googleMaps.GroundOverlay('imgs/mapOverlays/' +
							baseName + '_' + side + '.png', imageBounds));
					_.get(gSrv, ['baseOverlay', baseName]).setMap(gSrv.currentMap);

					gSrv.googleMaps.event.addListener(
						_.get(gSrv, ['baseOverlay', baseName]),
						'rightclick',
						function(e){
							gSrv.displayCoordinates(e.latLng);
						}
					);
				}

				if ( typeof gSrv.overlayCoords[baseName].latc !== "undefined" ) {
					var center =  {lat: gSrv.overlayCoords[baseName].latc, lng: gSrv.overlayCoords[baseName].lngc};
					var overlayRadius = _.get(gSrv, ['overlayCoords', baseName, 'capturePoint']) ? 7500 : 15000;
					var sideColor = { "1": '#ff5555', "2": '#00aaff' };
					var curSideColor = (_.get(base, 'baseType') === 'MOB') ? sideColor[side]: null;
					// console.log('base: ', base, curSideColor);


					_.set(gSrv, ['circleOverlay', baseName], new gSrv.googleMaps.Circle({
						strokeColor: curSideColor,
						fillColor: curSideColor,
						strokeOpacity: 0.2,
						strokeWeight: 0,
						map: gSrv.currentMap,
						center: center,
						radius: overlayRadius
					}));

					gSrv.googleMaps.event.addListener(
						_.get(gSrv, ['circleOverlay', baseName]),
						'rightclick',
						function(e){
							gSrv.displayCoordinates(e.latLng);
						}
					);
				}
			}
		});
		/*
		_.set(gSrv, 'updateOverlay', function (base, side) {
			if(!_.includes(base, '_MOB') || !_.includes(base, '_FOB')){ //until farps have a img overlay, bypass them...
				_.get(gSrv, ['baseOverlay', base]).setMap(null);
				delete gSrv.baseOverlay[base];
			}
			_.get(gSrv, ['circleOverlay', base]).setMap(null);
			delete gSrv.circleOverlay[base];

			gSrv.addOverlay(base, side);
		});
		 */
		_.set(gSrv, 'init', function (serverName, theaterObj) {
			_.set(userAccountService, 'localAccount.headerInfo', 'Right Click Map For Point Info');
			gSrv.setupGmapObj(theaterObj);
			uiGmapIsReady.promise()
				.then(function (maps) {
					var prePromise = [];
					_.set(gSrv, 'currentMap', maps[0].map);
					prePromise.push(gSrv.getOverlayJSON(theaterObj));
					prePromise.push(gSrv.getSIDCJSON());
					$q.all(prePromise)
						.then(function () {
							// console.log('json grabbed', gSrv.overlayCoords, gSrv.SIDC);
							uiGmapGoogleMapApi.then(function (googleMaps) {
								_.set(gSrv, 'googleMaps', googleMaps);
								_.set(gSrv, 'gmapObj.options.mapTypeControlOptions.position',
									googleMaps.ControlPosition.LEFT_BOTTOM);
								gSrv.googleMaps.event.addListener(
									gSrv.currentMap,
									'zoom_changed',
									function () {
										var zoomLevel = gSrv.currentMap.getZoom();
										if( zoomLevel >
											_.toNumber(
												_.get(theaterObj, 'removeSideZone')
											)
										){
											_.forOwn(gSrv.circleOverlay, function (value, key){
												gSrv.circleOverlay[key].setVisible(false);
											});
										}else{
											_.forOwn(gSrv.circleOverlay, function (value, key){
												gSrv.circleOverlay[key].setVisible(true);
											});
										}
									}
								);
								_.set(gSrv, 'displayCoordinates', function (pnt) {
									var userUnit;
									var toHeading;
									var toDistance;
									_.set(
										userAccountService,
										'localAccount.unit',
										_.find(
											gSrv.gmapObj.markers,
											{playername: userAccountService.localAccount.gameName}
										)
									);
									_.set(
										userAccountService,
										'localAccount.curPointer',
										{lat: pnt.lat(), lng: pnt.lng()}
									);
									if (typeof userAccountService.localAccount.unit !== 'undefined') {
										userUnit = new gSrv.googleMaps.LatLng(
											userAccountService.localAccount.unit.latitude,
											userAccountService.localAccount.unit.longitude
										);
										toHeading = gSrv.googleMaps.geometry.spherical.computeHeading(userUnit, pnt);
										if (toHeading > 0) {
											toHeading = Math.round(toHeading);
										} else {
											toHeading = Math.round(360+toHeading);
										}
										_.set(userAccountService, 'localAccount.headingToPoint', toHeading);
										toDistance = (gSrv.googleMaps.geometry.spherical.computeDistanceBetween(userUnit, pnt) / 1000).toFixed(2);
										_.set(
											userAccountService,
											'localAccount.headerInfo',
											'Lat: '+
												pnt.lat().toFixed(6)+
												' Lng: '+
												pnt.lng().toFixed(6)+
												'<br>HdgToCursor: '+
												toHeading+
												'° DistToCursor: '+
												toDistance+
												'km'
										);
									} else {
										_.set(
											userAccountService,
											'localAccount.headerInfo',
											'Lat: '+
												pnt.lat().toFixed(6)+
												' Lng: '+
												pnt.lng().toFixed(6)
										);
									}
								});

								gSrv.googleMaps.event.addListener(gSrv.currentMap, 'rightclick', function (event) {
									gSrv.displayCoordinates(event.latLng);
								});

								unitStaticService.init(serverName)
									.then(function(){
										gSrv.processBases(unitStaticService.bases);
										gSrv.processUnitsStatics(unitStaticService.unitStatics);
									})
									.catch(function(err){
										/* eslint-disable no-console */
										console.log('line218', err);
										/* eslint-enable no-console */
									})
								;
							});
						})
						.catch(function(err){
							/* eslint-disable no-console */
							console.log('line58', err);
							/* eslint-enable no-console */
						})
					;
				})
				.catch(function(err){
					/* eslint-disable no-console */
					console.log('line58', err);
					/* eslint-enable no-console */
				})
			;
		});
	}
	controlService.$inject = ['$q', '$window', '$http', 'userAccountService', 'unitStaticService', 'uiGmapIsReady', 'uiGmapGoogleMapApi'];

	angular
		.module('ddcs.gmapService',[
			'uiGmapgoogle-maps',
			'ddcs.unitStaticService'
		])
		.config(function(uiGmapGoogleMapApiProvider) {
			uiGmapGoogleMapApiProvider.configure({
				key: 'AIzaSyBtYlyyT5iCffhuFc07z8I-fTq6zuWkFjI',
				libraries: 'weather,geometry,visualization'
			});
		})
		.service('gmapService', controlService)
	;
}(angular));
