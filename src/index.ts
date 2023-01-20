// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, Guild, GuildChannel, Message, TextChannel } from 'discord.js';
import { token } from './config.json';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import credenciais from './credentials.json';

const arquivo = { id: "1PdMPbYtkmURkRJ7mCu52-g1UENLEKOtnS0KRMgvAmTw" }

interface Boss {
  name: string,
  respawn: string
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  const interval = 1000 * 60 * 5

  updateBossList(c);
  setInterval(() => {
    updateBossList(c);
  }, interval)
});

// Log in to Discord with your client's token
client.login(token);


const updateBossList = async function (c: Client<true>) {
  const bossListText = await getBossListText()

  const guilds = await c.guilds.fetch();
  guilds.forEach(async (_guild) => {
    const guild = await _guild.fetch()

    const channel = (await guild.channels.fetch()).find(c => c?.name === "🐉┆lista-de-boss") as TextChannel
    if (!channel) return;

    const message = (await channel.messages.fetch()).find(m => m.author.bot && m.author.username.includes("Dekaron")) as Message
    if (!message) {
      return channel.send(bossListText)
    }

    if (message.content !== bossListText) {
      message.edit(bossListText)
    }
  })
}

const getBossListText = async () => {
  const doc = new GoogleSpreadsheet(arquivo.id);

  await doc.useServiceAccountAuth({
    client_email: credenciais.client_email,
    private_key: credenciais.private_key.replace(/\\n/g, '\n')
  })
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0]

  const rows = await sheet.getRows()

  const bossList = rows.map(row => {
    return {
      name: row["NICK BOSS"],
      respawn: row["Vivo"] === "Sim" ? "Vivo" : row["RESPAWN 1"],
    } as Boss
  })
    .map(boss => {
      return `*${boss.respawn.padStart(9)} | ${boss.name.padEnd(25)}`
    })
  // .slice(0, 10)

  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const year = String(now.getFullYear()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")

  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`

  const finalList = [`#${"RESPAWN".padStart(9)} | ${"BOSS".padEnd(25)}`, ...bossList, `\nÚltima atualização • ${formattedDate}`]
    .join("\n")

  return `\`\`\`md\n${finalList}\n\`\`\``
}