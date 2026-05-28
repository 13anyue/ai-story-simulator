// js/systems.js
// 天气/节日
function updateWeatherDisplay() { document.getElementById('topbar-weather')?.setAttribute('data-weather', DB.weather); }
function advanceWorldTime(minutes=10) {
    DB.worldTime.minute += minutes;
    while(DB.worldTime.minute >= 60) { DB.worldTime.hour++; DB.worldTime.minute-=60; }
    if(DB.worldTime.hour>=24) { DB.worldTime.day++; DB.worldTime.hour=0; }
    // 简化季节...
}
// NPC自动活动（异步）
async function aiMoveNpcs() { /* 调用ai决定移动 */ }
// 世界书检索
function getWorldBookContext(userInput) {
    let matched = [];
    for(let e of DB.worldBook.entries) {
        if(e.constant || e.keys.some(k=>userInput.includes(k))) matched.push(e.content);
    }
    return matched.join("\n");
}
// 论坛增删查
function addForumPost(author, content, type='player') {
    DB.forumPosts.unshift({ id:Date.now(), author, content, time:Date.now(), likes:0, comments:[] });
    saveData();
}
// NPC关系网初始化（占位）
function ensureRelationshipNetwork() { if(!DB.relationshipNetwork.nodes.length) DB.relationshipNetwork.nodes = [{id:'player', name:'主角', type:'player'}]; }
// 角色头像库智能分配
function assignAvatarFromLibrary(character) {
    if(!character.avatar) character.avatar = `https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)}`;
}
// 记忆自动摘要
async function autoSummarizeMemory() { /* 调用LLM总结历史剧情 */ }
