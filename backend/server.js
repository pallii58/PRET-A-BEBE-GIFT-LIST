import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import giftListRoutes from "./routes/giftLists.js";
import publicRoutes from "./routes/public.js";
import webhookRoutes from "./routes/webhooks.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/public", publicRoutes);
app.use("/api", giftListRoutes);
app.use("/webhooks", webhookRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

