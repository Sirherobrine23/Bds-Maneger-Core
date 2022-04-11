import path from "path";
import fs from "fs";
import os from "os";
import * as bdsTypes from "./globalType";

export const storage = path.resolve(process.env.WORLD_STORAGE||path.join(os.homedir(), "bds_core/worlds"));
if (!fs.existsSync(storage)) fs.mkdirSync(storage);

export async function storageWorld(Platform: bdsTypes.Platform, serverPath: string, world?: string) {
  if (process.platform === "win32") throw new Error("Windows is not supported");
  // On storage path
  const onStorage = path.join(storage, Platform);
  if (!fs.existsSync(onStorage)) fs.mkdirSync(onStorage);

  // Prepare to platforms
  if (Platform === "bedrock") {
    // Bedrock Path
    const bedrockServerWorld = path.join(serverPath, "worlds");
    if (fs.existsSync(bedrockServerWorld)) {
      if (fs.lstatSync(bedrockServerWorld).isSymbolicLink()) return;
      for (const folder of fs.readdirSync(bedrockServerWorld)) {
        await fs.promises.rename(path.join(bedrockServerWorld, folder), path.join(onStorage, folder))
      }
      await fs.promises.rmdir(bedrockServerWorld);
    }
    await fs.promises.symlink(onStorage, bedrockServerWorld, "dir");
    return;
  } else if (Platform === "pocketmine") {
    // pocketmine Path
    const pocketmineWorld = path.join(serverPath, "worlds");
    if (fs.existsSync(pocketmineWorld)) {
      if (fs.lstatSync(pocketmineWorld).isSymbolicLink()) return;
      for (const folder of fs.readdirSync(pocketmineWorld)) {
        await fs.promises.rename(path.join(pocketmineWorld, folder), path.join(onStorage, folder))
      }
      await fs.promises.rmdir(pocketmineWorld);
    }
    await fs.promises.symlink(onStorage, pocketmineWorld, "dir");
    return;
  } else if (Platform === "java") {
    if (!world) throw new Error("No world name provided");
    // Java Path to map
    const javaServerWorld = path.join(serverPath, world);
    if (fs.existsSync(javaServerWorld)) {
      if (fs.lstatSync(javaServerWorld).isSymbolicLink()) return;
      await fs.promises.rename(javaServerWorld, path.join(onStorage, world));
    }
    await fs.promises.symlink(path.join(onStorage, world), javaServerWorld, "dir");
  }
  throw new Error("Platform not supported");
}

export async function changeServerSettings(Platform: bdsTypes.Platform, serverPath: string) {
  if (process.platform === "win32") throw new Error("Windows is not supported");
  // On storage path
  const onStorage = path.join(storage, Platform);
  if (!fs.existsSync(onStorage)) fs.mkdirSync(onStorage);

  // Bedrock
  if (Platform === "bedrock") {
    const bedrockSettings = path.join(serverPath, "server.properties");
    if (fs.existsSync(bedrockSettings)) {
      if (fs.lstatSync(bedrockSettings).isSymbolicLink()) return;
      if (!fs.existsSync(path.join(onStorage, "server.properties"))) {
        await fs.promises.copyFile(bedrockSettings, path.join(onStorage, "server.properties"));
        await fs.promises.rm(bedrockSettings);
      }
    }
    await fs.promises.symlink(path.join(onStorage, "bedrock_server.properties"), bedrockSettings, "file");
  } else if (Platform === "java") {
    const javaSettings = path.join(serverPath, "server.properties");
    if (fs.existsSync(javaSettings)) {
      if (fs.lstatSync(javaSettings).isSymbolicLink()) return;
      if (!fs.existsSync(path.join(onStorage, "server.properties"))) {
        await fs.promises.copyFile(javaSettings, path.join(onStorage, "server.properties"));
        await fs.promises.rm(javaSettings);
      }
    }
    await fs.promises.symlink(path.join(onStorage, "java_server.properties"), javaSettings, "file");
  } else if (Platform === "pocketmine") {
    const pocketmineSettings = path.join(serverPath, "server.properties");
    if (fs.existsSync(pocketmineSettings)) {
      if (fs.lstatSync(pocketmineSettings).isSymbolicLink()) return;
      if (!fs.existsSync(path.join(onStorage, "server.properties"))) {
        await fs.promises.copyFile(pocketmineSettings, path.join(onStorage, "server.properties"));
        await fs.promises.rm(pocketmineSettings);
      }
    }
    await fs.promises.symlink(path.join(onStorage, "pocketmine_server.properties"), pocketmineSettings, "file");
  } else if (Platform === "spigot") {
    const spigotSettings = path.join(serverPath, "server.properties");
    if (fs.existsSync(spigotSettings)) {
      if (fs.lstatSync(spigotSettings).isSymbolicLink()) return;
      if (!fs.existsSync(path.join(onStorage, "server.properties"))) {
        await fs.promises.copyFile(spigotSettings, path.join(onStorage, "server.properties"));
        await fs.promises.rm(spigotSettings);
      }
    }
    await fs.promises.symlink(path.join(onStorage, "spigot_server.yml"), spigotSettings, "file");
  }
}