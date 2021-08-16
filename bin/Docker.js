#!/usr/bin/env node
const BdsCore = require("../index");
const { GetPlatform } = require("../lib/BdsSettings");
const { Servers } = require("../lib/ServerURL");
const { CronJob } = require("cron");
const BdsInfo = require("../BdsManegerInfo.json");

process.env.BDS_DOCKER_IMAGE = true;

function StartServer(){
    console.log("The entire log can be accessed via the api and/or the docker log");
    const ServerStarted = BdsCore.start();
    ServerStarted.log(a => process.stdout.write(a));
    ServerStarted.exit(process.exit);
    BdsCore.api();
    new CronJob("0 */1 * * *", async () => {
        try {
            const CurrentLocalVersion = BdsCore.getBdsConfig().server.versions[GetPlatform()],
                CurrentRemoteVersion = Object.getOwnPropertyNames((await (await fetch(BdsInfo.download.servers)).json())[GetPlatform()])[0];
            if (CurrentLocalVersion !== CurrentRemoteVersion) {
                let currenttime = `Hello we are starting the server upgrade from version ${CurrentLocalVersion} to version ${CurrentRemoteVersion}, you have 20 seconds to exit the server`
                console.log("Update Server:", currenttime);
                ServerStarted.say(currenttime);
                let countdown = 20;
                while (countdown > 1) {
                    currenttime = `${countdown} seconds remaining to stop Server!`;
                    console.log(currenttime);
                    ServerStarted.say(currenttime);
                    countdown--;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                currenttime = "Stopping the server"
                console.log(currenttime);
                ServerStarted.say(currenttime);
                await new Promise(resolve => setTimeout(resolve, 600));
                ServerStarted.stop();
            }
        } catch (err) {
            console.log(err);
        }
    });
}

// Check Installed Server
const AllVersions = BdsCore.BdsSettigs.GetJsonConfig().server.versions;
if (Object.getOwnPropertyNames(AllVersions).filter(platform => AllVersions[platform]).length >= 1) {
    if (process.env.UPDATE_SERVER === "true") {
        BdsCore.download(true, true, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            StartServer();
        });
    } else {
        // Check for Update
        if (AllVersions[GetPlatform()] === Object.getOwnPropertyNames(Servers[GetPlatform()])[0]) {
            console.log("The entire log can be accessed via the api and/or the docker log");
            const ServerStarted = BdsCore.start();
            ServerStarted.log(a => process.stdout.write(a));
            ServerStarted.exit(process.exit);
            BdsCore.api();
        } else {
            BdsCore.download(true, true, (err) => {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }
                StartServer();
            });
        }
    }
} else {
    console.log("Server is not installed, starting server implementation");
    // Import ENV to Settings Server
    const { DESCRIPTION, WORLD_NAME, GAMEMODE, DIFFICULTY, ACCOUNT, PLAYERS, SERVER, ENABLE_COMMANDS } = process.env;
    // Update Platform
    BdsCore.change_platform(SERVER || "bedrock");
    BdsCore.download(true, true, (err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        // Create JSON Config
        const ServerConfig = {
            world: WORLD_NAME,
            description: DESCRIPTION,
            gamemode: GAMEMODE,
            difficulty: DIFFICULTY,
            players: parseInt(PLAYERS),
            commands: ENABLE_COMMANDS === "true",
            account: ACCOUNT === "true",
            whitelist: false,
            port: 19132,
            portv6: 19133,
        }
        BdsCore.set_config(ServerConfig);
        StartServer();
    });
}