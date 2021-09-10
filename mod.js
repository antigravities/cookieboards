// TODO: Check for updates on load in a non destructive way

const CookieBoards = {};

CookieBoards.disabled = false;
CookieBoards.awaitingPrompt = false;

function login(pw) {
    CookieBoards.awaitingPrompt = false;

    if( pw === "" ){
        CookieBoards.disabled = true;
        return false;
    }

    try {
        CookieBoards.userID = fetch("{{HOST}}/new?password=" + encodeURIComponent(pw))
                .then(response => response.json())
                .then((data) => {
                    if( data.error ){
                        console.log(data);
                        prompt();
                    }
                    return data.id;
                });
    } catch(e) {
        console.log(e);
        prompt();
    }
}

async function prompt(){
    Game.Prompt('<h3>Login to CookieBoards!</h3><div class="block">Please enter the secret password. If you don\'t know what it is, ask the person who set up the server. Entering nothing will disable the mod.".</div><div class="block"><textarea id="textareaPrompt" style="width:100%;height:128px;"></textarea></div>',[['Lets Go!','login(l(\'textareaPrompt\').value);Game.ClosePrompt();']]);
}

CookieBoards.getUserId = async () => {
    if( CookieBoards.userID ) return CookieBoards.userID;

    if( CookieBoards.disabled ) return false;

    if( CookieBoards.awaitingPrompt ) return false;
    CookieBoards.awaitingPrompt = true;

    prompt();
};

CookieBoards.getBakeryName = () => {
    return document.querySelector("#bakeryName").innerText;
};

CookieBoards.reportCPS = async cps => {
    cps = Game.cookiesPs*(1-Game.cpsSucked);

    let userID = await CookieBoards.getUserId();
    if( await userID === false ) return;

    try {
        let report = await (await fetch("{{HOST}}/cps?user=" + encodeURIComponent(await CookieBoards.userID) + "&cps=" + encodeURIComponent(cps) + "&bakery=" + encodeURIComponent(CookieBoards.getBakeryName()) + "&cookies=" + Game.cookies + "&prestige=" + Game.prestige)).json();
        
        if( report.error ){
            console.log(report);
        }
    } catch(e){
        console.log(e);
    }
};

CookieBoards.reportCPC = async cpc => {
    let userID = await CookieBoards.getUserId();
    if( await userID === false ) return;

    try {
        let report = await (await fetch("{{HOST}}/cpc?user=" + encodeURIComponent(await CookieBoards.userID) + "&cpc=" + encodeURIComponent(cpc) + "&bakery=" + encodeURIComponent(CookieBoards.getBakeryName()) + "&cookies=" + Game.cookies + "&prestige=" + Game.prestige)).json();
        
        if( report.error ){
            console.log(report);
        }
    } catch(e){
        console.log(e);
    }
};

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

// this causes main.js?v=2.090:22 Uncaught TypeError: str.replace
CookieBoards.save = () => {
    if( CookieBoards.userID ){
        return CookieBoards.userID;
    }
};

CookieBoards.load = data => {
    CookieBoards.userID = data;
};

Game.registerMod("CookieBoards__{{HOST}}", CookieBoards);
