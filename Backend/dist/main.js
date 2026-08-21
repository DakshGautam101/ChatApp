import "dotenv/config";
import connectDB from "./utils/db.js";
import { server } from "./app.js";
import logger from "./utils/logger.js";
connectDB();
const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=main.js.map