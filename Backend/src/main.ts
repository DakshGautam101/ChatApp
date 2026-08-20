import "dotenv/config";
import connectDB from "./utils/db.js";
import { server } from "./app.js";
import logger from "./utils/logger.js";

connectDB();

const PORT: number = Number(process.env.PORT) || 5000;

server.listen(PORT, (): void => {
    logger.info(`Server is running on port ${PORT}`);
});