const AppState = {
    worldList: [],
    presets: [],
    activeWorldId: null,
    gameInstance: null,
    personaList: [],
    activePersonaId: null,
    festivalList: [],
    currentTheme: null,

    init() {
        try {
            this.worldList = JSON.parse(localStorage.getItem('worldList') || '[]');
            this.presets = JSON.parse(localStorage.getItem('presets') || JSON.stringify(DEFAULT_DATA.presets));
            this.personaList = JSON.parse(localStorage.getItem('personaList') || '[]');
            this.festivalList = JSON.parse(localStorage.getItem('festivalList') || JSON.stringify(DEFAULT_DATA.festivalList));
            this.activePersonaId = localStorage.getItem('activePersonaId') || null;
            this.currentTheme = JSON.parse(localStorage.getItem('theme') || JSON.stringify(DEFAULT_DATA.theme));
            this.applyTheme(this.currentTheme);
            UI.init();
            this.bindEvents();
            UI.showPage('home');
            this.updateApiStatus();
        } catch (e) {
            console.error('初始化失败:', e);
        }
        // 已移除加载遮罩相关代码
    },

    bindEvents() {
        // 首页入口
        document.getElementById('btn-avatar').addEventListener('click', () => UI.showPage('profile'));
        document.getElementById('btn-create-world-hero')?.addEventListener('click', () => UI.showPage('createGame'));
        document.getElementById('btn-create-world').addEventListener('click', () => UI.showPage('createGame'));
        document.getElementById('btn-quick-api').addEventListener('click', () => UI.showPage('apiConfig'));
        document.getElementById('btn-quick-preset').addEventListener('click', () => UI.showPage('presets'));
        document.getElementById('btn-quick-theme').addEventListener('click', () => UI.showPage('theme'));
        document.getElementById('btn-quick-import').addEventListener('click', () => UI.showPage('createGame'));

        // API 页
        document.getElementById('btn-test-api').addEventListener('click', () => this.testApi());
        document.getElementById('btn-save-api').addEventListener('click', () => this.saveApi());

        // 个人中心
        document.getElementById('btn-add-persona').addEventListener('click', () => this.addPersona());
        document.getElementById('btn-goto-preset').addEventListener('click', () => UI.showPage('presets'));
        document.getElementById('btn-goto-theme').addEventListener('click', () => UI.showPage('theme'));
        document.getElementById('btn-goto-api').addEventListener('click', () => UI.showPage('apiConfig'));

        // 创建游戏
        document.getElementById('btn-generate-game').addEventListener('click', () => this.generateGame());
        document.getElementById('btn-import-game').addEventListener('click', () => this.importGame());

        // 游戏内导航
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const panelId = e.currentTarget.dataset.panel;
                document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(panelId).classList.add('active');
            });
        });

        // 自定义行动
        document.getElementById('btn-custom-action').addEventListener('click', () => {
            const input = document.getElementById('custom-action-input');
            if (input.value.trim()) {
                GameCore.handlePlayerChoice(input.value.trim());
                input.value = '';
            }
        });

        // 存档与重置
        document.getElementById('btn-save-game').addEventListener('click', () => SaveManager.saveGame());
        document.getElementById('btn-reset-game').addEventListener('click', () => {
            this.gameInstance = null;
            UI.showPage('home');
        });
        document.getElementById('btn-factory-reset').addEventListener('click', () => {
            localStorage.clear();
            location.reload();
        });

        // 节日
        document.getElementById('btn-add-festival').addEventListener('click', () => this.addFestival());

        // 世界书
        document.getElementById('btn-save-world-book').addEventListener('click', () => {
            if (this.gameInstance) {
                this.gameInstance.worldBook = document.getElementById('world-book').value;
                UI.showToast('世界书已保存');
            }
        });

        // 主题
        document.getElementById('btn-apply-custom-theme').addEventListener('click', () => this.applyCustomTheme());
        document.getElementById('btn-reset-theme').addEventListener('click', () => this.resetTheme());
        document.querySelectorAll('.theme-dot').forEach(el => {
            el.addEventListener('click', () => this.applyPresetTheme(el.dataset.theme));
        });

        // 模态关闭
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
        });

        // 地图
        document.getElementById('btn-upload-map-bg').addEventListener('click', () => this.uploadMapBg());
        document.getElementById('map-container').addEventListener('click', (e) => {
            if (e.target === e.currentTarget || e.target.id === 'map-background') this.addLocationOnMap(e);
        });
        document.getElementById('btn-ai-generate-locations').addEventListener('click', () => this.aiGenLocations());
    },

    loadWorld(worldId) {
        const world = this.worldList.find(w => w.id == worldId);
        if (!world) return;
        this.activeWorldId = worldId;
        this.gameInstance = createNewGameInstance(world.name, world.rules);
        this.gameInstance.npcs = JSON.parse(JSON.stringify(SAMPLE_NPCS));
        GameSystems.addLifeLog(this.gameInstance, '踏入这个世界...');
        UI.showPage('game');
        UI.refreshGameUI();
        GameCore.handlePlayerChoice('开始游戏');
    },

    deleteWorld(id) {
        this.worldList = this.worldList.filter(w => w.id != id);
        localStorage.setItem('worldList', JSON.stringify(this.worldList));
        UI.renderWorldCards();
    },

    generateGame() {
        const name = document.getElementById('game-world-name').value || '未命名';
        const rules = document.getElementById('game-rules-input').value;
        this.worldList.push({ id: Date.now(), name, rules });
        localStorage.setItem('worldList', JSON.stringify(this.worldList));
        UI.showToast('世界已创建');
        UI.showPage('home');
        UI.renderWorldCards();
    },

    importGame() {
        const file = document.getElementById('import-game-file').files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            SaveManager.importGame(e.target.result);
            this.worldList = AppState.worldList;
            localStorage.setItem('worldList', JSON.stringify(this.worldList));
            UI.renderWorldCards();
        };
        reader.readAsText(file);
    },

    addPersona() {
        const name = prompt('面具角色名称：');
        if (!name) return;
        this.personaList.push({ id: Date.now(), name, worldBind: null });
        localStorage.setItem('personaList', JSON.stringify(this.personaList));
        UI.renderPersonas();
    },

    getActivePreset() {
        return this.presets[0];
    },

    updateApiStatus() {
        const config = APIManager.getConfig();
        document.getElementById('status-endpoint').textContent = config.endpoint || '未配置';
        document.getElementById('status-model').textContent = config.model || '未配置';
        const connEl = document.getElementById('status-connection');
        if (connEl) connEl.textContent = config.endpoint ? '就绪' : '未测试';
    },

    async testApi() {
        const config = {
            endpoint: document.getElementById('api-endpoint').value,
            key: document.getElementById('api-key').value,
            model: document.getElementById('api-model').value
        };
        const result = await APIManager.testConnection(config);
        const div = document.getElementById('api-test-result');
        div.classList.remove('hidden');
        div.className = `test-result ${result.success ? 'success' : 'error'}`;
        div.textContent = result.message;
    },

    saveApi() {
        const config = {
            endpoint: document.getElementById('api-endpoint').value,
            key: document.getElementById('api-key').value,
            model: document.getElementById('api-model').value,
            temperature: parseFloat(document.getElementById('api-temperature').value),
            maxTokens: parseInt(document.getElementById('api-max-tokens').value)
        };
        APIManager.saveConfig(config);
        this.updateApiStatus();
        UI.showToast('API配置已保存');
    },

    applyCustomTheme() {
        const theme = {
            primary: document.getElementById('custom-primary-color').value,
            bg: document.getElementById('custom-bg-color').value,
            cardBg: document.getElementById('custom-card-color').value,
            text: document.getElementById('custom-text-color').value,
            accent: document.getElementById('custom-accent-color').value
        };
        this.applyTheme(theme);
        localStorage.setItem('theme', JSON.stringify(theme));
    },

    resetTheme() {
        this.applyTheme(DEFAULT_DATA.theme);
        localStorage.setItem('theme', JSON.stringify(DEFAULT_DATA.theme));
        UI.loadThemeFields();
    },

    applyPresetTheme(name) {
        const themes = {
            default: { primary:'#6c5ce7', bg:'#faf8f5', cardBg:'#ffffff', text:'#2c2c2c', accent:'#e84393' },
            rose: { primary:'#e17055', bg:'#fff5f5', cardBg:'#ffffff', text:'#2c2c2c', accent:'#d63031' },
            ocean: { primary:'#0984e3', bg:'#f0f7ff', cardBg:'#ffffff', text:'#2c2c2c', accent:'#e84393' },
            forest: { primary:'#00b894', bg:'#f0fff4', cardBg:'#ffffff', text:'#2c2c2c', accent:'#e17055' }
        };
        if (themes[name]) {
            this.applyTheme(themes[name]);
            localStorage.setItem('theme', JSON.stringify(themes[name]));
            UI.loadThemeFields();
        }
    },

    applyTheme(theme) {
        document.documentElement.style.setProperty('--primary', theme.primary);
        document.documentElement.style.setProperty('--bg', theme.bg);
        document.documentElement.style.setProperty('--card-bg', theme.cardBg);
        document.documentElement.style.setProperty('--text', theme.text);
        document.documentElement.style.setProperty('--accent', theme.accent);
        this.currentTheme = theme;
    },

    addFestival() {
        const name = document.getElementById('new-festival-name').value.trim();
        const day = document.getElementById('new-festival-day').value;
        if (name && day) {
            this.festivalList.push(`${name},${day}`);
            localStorage.setItem('festivalList', JSON.stringify(this.festivalList));
            UI.renderFestivalTags();
        }
    },

    uploadMapBg() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const mapWorld = this.gameInstance.mapWorlds.find(m => m.id === this.gameInstance.currentMapWorldId);
                    if (mapWorld) mapWorld.bgImage = ev.target.result;
                    document.getElementById('map-background').src = ev.target.result;
                    document.getElementById('map-background').classList.remove('hidden');
                    document.getElementById('map-placeholder').classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    addLocationOnMap(e) {
        if (!this.gameInstance) return;
        const rect = document.getElementById('map-container').getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const name = prompt('地点名称：');
        if (name) {
            this.gameInstance.locations.push({ id: Date.now(), name, x, y, npcIds: [] });
            UI.renderLocations();
        }
    },

    async aiGenLocations() {
        const prompt = '请为当前游戏世界生成5个地点名称，用逗号分隔。';
        try {
            const response = await GameCore.generateStory(prompt);
            const names = response.split(/[,，]/).slice(0, 5).map(n => n.trim());
            names.forEach(name => {
                if (name && !this.gameInstance.locations.find(l => l.name === name)) {
                    this.gameInstance.locations.push({ id: Date.now() + Math.random(), name, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, npcIds: [] });
                }
            });
            UI.renderLocations();
            UI.showToast('AI已生成5个地点');
        } catch (e) {
            UI.showToast('生成失败');
        }
    },

    interactWithNpc(npcId, action) {
        GameCore.interactWithNpc(npcId, action);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    AppState.init();
});
