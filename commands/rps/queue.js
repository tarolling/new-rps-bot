const game = require('../../utils/game');
const { queueEmbed } = require('../../utils/embeds');
const { addPlayerToQueue } = require('../../utils/manageQueues');

module.exports = {
    data: {
        name: 'queue',
        description: 'Enter in the queue to play RPS against an opponent.',
        options: [
            {
                type: 4,
                name: 'queue_length',
                description: 'Specify (in minutes) how long you would like to stay in the queue for before automatically leaving.',
                required: false,
                min_value: 1,
                max_value: 60
            }
        ],
        default_member_permissions: (1 << 11) // 0x0000000000000800 - send messages
    },
    async execute(interaction) {
        const { user, channel } = interaction;

        const queueLength = interaction.options.getInteger('queue_length');
        const queue = await addPlayerToQueue(user, channel.name, queueLength * 60 * 1000);

        if (!queue) return interaction.reply({ content: 'You are already in a queue.', ephemeral: true });
        
        const { players } = queue;

        interaction.reply({ embeds: [queueEmbed(queue, interaction)] }).catch(console.error);
        if (players.length === 2) game(queue, interaction);
    }
};