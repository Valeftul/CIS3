import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import { store } from "./store";
import { checkAndNotifyLowStock } from "./mailer";

dotenv.config();

const app  = express();
const port = process.env.PORT || 5000;

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "warehouse_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    sameSite: "lax",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

// ─── ЛОГИРОВАНИЕ ────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── СТАТИКА (фронтенд) ─────────────────────────────────────
app.use(express.static(path.join(__dirname, "../../client")));

// ─── ROUTES ─────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../../client/public.html"));
});

const pages = ["dashboard", "products", "transactions", "suppliers",
  "analytics", "contracts", "login", "public", "finances", "public-requests"];
pages.forEach(page => {
  app.get(`/${page}`, (_req, res) => {
    res.sendFile(path.resolve(__dirname, `../../client/${page}.html`));
  });
});

app.use("/auth", authRoutes);
app.use("/api",  apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.listen(port, async () => {
  console.log(`\n✅ Сервер запущен: http://localhost:${port}`);
  console.log(`📦 Хранилище: in-memory (данные сбрасываются при перезапуске)`);
  console.log(`🔑 Войти: http://localhost:${port}`);
  console.log(`   Логин: admin | Пароль: admin123\n`);

  // ── Проверка низких остатков при старте сервера ──────────
  console.log(`📧 Проверка низких остатков при старте...`);
  await checkAndNotifyLowStock(store.products).catch(console.error);
});
