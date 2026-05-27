const AppState = {
    worldList: [],
    presets: [],
    activeWorldId: null,
    gameInstance: null,
    personaList: [],
    activePersonaId: null,
    festivalList: [],
    init() {
        const savedWorlds = localStorage.getItem('worldList');
        this.worldList = savedWorlds ? JSON.parse(savedWorlds) : [];
        const savedPresets = localStorage.getItem('presets');
        this.presets = savedPresets ? JSON.parse(savedPresets) : [...DEFAULT_DATA.presets];
        const savedPersonas = localStorage.getItem('personaList');
        this.personaList = savedPersonas ? JSON.parse(savedPersonas) : [];
        const savedFestivals = localStorage.getItem('festivalList');
        this.festivalList = savedFestivals ? JSON.parse(savedFestivals) : DEFAULT_DATA.festivalList;
        this.activePersonaId = localStorage.getItem('activePersonaId') || null;
        UI.init();
        this.bindEvents();
        UI.showPage('home');
        this.updateApiStatus();
    },
    bindEvents() {
        document.getElementById('btn-avatar').addEventListener('click', () => UI.showPage('profile'));
        document.getElementById('btn-create-world').addEventListener('click', () => UI.showPage('createGame'));
        document.getElementById('btn-quick-api').addEventListener('click', () => UI.showPage('apiConfig'));
        document.getElementById('btn-quick-preset').addEventListener('click', () => UI.showPage('presets'));
        document.getElementById('btn-quick-theme').addEventListener('click', () => UI.showPage('theme'));
        document.getElementById('btn-quick-import').addEventListener('click', () => UI.showPage('createGame'));
        document.getElementById('btn-test-api').addEventListener('click', () => this.testApi());
        document.getElementById('btn-save-api').addEventListener('click', () => this.saveApi());
        document.getElementById('btn-add-persona').addEventListener('click', () => this.addPersona());
        document.getElementById('btn-goto-preset').addEventListener('click', () => UI.showPage('presets'));
        document.getElementById('btn-goto-theme').addEventListener('click', () => UI.showPage('theme'));
        document.getElementById('btn-goto-api').addEventListener('click', () => UI.showPage('apiConfig'));
        document.getElementById('btn-generate-game').addEventListener('click', () => this.generateGame());
        document.getElementById('btn-import-game').addEventListener('click', () => this.importGame());
        // 游戏内导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const panelId = e.currentTarget.dataset.panel;
                document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(panelId).classList.add('active');
            });
        });
        document.getElementById('btn-custom-action').addEventListener('click', () => {
            const input = document.getElementById('custom-action-input');
            const text = input.value.trim();
            if (text) {
                GameCore.handlePlayerChoice(text);
                input.value = '';
            }
        });
        document.getElementById('btn-save-game').addEventListener('click', () => SaveManager.saveGame());
        document.getElementById('btn-reset-game').addEventListener('click', () => { this.gameInstance = null; UI.showPage('home'); });
        document.getElementById('btn-factory-reset').addEventListener('click', () => { localStorage.clear(); location.reload(); });
        document.getElementById('btn-add-festival').addEventListener('click', () => this.addFestival());
        document.getElementById('btn-save-world-book').addEventListener('click', () => {
            if (this.gameInstance) {
                this.gameInstance.worldBook = document.getElementById('world-book').value;
                UI.showToast('世界书已保存');
            }
        });
        document.getElementById('btn-apply-custom-theme').addEventListener('click', () => this.applyCustomTheme());
        document.getElementById('btn-reset-theme').addEventListener('click', () => this.resetTheme());
        document.querySelectorAll('.theme-preset').forEach(el => {
            el.addEventListener('click', () => this.applyPresetTheme(el.dataset.theme));
        });
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
        });
        document.getElementById('btn-upload-map-bg').addEventListener('click', () => this.uploadMapBackground());
        document.getElementById('map-container').addEventListener('click', (e) => {
            if (e.target === e.currentTarget || e.target.id === 'map-background') {
                this.addLocationOnMap(e);
            }
        });
        document.getElementById('btn-ai-generate-locations').addEventListener('click', () => this.aiGenerateLocations());
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
    deleteWorld(worldId) {
        this.worldList = this.worldList.filter(w => w.id != worldId);
        localStorage.setItem('worldList', JSON.stringify(this.worldList));
        UI.renderWorldCards();
    },
    async generateGame() {
        const name = document.getElementById('game-world-name').value || '未命名';
        const rules = document.getElementById('game-rules-input').value;
        const world = { id: Date.now(), name, rules };
        this.worldList.push(world);
        localStorage.setItem('worldList', JSON.stringify(this.worldList));
        UI.showToast('世界已创建');
        UI.showPage('home');
        UI.renderWorldCards();
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
        this.personaList.push(persona);
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
        document.documentElement.style.setProperty('--primary', document.getElementById('custom-primary-color').value);
        document.documentElement.style.setProperty('--bg', document.getElementById('custom-bg-color').value);
        document.documentElement.style.setProperty('--card-bg', document.getElementById('custom-card-color').value);
        document.documentElement.style.setProperty('--text', document.getElementById('custom-text-color').value);
        document.documentElement.style.setProperty('--accent', document.getElementById('custom-accent-color').value);
        document.documentElement.style.setProperty('--radius', document.getElementById('custom-radius').value + 'px');
    },
    resetTheme() {
        document.documentElement.style.cssText = '';
    },
    applyPresetTheme(themeName) {
        const themes = {
            default: { primary:'#6c5ce7', bg:'#1a1a2e', cardBg:'#1e1e3a', text:'#e0dce8', accent:'#ff6b9d' },
            warm: { primary:'#e17055', bg:'#2d1e1a', cardBg:'#3a2a22', text:'#f5e6d3', accent:'#fab1a0' },
            forest: { primary:'#00b894', bg:'#1a2e1a', cardBg:'#243824', text:'#d4e6d4', accent:'#55efc4' },
            ocean: { primary:'#0984e3', bg:'#1a2a3e', cardBg:'#1e3248', text:'#dfe6e9', accent:'#74b9ff' },
            royal: { primary:'#a29bfe', bg:'#2e1a3e', cardBg:'#3a2048', text:'#f0e6f6', accent:'#fd79a8' },
            sunset: { primary:'#fdcb6e', bg:'#3e2a1a', cardBg:'#4a3422', text:'#ffeaa7', accent:'#e17055' }
        };
        if (themes[themeName]) {
            const t = themes[themeName];
            document.documentElement.style.setProperty('--primary', t.primary);
            document.documentElement.style.setProperty('--bg', t.bg);
            document.documentElement.style.setProperty('--card-bg', t.cardBg);
            document.documentElement.style.setProperty('--text', t.text);
            document.documentElement.style.setProperty('--accent', t.accent);
            document.querySelectorAll('.theme-preset').forEach(el => el.classList.remove('active'));
            document.querySelector(`.theme-preset[data-theme="${themeName}"]`).classList.add('active');
        }
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
    uploadMapBackground() {
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
    addLocationOnMap(event) {
        if (!this.gameInstance) return;
        const mapContainer = document.getElementById('map-container');
        const rect = mapContainer.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        const name = prompt('输入地点名称：');
        if (name) {
            const newLoc = { id: Date.now(), name, x, y, npcIds: [] };
            this.gameInstance.locations.push(newLoc);
            UI.renderLocations();
            UI.renderMapMarkers();
        }
    },
    async aiGenerateLocations() {
        const prompt = '请为当前游戏世界生成5个地点名称，用逗号分隔。';
        try {
            const response = await GameCore.generateStory(prompt);
            const names = response.split(/[,，]/).slice(0,5).map(n => n.trim());
            names.forEach(name => {
                if (name && !this.gameInstance.locations.find(l => l.name === name)) {
                    this.gameInstance.locations.push({ id: Date.now()+Math.random(), name, x: Math.random()*80+10, y: Math.random()*80+10, npcIds: [] });
                }
            });
            UI.renderLocations();
            UI.renderMapMarkers();
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
    setTimeout(() => document.getElementById('loading-overlay').style.opacity='0', 500);
    setTimeout(() => document.getElementById('loading-overlay').remove(), 1000);
});
