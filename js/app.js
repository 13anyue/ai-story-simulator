// 应用主控与状态管理
const AppState = {
    worldList: [],
    presets: [],
    activeWorldId: null,
    gameInstance: null,
    festivalList: [],
    init() {
        // 加载本地存储
        const savedWorlds = localStorage.getItem('worldList');
        if (savedWorlds) this.worldList = JSON.parse(savedWorlds);
        else this.worldList = [];
        const savedPresets = localStorage.getItem('presets');
        this.presets = savedPresets ? JSON.parse(savedPresets) : [...DEFAULT_DATA.presets];
        const savedFestivals = localStorage.getItem('festivalList');
        this.festivalList = savedFestivals ? JSON.parse(savedFestivals) : DEFAULT_DATA.festivalList;
        
        UI.init();
        this.bindEvents();
        UI.showPage('home');
        UI.renderWorldCards();
        this.updateApiStatus();
    },
    bindEvents() {
        // 首页
        document.getElementById('btn-avatar').addEventListener('click', () => UI.showPage('profile'));
        document.getElementById('btn-create-world').addEventListener('click', () => UI.showPage('createGame'));
        document.getElementById('btn-quick-api').addEventListener('click', () => UI.showPage('apiConfig'));
        document.getElementById('btn-quick-preset').addEventListener('click', () => UI.showPage('presets'));
        document.getElementById('btn-quick-theme').addEventListener('click', () => UI.showPage('theme'));
        document.getElementById('btn-quick-import').addEventListener('click', () => UI.showPage('createGame'));
        // API页
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
        // 游戏内
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const panelId = e.currentTarget.dataset.panel;
                document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(panelId).classList.add('active');
            });
        });
        document.getElementById('btn-save-game').addEventListener('click', () => SaveManager.saveGame());
        document.getElementById('btn-reset-game').addEventListener('click', () => { this.gameInstance = null; UI.showPage('home'); });
        document.getElementById('btn-factory-reset').addEventListener('click', () => { localStorage.clear(); location.reload(); });
        document.getElementById('btn-add-festival').addEventListener('click', () => this.addFestival());
        document.getElementById('btn-save-world-book').addEventListener('click', () => {
            if (this.gameInstance) this.gameInstance.worldBook = document.getElementById('world-book').value;
        });
        // 主题
        document.getElementById('btn-apply-custom-theme').addEventListener('click', () => this.applyCustomTheme());
        document.getElementById('btn-reset-theme').addEventListener('click', () => this.resetTheme());
        document.querySelectorAll('.theme-preset').forEach(el => {
            el.addEventListener('click', () => this.applyPresetTheme(el.dataset.theme));
        });
        // 模态关闭
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
        });
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
        // 初始剧情
        GameCore.handlePlayerChoice('开始游戏');
    },
    async generateGame() {
        const name = document.getElementById('game-world-name').value || '未命名';
        const rules = document.getElementById('game-rules-input').value;
        const world = { id: Date.now(), name, rules };
        this.worldList.push(world);
        localStorage.setItem('worldList', JSON.stringify(this.worldList));
        UI.renderWorldCards();
        UI.showToast('世界已创建，正在进入...');
        this.loadWorld(world.id);
    },
    importGame() {
        const fileInput = document.getElementById('import-game-file');
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            SaveManager.importGame(e.target.result);
            this.worldList = AppState.worldList;
            localStorage.setItem('worldList', JSON.stringify(this.worldList));
            UI.renderWorldCards();
            UI.showToast('导入成功');
        };
        reader.readAsText(file);
    },
    addPersona() {
        const name = prompt('面具角色名称：');
        if (!name) return;
        const persona = { id: Date.now(), name, worldBind: null };
        this.personaList = this.personaList || [];
        this.personaList.push(persona);
        this.renderPersonas();
    },
    // ...（其他辅助方法省略，核心已包含）
    getActivePreset() {
        return this.presets[0];
    },
    updateApiStatus() {
        const config = APIManager.getConfig();
        document.getElementById('status-endpoint').textContent = config.endpoint || '未配置';
        document.getElementById('status-model').textContent = config.model || '未配置';
    },
    async testApi() {
        const config = {
            endpoint: document.getElementById('api-endpoint').value,
            key: document.getElementById('api-key').value,
            model: document.getElementById('api-model').value
        };
        const result = await APIManager.testConnection(config);
        const resultDiv = document.getElementById('api-test-result');
        resultDiv.classList.remove('hidden');
        resultDiv.className = `test-result ${result.success ? 'success' : 'error'}`;
        resultDiv.textContent = result.message;
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
        const primary = document.getElementById('custom-primary-color').value;
        document.documentElement.style.setProperty('--primary', primary);
        // ... 应用其他颜色
    },
    resetTheme() {
        document.documentElement.style.cssText = '';
    },
    applyPresetTheme(themeName) {
        const themes = {
            default: { primary:'#6c5ce7', bg:'#1a1a2e' },
            warm: { primary:'#e17055', bg:'#2d1e1a' },
            forest: { primary:'#00b894', bg:'#1a2e1a' },
            ocean: { primary:'#0984e3', bg:'#1a2a3e' },
            royal: { primary:'#a29bfe', bg:'#2e1a3e' },
            sunset: { primary:'#fdcb6e', bg:'#3e2a1a' }
        };
        if (themes[themeName]) {
            document.documentElement.style.setProperty('--primary', themes[themeName].primary);
            document.documentElement.style.setProperty('--bg', themes[themeName].bg);
        }
    },
    addFestival() {
        const name = document.getElementById('new-festival-name').value;
        const day = document.getElementById('new-festival-day').value;
        if (name && day) {
            this.festivalList.push(`${name},${day}`);
            localStorage.setItem('festivalList', JSON.stringify(this.festivalList));
        }
    }
};

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    setTimeout(() => document.getElementById('loading-overlay').style.opacity='0', 500);
    setTimeout(() => document.getElementById('loading-overlay').remove(), 1000);
});
