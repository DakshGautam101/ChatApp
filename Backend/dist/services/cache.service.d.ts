export declare const cacheService: {
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
};
export default cacheService;
//# sourceMappingURL=cache.service.d.ts.map