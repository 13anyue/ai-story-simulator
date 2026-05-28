// js/api.js
async function callLLM(userMsg, sysPrompt, streamCallback) {
    const { endpoint, key, model } = DB.apiConfig;
    if(!key) throw new Error("未配置API密钥");
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 120000);
    const res = await fetch(`${endpoint}/chat/completions`, {
        method:'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({ model, messages: [{ role:'system', content:sysPrompt }, { role:'user', content:userMsg }], temperature:0.85, stream:!!streamCallback }),
        signal: controller.signal
    });
    clearTimeout(timeout);
    if(!res.ok) throw new Error(`API错误 ${res.status}`);
    if(streamCallback && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while(true) {
            const { done, value } = await reader.read();
            if(done) break;
            let chunk = decoder.decode(value);
            full += chunk;
            streamCallback(chunk, full);
        }
        return full;
    } else {
        let json = await res.json();
        return json.choices[0].message.content;
    }
}
async function testAPIConnection() {
    try {
        let result = await callLLM("测试连通", "请回复'连通成功'", false);
        alert("API连接成功：" + result.slice(0,50));
        return true;
    } catch(e) { alert("连接失败："+e.message); return false; }
}
async function fetchModels() {
    const { endpoint, key } = DB.apiConfig;
    const res = await fetch(`${endpoint}/models`, { headers:{'Authorization':`Bearer ${key}`} });
    let data = await res.json();
    let models = data.data?.map(m=>m.id) || [];
    return models;
}
