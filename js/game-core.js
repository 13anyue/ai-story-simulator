// js/game-core.js
let isGenerating = false;
async function generateStory(userInstruction) {
    if(isGenerating) return;
    isGenerating = true;
    document.getElementById('global-loader')?.classList.remove('hidden');
    let sys = buildSystemPrompt();
    let wbCtx = getWorldBookContext(userInstruction);
    let finalPrompt = `${wbCtx}\n【玩家行动】${userInstruction}\n请返回JSON格式: {"narrative":"HTML卡片","choices":["选项"],"player_update":{},"npc_update":[]}`;
    try {
        let raw = await callLLM(finalPrompt, sys, false);
        let json = JSON.parse(raw);
        appendStoryHTML(json.narrative, json.choices);
        // 更新主角/NPC数据
        if(json.player_update) Object.assign(DB.gameState.player, json.player_update);
        if(json.npc_update) json.npc_update.forEach(n=>{ let idx=DB.gameState.npcs.findIndex(x=>x.id===n.id); if(idx>=0) Object.assign(DB.gameState.npcs[idx], n); else DB.gameState.npcs.push(n); });
        advanceWorldTime(12);
        saveData();
    } catch(e) { appendStoryHTML(`<div class="text-red-500">剧情生成出错: ${e.message}</div>`, []); }
    finally { isGenerating=false; document.getElementById('global-loader')?.classList.add('hidden'); }
}
function buildSystemPrompt() {
    return `你是高自由度文字游戏AI。世界观:${DB.gameState?.globalLore||''}\n输出严格按照精美HTML卡片+选项。属性变化用🎲标记。对话采用【名字:内容】。分支选项用||分割。`;
}
function selectChoice(choice) { generateStory(choice); }
function submitCustomAction() { let inp=document.getElementById('free-input'); if(inp.value) generateStory(inp.value); inp.value=''; }
// 开局初始化世界
async function initGameWithWorld(worldId) {
    let world = DB.worlds.find(w=>w.id===worldId);
    DB.gameState = { worldId, worldName:world.name, globalLore:world.globalLore, systemPrompt:world.systemPrompt, player:{ name:"主角", stats:{"气血":100,"灵力":50}, inventory:[] }, npcs:world.npcs || [], locations:world.locations || [], currentLocationId:world.locations?.[0]?.id || "", worldBookEntries:[] };
    DB.maps = [{ id:"main", name:world.name, bgUrl:"", locations:DB.gameState.locations }];
    DB.currentMapId = "main";
    switchScreen('screen-gameplay');
    renderGameUI();
    generateStory("开局描述，展现世界风貌");
}
