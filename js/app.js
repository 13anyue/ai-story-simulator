// js/api.js - API调用与通信模块

// 调用LLM API
async function callLLMRequest(userContent, systemContent) {
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'flex';
    try {
        if (!DB.apiConfig.key || !DB.apiConfig.endpoint || !DB.apiConfig.model) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return "【单机脱机模式】\n由于未配置API密钥，位面法则转入内置自循环系统：\n【场景路人】：\"既然未开启云密钥，不如手动DIY所有NPC交互、属性变质、在地图场景中全自由编写剧本日志罢！\"\n（内心：即使没有大模型回馈，纯手动沙盒创造也是极高自由度的体验...）\n||选项分组||\n1. 打开「设置」修改提示词语气\n2. 涉足「大地图」建立新场景\n3. 切入「NPC」手动制造宿世死敌\n4. 前往「属性日志」扩展属性项";
        }
        const response = await fetch(`${DB.apiConfig.endpoint}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DB.apiConfig.key}` },
            body: JSON.stringify({
                model: DB.apiConfig.model,
                messages: [{ role: "system", content: systemContent }, { role: "user", content: userContent }],
                temperature: 0.85
            })
        });
        if (!response.ok) throw new Error(`LLM接口异常，状态码: ${response.status}`);
        const resData = await response.json();
        return resData.choices[0].message.content;
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

// 测试API连通性
async function testAPIConnection() {
    const endpoint = document.getElementById('cfg-endpoint').value.trim();
    const key = document.getElementById('cfg-key').value.trim();
    const model = document.getElementById('cfg-model').value.trim();
    if (!key || !model) { showToast("密钥与模型名不可留空！", false); return; }
    showToast("正在发射连通性测试...");
    try {
        const response = await fetch(`${endpoint}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({ model: model, messages: [{ role: "user", content: "ping" }], max_tokens: 5 })
        });
        if (response.ok) showToast("【连通成功】云端神经元成功回馈！");
        else showToast(`【连通受挫】状态码：${response.status}。`, false);
    } catch (err) { showToast("【连通熔断】网络层面阻断。", false); }
}

// 获取可用模型列表
async function fetchAvailableModels() {
    const endpoint = document.getElementById('cfg-endpoint').value.trim();
    const key = document.getElementById('cfg-key').value.trim();
    if (!key) { showToast("需先填入密钥！", false); return; }
    showToast("正向远程拉取模型名册...");
    try {
        const res = await fetch(`${endpoint}/models`, { method: "GET", headers: { "Authorization": `Bearer ${key}` } });
        if (!res.ok) throw new Error("服务器返回错误");
        const data = await res.json();
        const box = document.getElementById('model-list-box');
        const listContainer = document.getElementById('model-list-items');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        if (data.data && Array.isArray(data.data)) {
            data.data.slice(0, 15).forEach(m => {
                const div = document.createElement('div');
                div.className = "model-item";
                div.innerText = m.id;
                div.onclick = () => { document.getElementById('cfg-model').value = m.id; showToast(`已选定模型：${m.id}`); };
                listContainer.appendChild(div);
            });
            box.classList.remove('hidden');
            showToast("成功拉取模型名册！");
        }
    } catch (err) { showToast("远程列表拉取受阻，可手动填入。", false); }
}

function saveAPIConfigAndBack() {
    DB.apiConfig.endpoint = document.getElementById('cfg-endpoint').value.trim();
    DB.apiConfig.key = document.getElementById('cfg-key').value.trim();
    DB.apiConfig.model = document.getElementById('cfg-model').value.trim();
    localStorage.setItem("AI_WENYOU_CONFIG", JSON.stringify(DB.apiConfig));
    showToast("API凭证已保存。");
    switchScreen('screen-lobby');
}

function cleanAiJsonOutput(rawStr) {
    let out = rawStr.trim();
    if (out.startsWith("```json")) out = out.substring(7);
    if (out.startsWith("```")) out = out.substring(3);
    if (out.endsWith("```")) out = out.substring(0, out.length - 3);
    return out.trim();
}
