// 确保 assignAvatarFromLibrary 被覆盖，避免调用头像库
if (typeof window.assignAvatarFromLibrary !== 'function') {
    window.assignAvatarFromLibrary = function() { return; };
}
// 确保 getSafeAvatarURL 仅处理有效 URL，不依赖头像库
if (window.getSafeAvatarURL && window.getSafeAvatarURL.toString().includes('AVATAR_LIBRARY')) {
    window.getSafeAvatarURL = function(avatarData) {
        if (!avatarData) return null;
        if (typeof avatarData === 'string' && (avatarData.startsWith('http') || avatarData.startsWith('blob:') || avatarData.startsWith('data:'))) {
            return avatarData;
        }
        return null;
    };
}
console.log("✅ 头像库依赖已移除，使用首字母文字头像");
