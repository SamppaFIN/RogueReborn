const fs = require('fs');
let content = fs.readFileSync('src/data/items.js', 'utf8');

// Poista vanha batch5
const b5 = content.indexOf('// --- Batch 5:');
if (b5 > 0) {
    const after = content.indexOf('};', b5 + 4000) + 2;
    content = content.slice(0, b5) + content.slice(after);
    console.log('Removed old batch5');
}

const dbEnd = content.indexOf('];');
const pre = content.slice(0, dbEnd);
const post = content.slice(dbEnd);

const newItems = [
    {type:'potion',char:'!',color:'#f1c40f',name:'Potion of Speed',effect:'speed_boost',minFloor:2,cost:40},
    {type:'potion',char:'!',color:'#2c3e50',name:'Potion of Invisibility',effect:'invisibility',minFloor:3,cost:80},
    {type:'potion',char:'!',color:'#e74c3c',name:'Potion of Heroism',effect:'heroism',minFloor:4,cost:120,value:5},
    {type:'potion',char:'!',color:'#2ecc71',name:'Potion of Cure Poison',effect:'cure_poison',minFloor:1,cost:30},
    {type:'potion',char:'!',color:'#f39c12',name:'Potion of Restore Life',effect:'restore_life',minFloor:8,cost:2000,artifact:true,identified:true},
    {type:'scroll',char:'?',color:'#9b59b6',name:'Scroll of Phase Door',effect:'phase_door',minFloor:2,cost:50},
    {type:'scroll',char:'?',color:'#e67e22',name:'Scroll of Trap Detection',effect:'trap_detect',minFloor:2,cost:45},
    {type:'scroll',char:'?',color:'#f1c40f',name:'Scroll of Light',effect:'magic_lamp',minFloor:1,cost:35,value:50},
    {type:'scroll',char:'?',color:'#2c3e50',name:'Scroll of Darkness',effect:'darkness',minFloor:3,cost:60},
    {type:'scroll',char:'?',color:'#3498db',name:'Scroll of Reveal',effect:'reveal',minFloor:2,cost:40},
    {type:'scroll',char:'?',color:'#66fcf1',name:'Scroll of Rune of Protection',effect:'rune_protect',minFloor:3,cost:100,value:15},
    {type:'wand',char:'/',color:'#e74c3c',name:'Wand of Fire',effect:'wand_fire',charges:8,minFloor:3,cost:150},
    {type:'wand',char:'/',color:'#3498db',name:'Wand of Frost',effect:'wand_frost',charges:8,minFloor:3,cost:150},
    {type:'wand',char:'/',color:'#f1c40f',name:'Wand of Lightning',effect:'wand_lightning',charges:6,minFloor:4,cost:200},
    {type:'wand',char:'/',color:'#d35400',name:'Wand of Destruction',effect:'wand_destruction',charges:3,minFloor:3,cost:120},
    {type:'scroll',char:'?',color:'#95a5a6',name:'Scroll of Fear',effect:'fear',minFloor:4,cost:80},
    {type:'scroll',char:'?',color:'#f39c12',name:'Scroll of Bless',effect:'bless',minFloor:2,cost:55}
].map(s => '\n    ' + s + ',').join('');

const result = pre + '\n    // --- Batch 5: New Status/Strategy Items (TomeNet-inspired) ---' + newItems + post;
fs.writeFileSync('src/data/items.js', result);
console.log('Done - 17 items added to ITEM_DB');
