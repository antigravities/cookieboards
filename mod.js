// TODO: Check for updates on load in a non destructive way

const CookieBoards = {};

CookieBoards.disabled = false;
CookieBoards.awaitingPrompt = false;

async function prompt(txt){
    return new Promise((resolve, reject) => {
        if( ! document.querySelector("#cookieboards__prompt") ){
            let div = document.createElement("div");
            div.innerHTML = `<div style="width: 60ch; height: 8em; position: absolute; top: 0; left: 0; background-color: white; z-index: 99999999999999999; padding: 1em; color: black;" id="cookieboards__prompt"><form action="" id="cookieboards__form"><span id="cookieboards__form-text"></span><br><input type="text" id="cookieboards__input"><br><br><input type="submit" value="Submit"></form>`
            document.body.appendChild(div);
        } else {
            document.querySelector("#cookieboards__prompt").style.display = "block";
        }

        document.querySelector("#cookieboards__form-text").innerText = txt;
        
        let hdl = e => {
            e.preventDefault();
            document.querySelector("#cookieboards__prompt").style.display = "none";
            document.querySelector("#cookieboards__form").removeEventListener("submit", hdl);
            resolve(document.querySelector("#cookieboards__input").value);
        }

        document.querySelector("#cookieboards__form").addEventListener("submit", hdl);
    });
}

CookieBoards.getUserID = async () => {
    if( CookieBoards.userID ) return CookieBoards.userID;

    if( CookieBoards.disabled ) return false;

    if( CookieBoards.awaitingPrompt ) return false;
    CookieBoards.awaitingPrompt = true;

    while( true ){
        let res = await prompt("Please enter the secret password. If you don't know what it is, ask the person who set up the server. Entering nothing will disable the mod.");

        CookieBoards.awaitingPrompt = false;

        if( res === "" ){
            CookieBoards.disabled = true;
            return false;
        }

        let id;

        try {
            id = await (await fetch("{{HOST}}/new?password=" + encodeURIComponent(res))).json();
        } catch(e) {
            console.log(e);
            continue;
        }

        if( id.error ){
            console.log(id);
            continue;
        }

        CookieBoards.userID = id.id;
        break;
    }
}

CookieBoards.getBakeryName = () => {
    return document.querySelector("#bakeryName").innerText;
}

CookieBoards.reportCPS = async cps => {
    cps = Game.cookiesPs;

    let userID = await CookieBoards.getUserID();
    if( userID === false ) return;

    try {
        let report = await (await fetch("{{HOST}}/cps?user=" + encodeURIComponent(userID) + "&cps=" + encodeURIComponent(cps) + "&bakery=" + encodeURIComponent(CookieBoards.getBakeryName()) + "&cookies=" + Game.cookies + "&prestige=" + Game.prestige)).json();
        
        if( report.error ){
            console.log(report);
        }
    } catch(e){
        console.log(e);
    }
}

CookieBoards.reportCPC = async cpc => {
    let userID = await CookieBoards.getUserID();
    if( userID === false ) return;

    try {
        let report = await (await fetch("{{HOST}}/cpc?user=" + encodeURIComponent(userID) + "&cpc=" + encodeURIComponent(cpc) + "&bakery=" + encodeURIComponent(CookieBoards.getBakeryName()) + "&cookies=" + Game.cookies + "&prestige=" + Game.prestige)).json();
        
        if( report.error ){
            console.log(report);
        }
    } catch(e){
        console.log(e);
    }
}

CookieBoards.init = () => {
    Game.registerHook("cps", cps => {
        CookieBoards.reportCPS(cps);
        return cps;
    });

    Game.registerHook("cookiesPerClick", cpc => {
        CookieBoards.reportCPC(cpc);
        return cpc;
    });
};

CookieBoards.save = () => {
    if( CookieBoards.userID ){
        return CookieBoards.userID;
    }
};

CookieBoards.load = data => {
    CookieBoards.userID = data;
}

Game.registerMod("CookieBoards__{{HOST}}", CookieBoards);
