// 游戏核心逻辑：剧情推进、AI生成、交互处理
const GameCore = {
    async generateStory(prompt) {
        const config = APIManager.getConfig();
        const game = AppState.gameInstance;
        const systemPrompt = AppState.getActivePreset()?.content || DEFAULT_DATA.presets[0].content;
        const fullPrompt = `当前状态：第${game.day}天，${game.time}，${game.weather}。玩家：${game.player.name}。\n${prompt}\n请根据设定推进剧情。`;
        try {
            const text = await APIManager.generateText(fullPrompt, systemPrompt, config);
            return text;
        } catch (e) {
            // 离线模拟
            return `【离线模式】你继续在${game.worldName}中探索。周围一片寂静。\n\n<b>系统提示：</b>${e.message}`;
        }
    },
    async handlePlayerChoice(choiceText) {
        const game = AppState.gameInstance;
        game.storyHistory.push({ role:'user', content:choiceText });
        const response = await this.generateStory(choiceText);
        game.storyHistory.push({ role:'assistant', content:response });
        // 简单解析更新
        game.day++;
        game.weather = GameSystems.randomWeather();
        GameSystems.checkFestival(game);
        UI.showPage('game');
        UI.refreshGameUI();
        document.getElementById('story-content').innerHTML = this.formatStory(response);
        this.generateOptions(response);
    },
    formatStory(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/【(.*?)】/g, '<span class="highlight">【$1】</span>');
    },
    generateOptions(text) {
        const container = document.getElementById('story-options');
        const defaultOptions = ['继续探索', '与周围人交谈', '休息片刻'];
        // 简单基于关键词生成选项
        const options = [];
        if (text.includes('对话')) options.push('回应对话');
        if (text.includes('物品')) options.push('查看物品');
        options.push(...defaultOptions.slice(0, 3 - options.length));
        container.innerHTML = options.map(opt => `<button class="story-option-btn">${opt}</button>`).join('');
        container.querySelectorAll('.story-option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handlePlayerChoice(btn.textContent));
        });
    },
    async interactWithNpc(npcId, action) {
        const game = AppState.gameInstance;
        const npc = game.npcs.find(n => n.id === npcId);
        if (!npc) return;
        GameSystems.recordNpcAppearance(game, npcId);
        const prompt = `你对${npc.name}执行了“${action}”。请生成${npc.name}的回应。`;
        const response = await this.generateStory(prompt);
        GameSystems.addLifeLog(game, `与${npc.name}交互：${action}`);
        document.getElementById('story-content').innerHTML = this.formatStory(`<strong>${npc.name}：</strong>${response}`);
        this.generateOptions(response);
    }
};
