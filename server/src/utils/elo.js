/**
 * Calculates new Elo ratings for a match.
 * @param {number} playerAElo - Elo of Player A
 * @param {number} playerBElo - Elo of Player B
 * @param {number} winnerId - 1 for Player A wins, 2 for Player B wins, 0.5 for draw (draws might not exist in standard rubiks matches but good to have)
 * @param {number} kFactor - Elo K-factor (default 32)
 * @returns {object} - { newPlayerAElo, newPlayerBElo }
 */
export function calculateElo(playerAElo, playerBElo, playerAWins, kFactor = 32) {
    const expectedA = 1 / (1 + Math.pow(10, (playerBElo - playerAElo) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (playerAElo - playerBElo) / 400));

    let scoreA, scoreB;
    if (playerAWins === 1) { // Player A wins
        scoreA = 1;
        scoreB = 0;
    } else if (playerAWins === 0) { // Player B wins
        scoreA = 0;
        scoreB = 1;
    } else { // Draw
        scoreA = 0.5;
        scoreB = 0.5;
    }

    const newPlayerAElo = Math.round(playerAElo + kFactor * (scoreA - expectedA));
    const newPlayerBElo = Math.round(playerBElo + kFactor * (scoreB - expectedB));

    return {
        newPlayerAElo,
        newPlayerBElo
    };
}
