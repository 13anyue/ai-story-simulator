// js/api.js - AI 接口通信模块

// ==================== API 请求工具函数 ====================

/**
 * 构建 OpenAI 兼容的请求头
 * @param {string} apiKey - API 密钥
 * @param {Object} extra - 额外请求头
 * @returns {Object} 请求头对象
 */
function buildOpenAICompatibleHeaders(apiKey, extra = {}) {
    const key = String(apiKey || '');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'api-key': key,
        ...extra
    };
}

/**
 * 构建可能的 API 端点候选列表（自动补充 /v1）
 * @param {string} baseUrl - 基础 URL
 * @param {string} path - 路径
 * @returns {string[]} 候选 URL 列表
 */
function buildOpenAIEndpointCandidates(baseUrl, path) {
    const base = String(baseUrl || '').replace(/\/+$/, '');
    const p = String(path || '').startsWith('/') ? String(path || '') : `/${path}`;
    const list = [];
    if (base) list.push(base + p);
    // 若未包含 /v1，自动补充候选
    const baseLower = base.toLowerCase();
    const alreadyHasV1 = /\/v1(?:\/|$)/i.test(baseLower);
    if (base && !alreadyHasV1) {
        list.push(base + '/v1' + p);
    }
    return Array.from(new Set(list));
}

/**
 * 提取 API 错误信息，转为中文友好提示
 * @param {Object} maybeJson - 可能的 JSON 响应体
 * @param {string} fallbackText - 回退文本
 * @param {number} status - HTTP 状态码
 * @returns {string} 中文错误信息
 */
function extractOpenAIErrorMessage(maybeJson, fallbackText, status) {
    const statusText = status ? `（状态码：${status}）` : '';
    let rawDetail = '';
    try {
        const obj = (maybeJson && typeof maybeJson === 'object') ? maybeJson : null;
        const errObj = obj?.error;
        const msg =
            (typeof errObj === 'string' ? errObj : null) ||
            errObj?.message ||
            errObj?.detail ||
            obj?.message ||
            obj?.detail ||
            obj?.msg ||
            obj?.error_description ||
            (obj?.code != null && obj?.message ? String(obj.message) : '') ||
            '';
        if (msg && String(msg).trim()) rawDetail = String(msg).trim();
    } catch (e) {}
    if (!rawDetail) {
        const text = String(fallbackText || '').trim();
        if (text) rawDetail = text.slice(0, 400);
    }
    const zh = toChineseNetworkHint(rawDetail);
    if (zh && zh !== '未知错误') return `API 返回错误${statusText}：${zh}`;
    return `API 请求失败${statusText}`;
}

/**
 * 将英文错误信息转为中文网络提示
 * @param {string} raw - 原始错误文本
 * @returns {string} 中文提示
 */
function toChineseNetworkHint(raw) {
    const s = String(raw || '').trim();
    if (!s) return '未知错误';
    const lower = s.toLowerCase();

    // 解析状态码
    const statusMatch = s.match(/\bstatus(?:\s*code)?\b[^\d]{0,10}(\d{3})\b/i) || s.match(/\b(\d{3})\b/);
    const status = statusMatch ? Number(statusMatch[1]) : null;

    // 网络/CORS 错误
    if (/failed to fetch|networkerror|load failed|typeerror: failed to fetch|fetch failed/i.test(s) ||
        /err_network|network\s*error|net::err/i.test(lower) ||
        /ecconnrefused|econnrefused|enotfound|eai_again|dns|name_not_resolved/i.test(lower)) {
        if (/cors|cross-origin|access-control-allow-origin|same origin/i.test(s) || /blocked by cors/i.test(lower)) {
            return '跨域请求被浏览器拦截（CORS），请确认 API 基础地址已正确配置跨域响应头，或使用支持跨域的中转/同源部署方式';
        }
        if (/mixed content|blocked:|insecure|https/i.test(lower) && /http:\/\//i.test(lower)) {
            return '浏览器拦截了不安全请求（混合内容）：当前页面为 HTTPS，但 API 基础地址是 HTTP，请改为 HTTPS 或使用同源代理';
        }
        if (/blocked|adblock|client blocked|err_blocked_by_client/i.test(lower)) {
            return '网络请求被浏览器插件/拦截器阻止，请关闭相关拦截扩展后重试';
        }
        return '网络连接失败：请检查网络是否正常、API 基础地址是否可访问、是否需要代理/加速器，以及浏览器是否拦截了请求';
    }

    // 超时/中断
    if (/timeout|timed out|time out/i.test(lower) || s.includes('超时')) {
        return '请求超时：请稍后重试；若持续超时，请检查 API 基础地址连通性、模型是否可用，或降低生成长度';
    }
    if (/aborted|aborterror|the user aborted/i.test(lower) || /已中止|已取消/.test(s)) {
        return '请求已中止：可能是超时自动取消或页面切换导致，请重试';
    }

    // 鉴权/密钥
    if (status === 401 || status === 403 ||
        /unauthorized|forbidden|invalid_api_key|incorrect api key|api key|authentication/i.test(lower)) {
        return 'API 密钥无效或无权限：请检查设置中的 API 密钥是否正确、是否有额度/权限，以及基础地址是否匹配该密钥';
    }

    // 地址/路由
    if (status === 404 || /not found|404/i.test(lower)) {
        return '接口地址不存在：请检查 API 基础地址是否正确，且通常需要以 /v1 结尾（例如 https://xxx.com/v1）';
    }

    // 限流/拥塞
    if (status === 429 || /too many requests|rate limit|quota/i.test(lower)) {
        return '请求过于频繁或触发限流/额度限制：请稍后再试，或在设置中更换可用的密钥/模型';
    }

    // 服务端/网关
    if ([500, 502, 503, 504].includes(status) || /bad gateway|service unavailable|gateway timeout/i.test(lower)) {
        return '服务暂时不可用或网关异常：请稍后重试；若持续出现，请检查中转服务状态或更换基础地址';
    }

    // 模型/参数/响应解析
    if (/model_not_found|no such model|unknown model|model.*not.*found/i.test(lower)) {
        return '模型不存在或不可用：请在设置中选择有效模型，或点击“获取模型列表”后重新选择';
    }
    if (/context_length_exceeded|max tokens|maximum context/i.test(lower)) {
        return '请求内容过长导致超过模型上下文限制：请缩短输入或降低生成长度后重试';
    }
    if (/invalid request|bad request|invalid.*param|missing required/i.test(lower) || status === 400) {
        return '请求参数不被接口接受：请检查基础地址是否为 OpenAI Compatible 接口，以及模型名称是否正确';
    }
    if (/unexpected token|json|parse|syntaxerror/i.test(lower)) {
        return '响应解析失败：接口返回内容格式不兼容或被网关改写，请检查基础地址与接口兼容性后重试';
    }

    // 连接中断 / TLS / 代理
    if (/econnreset|connection reset|socket hang up|broken pipe|etimedout|enetunreach|ehostunreach/i.test(lower) ||
        (/ssl|tls|certificate|cert_/i.test(lower) && /error|fail|invalid/i.test(lower))) {
        return '连接被中断或安全握手失败：请检查网络稳定性、系统时间是否正确、代理或防火墙设置，稍后重试';
    }
    if (/insufficient balance|余额不足|no quota|exceeded.*quota|payment required|402/i.test(lower)) {
        return '账户额度或余额不足：请充值、更换密钥或稍后再试';
    }
    if (/content[- ]?decoding|decompression failed|incorrect header check/i.test(lower)) {
        return '响应解压或编码异常：请稍后重试，或尝试更换网络环境';
    }
    if (/premature close|incomplete chunked|length required/i.test(lower)) {
        return '传输未完整结束：可能是网络不稳定或服务端提前关闭连接，请稍后重试';
    }

    // 回退：如果包含大量 ASCII，泛化为中文
    const asciiCount = (s.match(/[\x20-\x7E]/g) || []).length;
    if (asciiCount > Math.max(24, s.length * 0.55)) {
        return '发生未知错误（可能是网络异常、跨域拦截、接口不兼容或配置错误）：请检查 API 基础地址与密钥设置后重试';
    }
    const zhTail = String(s).replace(/[A-Za-z0-9_./:-]{4,}/g, ' ').replace(/\s+/g, ' ').trim();
    if (zhTail.length >= 8 && /[\u4e00-\u9fff]/.test(zhTail)) return zhTail.slice(0, 240);
    return '发生未知错误，请检查网络与 API 配置后重试';
}

/**
 * 尝试从响应中提取聊天内容（兼容多种格式）
 * @param {Object} data - 响应 JSON
 * @returns {string} 内容文本
 */
function extractChatCompletionContentFromJson(data) {
    if (!data) return '';
    const choice0 = Array.isArray(data.choices) ? data.choices[0] : null;
    const msg = choice0?.message;
    let content =
        msg?.content ||
        msg?.reasoning_content ||
        choice0?.text ||
        (typeof data?.output === 'string' ? data.output : '') ||
        data?.output_text ||
        data?.content ||
        data?.result ||
        '';
    if (!content && Array.isArray(msg?.content)) {
        content = msg.content.map(x => typeof x === 'string' ? x : (x?.text || x?.content || '')).join('');
    }
    return String(content || '');
}

/**
 * 从流式 SSE 数据中提取增量文本
 * @param {Object} data - SSE 解析后的 JSON
 * @returns {string} 增量文本
 */
function extractDeltaTextFromSseJson(data) {
    const c0 = Array.isArray(data?.choices) ? data.choices[0] : null;
    return (c0?.delta?.content || c0?.delta?.reasoning_content || c0?.delta?.reasoning ||
            c0?.delta?.text || c0?.message?.content || c0?.message?.reasoning_content ||
            c0?.reasoning_content || c0?.text || data?.delta?.content || data?.delta?.reasoning_content ||
            data?.reasoning_content || data?.content || '');
}

/**
 * 安全解析 SSE 的 data 行（兼容引号包裹）
 * @param {string} dataStr - data: 后面的字符串
 * @returns {Object|null} 解析后的对象
 */
function tryParseSseEventData(dataStr) {
    const s = String(dataStr || '').trim();
    if (!s || s === '[DONE]') return null;
    try {
        return JSON.parse(s);
    } catch {
        try {
            const t = s.replace(/^["']|["']$/g, '').trim();
            if (t && t !== s) return JSON.parse(t);
        } catch {}
    }
    return null;
}

/**
 * 智能休眠
 * @param {number} ms - 毫秒
 * @returns {Promise}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 判断 HTTP 状态码是否可重试
 * @param {number} status
 * @returns {boolean}
 */
function shouldRetryHttpStatus(status) {
    return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * 创建带超时的 AbortSignal
 * @param {number} timeoutMs - 超时毫秒
 * @returns {Object} { signal, abort, clear }
 */
function createTimeoutAbortSignal(timeoutMs) {
    const controller = new AbortController();
    let timeoutId = null;
    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timeoutId = setTimeout(() => {
            try { controller.abort(new Error('请求超时')); } catch { controller.abort(); }
        }, timeoutMs);
    }
    return {
        signal: controller.signal,
        abort: (reason) => { try { controller.abort(reason); } catch { controller.abort(); } },
        clear: () => { if (timeoutId) clearTimeout(timeoutId); timeoutId = null; }
    };
}

/**
 * 合并外部和内部 AbortSignal
 * @param {AbortSignal} externalSignal
 * @param {AbortSignal} internalSignal
 * @returns {AbortSignal}
 */
function mergeAbortSignals(externalSignal, internalSignal) {
    if (!externalSignal) return internalSignal;
    if (!internalSignal) return externalSignal;
    try {
        if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
            return AbortSignal.any([externalSignal, internalSignal]);
        }
    } catch {}
    const controller = new AbortController();
    const onAbort = () => {
        try { controller.abort(externalSignal.reason || internalSignal.reason); } catch { controller.abort(); }
    };
    try {
        if (externalSignal.aborted || internalSignal.aborted) onAbort();
        else {
            externalSignal.addEventListener('abort', onAbort, { once: true });
            internalSignal.addEventListener('abort', onAbort, { once: true });
        }
    } catch {
        try { onAbort(); } catch {}
    }
    return controller.signal;
}

/**
 * 带重试和超时的 fetch
 * @param {string} url
 * @param {Object} init
 * @param {Object} opts - { timeoutMs, retries, retryBaseDelayMs }
 * @returns {Promise<Response>}
 */
async function fetchWithTimeoutAndRetry(url, init, opts = {}) {
    const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 120000;
    const retries = Number.isFinite(opts.retries) ? opts.retries : 3;
    const retryBaseDelayMs = Number.isFinite(opts.retryBaseDelayMs) ? opts.retryBaseDelayMs : 1400;

    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const timeout = createTimeoutAbortSignal(timeoutMs);
        let res = null;
        try {
            const mergedSignal = mergeAbortSignals(init?.signal, timeout.signal);
            res = await fetch(url, { ...(init || {}), signal: mergedSignal, cache: 'no-store' });
            timeout.clear();

            if (res && typeof res.status === 'number' && shouldRetryHttpStatus(res.status) && attempt < retries) {
                const st = res.status;
                try { await res.arrayBuffer(); } catch { try { await res.text(); } catch {} }
                res = null;
                let delay = st === 429
                    ? Math.min(90000, retryBaseDelayMs * Math.pow(3, attempt + 1)) + Math.floor(Math.random() * 2000)
                    : Math.min(20000, retryBaseDelayMs * Math.pow(2, attempt)) + Math.floor(Math.random() * 600);
                await sleep(delay);
                continue;
            }
            return res;
        } catch (e) {
            timeout.clear();
            if (res) {
                try { await res.arrayBuffer(); } catch { try { await res.text(); } catch {} }
                res = null;
            }
            lastErr = e;
            const msg = String(e?.message || e || '');
            const isAbort = (e && (e.name === 'AbortError' || /aborted|abort/i.test(msg))) || false;
            const isOurTimeout = /请求超时/.test(msg);
            if (attempt >= retries) break;
            if (/401|403|unauthorized|forbidden|invalid_api_key/i.test(msg)) break;
            let delay = isOurTimeout
                ? Math.min(25000, retryBaseDelayMs * Math.pow(2, attempt + 1)) + Math.floor(Math.random() * 800)
                : Math.min(20000, retryBaseDelayMs * Math.pow(2, attempt)) + Math.floor(Math.random() * 600);
            if (isAbort && init?.signal?.aborted && !isOurTimeout) break;
            await sleep(delay);
        }
    }
    throw lastErr || new Error('网络请求失败');
}

/**
 * 统一的 OpenAI 兼容接口调用（自动尝试流式/非流式，多端点回退）
 * @param {Object} params
 * @param {string} params.baseUrl - API 基础地址
 * @param {string} params.apiKey - API 密钥
 * @param {Object} params.body - 请求体
 * @param {boolean} params.preferStream - 是否优先流式
 * @param {Object} params.fetchOpts - 额外 fetch 选项
 * @param {Function} params.onDelta - 流式回调 (piece, full)
 * @returns {Promise<string>} 完整响应文本
 */
async function openAIChatRequestAuto({ baseUrl, apiKey, body, preferStream = true, fetchOpts = {}, onDelta = null }) {
    const headersStream = buildOpenAICompatibleHeaders(apiKey, { 'Accept': 'text/event-stream' });
    const headersJson = buildOpenAICompatibleHeaders(apiKey, { 'Accept': 'application/json' });
    const candidates = buildOpenAIEndpointCandidates(baseUrl, '/chat/completions');

    const nonStreamFetchOpts = { timeoutMs: 120000, retries: 3, retryBaseDelayMs: 1400, ...(fetchOpts.nonStream || {}) };
    const streamFetchOpts = { timeoutMs: 120000, retries: 2, retryBaseDelayMs: 1400, ...(fetchOpts.stream || {}) };

    const doNonStream = async () => {
        let lastErr = null;
        for (const url of candidates) {
            try {
                const res = await fetchWithTimeoutAndRetry(url, {
                    method: 'POST',
                    headers: headersJson,
                    body: JSON.stringify({ ...body, stream: false })
                }, nonStreamFetchOpts);
                const { json, text } = await (async () => {
                    try { return { json: await res.json(), text: '' }; } catch { return { json: null, text: await res.text() }; }
                })();
                if (!res.ok) throw new Error(extractOpenAIErrorMessage(json, text, res.status));
                let data = json;
                if (!data && text) { try { data = JSON.parse(text); } catch { data = null; } }
                let content = extractChatCompletionContentFromJson(data);
                if (!content.trim() && data) content = typeof data === 'object' ? JSON.stringify(data) : String(data);
                if (!content.trim()) throw new Error('API 响应成功，但未解析到可用内容，可能是模型输出了空文本或触发了安全拦截');
                return content;
            } catch (e) { lastErr = e; }
        }
        throw lastErr || new Error('API 请求失败');
    };

    const doStream = async () => {
        let lastErr = null;
        for (const url of candidates) {
            let full = '';
            try {
                const res = await fetchWithTimeoutAndRetry(url, {
                    method: 'POST',
                    headers: headersStream,
                    body: JSON.stringify({ ...body, stream: true })
                }, streamFetchOpts);
                if (!res.ok) {
                    const { json, text } = await (async () => {
                        try { return { json: await res.json(), text: '' }; } catch { return { json: null, text: await res.text() }; }
                    })();
                    throw new Error(extractOpenAIErrorMessage(json, text, res.status));
                }
                if (!res.body || !res.body.getReader) {
                    throw Object.assign(new Error('当前接口未提供可读取的流式响应体，将自动改用非流式模式'), { _streamNotSupported: true });
                }
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                const streamStartTime = Date.now();
                const STREAM_TOTAL_MS = 180000;
                const STREAM_IDLE_MS = 120000;
                let receivedAnyChunk = false;
                let lastChunkAt = Date.now();

                while (true) {
                    if (Date.now() - streamStartTime > STREAM_TOTAL_MS) {
                        throw Object.assign(new Error('流式传输超时：整体等待时间过长'), { _streamMaybeRecoverable: true, _streamPartialText: full });
                    }
                    if (receivedAnyChunk && Date.now() - lastChunkAt > STREAM_IDLE_MS) {
                        throw Object.assign(new Error('流式传输空闲超时：长时间未收到数据'), { _streamMaybeRecoverable: true, _streamPartialText: full });
                    }
                    const { done, value } = await reader.read();
                    if (done) break;
                    receivedAnyChunk = true;
                    lastChunkAt = Date.now();
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        const trimmed = String(line || '').replace(/\r$/, '').trim();
                        if (!trimmed || !trimmed.startsWith('data:')) continue;
                        const dataStr = trimmed.replace(/^data:\s*/, '');
                        if (dataStr === '[DONE]') continue;
                        const data = tryParseSseEventData(dataStr);
                        if (!data) continue;
                        const piece = extractDeltaTextFromSseJson(data);
                        if (piece) {
                            full += piece;
                            if (typeof onDelta === 'function') { try { onDelta(piece, full); } catch {} }
                        }
                    }
                }
                const rest = String(buffer || '').replace(/\r$/, '').trim();
                if (rest) {
                    const restLines = rest.includes('\n') ? rest.split('\n').map(l => l.replace(/\r$/, '').trim()).filter(Boolean) : [rest];
                    for (const trimmed of restLines) {
                        if (!trimmed.startsWith('data:')) continue;
                        const dataStr = trimmed.replace(/^data:\s*/, '');
                        if (!dataStr || dataStr === '[DONE]') continue;
                        const data = tryParseSseEventData(dataStr);
                        if (!data) continue;
                        const piece = extractDeltaTextFromSseJson(data);
                        if (piece) {
                            full += piece;
                            if (typeof onDelta === 'function') { try { onDelta(piece, full); } catch {} }
                        }
                    }
                }
                if (!full.trim()) {
                    throw Object.assign(new Error('流式响应已结束，但未解析到内容'), { _streamNotSupported: true, _streamPartialText: full });
                }
                return full;
            } catch (e) {
                if (String(full ?? '').trim()) return full;
                lastErr = e;
            }
        }
        throw lastErr || new Error('流式请求失败');
    };

    if (preferStream) {
        try { return await doStream(); } catch (e) { try { return await doNonStream(); } catch { throw e; } }
    }
    return await doNonStream();
}

/**
 * 获取可用模型列表
 * @param {Object} params
 * @param {string} params.baseUrl
 * @param {string} params.apiKey
 * @returns {Promise<Array<{id: string}>>}
 */
async function openAIModelsRequestAuto({ baseUrl, apiKey }) {
    const headers = buildOpenAICompatibleHeaders(apiKey, { 'Accept': 'application/json' });
    const candidates = buildOpenAIEndpointCandidates(baseUrl, '/models');
    let lastErr = null;
    for (const url of candidates) {
        try {
            const res = await fetchWithTimeoutAndRetry(url, { headers }, { timeoutMs: 120000, retries: 3, retryBaseDelayMs: 1400 });
            if (!res.ok) {
                const { json, text } = await (async () => {
                    try { return { json: await res.json(), text: '' }; } catch { return { json: null, text: await res.text() }; }
                })();
                throw new Error(extractOpenAIErrorMessage(json, text, res.status));
            }
            const { json, text } = await (async () => {
                try { return { json: await res.json(), text: '' }; } catch { return { json: null, text: await res.text() }; }
            })();
            let data = json;
            if (!data && text) { try { data = JSON.parse(text); } catch { data = null; } }
            const list =
                (Array.isArray(data) ? data : null) ||
                (Array.isArray(data?.data) ? data.data : null) ||
                (Array.isArray(data?.models) ? data.models : null) ||
                (Array.isArray(data?.model_list) ? data.model_list : null) ||
                (Array.isArray(data?.result) ? data.result : null) ||
                [];
            const models = list
                .map(m => (typeof m === 'string' ? { id: m } : m))
                .map(m => ({ id: m?.id || m?.name || m?.model || m?.model_id || m?.deployment || '' }))
                .filter(m => m.id && String(m.id).trim())
                .map(m => ({ id: String(m.id).trim() }));
            return Array.from(new Set(models.map(m => m.id))).map(id => ({ id }));
        } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('获取模型失败');
}

// ==================== 对外接口函数（绑定到 window 供其他模块调用）====================

/**
 * 核心 LLM 调用入口（供游戏逻辑使用）
 * @param {string} userContent - 用户输入
 * @param {string} systemContent - 系统提示词
 * @returns {Promise<string>} AI 响应文本
 */
async function callLLMRequest(userContent, systemContent) {
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'flex';
    try {
        // 检查 API 配置
        if (!window.gameState?.apiConfig?.key || !window.gameState?.apiConfig?.endpoint || !window.gameState?.apiConfig?.model) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return "【单机脱机模式】\n由于未配置API密钥，位面法则转入内置自循环系统：\n【场景路人】：\"既然未开启云密钥，不如手动DIY所有NPC交互、属性变质、在地图场景中全自由编写剧本日志罢！\"\n（内心：即使没有大模型回馈，纯手动沙盒创造也是极高自由度的体验...）\n||选项分组||\n1. 打开「设置」修改提示词语气\n2. 涉足「大地图」建立新场景\n3. 切入「NPC」手动制造宿世死敌\n4. 前往「属性日志」扩展属性项";
        }
        const response = await openAIChatRequestAuto({
            baseUrl: window.gameState.apiConfig.endpoint,
            apiKey: window.gameState.apiConfig.key,
            body: {
                model: window.gameState.apiConfig.model,
                messages: [{ role: "system", content: systemContent }, { role: "user", content: userContent }],
                temperature: 0.85
            },
            preferStream: true
        });
        return response;
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

/**
 * 测试 API 连通性
 */
async function testAPIConnection() {
    const endpoint = document.getElementById('cfg-endpoint')?.value.trim();
    const key = document.getElementById('cfg-key')?.value.trim();
    const model = document.getElementById('cfg-model')?.value.trim();
    if (!key || !model) { window.showToast?.("密钥与模型名不可留空！", false); return; }
    window.showToast?.("正在发射连通性测试...");
    try {
        const response = await fetch(`${endpoint}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({ model: model, messages: [{ role: "user", content: "ping" }], max_tokens: 5 })
        });
        if (response.ok) window.showToast?.("【连通成功】云端神经元成功回馈！");
        else window.showToast?.(`【连通受挫】状态码：${response.status}。`, false);
    } catch (err) { window.showToast?.("【连通熔断】网络层面阻断。", false); }
}

/**
 * 获取可用模型列表并填充下拉框
 */
async function fetchAvailableModels() {
    const endpoint = document.getElementById('cfg-endpoint')?.value.trim();
    const key = document.getElementById('cfg-key')?.value.trim();
    if (!key) { window.showToast?.("需先填入密钥！", false); return; }
    window.showToast?.("正向远程拉取模型名册...");
    try {
        const models = await openAIModelsRequestAuto({ baseUrl: endpoint, apiKey: key });
        const box = document.getElementById('model-list-box');
        const listContainer = document.getElementById('model-list-items');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        if (models.length === 0) {
            listContainer.innerHTML = '<div>未找到可用模型</div>';
        } else {
            models.slice(0, 15).forEach(m => {
                const div = document.createElement('div');
                div.className = 'model-item';
                div.innerText = m.id;
                div.onclick = () => {
                    const modelInput = document.getElementById('cfg-model');
                    if (modelInput) modelInput.value = m.id;
                    window.showToast?.(`已选定模型：${m.id}`);
                };
                listContainer.appendChild(div);
            });
        }
        if (box) box.classList.remove('hidden');
        window.showToast?.("成功拉取模型名册！");
    } catch (err) { window.showToast?.("远程列表拉取受阻，可手动填入。", false); }
}

/**
 * 保存 API 配置并返回大厅
 */
function saveAPIConfigAndBack() {
    const endpoint = document.getElementById('cfg-endpoint')?.value.trim();
    const key = document.getElementById('cfg-key')?.value.trim();
    const model = document.getElementById('cfg-model')?.value.trim();
    if (window.gameState) {
        window.gameState.apiConfig = { endpoint, key, model };
        localStorage.setItem("AI_WENYOU_CONFIG", JSON.stringify(window.gameState.apiConfig));
    }
    window.showToast?.("API凭证已保存。");
    window.switchScreen?.('screen-lobby');
}

/**
 * 清理 AI JSON 输出（去除 Markdown 代码块标记）
 * @param {string} rawStr
 * @returns {string}
 */
function cleanAiJsonOutput(rawStr) {
    let out = rawStr.trim();
    if (out.startsWith("```json")) out = out.substring(7);
    if (out.startsWith("```")) out = out.substring(3);
    if (out.endsWith("```")) out = out.substring(0, out.length - 3);
    return out.trim();
}

// 挂载到全局
if (typeof window !== 'undefined') {
    window.callLLMRequest = callLLMRequest;
    window.testAPIConnection = testAPIConnection;
    window.fetchAvailableModels = fetchAvailableModels;
    window.saveAPIConfigAndBack = saveAPIConfigAndBack;
    window.cleanAiJsonOutput = cleanAiJsonOutput;
    window.openAIChatRequestAuto = openAIChatRequestAuto;
    window.openAIModelsRequestAuto = openAIModelsRequestAuto;
}
