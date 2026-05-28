const GameCore = {
    async generateStory(prompt, extraContext = '') {
        const config = APIManager.getConfig();
        const game = AppState.gameInstance;
        const systemPrompt = AppState.getActivePreset()?.content || DEFAULT_DATA.presets[0].content;
        const worldBook = game.worldBook || '';
        let fullPrompt = `当前状态：第${game.day}天，${game.time}，${game.weather}。玩家：${game.player.name}。\n`;
        if (worldBook) fullPrompt += `世界设定：${worldBook}\n`;
        if (extraContext) fullPrompt += `额外背景：${extraContext}\n`;
        fullPrompt += prompt;
        try {
            const text = await APIManager.generateText([{ role: 'user', content: fullPrompt }], config, systemPrompt);
            return text;
        } catch (e) {
            return `<em>【离线模式】</em>你继续在${game.worldName}中探索。\n<b>系统提示：</b>${e.message}`;
        }
    },
    async handlePlayerChoice(choiceText) {
        const game = AppState.gameInstance;
        game.storyHistory.push({ role:'user', content:choiceText });
        const response = await this.generateStory(choiceText);
        game.storyHistory.push({ role:'assistant', content:response });
        game.day++;
        game.weather = GameSystems.randomWeather();
        GameSystems.checkFestival(game);
        this.displayStory(response);
        this.generateOptions(response);
        UI.refreshGameUI();
    },
    displayStory(text) {
        const contentEl = document.getElementById('story-content');
        contentEl.innerHTML = this.formatStory(text);
    },
    formatStory(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/【(.*?)】/g, '<span class="highlight">【$1】</span>');
    },
    generateOptions(text) {
        const container = document.getElementById('story-options');
        const defaults = ['继续探索', '与周围人交谈', '休息片刻'];
        const options = new Set();
        if (text.includes('对话')) options.add('回应对话');
        if (text.includes('物品')) options.add('查看物品');
        defaults.forEach(o => options.add(o));
        const opts = [...options].slice(0,3);
        container.innerHTML = opts.map(opt => `<button class="story-option-btn">${opt}</button>`).join('');
        container.querySelectorAll('.story-option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handlePlayerChoice(btn.textContent));
        });
    },
    async interactWithNpc(npcId, action) {
        const game = AppState.gameInstance;
        const npc = game.npcs.find(n => n.id === npcId);
        if (!npc) return;
        GameSystems.recordNpcAppearance(game, npcId);
        const prompt = `你对${npc.name}执行了“${action}”。请以${npc.name}的身份回应。`;
        const response = await this.generateStory(prompt);
        GameSystems.addLifeLog(game, `与${npc.name}交互：${action}`);
        this.displayStory(`<strong>${npc.name}：</strong>${response}`);
        this.generateOptions(response);
        UI.refreshGameUI();
    }
};
