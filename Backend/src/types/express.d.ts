declare global {
    namespace Express{
        interface Request {
            user ?: AuthTokenPayload
        }
    }
}

export {}