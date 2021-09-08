const app = (require("express"))();
const fs = require("fs").promises;
const uuid = require("uuid").v4;
const JSZip = require("jszip");

let users = {};

function getHost() {
    return process.env.HOST || ("http://localhost:" + (process.env.PORT || "5000"));
}

function getPassword() {
    if( ! process.env.PASSWORD ){
        console.warn(`You did not supply a password. It has been set to "dev". To supply a password, use the PASSWORD environment variable: PASSWORD="mypassword" ${process.argv.join(" ")}`);
        return "dev";
    }
    return process.env.PASSWORD;
}
const password = getPassword();

function adminPassword() {
    return process.env.ADMIN || false;
}

function getClientIp(req) {
    var ipAddr = req.connection.remoteAddress;
    if (!ipAddr) return '';

    // make it actually a IP (what the #$%@ was it before??!)
    if (ipAddr.substr(0, 7) == "::ffff:") {
        ipAddr = ipAddr.substr(7)
    }

    // and give back an actually sane IP, what
    return ipAddr;
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://orteil.dashnet.org");
    next();
});

async function getIpBlacklist() {
    try {
        return ipBlacklist = JSON.parse(await fs.readFile("ipBlacklist.json"));
    } catch (e) {
        console.log(e);
        return [];
    }
}

app.use(async (req, res, next) => {
    var ipAddr = getClientIp(req);
    let list = await getIpBlacklist();
    if (await list.list.indexOf(ipAddr) !== -1) console.log(`everyone! look at the fool with the ip ${ipAddr}`);
    else if (!req.query.hasOwnProperty("user") ) next();
    else if (users[req.query.user] == undefined) next(); // must be new!
    else if (users[req.query.user].blocked == true) console.log(`we blocked a connection attempt from ${req.query.user}`);
    else next();
});

app.get("/new", (req, res) => {
    if (!req.query.hasOwnProperty("password")) {
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }

    if (req.query.password != password) {
        res.writeHead(401);
        res.end(JSON.stringify({ "error": "invalid password" }));
        return;
    }

    let user = uuid();
    users[user] = { bakery: "(unknown)", cps: 0, cpc: 0, cookies: 0, buildings: {}, prestige: 0 };

    res.writeHead(200);
    res.end(JSON.stringify({ "id": user }));
});

// TODO: Why are there two endpoints for CPS and CPC? Could it be one?
// CPS sometimes effects CPC, but not always. Is it more or less intensive to have them combined? Adding another param only costs a few bytes.
// plus, its not like the bakery name updates each time, and yet here we are.
app.get("/cps", (req, res) => {
    if (!req.query.hasOwnProperty("user") || !req.query.hasOwnProperty("cps") || !req.query.hasOwnProperty("bakery") || !req.query.hasOwnProperty("cookies") || !req.query.hasOwnProperty("prestige")) {
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }

    if (!users.hasOwnProperty(req.query.user)) {
        res.writeHead(401);
        res.end(JSON.stringify({ "error": "user not found" }));
        return;
    }

    req.query.cps = req.query.cps.replace(/ /g, "+");
    req.query.cookies = req.query.cookies.replace(/ /g, "+");

    users[req.query.user].bakery = req.query.bakery;
    users[req.query.user].cps = (isNaN(parseFloat(req.query.cps)) ? 0 : parseFloat(req.query.cps)).toExponential().toString();
    users[req.query.user].cookies = (isNaN(parseFloat(req.query.cookies)) ? 0 : parseFloat(req.query.cookies)).toExponential().toString();
    users[req.query.user].prestige = (isNaN(parseFloat(req.query.cookies)) ? 0 : parseFloat(req.query.prestige));

    res.writeHead(200);
    res.end(JSON.stringify({ "ok": "reported score" }));
});

app.get("/cpc", (req, res) => {
    if (!req.query.hasOwnProperty("user") || !req.query.hasOwnProperty("cpc") || !req.query.hasOwnProperty("bakery") || !req.query.hasOwnProperty("cookies") || !req.query.hasOwnProperty("prestige")) {
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }

    if (!users.hasOwnProperty(req.query.user)) {
        res.writeHead(401);
        res.end(JSON.stringify({ "error": "user not found" }));
        return;
    }

    req.query.cpc = req.query.cpc.replace(/ /g, "+");
    req.query.cookies = req.query.cookies.replace(/ /g, "+");

    users[req.query.user].bakery = req.query.bakery;
    users[req.query.user].cpc = (isNaN(parseFloat(req.query.cpc)) ? 0 : parseFloat(req.query.cpc)).toString();
    users[req.query.user].cookies = (isNaN(parseFloat(req.query.cookies)) ? 0 : parseFloat(req.query.cookies)).toString();
    users[req.query.user].prestige = (isNaN(parseFloat(req.query.cookies)) ? 0 : parseFloat(req.query.prestige));

    res.writeHead(200);
    res.end(JSON.stringify({ "ok": "reported score" }));
});

app.get("/mod", async (req, res) => {
    res.writeHead(200);
    res.end((await fs.readFile("mod.js")).toString().replace(/\{\{HOST\}\}/g, getHost()))
});

app.get("/cookie", async (req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify(Object.values(users)));
});

app.get("/download", async (req, res) => {
    res.writeHead(200, { "Content-Type": "application/zip" });
    // TODO: Let's not regenerate the zip each call, a hash check should suffice
    var zip = new JSZip();

    let fol = zip.folder("cookieboards");
    fol.file("main.js", `Game.LoadMod("${getHost()}/mod");`);
    fol.file("info.txt", JSON.stringify({ "Name": `Cookie Clicker Leaderboards - ${getHost()}`, "ID": "cookies__" + getHost(), "Author": "Alexandra", "Description": `Report scores to ${getHost()}`, "GameVersion": "2.031", "Date": "06/09/2021", "Dependencies": [], "Disabled": 0, "AllowSteamAchievs": 1 }));

    (await zip.generateNodeStream()).pipe(res);
    return;
});

app.get("/", async (req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end((await fs.readFile("index.html")).toString().replace(/\{\{HOST\}\}/g, getHost()))
});

// allow admins and the user themself to give a user an alias, for if the user has a confusing bakery name and viewers may be unsure of who runs it
// this is not privileged because only admins and the user would know the user id
// this is not a method of handling abuse
// TODO: forced bakery names as actual ways to handle abuse (can't have oopsie names)
app.get("/alias", async (req, res) => {
    if (!req.query.hasOwnProperty("user") || !req.query.hasOwnProperty("alias")) {
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }

    if (!users.hasOwnProperty(req.query.user)) {
        res.writeHead(401);
        res.end(JSON.stringify({ "error": "user not found" }));
        return;
    }

    users[req.query.user].alias = req.query.alias;
});

// add a way to block users from an api

app.get("/block", async (req, res) => {
    if (!req.query.hasOwnProperty("type") || !req.query.hasOwnProperty("auth") || !req.query.hasOwnProperty("acc")) {
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }
    
    else if (adminPassword() == false) {
        res.writeHead(406);
        res.end(JSON.stringify({ "error": "admin commands have been disabled" }));
        return;
    }
    else if (req.query.auth !== adminPassword()) {
        res.writeHead(418);
        res.end(JSON.stringify({ "error": "stop it now!" }));
        return;
    }

    // if we reached this point the user is an admin and its ok to dump errors onto her ;)

    if (req.query.unblock !== "true") {
        if (req.query.type == "ip") {
            try {
                let list = await getIpBlacklist();
                list.list.push(req.query.acc);
                await fs.writeFile("ipBlacklist.json", JSON.stringify(list));
                res.writeHead(200);
                res.end();
            }
            catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ "error": error.message }));
            }
        }

        else if (req.query.type == "user") {
            try {
                users[req.query.user].blocked = true;
                res.writeHead(200);
                res.end();
            }
            catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ "error": error.message }));
            }
        }
    } else { // oooh an unban, I lazily copied and pasted code.
        if (req.query.type == "ip") {
            try {
                let list = await getIpBlacklist();
                list = list.list.filter(function(item) {
                    return item !== req.query.acc
                });
                await fs.writeFile("ipBlacklist.json", JSON.stringify(list));
                res.writeHead(200);
                res.end();
            }
            catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ "error": error.message }));
            }
        }

        else if (req.query.type == "user") {
            try {
                users[req.query.user].blocked = false;
                res.writeHead(200);
                res.end();
            }
            catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ "error": error.message }));
            }
        }        
    }
})

app.listen(process.env.PORT || 5000);

setInterval(async () => {
    await fs.writeFile("cookie.json", JSON.stringify(users));
}, 5000);

(async () => {
    try {
        users = JSON.parse(await fs.readFile("cookie.json"));
    } catch (e) {
        console.log(e);
        users = {};
    }
})();
