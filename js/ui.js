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
            // 刷新对应页面内容
            if (pageId === 'home') {
                this.renderWorldCards();
                this.updateWelcomeName();
            } else if (pageId === 'profile') {
                this.renderPersonas();
                this.renderWorldSelect();
            } else if (pageId === 'presets') {
                this.renderPresets();
            } else if (pageId === 'game') {
                this.refreshGameUI();
            } else if (pageId === 'apiConfig') {
                this.loadApiFields();
            }
        }
    },
    bindGlobalEvents() {
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if (target) this.showPage(target);
            });
        });
    },
    updateWelcomeName() {
        const persona = AppState.personaList.find(p => p.id === AppState.activePersonaId);
        document.getElementById('welcome-name').textContent = persona ? persona.name : '旅行者';
        document.getElementById('avatar-display').textContent = persona ? persona.name[0] : '?';
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
                <div class="world-card-actions">
                    <button class="btn-sm btn-outline enter-world-btn"><i class="fas fa-play"></i> 进入</button>
                    <button class="btn-sm btn-outline delete-world-btn" data-id="${w.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.
