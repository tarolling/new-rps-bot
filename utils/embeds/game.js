const ranks = require('../../config/ranks');
const { footer } = require('../../config/embeds');


module.exports = (queue) => {
    const { players, lobbyInfo: { gameNumber, id, rank } } = queue;
    const color = (Object.keys(ranks).includes(rank)) ? ranks[rank].color : null;
    return {
        color,
        title: `Lobby #${id} - Game ${gameNumber}`,
        description: 'Make your selection. You have 30 seconds! First to 3 wins.',
        fields: [
            { name: `${players[0].score}`, value: players[0].user.username, inline: true },
            { name: `${players[1].score}`, value: players[1].user.username, inline: true }
        ],
        footer
    };
};