// js/ui.js
function renderLobby() {
    let lobbyDiv = document.getElementById('screen-lobby');
    lobbyDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4"><h1 class="text-2xl font-black">✨文游·世界书引擎</h1><button id="open-user-manager" class="bg-primary text-white p-2 rounded-full"><i class="fas fa-user-circle"></i></button></div>
        <div class="space-y-3"><h3>📜 我的世界</h3><div id="world-list" class="space-y-2"></div><button id="create-world-btn" class="w-full py-2 rounded-xl bg-gray-200 dark:bg-gray-800"><i class="fas fa-plus"></i> 创世/导入文件</button></div>
        <div class="mt-4"><button id="enter-api-config" class="text-sm text-primary">⚙️ API配置</button></div>
    `;
    document.getElementById('open-user-manager')?.addEventListener('click',()=>openUserManager());
    document.getElementById('enter-api-config')?.addEventListener('click',()=>switchScreen('screen-api-config'));
}
function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s=>s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    if(screenId==='screen-gameplay') document.getElementById('bottom-nav-bar').style.display='flex';
    else document.getElementById('bottom-nav-bar').style.display='none';
}
function renderGameUI() {
    let gp = document.getElementById('screen-gameplay');
    gp.innerHTML = `<div id="game-header" class="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur p-2 flex justify-between"><span id="loc-name">位置</span><span id="weather-icon">☀️</span></div>
    <div id="story-terminal" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
    <div class="p-3 border-t sticky bottom-0 bg-white/90"><div id="story-choices" class="flex flex-wrap gap-2 mb-2"></div><div class="flex gap-2"><input id="free-input" class="flex-1 border rounded-full px-4 py-2" placeholder="自由行动..."><button id="submit-action" class="bg-primary text-white px-4 rounded-full">执行</button></div></div>`;
    document.getElementById('submit-action').onclick = ()=>submitCustomAction();
}
function appendStoryHTML(html, choices=[]) {
    let terminal = document.getElementById('story-terminal');
    let div = document.createElement('div'); div.className = 'story-card'; div.innerHTML = html;
    terminal.appendChild(div); terminal.scrollTop = terminal.scrollHeight;
    let choiceDiv = document.getElementById('story-choices');
    choiceDiv.innerHTML = '';
    choices.forEach(c=>{ let btn=document.createElement('button'); btn.className='choice-btn'; btn.innerText=c; btn.onclick=()=>selectChoice(c); choiceDiv.appendChild(btn); });
}
function renderNPCList() { /* 生成NPC卡片并绑定点击互动 */ }
function renderMap() { /* 易次元风格长图地点渲染，支持背景上传 */ }
function renderForum() { /* 弹窗内显示帖子列表与发布 */ }
