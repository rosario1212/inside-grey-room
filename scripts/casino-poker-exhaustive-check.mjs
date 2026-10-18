import assert from 'node:assert/strict';
import {evaluateHand} from '../casino/games.mjs';
// Independent combinatorial oracle: every possible five-card hand in 52 cards.
// Counts are ordered high card, pair, two pairs, trips, straight, flush, full
// house, quads, straight flush (including royal flushes).
const counts=Array(9).fill(0),cards=Array(5);
for(let a=0;a<48;a++)for(let b=a+1;b<49;b++)for(let c=b+1;c<50;c++)for(let d=c+1;d<51;d++)for(let e=d+1;e<52;e++){
 cards[0]=a;cards[1]=b;cards[2]=c;cards[3]=d;cards[4]=e;counts[evaluateHand(cards)[0]]++;
}
assert.deepEqual(counts,[1302540,1098240,123552,54912,10200,5108,3744,624,40]);
console.log('Casino poker: all 2,598,960 five-card combinations match the independent category counts.');
