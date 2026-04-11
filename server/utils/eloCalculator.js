/**
 * ELO Calculation Utilities
 * Based on the standard Elo rating system formula: R' = R + K * (S - E)
 */

const BASE_ELO = 1200;
const PLACEMENT_K = 40; // High volatility for new players
const REGULAR_K = 20;   // Stability for established players
const PLACEMENT_THRESHOLD = 30; // Matches before moving to regular K

/**
 * Calculate the expected outcome for player A
 * @param {number} ratingA - Current ELO of player A
 * @param {number} ratingB - Current ELO of player B
 * @returns {number} Expected score (0 to 1)
 */
function getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ratings for both players
 * @param {Object} p1 - { id: string, rating: number, matchCount: number, score: number }
 * @param {Object} p2 - { id: string, rating: number, matchCount: number, score: number }
 * @param {boolean} isForfeit - Whether the match ended by forfeit
 * @param {string} forfeiterId - The ID of the player who forfeited
 * @returns {Object} { p1: { newRating, delta }, p2: { newRating, delta } }
 */
function calculateNewRatings(p1, p2, isForfeit = false, forfeiterId = null) {
    let s1 = 0.5;
    let s2 = 0.5;

    if (isForfeit && forfeiterId) {
        if (forfeiterId === p1.id) { s1 = 0; s2 = 1; }
        else { s1 = 1; s2 = 0; }
    } else {
        if (p1.score > p2.score) { s1 = 1; s2 = 0; }
        else if (p2.score > p1.score) { s1 = 0; s2 = 1; }
    }

    const e1 = getExpectedScore(p1.rating, p2.rating);
    const e2 = getExpectedScore(p2.rating, p1.rating);

    const k1 = p1.matchCount < PLACEMENT_THRESHOLD ? PLACEMENT_K : REGULAR_K;
    const k2 = p2.matchCount < PLACEMENT_THRESHOLD ? PLACEMENT_K : REGULAR_K;

    const delta1 = Math.round(k1 * (s1 - e1));
    const delta2 = Math.round(k2 * (s2 - e2));

    const newRating1 = Math.max(0, p1.rating + delta1);
    const newRating2 = Math.max(0, p2.rating + delta2);

    return {
        p1: { newRating: newRating1, delta: delta1 },
        p2: { newRating: newRating2, delta: delta2 }
    };
}

module.exports = {
    BASE_ELO,
    getExpectedScore,
    calculateNewRatings
};
