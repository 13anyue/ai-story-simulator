document.addEventListener('DOMContentLoaded', async () => {
    loadData();
    renderLobby();
    // 绑定全局tab切换与功能
    window.switchScreen = switchScreen;
    window.selectChoice = selectChoice;
    window.submitCustomAction = submitCustomAction;
    window.openUserManager = () => { /* 多面具角色弹窗 */ alert("多角色面具：可绑定世界、切换档案"); };
    // API配置界面渲染
    let apiScreen = document.getElementById('screen-api-config');
    apiScreen.innerHTML = `<div class="space-y-4"><h2>API 配置</h2><input id="api-endpoint" placeholder="Endpoint" class="w-full border p-2 rounded"><input id="api-key" placeholder="Key" type="password"><input id="api-model" placeholder="Model"><button id="test-api-btn" class="bg-primary text-white p-2 rounded">测试连通</button><button id="save-api-btn">保存并返回</button></div>`;
    document.getElementById('test-api-btn')?.addEventListener('click', async ()=>{
        DB.apiConfig.endpoint = document.getElementById('api-endpoint').value;
        DB.apiConfig.key = document.getElementById('api-key').value;
        DB.apiConfig.model = document.getElementById('api-model').value;
        await testAPIConnection();
    });
    document.getElementById('save-api-btn')?.addEventListener('click',()=>{ saveData(); switchScreen('screen-lobby'); });
    // 大厅内世界列表
    function refreshWorldList() {
        let container = document.getElementById('world-list');
        container.innerHTML = DB.worlds.map(w=>`<div class="border rounded-xl p-3 flex justify-between"><span>${w.name}</span><button class="text-primary" data-world-id="${w.id}">进入</button></div>`).join('');
        document.querySelectorAll('[data-world-id]').forEach(btn=>btn.addEventListener('click',(e)=>initGameWithWorld(btn.dataset.worldId)));
    }
    refreshWorldList();
    document.getElementById('create-world-btn')?.addEventListener('click',()=>{
        let name = prompt("世界名称");
        if(name) DB.worlds.push({ id:"w"+Date.now(), name, description:"新世界", globalLore:"待完善", systemPrompt:"默认", locations:[{ id:"start", name:"初生地", desc:"起点"}], npcs:[] });
        refreshWorldList();
        saveData();
    });
});
