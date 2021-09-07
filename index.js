const app = (require("express"))();
const fs = require("fs").promises;
const uuid = require("uuid").v4;
const JSZip = require("jszip");

let users = {};

function getHost(){
    return process.env.HOST || ("http://localhost:" + (process.env.PORT || "5000"));
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://orteil.dashnet.org");
    next();
});

app.get("/new", (req, res) => {
    if( ! req.query.hasOwnProperty("password") ) {
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }

    if( req.query.password != process.env.PASSWORD ){
        res.writeHead(401);
        res.end(JSON.stringify({ "error": "invalid password" }));
        return;
    }

    let user = uuid();
    users[user] = { bakery: "(unknown)", cps: 0, cpc: 0, cookies: 0, buildings: {}, prestige: 0 };

    res.writeHead(200);
    res.end(JSON.stringify({ "id": user }));
});

app.get("/cps", (req, res) => {
    if( ! req.query.hasOwnProperty("user") || ! req.query.hasOwnProperty("cps") || ! req.query.hasOwnProperty("bakery") || ! req.query.hasOwnProperty("cookies") || ! req.query.hasOwnProperty("prestige") ){
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }

    if( ! users.hasOwnProperty(req.query.user) ){
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
    if( ! req.query.hasOwnProperty("user") || ! req.query.hasOwnProperty("cpc") || ! req.query.hasOwnProperty("bakery") || ! req.query.hasOwnProperty("cookies") || ! req.query.hasOwnProperty("prestige") ){
        res.writeHead(400);
        res.end(JSON.stringify({ "error": "missing parameters" }));
        return;
    }

    if( ! users.hasOwnProperty(req.query.user) ){
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

app.listen(process.env.PORT || 5000);

setInterval(async () => {
    await fs.writeFile("cookie.json", JSON.stringify(users));
}, 5000);

(async () => {
    try {
        users = JSON.parse(await fs.readFile("cookie.json"));
    } catch(e) {
        console.log(e);
        users = {};
    }
})();