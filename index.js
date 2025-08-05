require('dotenv').config()
const { Client } = require('discord.js-selfbot-v13')
const client = new Client()

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setStatus('dnd') // set the status to do not disturb
    client.user.setActivity(process.env.ACTIVITY_MESSAGE || 'Whats good bruv', { type: 'WATCHING' }) // set the activity from env or default
    console.log(`Status set to DND and activity set to "Bumping the server!"`) // log the status and activity in console

    const channel = await client.channels.fetch(process.env.BUMP_CHANNEL) // get the channel to send bumps
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL) // get the channel to log bumps
    if (!channel || !logChannel) {
        console.error('Bump or log channel not found! Please check your .env file.')
        return
    }
    console.log(`Bump channel and log channel fetched successfully.`) // log the channels fetched in console
    
    async function bump() {
        await channel.sendSlash('302050872383242240', 'bump') // send the bump command in the channel
        console.log(`Bumped the server at ${new Date().toLocaleTimeString()}`) // log the bump time in console
        await logChannel.send(`Bumped the server at ${new Date().toLocaleTimeString()}`) // log the bump time in log channel
        console.log(`Sent bump message at ${new Date().toLocaleTimeString()}`)// log the bump message time in console
    }

    async function loop() {
        // Random interval between 2 and 2.5 hours (in ms)
        var randomNum = Math.round(Math.random() * (9000000 - 7200000 + 1)) + 7200000 // 7200000 ms = 2 hours, 9000000 ms = 2.5 hours
        var nextBumpTime = new Date(Date.now() + randomNum) // calculate the next bump time
        await logChannel.send(`Next bump scheduled at ${nextBumpTime.toLocaleTimeString()}`) // log the next bump time in log channel
        console.log(`Next bump scheduled at ${nextBumpTime.toLocaleTimeString()}`) // log the next bump time in console
        setTimeout(function () {
            bump()
            loop()
        }, randomNum)
    }
    
    bump()
    loop()
})

client.login(process.env.TOKEN)
