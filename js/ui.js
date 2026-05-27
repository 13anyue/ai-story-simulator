// 界面渲染与事件绑定
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
    showPage(pageId) {
        Object.values(this.pages).forEach(p => p.classList.remove('active'));
        if (this.pages[pageId]) {
            this.pages[pageId].classList.add('active');
            this.currentPage = pageId;
            if (pageId === 'game') this.refreshGameUI();
        }
    },
    bindGlobalEvents() {
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if (target) this.showPage(target);
            });
        });
        // 其他事件在app.js中按需绑定
    },
    renderWorldCards() {
        const container = document.getElementById('world-cards-container');
        const empty = document.getElementById('empty-worlds');
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
                <button class="btn-sm btn-outline enter-world-btn">进入</button>
            </div>
        `).join('');
        container.querySelectorAll('.enter-world-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const worldId = e.target.closest('.world-card').dataset.worldId;
                AppState.loadWorld(worldId);
            });
        });
    },
    refreshGameUI() {
        if (!AppState.gameInstance) return;
        const g = AppState.gameInstance;
        document.getElementById('game-world-badge').textContent = g.worldName;
        document.getElementById('game-weather').innerHTML = `<i class="fas fa-${g.weather==='晴'?'sun':g.weather==='阴'?'cloud':'cloud-rain'}"></i> ${g.weather}`;
        document.getElementById('game-time').textContent = `${g.time}·${g.season}`;
        document.getElementById('game-date').textContent = `第${g.day}天`;
        const festivalEl = document.getElementById('game-festival');
        if (g.activeFestival) {
            festivalEl.classList.remove('hidden');
            festivalEl.innerHTML = `<i class="fas fa-star"></i> ${g.activeFestival}`;
        } else festivalEl.classList.add('hidden');
        this.renderPlayerStats();
        this.renderInventory();
        this.renderNpcList();
        this.renderLifeLog();
        this.renderLocations();
    },
    renderPlayerStats() {
        const g = AppState.gameInstance;
        document.getElementById('player-name-display').textContent = g.player.name;
        document.getElementById('player-title-display').textContent = g.player.title;
        document.getElementById('player-avatar-large').textContent = g.player.name.charAt(0);
        const statsDiv = document.getElementById('player-stats');
        statsDiv.innerHTML = Object.entries(g.player.stats).map(([k,v]) => `<span class="tag">${k}: ${v}</span>`).join('');
    },
    renderInventory() {
        const g = AppState.gameInstance;
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = g.player.inventory.map(i => `<div class="item-card tag">${i.name}</div>`).join('');
        const privGrid = document.getElementById('private-items-grid');
        privGrid.innerHTML = g.player.privateItems.map(i => `<div class="item-card tag"><i class="fas fa-lock"></i> ${i.name}</div>`).join('');
        document.getElementById('item-count').textContent = g.player.inventory.length + '件';
    },
    renderNpcList() {
        const g = AppState.gameInstance;
        const container = document.getElementById('npc-list');
        container.innerHTML = g.npcs.map(npc => `
            <div class="npc-card" data-npc-id="${npc.id}">
                <div class="npc-avatar">${npc.avatarChar||npc.name[0]}</div>
                <div class="npc-info"><strong>${npc.name}</strong> <span class="text-dim">${npc.title||''}</span></div>
                <div class="npc-actions">
                    ${npc.interactions.slice(0,2).map(a => `<button class="btn-sm btn-outline interact-btn" data-action="${a}">${a}</button>`).join('')}
                </div>
            </div>
        `).join('');
        // 绑定交互事件
        container.querySelectorAll('.interact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const npcId = e.target.closest('.npc-card').dataset.npcId;
                const action = e.target.dataset.action;
                AppState.interactWithNpc(npcId, action);
            });
        });
        container.querySelectorAll('.npc-card').forEach(card => {
            card.addEventListener('click', () => {
                const npcId = card.dataset.npcId;
                this.showNpcDetail(npcId);
            });
        });
    },
    showNpcDetail(npcId) {
        const npc = AppState.gameInstance.npcs.find(n => n.id === npcId);
        if (!npc) return;
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <h3>${npc.name} <small>${npc.title||''}</small></h3>
            <p><strong>背景：</strong>${npc.background||'无'}</p>
            <p><strong>属性：</strong>${Object.entries(npc.stats).map(([k,v])=>`${k}:${v}`).join(', ')}</p>
            <p><strong>家族：</strong>${GameSystems.getFamilyTree(npc)}</p>
            <div class="btn-row"><button class="btn-sm btn-outline" id="btn-open-npc-phone"><i class="fas fa-mobile-alt"></i> 查看手机</button></div>
        `;
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('btn-open-npc-phone').onclick = () => this.openNpcPhone(npc);
    },
    openNpcPhone(npc) {
        GameSystems.generatePhoneContent(npc);
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <h3><i class="fas fa-mobile-alt"></i> ${npc.name}的手机</h3>
            <div class="phone-apps">${npc.phoneContent.apps.map(app => `<span class="tag phone-app" data-app="${app}">${app}</span>`).join('')}</div>
            <div id="phone-app-content" class="phone-app-content"></div>
        `;
        document.querySelectorAll('.phone-app').forEach(appEl => {
            appEl.addEventListener('click', () => {
                document.getElementById('phone-app-content').innerHTML = `<p>这是${appEl.dataset.app}的内容（AI生成）</p>`;
            });
        });
    },
    renderLifeLog() {
        const g = AppState.gameInstance;
        const list = document.getElementById('life-log-list');
        list.innerHTML = g.lifeLog.slice(0,20).map(log => `<div class="log-entry"><small>${log.time}</small> ${log.text}</div>`).join('');
    },
    renderLocations() {
        const g = AppState.gameInstance;
        const list = document.getElementById('location-list');
        list.innerHTML = g.locations.map(loc => `<div class="location-item">${loc.name} <span class="text-dim">${loc.npcIds?.length||0}人</span></div>`).join('');
    },
    showToast(msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast'; toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};
