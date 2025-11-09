import axios from "axios";

export const meta = {
  name: "help",
  aliases: ["h", "commands", "cmds"],
  version: "1.0.0",
  author: "Farhan (modified from ShawnDesu)",
  description: "Shows all available commands grouped by category for Baka-Chan.",
  guide: "<command|all>",
  cooldown: 5,
  prefix: "both",
  type: "anyone",
  category: "system",
  waifu: true, // Enable waifu image background
};

// --- Fetch Random Waifu Image (optional aesthetic) ---
async function getRandomWaifuUrl() {
  try {
    const res = await axios.get("https://api.waifu.pics/sfw/waifu", { timeout: 8000 });
    if (res?.data?.url) return res.data.url;
  } catch (e) {}
  return "https://i.imgur.com/3ZQ3Z5b.png";
}

// --- Main Command Logic ---
export async function onStart({ bot, chatId, msg, response }) {
  try {
    const { commands } = global.chaldea;
    const { prefix: globalPrefix, symbols } = global.settings;
    const userId = msg.from.id;
    const args = msg.text.split(" ").slice(1);
    const cleanArg = args[0] ? args[0].trim().toLowerCase() : "";
    const chatType = msg.chat.type;

    // Show specific command info if requested
    if (cleanArg) {
      const command =
        commands.get(cleanArg) ||
        [...commands.values()].find(
          (cmd) =>
            Array.isArray(cmd.meta.aliases) &&
            cmd.meta.aliases.map((a) => a.toLowerCase()).includes(cleanArg)
        );

      if (command) {
        const helpMessage = generateCommandInfo(command.meta, globalPrefix);
        return await response.reply(helpMessage, { parse_mode: "Markdown" });
      }
    }

    // Otherwise show full help list
    const allCommands = getFilteredCommands([...commands.values()]);
    const helpMessage = generateFullHelpMessage(allCommands, globalPrefix, symbols);

    if (meta.waifu) {
      const loading = await response.reply("⌛ Generating help list...");
      const waifuUrl = await getRandomWaifuUrl();
      await response.photo(waifuUrl, {
        caption: helpMessage,
        parse_mode: "Markdown",
      });
      try { await response.delete(loading); } catch {}
    } else {
      await response.reply(helpMessage, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("Error in help command:", error);
    await response.reply("⚠️ Oops! Something went wrong while showing help.", { parse_mode: "Markdown" });
  }
}

// --- Filter: Remove hidden/private-only commands ---
function getFilteredCommands(commandList) {
  return commandList
    .filter((cmd) => cmd.meta && cmd.meta.category?.toLowerCase() !== "hidden")
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

// --- Generate ALL commands grouped by category ---
function generateFullHelpMessage(filteredCommands, prefix, symbols) {
  const categories = {};
  filteredCommands.forEach((cmd) => {
    const cat = capitalize(cmd.meta.category || "Misc");
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(`${symbols || "•"} ${prefix}${cmd.meta.name}`);
  });

  const sortedCategories = Object.keys(categories).sort();
  const totalCmds = filteredCommands.length;

  let message = `*💫 Welcome to Baka-Chan Command Center*\n`;
  message += `_Here’s a full list of my available commands, grouped by category._\n\n`;

  for (const cat of sortedCategories) {
    const list = categories[cat].map((c) => `│ ${c}`).join("\n");
    message += `╭─── ✦ *${cat}*\n${list}\n╰───────────────✦\n\n`;
  }

  message += `✨ *Total Commands:* ${totalCmds}\n`;
  message += `_Use_ \`${prefix}help <command>\` _to view detailed info._`;

  return message;
}

// --- Single Command Info (when help <cmd>) ---
function generateCommandInfo(cmdInfo, prefix) {
  const aliases = cmdInfo.aliases?.length
    ? `*Aliases:*\n${cmdInfo.aliases.map((a) => `\`${a}\``).join(", ")}`
    : "*Aliases:*\nNone";

  const usage = cmdInfo.guide
    ? Array.isArray(cmdInfo.guide)
      ? cmdInfo.guide.map((u) => `\`${prefix}${cmdInfo.name} ${u}\``).join("\n")
      : `\`${prefix}${cmdInfo.name} ${cmdInfo.guide}\``
    : "No usage instructions.";

  return (
    `📘 *Command:* \`${cmdInfo.name}\`\n\n` +
    `*Description:*\n${cmdInfo.description}\n\n` +
    `*Usage:*\n${usage}\n\n` +
    `*Category:* ${capitalize(cmdInfo.category || "Misc")}\n` +
    `*Cooldown:* ${cmdInfo.cooldown || 0}s\n\n` +
    aliases
  );
}

// --- Utility Function ---
function capitalize(txt) {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}
