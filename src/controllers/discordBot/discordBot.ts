/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

const dBot = {};
const twoMin = 2 * 60 * 1000;

const srsFilePaths = [
    // { name: 'DDCS1978ColdWar', path: 'C:/Users/andre/Desktop/testClient/2/clients-list.json' },
    // { name: 'DDCSModern', path: 'C:/Users/andre/Desktop/testClient/1/clients-list.json' }
    { name: "DDCS1978ColdWar", path: "C:/Users/MegaServer/Desktop/SRS/DDCS-Standard/clients-list.json" },
    { name: "DDCSModern", path: "C:/Users/MegaServer/Desktop/SRS/DDCS-Hardcore/clients-list.json" }
];

/*
fs.readFileAsyncArray(fileObj) {
    return new Promise((resolve: any, reject: any) => {
        fs.readFile(fileObj.path, (err, data) => {
            if (err) {
                reject(err);
            } else {
                fileObj.data = JSON.parse(data);
                resolve(fileObj);
            }
        });
    });
}
*/

export function getName(vcUser: any) {
    if (vcUser.nickname) {
        return vcUser.nickname;
    }
    return vcUser.user.username;
}

export async function setDiscordOnlineStatus(onlineStatus: boolean) {
    console.log("firingsetdiscord");
    const srvs = await ddcsControllers.serverActionsRead({enabled: true});
    for (const srv of srvs) {
        const curServerName = srv._id;
        console.log("update server: " + curServerName + " " + onlineStatus);
        await ddcsControllers.serverActionsUpdate({
            name: curServerName,
            isDiscordOnline: onlineStatus
        });
    }
}

export function clientLogin(cObj: any, token: string) {
    cObj.login(token)
        .then(() => {
            console.log("Client login successful");
        })
        .catch(() => {
            console.log("Client login failure");
            exports.setDiscordOnlineStatus(false);
            setTimeout(() => {
                exports.clientLogin(cObj, token);
            }, 5 + 1000);
        });
}


/*
fs.readFile(__dirname + "/../../.config.json", (err, data) => {
    if (err) {
        return err;
    } else {
        const tokenID = JSON.parse(data);
        _.set(exports, 'sendSoundBite', function (vcArray, songFile) {
            vcArray[0].join().then(function (connection) {
                const dispatcher = connection.playFile(songFile);
                dispatcher.on("end", function (end) {
                    vcArray[0].leave();
                    if (vcArray.length !== 1) {
                        vcArray.shift();
                        exports.sendSoundBite(vcArray, songFile);
                    }
                });
            }).catch(err => console.log(err));
        });

        const client = new Discord.Client();
        dBot.clientLogin(client, _.get(tokenID, ['discord', 'token']));
        client.on('resume', () => { console.log('socket resumes'); dBot.setDiscordOnlineStatus(true); }) ;
        client.on('disconnect', () => { console.error('Connection lost...'); dBot.setDiscordOnlineStatus(false); });
        client.on('reconnecting', () => { console.log('Attempting to reconnect...'); dBot.setDiscordOnlineStatus(false); });
        client.on('error', error => { console.error(error.message); });
        client.on('warn', info => { console.error(info.message); });
        client.on('ready', () => {
            console.log('Ready!');
            dBot.setDiscordOnlineStatus(true);
            dBot.counter = 0;
            setInterval (function (){
                var curGuild = client.guilds.get('389682718033707008');
                var discordByChannel = {};
                var discordVoiceNames = ['Drexserver'];
                var SRSObjs = [];
                var voiceChans;
                var filePromise = [];

                masterDBController.remoteCommsActions('removeNonCommPeople', {})
                    .catch(function (err) {
                        console.log('line34', err);
                    })
                ;

                _.forEach(SRSFilePaths, function (SRS) {
                    filePromise.push(fs.readFileAsyncArray(SRS));
                });

                Promise.all(filePromise)
                    .then( function(srsfiles) {
                        _.forEach(srsfiles, function (srsfile) {
                            _.forEach(srsfile.data, function (curObj) {
                                _.set(curObj, 'SRSServer', srsfile.name);
                                SRSObjs.push(curObj);
                            });
                        });
                        voiceChans = curGuild.channels.filter(ch => ch.type === 'voice');
                        _.forEach(Array.from(voiceChans.values()), function (voiceChan) {
                            // console.log('voicechan: ', voiceChan.name);
                            //skip checking AFK
                            if(_.get(voiceChan, 'name') !== "AFK") {
                                _.forEach(Array.from(voiceChan.members.values()), function (vcUser) {
                                    // console.log('nick: ', vcUser.nickname, 'un: ', _.get(vcUser, 'user.username'));
                                    _.set(discordByChannel, [voiceChan.name, dBot.getName(vcUser)], vcUser);
                                    discordVoiceNames.push(dBot.getName(vcUser));
                                });
                            }
                        });

                        curGuild.members.forEach(member => {
                            var curUser = {};
                            var curPlayerName = dBot.getName(member);
                            var SRSMember = _.find(SRSObjs, {Name: curPlayerName});
                            _.assign(curUser, {
                                _id: curPlayerName,
                                isInSRS: !!SRSMember,
                                isInDiscord: !!_.includes(discordVoiceNames, curPlayerName),
                                SRSData: SRSMember
                            });
                            masterDBController.remoteCommsActions('update', curUser)
                                .catch(function (err) {
                                    console.log('line63', err);
                                })
                            ;
                        });
                    })
                    .catch(function (err) {
                        console.log('line52', err);
                    })
                ;
            }, 60 * 1000);
        });
        client.on('message', message => {
            console.log(message.content);

            if (message.content === '!patreon') {
                message.channel.send('https://www.patreon.com/dynamicdcs');
            }
            if (message.content === '!paypal') {
                message.channel.send('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HSRWLCYNXQB4N');
            }
            if (message.content === '!America') {
                var channelsToPlay = [
                    'General',
                    // 'Red Gen Chat(Relaxed GCI)',
                    // 'Blue Gen Chat(Relaxed GCI)',
                ];
                var vcArray = [];
                var songFile = 'C:/Users/MegaServer/DynamicDCS/sndBites/AMERICAshort.mp3';
                var curGuild = client.guilds.get('389682718033707008');

                _.forEach(channelsToPlay, function (channel) {
                    vcArray.push(_.first(curGuild.channels.filter(ch => ch.type === 'voice' && ch.name === channel).array()));
                });

                //vcArray.push(_.first(curGuild.channels.filter(ch => ch.type === 'voice' && ch.name === 'Here But Coding').array()));
                //vcArray.push(_.first(curGuild.channels.filter(ch => ch.type === 'voice' && ch.name === 'Group 1').array()));
                // vcArray = curGuild.channels.filter(ch => ch.type === 'voice').array();

                exports.sendSoundBite(vcArray, songFile);

                message.channel.send('testPlay');
            }
            if (message.content === '!F-18') {
                var channelsToPlay = [
                    'General',
                    // 'Red Gen Chat(Relaxed GCI)',
                    // 'Blue Gen Chat(Relaxed GCI)',
                ];
                var vcArray = [];
                var songFile = 'C:/Users/MegaServer/DynamicDCS/sndBites/DCS_World_FA-18C_Hornet_Menu_Theme.mp3';
                var curGuild = client.guilds.get('389682718033707008');

                _.forEach(channelsToPlay, function (channel) {
                    vcArray.push(_.first(curGuild.channels.filter(ch => ch.type === 'voice' && ch.name === channel).array()));
                });

                //vcArray.push(_.first(curGuild.channels.filter(ch => ch.type === 'voice' && ch.name === 'Here But Coding').array()));
                //vcArray.push(_.first(curGuild.channels.filter(ch => ch.type === 'voice' && ch.name === 'Group 1').array()));
                // vcArray = curGuild.channels.filter(ch => ch.type === 'voice').array();

                exports.sendSoundBite(vcArray, songFile);

                message.channel.send('testPlay');
            }
        });
    }
}
 */
