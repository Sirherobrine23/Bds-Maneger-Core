import os from "os";
import path from "path";
import fs, { promises as fsPromise } from "fs";
import * as Proprieties from "../../lib/Proprieties"
import { parse as nbtParse, NBT, Metadata as nbtData, NBTFormat } from "prismarine-nbt";
const serverPath = path.resolve(process.env.SERVER_PATH||path.join(os.homedir(), "bds_core/servers"), "bedrock");

export type bedrockConfig = {
  /** This is the server name shown in the in-game server list. */
  serverName: string,
  /** The maximum numbers of players that should be able to play on the server. `Higher values have performance impact.` */
  maxPlayers?: number,
  /** Default gamemode to server and new Players */
  gamemode: "survival"|"creative"|"adventure"|1|2|3,
  /** Default server difficulty */
  difficulty?: "peaceful"|1|"easy"|2|"normal"|3|"hard"|4,
  /** Which permission level new players will have when they join for the first time. */
  PlayerDefaultPermissionLevel?: "visitor"|"member"|"operator",
  /** World Name to show in list friends and pause menu */
  worldName: string,
  /** The seed to be used for randomizing the world (`If left empty a seed will be chosen at random`). */
  worldSeed?: string|number,
  /** For remote servers always use true as the server will be exposed. */
  requiredXboxLive?: true|false,
  /** if enabled, allow only player in permission.json */
  allowList?: true|false,
  /** if enabled server allow commands, Command block and in survival disable achievements */
  allowCheats?: true|false,
  /** Server Ports */
  port?: {
    /** IPv4 Port, different for v6 */
    v4?: number,
    /** IPv6 */
    v6?: number,
  },
  /** The maximum allowed view distance (`Higher values have performance impact`). */
  viewDistance?: number,
  /** The world will be ticked this many chunks away from any player (`Higher values have performance impact`). */
  tickDistance?: number,
  /** After a player has idled for this many minutes they will be kicked (`If set to 0 then players can idle indefinitely`). */
  playerIdleTimeout?: number,
  /** Maximum number of threads the server will try to use (`Bds Core auto detect Threads`). */
  maxCpuThreads?: number,
  /** If the world uses any specific texture packs then this setting will force the client to use it. */
  texturepackRequired?: true|false
};

export async function CreateServerConfig(config: bedrockConfig): Promise<bedrockConfig&{configArray: string}> {
  if (!!config.difficulty) {
    if (typeof config.difficulty === "number") {
      if (config.difficulty === 1) config.difficulty = "peaceful";
      else if (config.difficulty === 2) config.difficulty = "easy";
      else if (config.difficulty === 3) config.difficulty = "normal";
      else if (config.difficulty === 4) config.difficulty = "hard";
      else {
        console.log("[Bds Core] Invalid difficulty value, defaulting to normal");
        config.difficulty = "normal";
      }
    }
  }
  if (!!config.gamemode) {
    if (typeof config.gamemode === "number") {
      if (config.gamemode === 1) config.gamemode = "survival";
      else if (config.gamemode === 2) config.gamemode = "creative";
      else if (config.gamemode === 3) config.gamemode = "adventure";
      else {
        console.log("[Bds Core] Invalid gamemode value, defaulting to survival");
        config.gamemode = "survival";
      }
    }
  }
  if (!!config.viewDistance) {
    if (typeof config.viewDistance === "number") {
      if (config.viewDistance < 4) {
        console.log("[Bds Core] Invalid view distance value, defaulting to 4");
        config.viewDistance = 4;
      }
    } else {
      console.log("[Bds Core] Invalid view distance value, defaulting to 4");
      config.viewDistance = 4;
    }
  }
  if (!!config.tickDistance) {
    if (typeof config.tickDistance === "number") {
      if (config.tickDistance < 4) {
        console.log("[Bds Core] Invalid tick distance value, defaulting to 4");
        config.tickDistance = 4;
      }
    } else {
      console.log("[Bds Core] Invalid tick distance value, defaulting to 4");
      config.tickDistance = 4;
    }
  }
  if (!!config.maxPlayers) {
    if (typeof config.maxPlayers === "number") {
      if (config.maxPlayers < 2) {
        console.log("[Bds Core] Invalid max players value, defaulting to 2");
        config.maxPlayers = 2;
      }
    } else {
      console.log("[Bds Core] Invalid max players value, defaulting to 2");
      config.maxPlayers = 2;
    }
  }
  if (!!config.playerIdleTimeout||config.playerIdleTimeout !== 0) {
    if (typeof config.playerIdleTimeout === "number") {
      if (config.playerIdleTimeout < 0) {
        console.log("[Bds Core] Invalid player idle timeout value, defaulting to 0");
        config.playerIdleTimeout = 0;
      }
    } else {
      console.log("[Bds Core] Invalid player idle timeout value, defaulting to 0");
      config.playerIdleTimeout = 0;
    }
  }
  if (!!config.port) {
    if (!!config.port.v4) {
      if (typeof config.port.v4 === "number") {
        if (config.port.v4 < 1) {
          console.log("[Bds Core] Invalid v4 port value, defaulting to 19132");
          config.port.v4 = 19132;
        }
      }
    }
    if (!!config.port.v6) {
      if (typeof config.port.v6 === "number") {
        if (config.port.v6 < 1) {
          console.log("[Bds Core] Invalid v6 port value, defaulting to 19133");
          config.port.v6 = 19133;
        }
      }
    }
  }
  const serverName = config.serverName || "Bedrock Server";
  const maxPlayers = config.maxPlayers || 20;
  const gamemode = config.gamemode || "survival";
  const difficulty = config.difficulty || "peaceful";
  const PlayerDefaultPermissionLevel =  config.PlayerDefaultPermissionLevel || "member";
  const worldName = config.worldName || "Bedrock level";
  const worldSeed = config.worldSeed || "";
  const requiredXboxLive = config.requiredXboxLive || true;
  const allowList = config.allowList || false;
  const allowCheats = config.allowCheats || false;
  const port = {v4: (config.port||{}).v4 || 19132, v6: (config.port||{}).v6 || 19133};
  const viewDistance = config.viewDistance || 32;
  const tickDistance = config.tickDistance || 4;
  const playerIdleTimeout = config.playerIdleTimeout || 0;
  const maxCpuThreads = config.maxCpuThreads || os.cpus().length || 8;
  const texturepackRequired = config.texturepackRequired || false;

  // Server config
  const configFileArray = [
    `server-name=${serverName}`,
    `gamemode=${gamemode}`,
    "force-gamemode=false",
    `difficulty=${difficulty}`,
    `allow-cheats=${allowCheats}`,
    `max-players=${maxPlayers}`,
    `online-mode=${requiredXboxLive}`,
    `allow-list=${allowList}`,
    `server-port=${port.v4}`,
    `server-portv6=${port.v6}`,
    `view-distance=${viewDistance}`,
    `tick-distance=${tickDistance}`,
    `player-idle-timeout=${playerIdleTimeout}`,
    `max-threads=${maxCpuThreads}`,
    `level-name=${worldName}`,
    `level-seed=${worldSeed}`,
    `default-player-permission-level=${PlayerDefaultPermissionLevel}`,
    `texturepack-required=${texturepackRequired}`,
    `content-log-file-enabled=false`,
    `compression-threshold=1`,
    `server-authoritative-movement=server-auth`,
    `player-movement-score-threshold=20`,
    `player-movement-action-direction-threshold=0.85`,
    `player-movement-distance-threshold=0.3`,
    `player-movement-duration-threshold-in-ms=500`,
    `correct-player-movement=false`,
    `server-authoritative-block-breaking=false`
  ];

  // Write config file
  await fsPromise.writeFile(path.join(serverPath, "server.properties"), configFileArray.join("\n"), {encoding: "utf8"});

  // Return writed config
  return {
    serverName,
    maxPlayers,
    gamemode,
    difficulty,
    PlayerDefaultPermissionLevel,
    worldName,
    worldSeed,
    requiredXboxLive,
    allowList,
    allowCheats,
    port,
    viewDistance,
    tickDistance,
    playerIdleTimeout,
    maxCpuThreads,
    texturepackRequired,
    configArray: configFileArray.join("\n")
  }
}

type bedrockParsedConfig = {
  /** This is the server name shown in the in-game server list. */
  serverName: string,
  /** World Name to show in list friends and pause menu */
  worldName: string,
  /** Default gamemode to server and new Players */
  gamemode: "survival"|"creative"|"adventure",
  /** The maximum numbers of players that should be able to play on the server. `Higher values have performance impact.` */
  maxPlayers: number,
  /** Default server difficulty */
  difficulty: "peaceful"|"easy"|"normal"|"hard",
  /** The seed to be used for randomizing the world (`If left empty a seed will be chosen at random`). */
  worldSeed: string|number,
  /** World NBT */
  nbtParsed: {parsed: NBT, type: NBTFormat, metadata: nbtData}
};
export async function getConfig(): Promise<bedrockParsedConfig> {
  const config: bedrockParsedConfig = {
    serverName: "Bedrock Server",
    worldName: "Bedrock level",
    gamemode: "survival",
    difficulty: "normal",
    maxPlayers: 0,
    worldSeed: "",
    nbtParsed: undefined
  };
  if (fs.existsSync(path.join(serverPath, "server.properties"))) {
    const ProPri = Proprieties.parse(await fsPromise.readFile(path.join(serverPath, "server.properties"), {encoding: "utf8"}));
    if (ProPri["server-name"] !== undefined) config.serverName = String(ProPri["server-name"]);
    if (ProPri["level-name"] !== undefined) config.worldName = String(ProPri["level-name"]);
    if (ProPri["gamemode"] !== undefined) config.gamemode = String(ProPri["gamemode"]) as "survival"|"creative"|"adventure";
    if (ProPri["max-players"] !== undefined) config.maxPlayers = Number(ProPri["max-players"]);
    if (ProPri["difficulty"] !== undefined) config.difficulty = String(ProPri["difficulty"]) as "peaceful"|"easy"|"normal"|"hard";
    const worldDatePath = path.join(serverPath, "worlds", config.worldName, "level.dat");
    if (fs.existsSync(worldDatePath)) config.nbtParsed = await nbtParse(await fsPromise.readFile(worldDatePath));
    if (ProPri["level-seed"] !== undefined) config.worldSeed = String(ProPri["level-seed"]);
    else {
      if (config.nbtParsed !== undefined) {
        const seedValue = ((((((config||{}).nbtParsed||{}).parsed||{}).value||{}).RandomSeed||{}).value||"").toString()
        if (!!seedValue) config.worldSeed = seedValue;
      }
    }
  }
  return config;
}

export async function Permission(): Promise<Array<{ignoresPlayerLimit: false|true, name: string, xuid?: string}>> {
  const permissionPath = path.join(serverPath, "allowlist.json");
  if (fs.existsSync(permissionPath)) {
    const permission = JSON.parse(await fsPromise.readFile(permissionPath, {encoding: "utf8"}));
    return permission;
  }
  return [];
}