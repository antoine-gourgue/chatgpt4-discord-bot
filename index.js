require('dotenv/config');
const { Client } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

client.on('ready', () => {
    console.log('The bot is online ! ');
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['1153834567132774470'];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id))
        return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];
    conversation.push({
        role: 'system',
        content: 'Chat GPT is a friendly chatbot.'
    });

    let prevMessages = await message.channel.messages.fetch({ limit: 10 });
    prevMessages = [...prevMessages.values()].reverse();


    prevMessages.forEach(msg => { // Fixed arrow function syntax.
        if (msg.author.bot && msg.author.id !== client.user.id) return;
        if (msg.content.startsWith(IGNORE_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content, // Removed unnecessary quotes.
            });
            return;
        }

        conversation.push({
            role: 'user',
            name: username,
            content: msg.content,
        });
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: conversation,
        });

        clearInterval(sendTypingInterval);

        if (response && response.choices && response.choices.length > 0) {
            await message.reply(response.choices[0].message.content);
        } else {
            console.error("OpenAI didn't return the expected data");
            await message.reply("Désolé, je n'ai pas pu obtenir une réponse.");
        }
    } catch (error) {
        console.error(`OpenAI Error:\n${error}`);
        clearInterval(sendTypingInterval);
        message.reply("I'm having some trouble with the OpenAI API. Try again in a moment.");
    }
});

client.login(process.env.TOKEN);
