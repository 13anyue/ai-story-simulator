const APIManager = {
    getConfig() {
        const saved = localStorage.getItem('apiConfig');
        return saved ? JSON.parse(saved) : { ...DEFAULT_DATA.api };
    },
    saveConfig(config) {
        localStorage.setItem('apiConfig', JSON.stringify(config));
    },
    async testConnection(config) {
        const { endpoint, key, model } = config;
        if (!endpoint || !key) return { success: false, message: '请先填写端点和密钥' };
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model || 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 5
                })
            });
            if (response.ok) return { success: true, message: '连接成功！' };
            const err = await response.text();
            return { success: false, message: `错误 ${response.status}: ${err}` };
        } catch (e) {
            return { success: false, message: `网络错误: ${e.message}` };
        }
    },
    async generateText(messages, config, systemPrompt = null) {
        if (!config.endpoint || !config.key) throw new Error('API未配置');
        const allMessages = [];
        if (systemPrompt) allMessages.push({ role: 'system', content: systemPrompt });
        allMessages.push(...messages);
        const res = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify({
                model: config.model || 'gpt-3.5-turbo',
                messages: allMessages,
                temperature: config.temperature || 0.8,
                max_tokens: config.maxTokens || 2048
            })
        });
        if (!res.ok) throw new Error(`请求失败: ${res.status}`);
        const data = await res.json();
        return data.choices[0].message.content;
    }
};
