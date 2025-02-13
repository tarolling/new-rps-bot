const { SlashCommandBuilder, ChannelType, escapeUnderline } = require('discord.js');
const { addPlayerToQueue, findPlayerQueue, createQueue, findOpenQueue } = require('../../src/game/manage-queues');
const { queue: queueEmbed } = require('../../src/embeds');
const { findPlayer, registerPlayer } = require('../../src/db');
const { defaultTimeout } = require('../../config/settings.json');
const playSeries = require('../../src/game/play-series');
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
        await interaction.deferReply().catch(console.error);

        const release = await mutex.acquire();
        try {
            const { user, channel } = interaction;
            const player_doc = await findPlayer(user.id);
            if (!player_doc) {
                await registerPlayer(interaction);
            }

            let playerQueueId = await findPlayerQueue(user);
            if (playerQueueId) return interaction.editReply({ content: 'You are already in a lobby.', ephemeral: true }).catch(console.error);

            playerQueueId = await findOpenQueue();
            if (!playerQueueId) {
                playerQueueId = await createQueue();
            }

            const queueLength = interaction.options.getInteger('timeout');
            const timeout = setTimeout(async () => {
                await leave.execute(interaction);
            }, (queueLength ? queueLength : defaultTimeout) * 60 * 1000);

            const queue = await addPlayerToQueue(playerQueueId, user, timeout, (channel?.type === ChannelType.DM ? null : channel));
            if (!queue) return interaction.editReply({ content: 'The lobby is full, please wait until another is created.', ephemeral: true }).catch(console.error);

            const { players, lobbyInfo: { isPlaying } } = queue;

            interaction.editReply({ embeds: [queueEmbed(queue, user)] }).catch(console.error);
            console.log(`${escapeUnderline(user.username)} joined Lobby ${playerQueueId}`);

            if (players.length === 2) {
                for (const player of players) {
                    clearTimeout(player.timeout);
                }
                queue.isPlaying = true;
                if (!isPlaying) playSeries(playerQueueId, queue);
            }
        } finally {
            release();
        }
    }
};
