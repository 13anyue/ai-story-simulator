const GameSystems = {
    addLifeLog(game, text) {
        game.lifeLog.unshift({ time: `第${game.day}天 ${game.time}`, text });
        if (game.lifeLog.length > 50) game.lifeLog.pop();
    },
    recordNpcAppearance(game, npcId) {
        if (!game.npcMeetCount[npcId]) game.npcMeetCount[npcId] = 0;
        game.npcMeetCount[npcId]++;
        if (game.npcMeetCount[npcId] === 3) {
            const npc = game.npcs.find(n => n.id === npcId);
            if (npc && !npc.known) {
                npc.known = true;
                UI.showToast(`你认识了 ${npc.name}`);
                this.addLifeLog(game, `与${npc.name}正式相识。`);
            }
        }
    },
    addItem(game, item, isPrivate = false) {
        const list = isPrivate ? game.player.privateItems : game.player.inventory;
        list.push({ id: Date.now(), name: item.name, desc: item.desc, icon: item.icon || 'fa-box' });
    },
    getFamilyTree(npc) {
        if (!npc.familyTree) return '无家族信息';
        return Object.entries(npc.familyTree).map(([rel, name]) => `${rel}: ${name}`).join('，');
    },
    checkFestival(game) {
        const festivals = AppState.festivalList || [];
        for (let f of festivals) {
            const [name, interval] = f.split(',');
            if (game.day % parseInt(interval) === 0) {
                game.activeFestival = name;
                return name;
            }
        }
        game.activeFestival = null;
        return null;
    },
    randomWeather() {
        const list = ['晴', '阴', '小雨', '微风'];
        return list[Math.floor(Math.random() * list.length)];
    },
    addPost(game, title, content, author = '玩家') {
        game.forumPosts.unshift({ id: Date.now(), title, content, author, replies: [] });
    },
    generatePhoneContent(npc) {
        if (!npc.phoneContent) npc.phoneContent = { apps: [], messages: [] };
        if (npc.phoneContent.apps.length === 0) {
            npc.phoneContent.apps = ['备忘录', '日志', '密信'];
        }
    }
};
