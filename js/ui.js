const UI = {
    pages: {},
    currentPage: null,
    init() {
        this.pages = {
            home: document.getElementById('page-home'),
            apiConfig: document.getElementById('page-api-config'),
            profile: document.getElementById('page-profile'),
            presets: document.getElementById('page-presets'),
            theme: document.getElementById('page-theme'),
            createGame: document.getElementById('page-create-game'),
            game: document.getElementById('page-game')
        };
        this.bindGlobalEvents();
    },
    bindGlobalEvents() {
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if (target) this.showPage(target);
            });
        });
    },
    // 核心修复：覆盖所有页面，确保切换后内容不空白
    showPage(pageId) {
        if (!this.pages[pageId]) {
            console.warn('页面未找到:', pageId);
            return;
        }
        // 隐藏所有页面
        Object.values(this.pages).forEach(p => p.classList.remove('active'));
        // 显示目标页面
        this.pages[pageId].classList.add('active');
        this.currentPage = pageId;

        // 根据页面ID刷新对应内容
        switch (pageId) {
            case 'home':
                this.refreshHome();
                break;
            case 'profile':
                this.refreshProfile();
                break;
            case 'presets':
                this.renderPresets();
                break;
            case 'apiConfig':
                this.loadApiFields();
                this.updateApiStatus();
                break;
            case 'theme':
                this.loadThemeFields();
                break;
            case 'createGame':
                this.renderPresetOptions();
                break;
            case 'game':
                this.refreshGameUI();
                break;
            default:
                // 任何未知页面至少保证可见，避免空白
                break;
        }
    },
    refreshHome() {
        this.renderWorldCards();
        this.updateWelcomeName();
    },
    refreshProfile() {
        this.renderPersonas();
        this.renderWorldSelect();
    },
    updateWelcomeName() {
        const persona = AppState.personaList.find(p => p.id === AppState.activePersonaId);
        document.getElementById('welcome-name').textContent = persona ? persona.name : '旅行者';
        document.getElementById('avatar-display').textContent = persona ? persona.name[0] : '?';
    },
    renderWorldCards() {
        const container = document.getElementById('world-cards-container');
        const empty = document.getElementById('empty-worlds');
        if (!container) return;
        if (!AppState.worldList.length) {
            container.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
        container.innerHTML = AppState.worldList.map(w => `
            <div class="world-card" data-world-id="${w.id}">
                <h4>${w.name}</h4>
                <p>${w.rules ? w.rules.substring(0,60)+'...' : '无描述'}</p>
                <div class="world-card-actions">
                    <button class="btn-sm btn-outline enter-world-btn"><i class="fas fa-play"></i> 进入</button>
                    <button class="btn-sm btn-outline delete-world-btn" data-id="${w.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.enter-world-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const worldId = e.target.closest('.world-card').dataset.worldId;
                AppState.loadWorld(worldId);
            });
        });
        container.querySelectorAll('.delete-world-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.closest('.delete-world-btn').dataset.id;
                AppState.deleteWorld(id);
            });
        });
    },
    renderPersonas() {
        const list = document.getElementById('persona-list');
        const empty = document.getElementById('empty-personas');
        if (!list) return;
        if (!AppState.personaList.length) {
            list.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
        list.innerHTML = AppState.personaList.map(p => `
            <div class="persona-card">
                <strong>${p.name}</strong>
                <span class="text-dim">绑定：${p.worldBind || '无'}</span>
                <button class="btn-sm btn-outline select-persona" data-id="${p.id}">选择</button>
            </div>
        `).join('');
        list.querySelectorAll('.select-persona').forEach(btn => {
            btn.addEventListener('click', () => {
                AppState.activePersonaId = btn.dataset.id;
                localStorage.setItem('activePersonaId', AppState.activePersonaId);
                this.updateWelcomeName();
                UI.showToast('已切换面具角色');
            });
        });
    },
    renderWorldSelect() {
        const select = document.getElementById('select-default-world');
        if (!select) return;
        select.innerHTML = '<option value="">-- 未选择 --</option>' +
            AppState.worldList.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        if (AppState.activePersonaId) {
            const persona = AppState.personaList.find(p => p.id === AppState.activePersonaId);
            if (persona) select.value = persona.worldBind || '';
        }
        select.onchange = () => {
            if (AppState.activePersonaId) {
                const persona = AppState.personaList.find(p => p.id === AppState.activePersonaId);
                if (persona) persona.worldBind = select.value;
                localStorage.setItem('personaList', JSON.stringify(AppState.personaList));
            }
        };
    },
    renderPresets() {
        const container = document.getElementById('preset-list');
        if (!container) return;
        container.innerHTML = AppState.presets.map(p => `
            <div class="preset-card">
                <h4>${p.name}</h4>
                <p>${p.content.substring(0,80)}...</p>
                <button class="btn-sm btn-outline edit-preset" data-id="${p.id}">编辑</button>
            </div>
        `).join('');
    },
    renderPresetOptions() {
        const select = document.getElementById('select-preset-for-game');
        if (!select) return;
        select.innerHTML = AppState.presets.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    },
    loadApiFields() {
        const config = APIManager.getConfig();
        const endpoint = document.getElementById('api-endpoint');
        if (endpoint) endpoint.value = config.endpoint || '';
        const key = document.getElementById('api-key');
        if (key) key.value = config.key || '';
        const model = document.getElementById('api-model');
        if (model) model.value = config.model || '';
        const temp = document.getElementById('api-temperature');
        if (temp) temp.value = config.temperature;
        const tempVal = document.getElementById('temperature-value');
        if (tempVal) tempVal.textContent = config.temperature;
        const tokens = document.getElementById('api-max-tokens');
        if (tokens) tokens.value = config.maxTokens;
    },
    updateApiStatus() {
        const config = APIManager.getConfig();
        const endpointEl = document.getElementById('status-endpoint');
        if (endpointEl) endpointEl.textContent = config.endpoint || '未配置';
        const modelEl = document.getElementById('status-model');
        if (modelEl) modelEl.textContent = config.model || '未配置';
        const connEl = document.getElementById('status-connection');
        if (connEl) connEl.textContent = config.endpoint ? '就绪' : '未测试';
    },
    loadThemeFields() {
        const theme = AppState.currentTheme || DEFAULT_DATA.theme;
        const setColor = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setColor('custom-primary-color', theme.primary);
        setColor('custom-bg-color', theme.bg);
        setColor('custom-card-color', theme.cardBg);
        setColor('custom-text-color', theme.text);
        setColor('custom-accent-color', theme.accent);
    },
    refreshGameUI() {
        if (!AppState.gameInstance) return;
        const g = AppState.gameInstance;
        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        setText('game-world-badge', g.worldName);
        const weatherEl = document.getElementById('game-weather');
        if (weatherEl) weatherEl.innerHTML = `<i class="fas fa-${g.weather==='晴'?'sun':g.weather==='阴'?'cloud':'cloud-rain'}"></i> ${g.weather}`;
        setText('game-time', `${g.time}·${g.season}`);
        setText('game-date', `第${g.day}天`);
        const festivalEl = document.getElementById('game-festival');
        if (festivalEl) {
            if (g.activeFestival) {
                festivalEl.classList.remove('hidden');
                festivalEl.innerHTML = `<i class="fas fa-star"></i> ${g.activeFestival}`;
            } else {
                festivalEl.classList.add('hidden');
            }
        }
        this.renderPlayerStats();
        this.renderInventory();
        this.renderNpcList();
        this.renderLifeLog();
        this.renderLocations();
        this.renderSaveSlots();
        this.renderFestivalTags();
    },
    renderPlayerStats() {
        const g = AppState.gameInstance;
        const nameEl = document.getElementById('player-name-display');
        if (nameEl) nameEl.textContent = g.player.name;
        const titleEl = document.getElementById('player-title-display');
        if (titleEl) titleEl.textContent = g.player.title;
        const avatarEl = document.getElementById('player-avatar-large');
        if (avatarEl) avatarEl.textContent = g.player.name.charAt(0);
        const statsDiv = document.getElementById('player-stats');
        if (statsDiv) statsDiv.innerHTML = Object.entries(g.player.stats).map(([k,v]) => `<span class="tag">${k}: ${v}</span>`).join('');
    },
    renderInventory() {
        const g = AppState.gameInstance;
        const grid = document.getElementById('inventory-grid');
        if (grid) grid.innerHTML = g.player.inventory.map(i => `<div class="item-card tag" title="${i.desc||''}"><i class="fas ${i.icon||'fa-box'}"></i> ${i.name}</div>`).join('');
        const privGrid = document.getElementById('private-items-grid');
        if (privGrid) privGrid.innerHTML = g.player.privateItems.map(i => `<div class="item-card tag"><i class="fas fa-lock"></i> ${i.name}</div>`).join('');
        const countEl = document.getElementById('item-count');
        if (countEl) countEl.textContent = g.player.inventory.length + '件';
    },
    renderNpcList() {
        const g = AppState.gameInstance;
        const container = document.getElementById('npc-list');
        if (!container) return;
        container.innerHTML = g.npcs.map(npc => `
            <div class="npc-card" data-npc-id="${npc.id}">
                <div class="npc-avatar">${npc.avatarChar||npc.name[0]}</div>
                <div class="npc-info"><strong>${npc.name}</strong> <span class="text-dim">${npc.title||''}</span></div>
                <div class="npc-actions">
                    ${npc.interactions.slice(0,2).map(a => `<button class="btn-sm btn-outline interact-btn" data-action="${a}">${a}</button>`).join('')}
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.interact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const npcId = e.target.closest('.npc-card').dataset.npcId;
                const action = e.target.dataset.action;
                AppState.interactWithNpc(npcId, action);
            });
        });
        container.querySelectorAll('.npc-card').forEach(card => {
            card.addEventListener('click', () => this.showNpcDetail(card.dataset.npcId));
        });
    },
    showNpcDetail(npcId) { /* 保持原有逻辑，略 */ },
    openNpcPhone(npc) { /* 保持原有逻辑，略 */ },
    renderLifeLog() {
        const g = AppState.gameInstance;
        const list = document.getElementById('life-log-list');
        if (!list) return;
        list.innerHTML = g.lifeLog.slice(0,20).map(log => `<div class="log-entry"><small>${log.time}</small> ${log.text}</div>`).join('');
    },
    renderLocations() {
        const g = AppState.gameInstance;
        const list = document.getElementById('location-list');
        if (list) list.innerHTML = g.locations.map(loc => `<div class="location-item"><strong>${loc.name}</strong> <span class="text-dim">${loc.npcIds?.length||0}人</span></div>`).join('');
        this.renderMapMarkers();
    },
    renderMapMarkers() {
        const g = AppState.gameInstance;
        const container = document.getElementById('map-markers');
        if (!container) return;
        container.innerHTML = g.locations.map(loc => `<div class="map-marker" style="left:${loc.x||50}%; top:${loc.y||50}%;" data-loc-id="${loc.id}" title="${loc.name}"></div>`).join('');
    },
    renderSaveSlots() { /* 保持原有逻辑 */ },
    renderFestivalTags() { /* 保持原有逻辑 */ },
    showToast(msg) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast'; toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};
