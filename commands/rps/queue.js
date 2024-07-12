const { SlashCommandBuilder } = require('discord.js');
const { addPlayerToQueue, findPlayerQueue, createQueue, deleteRankQueue, findOpenQueue } = require('../../src/game/manageQueues');
const { queue: queueEmbed } = require('../../src/embeds');
const { findPlayer } = require('../../src/db');
const { defaultTimeout } = require('../../config/settings.json');
const playSeries = require('../../src/game/playSeries');
const leave = require('./leave');
const { Mutex } = require('async-mutex');


const mutex = new Mutex();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q')
        .setDescription('Enter in the queue to play RPS against a random opponent.')
        .addIntegerOption(option =>
            option
                .setName('timeout')
                .setDescription('Specify (in minutes) how long you would like to stay in the queue for before automatically leaving.')
                .setMinValue(1)
                .setMaxValue(60)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const release = await mutex.acquire();
        try {
            const { user } = interaction;
            const player_doc = await findPlayer(user.id);
            if (!player_doc) {
                return interaction.editReply({ content: 'You are not registered. Use `/r` to register.', ephemeral: true });
            }

            let playerQueueId = await findPlayerQueue(user);
            if (playerQueueId) return interaction.editReply({ content: 'You are already in a queue.', ephemeral: true });

            playerQueueId = await findOpenQueue();
            if (!playerQueueId) {
                playerQueueId = await createQueue();
            }

            const queueLength = interaction.options.getInteger('timeout');
            const timeout = setTimeout(async () => {
                await leave.execute(interaction);
            }, (queueLength ? queueLength : defaultTimeout) * 60 * 1000);

            const queue = await addPlayerToQueue(playerQueueId, user, timeout);
            if (!queue) return interaction.editReply({ content: 'The lobby is full, please wait until another is created.', ephemeral: true });

            const { players, lobbyInfo: { isPlaying } } = queue;

            await interaction.editReply({ embeds: [queueEmbed(queue, user)] });
            console.log(`${user.username} joined Lobby ${playerQueueId}`);

            if (players.length === 2) {
                for (const player of players) {
                    clearTimeout(player.timeout);
                }
                await deleteRankQueue(playerQueueId);
                queue.isPlaying = true;
                if (!isPlaying) playSeries(playerQueueId, queue);
            }
        } finally {
            release();
        }
    }
};