// js/api.js
window.callLLMRequest = async function(userContent, systemContent) {
    const loader = document.getElementById('global-loader');
    if(loader) loader.style.display='flex';
    try {
        if(!window.DB.apiConfig.key || !window.DB.apiConfig.endpoint || !window.DB.apiConfig.model) {
            await new Promise(r=>setTimeout(r,500));
            return "【单机脱机模式】由于未配置API密钥，位面法则转入内置自循环...\n||选项分组||\n1.打开「设置」修改提示词\n2.前往「大地图」\n3.切入「NPC」手动制造";
        }
        const res = await fetch(`${window.DB.apiConfig.endpoint}/chat/completions`, {
            method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${window.DB.apiConfig.key}`},
            body:JSON.stringify({ model:window.DB.apiConfig.model, messages:[{role:"system",content:systemContent},{role:"user",content:userContent}], temperature:0.85 })
        });
        if(!res.ok) throw new Error(`API异常 ${res.status}`);
        const data = await res.json();
        return data.choices[0].message.content;
    } finally { if(loader) loader.style.display='none'; }
};
window.testAPIConnection = async function(){ /* 从game.js搬运 */ };
window.fetchAvailableModels = async function(){ /* 搬运 */ };
window.saveAPIConfigAndBack = function(){ /* 搬运 */ };
window.cleanAiJsonOutput = (raw) => raw.replace(/```json|```/g,'').trim();
