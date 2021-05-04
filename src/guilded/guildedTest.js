const https = require("https");
const { Client } = require("@guildedjs/guilded.js");

const client = new Client();
/*
client.on('ready',async () => {
    console.log(`Bot is successfully logged in`)
});

client.on("messageCreate", message => {
    if(message.content === "-test") {
        console.log("showingMessages: ", message.channel);
        return message.channel.send("test message is working");
    }
})

client.login({
    email: "andrewfinegan@gmail.com",
    password: "MrcommsGuilded@"
});
*/

function setLockedSide(userId, side, credentials, isAdd) {
    const teamId = "NRgn0wvj";
    const redRoleId = "24239535";
    const blueRoleId = "24239536";

    let curRoleToPromote = ""

    if (side === 1) {
        curRoleToPromote = redRoleId;
    } else if (side === 2) {
        curRoleToPromote = blueRoleId;
    }

    const req = https.request({
            'method': 'POST',
            'hostname': 'www.guilded.gg',
            'path': '/api/login',
            'headers': {}
        }, (res) => {
            res.on("data", () => {});
            res.on("end", () => {
                let options = "";

                if ( isAdd ) {
                    options = {
                        'method': 'PUT',
                        'hostname': 'www.guilded.gg',
                        'path': '/api/teams/' + teamId + '/roles/' +curRoleToPromote + '/users/' + userId,
                        'headers': {
                            'Cookie' : res.headers['set-cookie']
                        }
                    };
                } else {
                    options = {
                        'method': 'DELETE',
                        'hostname': 'www.guilded.gg',
                        'path': '/api/teams/' + teamId + '/roles/' +curRoleToPromote + '/users/' + userId,
                        'headers': {
                            'Cookie' : res.headers['set-cookie']
                        }
                    };
                }


                const req2 = https.request(options, (res2) => {
                    res2.on("data", () => {});
                    res2.on("end", () => {});
                    res2.on("error", (error) => {
                        console.error(error);
                    });
                });
                req2.end();
            });
            res.on("error", (error) => {
                console.error(error);
            });
        }
    );

    let postData = `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"email\"\r\n\r\n` + credentials[0] + `\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\n` + credentials[1] + `\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--`;
    req.setHeader('content-type', 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');
    req.write(postData);
    req.end();
}

setLockedSide("x4oNooZA", 2, ["andrewfinegan@gmail.com", "MrcommsGuilded@"], false);