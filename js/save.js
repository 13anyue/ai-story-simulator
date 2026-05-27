const SaveManager = {
    saveGame(slotName) {
        const game = AppState.gameInstance;
        if (!game) return;
        const saves = this.getAllSaves();
        const saveKey = slotName || `auto_${Date.now()}`;
        saves[saveKey] = {
            timestamp: Date.now(),
            data: JSON.parse(JSON.stringify(game))
        };
        localStorage.setItem('gameSaves', JSON.stringify(saves));
        UI.showToast(`存档已保存至：${saveKey}`);
    },
    loadGame(slotName) {
        const saves = this.getAllSaves();
        const save = saves[slotName];
        if (save) {
            AppState.gameInstance = JSON.parse(JSON.stringify(save.data));
            return true;
        }
        return false;
    },
    getAllSaves() {
        const raw = localStorage.getItem('gameSaves');
        return raw ? JSON.parse(raw) : {};
    },
    deleteSave(slotName) {
        const saves = this.getAllSaves();
        delete saves[slotName];
        localStorage.setItem('gameSaves', JSON.stringify(saves));
    },
    exportGame() {
        const data = {
            worlds: AppState.worldList,
            presets: AppState.presets,
            activeWorldId: AppState.activeWorldId,
            game: AppState.gameInstance
        };
        return JSON.stringify(data, null, 2);
    },
    importGame(jsonStr) {
        const data = JSON.parse(jsonStr);
        if (data.worlds) AppState.worldList = data.worlds;
        if (data.presets) AppState.presets = data.presets;
        if (data.activeWorldId) AppState.activeWorldId = data.activeWorldId;
        if (data.game) AppState.gameInstance = data.game;
    }
};
