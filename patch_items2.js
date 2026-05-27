const fs = require('fs');
let c = fs.readFileSync('src/data/items.js', 'utf8');

// 1. Korjaa rikkinäinen loppukommentti
c = c.replace(/    \*\*/g, ' */');
c = c.replace(/\* .*Rogue Reborn.*/g, '');
c = c.replace(/\* All item.*/g, '');
c = c.replace(/\*\//g, '');

// 2. Poista duplikaatti ITEM_DB
const firstDB = c.indexOf('const ITEM_DB');
let secondDB = c.indexOf('const ITEM_DB', firstDB + 20);
while (secondDB > 0) {
    const endOfSecond = c.indexOf('];', secondDB) + 2;
    c = c.slice(0, secondDB) + c.slice(endOfSecond);
    secondDB = c.indexOf('const ITEM_DB', firstDB + 20);
}
console.log('Cleaned duplicates');

// 3. Varmista ITEM_DB loppuu oikein
fs.writeFileSync('src/data/items.js', c);
console.log('Done');