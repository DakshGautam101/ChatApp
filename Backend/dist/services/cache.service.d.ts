export declare const cacheService: {
    get(key: string): Promise<any>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
};
export default cacheService;
//# sourceMappingURL=cache.service.d.ts.map