export default function scramble(options = { turns: 20, array: false }) {
    const moves = [
        ["U", "U'", "U2"],
        ["D", "D'", "D2"],
        ["R", "R'", "R2"],
        ["L", "L'", "L2"],
        ["F", "F'", "F2"],
        ["B", "B'", "B2"],
    ];
    let result = "";
    let lastMoveType = null;
    for (let i = 0; i < (options.turns ?? 20); i++) {
        let moveType = Math.floor(Math.random() * 6);
        moveType = moveType === lastMoveType ? (moveType + 1) % 6 : moveType;
        const move = Math.floor(Math.random() * 3);
        result += ` ${moves[moveType][move]}`;
        lastMoveType = moveType;
    }
    if (options.array) return result.trim().split(" ");
    return result.trim();
}