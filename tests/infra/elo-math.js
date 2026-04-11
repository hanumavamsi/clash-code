const { calculateNewRatings } = require('../../server/utils/eloCalculator');

function test() {
  console.log("----------------------------------------");
  console.log("   ELO MATH VERIFICATION              ");
  console.log("----------------------------------------");

  // 1. New Player vs New Player (Equally matched)
  const p1_new = { id: 'p1', rating: 1200, matchCount: 0, score: 50 };
  const p2_new = { id: 'p2', rating: 1200, matchCount: 0, score: 30 };
  const res1 = calculateNewRatings(p1_new, p2_new);
  console.log("1. New Player (1200) vs New Player (1200):");
  console.log(`   P1 Win: ${res1.p1.newRating} (+${res1.p1.delta})`);
  console.log(`   P2 Loss: ${res1.p2.newRating} (${res1.p2.delta})\n`);

  // 2. High ELO vs Low ELO (Upset Win)
  const p1_high = { id: 'p1', rating: 1500, matchCount: 50, score: 30 };
  const p2_low = { id: 'p2', rating: 1000, matchCount: 10, score: 50 };
  const res2 = calculateNewRatings(p1_high, p2_low);
  console.log("2. Veteran (1500) vs New Player (1000) - UPSET:");
  console.log(`   P2 Win: ${res2.p2.newRating} (+${res2.p2.delta})`);
  console.log(`   P1 Loss: ${res2.p1.newRating} (${res2.p1.delta})\n`);

  // 3. High ELO vs Low ELO (Expected Win)
  const p1_high2 = { id: 'p1', rating: 1500, matchCount: 50, score: 50 };
  const p2_low2 = { id: 'p2', rating: 1000, matchCount: 10, score: 30 };
  const res3 = calculateNewRatings(p1_high2, p2_low2);
  console.log("3. Veteran (1500) vs New Player (1000) - EXPECTED:");
  console.log(`   P1 Win: ${res3.p1.newRating} (+${res3.p1.delta})`);
  console.log(`   P2 Loss: ${res3.p2.newRating} (${res3.p2.delta})\n`);

  // 4. Forfeit
  const p1_f = { id: 'p1', rating: 1200, matchCount: 5, score: 100 };
  const p2_f = { id: 'p2', rating: 1200, matchCount: 5, score: 50 };
  const res4 = calculateNewRatings(p1_f, p2_f, true, 'p1');
  console.log("4. P1 (1200) Forfeits against P2 (1200):");
  console.log(`   P1 (Forfeiter): ${res4.p1.newRating} (${res4.p1.delta})`);
  console.log(`   P2 (Winner): ${res4.p2.newRating} (+${res4.p2.delta})\n`);

  console.log("Tests complete.");
}

test();
