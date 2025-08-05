require('dotenv').config()
const { Client } = require('discord.js-selfbot-v13')
const client = new Client()

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`)

    const channel = await client.channels.fetch(process.env.BUMP_CHANNEL) // Fetch the bump channel from environment variables
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL)  // Fetch the log channel frpom environment variables
    /**
     * Sends a slash command to bump the server in the specified channel.
     */
    async function bump() {
        await channel.sendSlash('302050872383242240', 'bump') // Sends a slash command to the bump channel to bump the server.
        console.log(`Bumped the server at ${new Date().toLocaleTimeString()}`) // Logs the bump action to the console.
        await logChannel.send(`Bumped the server at ${new Date().toLocaleTimeString()}`) // Log the bump action in the log channel.
        console.log(`Sent bump message at ${new Date().toLocaleTimeString()}`)
    }

    /**
     * Loops the bump function at a random interval between 2 and 2.5 hours
     * to avoid detection by automating services.
     */
    function loop() {
        // send bump message every 2-3 hours, to prevent detection.
        var randomNum = Math.round(Math.random() * (9000000 - 7200000 + 1)) + 7200000
        setTimeout(function () {
            bump()
            loop()
        }, randomNum)
    }
    
    bump()
    loop()
})

/**
 * Logs in to Discord using the token from environment variables.
 */
client.login(process.env.TOKEN)
