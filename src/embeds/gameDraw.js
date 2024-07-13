const { EmbedBuilder } = require('discord.js');
const { defaultColor, footer } = require('./embed');

module.exports = (queue) => {
    const { players, lobbyInfo: { gameNumber } } = queue;
    return new EmbedBuilder()
        .setColor(defaultColor)
        .setTitle('GAME DRAW')
        .setDescription(`Game ${gameNumber}`)
        .addFields({ name: `${players[0].choice || 'N/A'}`, value: players[0].user.username, inline: true },
            { name: `${players[1].choice || 'N/A'}`, value: players[1].user.username, inline: true })
        .setFooter(footer);
};