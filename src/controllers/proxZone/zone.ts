/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

// Calculate a new coordinate based on start, distance and bearing
export function mathFmod(a: number, b: number ): number {
    return Number((a - (Math.floor(a / b) * b)).toPrecision(8));
}

function geo_destination(lonLat: number[], dist: number, brng: number): number[] {
    const lon1 = toRad(lonLat[0]);
    const lat1 = toRad(lonLat[1]);
    dist = dist / 6371.01; // Earth's radius in km
    brng = toRad(brng);

    const lat2 = Math.asin( Math.sin(lat1) * Math.cos(dist) +
        Math.cos(lat1) * Math.sin(dist) * Math.cos(brng) );
    let lon2: number = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(lat1),
            Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2)) as number;
    lon2 = mathFmod((lon2 + 3 * Math.PI), (2 * Math.PI)) - Math.PI;

    return [toDeg(lon2), toDeg(lat2)];
}
function toRad(deg: number): number {
    return deg * Math.PI / 180;
}
function toDeg(rad: number): number {
    return rad * 180 / Math.PI;
}

export function findBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLon = (lng2 - lng1);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = (Math.atan2(y, x)) * 180 / Math.PI;
    const curDeg = 360 - ((brng + 360) % 360);
    return (curDeg === 360) ? 0 : curDeg;
}

export function calcDirectDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const latRad1 = toRad(lat1);
    const latRad2 = toRad(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(latRad1) * Math.cos(latRad2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

export function toDegreesMinutesAndSeconds(coordinate: number) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    return degrees + " " + minutes + " " + seconds;
}

export function convertDMS(lat: number, lng: number) {
    const latitude = toDegreesMinutesAndSeconds(lat);
    const latitudeCardinal = lat >= 0 ? "N" : "S";

    const longitude = toDegreesMinutesAndSeconds(lng);
    const longitudeCardinal = lng >= 0 ? "E" : "W";

    return latitude + " " + latitudeCardinal + "    " + longitude + " " + longitudeCardinal;
}

export function getLonLatFromDistanceDirection(lonLatLoc: number[], direction: number, distance: number): number[] {
    return geo_destination(lonLatLoc, distance, direction);
}

export function getBoundingSquare(pArray: number[]): object {
    let x1 = _.get(pArray, [0, 0]);
    let y1 = _.get(pArray, [0, 1]);
    let x2 = _.get(pArray, [0, 0]);
    let y2 = _.get(pArray, [0, 1]);
    for (let i = 1; i < pArray.length; i++) {
        x1 = ( x1 > _.get(pArray, [i, 0])) ? _.get(pArray, [i, 0]) : x1;
        x2 = ( x2 < _.get(pArray, [i, 0])) ? _.get(pArray, [i, 0]) : x2;
        y1 = ( y1 > _.get(pArray, [i, 1])) ? _.get(pArray, [i, 1]) : y1;
        y2 = ( y2 < _.get(pArray, [i, 1]) ) ? _.get(pArray, [i, 1]) : y2;
    }
    return {
        x1,
        y1,
        x2,
        y2
    };
}

export function isLatLonInZone(lonLat: number[], polyZone: any[]) {

    let next;
    let prev;
    let inPolygon = false;
    const pNum = polyZone.length - 1;

    next = 1;
    prev = pNum;

    while (next <= pNum) {
        if ((( polyZone[next][1] > lonLat[1] ) !== ( polyZone[prev][1] > lonLat[1] )) &&
            ( lonLat[0] < ( polyZone[prev][0] - polyZone[next][0] ) * ( lonLat[1] - polyZone[next][1] ) /
            ( polyZone[prev][1] - polyZone[next][1] ) + polyZone[next][0] )) {
                inPolygon = ! inPolygon;
            }
        prev = next;
        next = next + 1;
    }
    return inPolygon;
}

export function getRandomLatLonFromBase(baseName: string, polytype: string, zoneNum?: string): number[] {
    const engineCache = ddcsControllers.getEngineCache();
    const baseInfo: any = _.find(engineCache.bases, {_id: baseName});
    if (baseInfo) {
        _.get(baseInfo, ["polygonLoc", polytype]);
        const pGroups = baseInfo.polygonLoc[polytype];
        let pickedPoly;
        if (zoneNum) {
            pickedPoly = pGroups[zoneNum];
        } else {
            pickedPoly = _.sample(pGroups);
        }
        let lonLatFound = false;
        const bs = exports.getBoundingSquare(pickedPoly);
        while (!lonLatFound) {
            const lonLat = [
                _.random(bs.x1, bs.x2),
                _.random(bs.y1, bs.y2)
            ];
            if (exports.isLatLonInZone(lonLat, pickedPoly)) {
                lonLatFound = true;
                return lonLat;
            }
        }
    }
    return [];
}

export function getOppositeHeading(heading: number) {
    return (heading + 180) % 360;
}
