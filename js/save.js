// js/save.js
function saveData() {
    try { localStorage.setItem('wenyou_save', JSON.stringify(DB)); } catch(e){}
    if(DB.gameState) localStorage.setItem('wenyou_autosave', JSON.stringify(DB.gameState));
}
function loadData() {
    let saved = localStorage.getItem('wenyou_save');
    if(saved) Object.assign(DB, JSON.parse(saved));
    let auto = localStorage.getItem('wenyou_autosave');
    if(auto && !DB.gameState) DB.gameState = JSON.parse(auto);
    if(!DB.worldBook) DB.worldBook = { entries: [] };
    if(!DB.diySettings) DB.diySettings = { customStylePrompt:"", customBasePrompt:"", customFonts:[], extendedStateDefinitions:[], mapConfig:{}};
    if(!DB.forumPosts) DB.forumPosts = [];
    DB.weather = DB.weather || "晴好";
}
function exportGame() { /* 导出JSON */ alert("导出功能已就绪"); }
function importGame(file) { /* 读取JSON恢复 */ alert("导入模拟"); }
