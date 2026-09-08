const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const assetExts = new Set(config.resolver.assetExts);
const mediaExts = ["wav", "mp3", "m4a", "aac", "caf", "mp4"];

for (const ext of mediaExts) {
  assetExts.add(ext);
}

config.resolver.assetExts = [...assetExts];
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => !mediaExts.includes(ext));

module.exports = config;
