const CookieBoards = {};
// not secure but who cares
let pw;

CookieBoards.disabled = false;
CookieBoards.awaitingPrompt = false;

async function prompt() {
    return new Promise((resolve, reject) => {
        CookieBoards.isPrompted = true;
        Game.Prompt('<h3>Login to CookieBoards!</h3><div class="block">Please enter the secret password. If you don\'t know what it is, ask the person who set up the server. Entering nothing will disable the mod.</div><div class="block"><input id="textareaPrompt" style="width:100%;" /></div>',[['Lets Go!','pw = l(\'textareaPrompt\').value;CookieBoards.isPrompted = false;Game.ClosePrompt();']]);
        function checkFlag() {
            if(CookieBoards.isPrompted === true) {
               window.setTimeout(checkFlag, 100); /* this checks the flag every 100 milliseconds*/
            } else {
              resolve();
            }
        }
        checkFlag();
    });
}

CookieBoards.getUserID = async () => {
    if( CookieBoards.userID ) return CookieBoards.userID;

    if( CookieBoards.disabled ) return false;

    if( CookieBoards.awaitingPrompt ) return false;
    CookieBoards.awaitingPrompt = true;

    while( true ){
        await prompt();

        CookieBoards.awaitingPrompt = false;

        if( pw === "" ){
            CookieBoards.disabled = true;
            return false;
        }

        let id;

        try {
            id = await (await fetch("{{HOST}}/new?password=" + encodeURIComponent(pw))).json();
        } catch(e) {
            console.log(e);
            pw = undefined;
            continue;
        }

        if( id.error ){
            console.log(id);
            pw = undefined;
            continue;
        }

        CookieBoards.userID = id.id;
        pw = undefined;
        break;
    }
};

CookieBoards.getBakeryName = () => {
    return document.querySelector("#bakeryName").innerText;
};

CookieBoards.reportCPS = async cps => {
    cps = Game.cookiesPs*(1-Game.cpsSucked);

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
};

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
};

Game.registerMod("CookieBoards__{{HOST}}", CookieBoards);