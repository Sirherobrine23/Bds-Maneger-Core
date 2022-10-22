import path from "node:path";
import fsOld from "node:fs";
import fs from "node:fs/promises";
import * as Proprieties from "./lib/Proprieties";
import * as globalPlatfroms from "./globalPlatfroms";
import { platformManeger } from "@the-bds-maneger/server_versions";
import { pathControl, bdsPlatformOptions } from "./platformPathManeger";
import { commendExists } from "./lib/childPromisses";
import * as httpRequest from "./lib/httpRequest";
import { exists, readdirrecursive } from "./lib/extendsFs";
import { randomPort } from "./lib/randomPort";

export async function installServer(version: string|boolean, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, serverRoot, platformIDs, id } = await pathControl("bedrock", platformOptions);
  const bedrockData = await platformManeger.bedrock.find(version);
  const url = bedrockData?.url[process.platform];

  // Remover files
  await fs.readdir(serverPath).then(files => files.filter(file => !saveFileFolder.test(file))).then(files => Promise.all(files.map(file => fs.rm(path.join(serverPath, file), {recursive: true, force: true}))));

  const serverConfig = (await fs.readFile(path.join(serverPath, "server.properties"), "utf8").catch(() => "")).trim();
  await httpRequest.extractZip({url, folderTarget: serverPath});
  if (serverConfig) await fs.writeFile(path.join(serverPath, "server.properties"), serverConfig);
  await fs.writeFile(path.join(serverRoot, "version_installed.json"), JSON.stringify({version: bedrockData.version, date: bedrockData.date, installDate: new Date()}));

  if (platformIDs.length > 1) {
    let v4: number, v6: number;
    const platformPorts = (await Promise.all(platformIDs.map(id => getConfig({id})))).map(config => ({v4: config.serverPort, v6: config.serverPortv6}));
    while (!v4||!v6) {
      const tmpNumber = await randomPort();
      if (platformPorts.some(ports => ports.v4 === tmpNumber||ports.v6 == tmpNumber)) continue;
      if (!v4) v4 = tmpNumber;
      else v6 = tmpNumber;
    };
    await updateConfig("serverPort", v4, {id});
    await updateConfig("serverPortv6", v6, {id});
  }
  return {
    id, url,
    version: bedrockData.version,
    date: bedrockData.date
  };
}

// RegExp
export const saveFileFolder = /^(worlds|server\.properties|config|((permissions|allowlist|valid_known_packs)\.json)|(development_.*_packs))$/;
export const portListen = /\[.*\]\s+(IPv[46])\s+supported,\s+port:\s+([0-9]+)/;
export const started = /\[.*\]\s+Server\s+started\./;
export const player = /\[.*\]\s+Player\s+((dis|)connected):\s+(.*),\s+xuid:\s+([0-9]+)/;

export async function startServer(platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath, logsPath, id } = await pathControl("bedrock", platformOptions);
  if (!fsOld.existsSync(path.join(serverPath, "bedrock_server"+(process.platform==="win32"?".exe":"")))) throw new Error("Install server fist");
  const args: string[] = [];
  let command = path.join(serverPath, "bedrock_server");
  if ((["android", "linux"]).includes(process.platform) && process.arch !== "x64") {
    args.push(command);
    if (await commendExists("qemu-x86_64-static")) command = "qemu-x86_64-static";
    if (await commendExists("qemu-x86_64")) command = "qemu-x86_64";
    else if (await commendExists("box64")) command = "box64";
    else throw new Error("Cannot emulate x64 architecture. Check the documentents in \"https://github.com/The-Bds-Maneger/Bds-Maneger-Core/wiki/Server-Platforms#minecraft-bedrock-server-alpha\"");
  }
  const backendStart = new Date();
  const logFileOut = path.join(logsPath, `${backendStart.getTime()}_${process.platform}_${process.arch}.log`);
  const serverConfig: globalPlatfroms.actionsV2 = {
    serverStarted(data, done) {
      if (started.test(data)) done({
        onAvaible: new Date(),
        timePassed: Date.now() - backendStart.getTime()
      });
    },
    portListening(data, done) {
      const match = data.match(portListen);
      if (!match) return;
      const [, protocol, port] = match;
      const portData: globalPlatfroms.portListen = {port: parseInt(port), type: "UDP", host: protocol?.trim() === "IPv4" ? "127.0.0.1" : protocol?.trim() === "IPv6" ? "[::]" : "Unknown", protocol: protocol?.trim() === "IPv4" ? "IPv4" : protocol?.trim() === "IPv6" ? "IPv6" : "Unknown"};
      done(portData);
    },
    playerAction(data, playerConnect, playerDisconnect, playerUnknown) {
      if (player.test(data)) {
        const [, action,, playerName, xuid] = data.match(player);
        if (action === "connect") playerConnect({connectTime: new Date(), playerName: playerName, xuid});
        else if (action === "disconnect") playerDisconnect({connectTime: new Date(), playerName: playerName, xuid});
        else playerUnknown({connectTime: new Date(), playerName: playerName, xuid});
      }
    },
    stopServer(components) {
      components.actions.runCommand("stop");
      return components.actions.waitExit();
    },
    playerTp(actions, playerName, x, y, z) {
      if (!/".*"/.test(playerName) && playerName.includes(" ")) playerName = `"${playerName}"`;
      actions.runCommand("tp", playerName, x, y, z);
    },
  };
  return globalPlatfroms.actionV2({
    id,
    platform: "bedrock",
    processConfig: {command, args, options: {cwd: serverPath, maxBuffer: Infinity, env: {LD_LIBRARY_PATH: process.platform === "win32"?undefined:serverPath}, logPath: {stdout: logFileOut}}},
    hooks: serverConfig
  });
}

// Update file config
export type keyConfig = "serverName"|"gamemode"|"forceGamemode"|"difficulty"|"allowCheats"|"maxPlayers"|"onlineMode"|"allowList"|"serverPort"|"serverPortv6"|"viewDistance"|"tickDistance"|"playerIdleTimeout"|"maxThreads"|"levelName"|"levelSeed"|"defaultPlayerPermissionLevel"|"texturepackRequired"|"chatRestriction"|"mojangTelemetry";
export async function updateConfig(key: "serverName", value: string, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "gamemode", value: "survival"|"creative"|"adventure", platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "forceGamemode", value: boolean, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "difficulty", value: "peaceful"|"easy"|"normal"|"hard", platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "allowCheats", value: boolean, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "maxPlayers", value: number, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "onlineMode", value: boolean, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "allowList", value: boolean, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "serverPort", value: number, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "serverPortv6", value: number, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "viewDistance", value: number, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "tickDistance", value: "4"|"6"|"8"|"10"|"12", platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "playerIdleTimeout", value: number, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "maxThreads", value: number, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "levelName", value: string, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "levelSeed", value?: string, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "defaultPlayerPermissionLevel", value: "visitor"|"member"|"operator", platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "texturepackRequired", value: boolean, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "chatRestriction", value: "None"|"Dropped"|"Disabled", platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: "mojangTelemetry", value: boolean, platformOptions?: bdsPlatformOptions): Promise<string>;
export async function updateConfig(key: keyConfig, value: string|number|boolean, platformOptions: bdsPlatformOptions = {id: "default"}): Promise<string> {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const fileProperties = path.join(serverPath, "server.properties");
  if (!fsOld.existsSync(fileProperties)) throw new Error("Install server fist!");
  let fileConfig = await fs.readFile(fileProperties, "utf8");
  if (key === "serverName") fileConfig = fileConfig.replace(/server-name=.*/, `server-name=${value}`);
  else if (key === "gamemode") fileConfig = fileConfig.replace(/gamemode=(survival|creative|adventure)/, `gamemode=${value}`);
  else if (key === "forceGamemode") fileConfig = fileConfig.replace(/force-gamemode=(true|false)/, `force-gamemode=${value}`);
  else if (key === "difficulty") fileConfig = fileConfig.replace(/difficulty=(peaceful|easy|normal|hard)/, `difficulty=${value}`);
  else if (key === "allowCheats") fileConfig = fileConfig.replace(/allow-cheats=(false|true)/, `allow-cheats=${value}`);
  else if (key === "maxPlayers") fileConfig = fileConfig.replace(/max-players=[0-9]+/, `max-players=${value}`);
  else if (key === "onlineMode") fileConfig = fileConfig.replace(/online-mode=(true|false)/, `online-mode=${value}`);
  else if (key === "allowList") fileConfig = fileConfig.replace(/allow-list=(false|true)/, `allow-list=${value}`);
  else if (key === "serverPort"||key === "serverPortv6") {
    if (key === "serverPort") fileConfig = fileConfig.replace(/server-port=[0-9]+/, `server-port=${value}`);
    else fileConfig = fileConfig.replace(/server-portv6=[0-9]+/, `server-portv6=${value}`);
  }
  else if (key === "viewDistance") {
    if (value > 4) fileConfig = fileConfig.replace(/view-distance=[0-9]+/, `view-distance=${value}`);
    else throw new Error("integer equal to 5 or greater");
  } else if (key === "tickDistance") fileConfig = fileConfig.replace(/tick-distance=(4|6|8|10|12)/, `tick-distance=${value}`);
  else if (key === "playerIdleTimeout") fileConfig = fileConfig.replace(/player-idle-timeout=[0-9]+/, `player-idle-timeout=${value}`);
  else if (key === "maxThreads") fileConfig = fileConfig.replace(/max-threads=[0-9]+/, `max-threads=${value}`);
  else if (key === "levelName") fileConfig = fileConfig.replace(/level-name=.*/, `level-name=${value}`);
  else if (key === "levelSeed") fileConfig = fileConfig.replace(/level-seed=.*/, `level-seed=${!value?"":value}`);
  else if (key === "defaultPlayerPermissionLevel") fileConfig = fileConfig.replace(/default-player-permission-level=(visitor|member|operator)/, `default-player-permission-level=${value}`);
  else if (key === "texturepackRequired") fileConfig = fileConfig.replace(/texturepack-required=(false|true)/, `texturepack-required=${value}`);
  else if (key === "chatRestriction") fileConfig = fileConfig.replace(/chat-restriction=(None|Dropped|Disabled)/, `chat-restriction=${value}`);
  else if (key === "mojangTelemetry") {
    if (!fileConfig.includes("emit-server-telemetry")) fileConfig = fileConfig.trim()+`\nemit-server-telemetry=false\n`;
    fileConfig = fileConfig.replace(/chat-restriction=(true|false)/, `nemit-server-telemetry=${value}`);
  }
  else throw new Error("Invalid key");

  await fs.writeFile(fileProperties, fileConfig);
  return fileConfig;
}

export type bedrockConfig = {
  "serverName"?: string,
  "gamemode"?: "survival"|"creative"|"adventure",
  "forceGamemode"?: boolean,
  "difficulty"?: "peaceful"|"easy"|"normal"|"hard",
  "allowCheats"?: boolean,
  "maxPlayers"?: number,
  "onlineMode"?: boolean,
  "allowList"?: boolean,
  "serverPort"?: number,
  "serverPortv6"?: number,
  "viewDistance"?: number,
  "tickDistance"?: "4"|"6"|"8"|"10"|"12",
  "playerIdleTimeout"?: number,
  "maxThreads"?: number,
  "levelName"?: string,
  "levelSeed"?: string,
  "defaultPlayerPermissionLevel"?: "visitor"|"member"|"operator",
  "texturepackRequired"?: boolean,
  "chatRestriction"?: "None"|"Dropped"|"Disabled",
  "mojangTelemetry"?: boolean
};

type rawConfig = {
  "server-name": string,
  gamemode: string,
  "force-gamemode": boolean,
  difficulty: string,
  "allow-cheats": boolean,
  "max-players": number,
  "online-mode": true,
  "allow-list": boolean,
  "server-port": number,
  "server-portv6": number,
  "view-distance": number,
  "tick-distance": number,
  "player-idle-timeout": number,
  "max-threads": number,
  "level-name": string,
  "level-seed": any,
  "default-player-permission-level": string,
  "texturepack-required": boolean,
  "content-log-file-enabled": boolean,
  "compression-threshold": number,
  "server-authoritative-movement": string,
  "player-movement-score-threshold": number,
  "player-movement-action-direction-threshold": number,
  "player-movement-distance-threshold": number,
  "player-movement-duration-threshold-in-ms": number,
  "correct-player-movement": boolean,
  "server-authoritative-block-breaking": boolean,
  "chat-restriction": string,
  "disable-player-interaction": boolean,
  "emit-server-telemetry"?: boolean
}

export async function getConfig(platformOptions: bdsPlatformOptions = {id: "default"}): Promise<bedrockConfig> {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const fileProperties = path.join(serverPath, "server.properties");
  if (!fsOld.existsSync(fileProperties)) throw new Error("Install server fist");
  const config = Proprieties.parse<rawConfig>(await fs.readFile(fileProperties, "utf8"));
  const configBase: bedrockConfig = {};
  const ignore = [
    "content-log-file-enabled", "compression-threshold", "server-authoritative-movement", "player-movement-score-threshold", "player-movement-action-direction-threshold",
    "player-movement-distance-threshold", "player-movement-duration-threshold-in-ms", "correct-player-movement", "server-authoritative-block-breaking", "disable-player-interaction"
  ]
  for (const configKey of Object.keys(config)) {
    if (ignore.includes(configKey)) continue;
    const key = configKey.replace(/-(.)/g, (_, _1) => _1.toUpperCase());
    if (key === "levelSeed" && config[configKey] === null) configBase[key] = "";
    else configBase[key] = config[configKey];
  }
  return configBase;
}

export type resourcePacks = {
  pack_id: string,
  version?: number[]
};

export type resourceManifest = {
  format_version?: 2,
  header: {
    uuid: string,
    name?: string,
    description?: string,
    version?: number[],
    min_engine_version?: number[]
  },
  modules?: {
    uuid: string,
    type: "resources",
    description?: string,
    version: number[]
  }[]
};

export async function addResourcePacksToWorld(resourceId: string, platformOptions: bdsPlatformOptions = {id: "default"}) {
  const { serverPath } = await pathControl("bedrock", platformOptions);
  const serverConfig = await getConfig(platformOptions);
  if (!await exists(path.join(serverPath, "worlds", serverConfig.levelName, "world_resource_packs.json"))) await fs.writeFile(path.join(serverPath, "worlds", serverConfig.levelName, "world_resource_packs.json"), "[]");
  const resourcesData: resourcePacks[] = JSON.parse(await fs.readFile(path.join(serverPath, "worlds", serverConfig.levelName, "world_resource_packs.json"), "utf8"));
  const manifests: resourceManifest[] = await Promise.all((await readdirrecursive([path.join(serverPath, "resource_packs"), path.join(serverPath, "worlds", serverConfig.levelName, "resource_packs")])).filter((file: string) => file.endsWith("manifest.json")).map(async (file: string) => JSON.parse(await fs.readFile(file, "utf8"))));
  const packInfo = manifests.find(pf => pf.header.uuid === resourceId);
  if (!packInfo) throw new Error("UUID to texture not installed in the server");
  if (resourcesData.includes({pack_id: resourceId})) throw new Error("Textura alredy installed in the World");
  resourcesData.push({pack_id: packInfo.header.uuid, version: packInfo.header.version});
  await fs.writeFile(path.join(serverPath, "worlds", serverConfig.levelName, "world_resource_packs.json"), JSON.stringify(resourcesData, null, 2));
  return resourcesData;
}