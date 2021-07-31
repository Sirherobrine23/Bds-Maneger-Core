const { bds_dir, GetServerBan, GetTelegramAdmins, GetPlatform, GetPaths } = require("../lib/BdsSettings");
const { existsSync, readFileSync } = require("fs")
const { join } = require("path")

module.exports.checkUser = function (admin_name){
    var adm = GetTelegramAdmins();
    for(let check_ in adm){
        const admin_check = adm[check_]
        if (admin_name === admin_check || admin_check === "all_users") return true;
    }
    return false
}

module.exports.CheckPlayer = function (player = "null"){
    const json = require(GetPaths("player"))[GetPlatform()];
    if (json[player]) return true; else return false
}

module.exports.token_verify = function (token){
    const path_tokens = join(bds_dir, "bds_tokens.json")
    if (existsSync(path_tokens)) var tokens = JSON.parse(readFileSync(path_tokens, "utf8")); else return false
    for (let token_verify of tokens) {
        const element = token_verify.token
        if (element === token) return true
    }
    return false
}

module.exports.CheckBan = function (player){
    var players = GetServerBan();
    for(let check_ in players){
        const admin_check = players[check_]
        if (player === admin_check.username) {
            if (admin_check[GetPlatform()]) return true
        }
    }
    return false
}