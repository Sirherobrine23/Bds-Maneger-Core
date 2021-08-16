const { join, resolve, basename } = require("path");
const { existsSync, writeFileSync, mkdirSync, readFileSync } = require("fs");
const { homedir } = require("os");
const { valid_platform } = require("./BdsSystemInfo");
const yaml = {
    parse: require("js-yaml").load,
    stringify: require("js-yaml").dump
}

// PATHs
const home = homedir();
const bds_dir = join(home, "bds_core");
if (!(existsSync(bds_dir))) mkdirSync(bds_dir, {recursive: true})

// Set default platform for bds maneger
var default_platformConfig;
if (valid_platform["bedrock"]) default_platformConfig = "bedrock";
else if (valid_platform["java"]) default_platformConfig = "java";
else if (valid_platform["pocketmine"]) default_platformConfig = "pocketmine";
else throw new Error("We cannot run any platforms on this system/device");

// Config Base to Bds Maneger Core and others Projects
var Config = {
    paths: {
        servers: join(bds_dir, "Servers"),
        backups: join(bds_dir, "Backups"),
        log: join(bds_dir, "Logs"),
        player: join(bds_dir, "Players.json")
    },
    bds: {
        enable_tmp_host: false
    },
    server: {
        platform: default_platformConfig,
        BackupCron: [
            {
                cron: "0 1 * * */3",
                Azure: false,
                Oracle: false,
                Google: false,
                Driver: false
            }
        ],
        versions: {
            bedrock: null,
            java: null,
            pocketmine: null,
            jsprismarine: null,
            spigot: null,
        },
        Settings: {
            java: {
                ram_mb: 1024
            }
        }
    },
    cloud: {
        Azure: {
            Account: null,
            AccountKey: null,
            Container: null
        },
        Oracle: {
            Bucket: null
        },
        Google: {},
        Driver: {
            RootID: null
        }
    },
    ban: [
        {
            username: "Steve",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
            spigot: true,
        },
        {
            username: "Alex",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
            spigot: true,
        },
        {
            username: "steve",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
            spigot: true,
        },
        {
            username: "alex",
            telegram: true,
            bedrock: true,
            java: true,
            pocketmine: true,
            jsprismarine: true,
            spigot: true,
        }
    ],
    telegram: {
        admins: ["all_users"],
        token: null
    }
}

// Config
const ConfigPath = join(resolve(homedir(), "bds_core"), "BdsConfig.yaml")
function SaveConfig(){writeFileSync(ConfigPath, yaml.stringify(Config));}
if (existsSync(ConfigPath)) Config = {
    ...Config,
    ...yaml.parse(readFileSync(ConfigPath, "utf8"))
}; else writeFileSync(ConfigPath, yaml.stringify(Config))
process.on("exit", () => SaveConfig())

// Paths
if (!(existsSync(Config.paths["backups"]))) mkdirSync(Config.paths["backups"], {recursive: true})
if (!(existsSync(Config.paths["log"]))) mkdirSync(Config.paths["log"], {recursive: true})
if (!(existsSync(Config.paths["servers"]))) mkdirSync(Config.paths["servers"], {recursive: true})

// Server Paths
const ServersPaths = {
    bedrock: join(Config.paths.servers, "Bedrock"),
    java: join(Config.paths.servers, "Java"),
    pocketmine: join(Config.paths.servers, "Pocketmine-MP"),
    jsprismarine: join(Config.paths.servers, "JSPrismarine"),
    dragonfly: join(Config.paths.servers, "Dragonfly_go"),
    spigot: join(Config.paths.servers, "Spigot")
}
Object.getOwnPropertyNames(ServersPaths).map(Servers => ServersPaths[Servers]).forEach(Servers => {
    if (!(existsSync(Servers))) {
        console.log(`Creating the ${basename(Servers)} Folder`);
        mkdirSync(Servers, {recursive: true})
    }
});

// get the path from the settings and return by function
function GetPaths(path = null){
    if (!(path)) throw new Error("Set path to get");
    if (!(path === "all" || Config.paths[path])) throw new Error("Put a valid path: " + Object.getOwnPropertyNames(Config.paths).join(", "));
    if (path === "all") return Config.paths
    return Config.paths[path]
}

// Get the server paths if you don't send a throw
function GetServerPaths(path = null){
    if (!(path)) throw new Error("Set path to get");
    if (!(ServersPaths[path])) throw new Error("Put a valid path: " + Object.getOwnPropertyNames(ServersPaths).join(", "));
    return ServersPaths[path]
}

// Update the settings and save at the same time so as not to lose any information from the Bds Maneger settings
function UpdateServerVersion(version = null, platform = Config.server.platform){
    if (Config.server.versions[platform] || Config.server.versions[platform] === null) {
        Config.server.versions[platform] = version;
        SaveConfig()
        return Config.server.versions[platform]
    } else throw new Error("Platform invalid")
}

// Update the entire Bds Manager Core platform
function UpdatePlatform(platform = Config.server.platform){
    platform = platform.toLocaleLowerCase();
    if (/bedrock/.test(platform)) {
        Config.server.platform = "bedrock";
        SaveConfig()
    } else if (/java/.test(platform)) {
        Config.server.platform = "java";
        SaveConfig()
    } else if (/pocketmine/.test(platform)) {
        Config.server.platform = "pocketmine";
        SaveConfig()
    } else if (/spigot/.test(platform)) {
        Config.server.platform = "spigot";
        SaveConfig()
    } else if (/jsprismarine/.test(platform)) {
        Config.server.platform = "jsprismarine";
        SaveConfig()
    } else throw new Error("platform no Exists")
    return platform
}

// Telegram
function UpdateTelegramToken(token = null){
    if (!(token)) throw new Error("Telegram Token invalid")
    Config.telegram.token = token
    SaveConfig()
    return token
}

const GetJsonConfig = () => Config;

const GetCronBackup = () => Config.server.BackupCron;
const GetPlatform = () => Config.server.platform;

const GetServerBan = () => Config.ban;
const GetServerVersion = () => Config.server.versions;
const GetServerSettings = (platform = Config.server.platform) => Config.server.Settings[platform];

const GetTelegramToken = () => Config.telegram.token;
const GetTelegramAdmins = () => Config.telegram.admins;

// Get a temporary host to connect to the server.
const GetTempHost = () => Config.bds.enable_tmp_host

// Enable and/or disable pick up temporary host.
function UpdateTempHost(enable = false){
    // Check Boolean
    if (typeof enable !== "boolean") {console.log("Use Boolean, default false"); enable = false;}
    
    // Save
    Config.bds.enable_tmp_host = enable
    SaveConfig();
    return true;
}

// Get the server settings
function GetCloudConfig(cloud = null){
    if (!(cloud) || !(Config.cloud[cloud])) throw new Error("Cloud no exists");
    return Config.cloud[cloud]
}

// Settings Cloud
// Azure
function Azure_Settings(account = null, key = null, container = null){
    if (!(account)) throw new Error("Set Azure Blob Account")
    if (!(key)) throw new Error("Set Azure Blob Key")
    if (!(container)) throw new Error("Set Azure Container")
    Config.cloud.Azure.Account = account
    Config.cloud.Azure.AccountKey = key
    Config.cloud.Azure.Container = container
    SaveConfig()
    return {
        Account: Config.cloud.Azure.Account,
        Key: Config.cloud.Azure.AccountKey,
        Container: Config.cloud.Azure.Container
    }
}

// Oracle
function Oracle_Settings(bucket = null){
    if (!(bucket)) throw new Error("Set Oracle Bucket name")
    Config.cloud.Oracle.Bucket = bucket
    return {
        Bucket: bucket
    }
}

// Google Drive
function Google_Driver_Settings(rootid = null){
    if (!(rootid)) {rootid = null; console.log("No Backup folder id added for Google Driver");}
    Config.cloud.Driver.RootID = rootid
    SaveConfig()
    return {
        RootID: rootid
    }
}

module.exports = {
    bds_dir: bds_dir,
    GetJsonConfig,
    GetPaths,
    GetServerPaths,
    GetServerSettings,
    UpdateServerVersion,
    GetServerVersion,
    GetServerBan,
    GetCronBackup,
    UpdatePlatform,
    GetPlatform,
    UpdateTelegramToken,
    GetTelegramToken,
    GetTelegramAdmins,
    GetTempHost,
    UpdateTempHost,
    GetCloudConfig,
    CloudConfig: {
        Azure: Azure_Settings,
        Oracle: Oracle_Settings,
        Driver: Google_Driver_Settings
    }
}
