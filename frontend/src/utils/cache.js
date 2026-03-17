export const readCache = (key, fallback = null) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

export const writeCache = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore quota or serialization errors
    }
};

/**
 * Limpa chaves específicas conhecidas de cache antigo
 */
export const clearLegacyCaches = () => {
    const legacyKeys = [
        'ordens_list_v1',
        'stats_v1',
        'recent_orders_v1',
        'map_montadores_v1'
    ];
    legacyKeys.forEach(key => localStorage.removeItem(key));
};

/**
 * Esquema de migração: Limpa caches se a versão da aplicação mudar
 */
export const initCacheMigration = (currentVersion = '1.1') => {
    const savedVersion = localStorage.getItem('app_cache_version');
    if (savedVersion !== currentVersion) {
        clearLegacyCaches();
        localStorage.setItem('app_cache_version', currentVersion);
        console.log(`[Cache] Cache limpo e versão atualizada para ${currentVersion}`);
    }
};

