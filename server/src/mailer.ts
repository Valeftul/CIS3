import nodemailer from "nodemailer";

// ─── НАСТРОЙКИ ────────────────────────────────────────────
// Укажите SMTP-данные вашего почтового сервера в .env:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=your@gmail.com
//   SMTP_PASS=your_app_password
// Для Gmail: включите "Двухфакторную аутентификацию" и создайте
// "Пароль приложения" в настройках аккаунта Google.

const ALERT_TO   = "mart.mirt.martin@gmail.com";
const ALERT_FROM = process.env.SMTP_USER || "noreply@skladpro.ru";

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

// ─── ОТПРАВКА ОДНОГО АЛЕРТА ────────────────────────────────
export async function sendLowStockAlert(product: {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  clientName?: string;
  contractNum?: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[Email] SMTP не настроен — алерт не отправлен для товара: ${product.name}`);
    return;
  }

  const statusEmoji = product.quantity === 0 ? "🚨" : "⚠️";
  const statusText  = product.quantity === 0 ? "НЕТ В НАЛИЧИИ" : "НИЗКИЙ ОСТАТОК";
  const now         = new Date().toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const clientRow = product.clientName
    ? `<tr><td style="padding:8px 12px;color:#6b7599;border-bottom:1px solid #2a3050">Клиент</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #2a3050">${product.clientName}</td></tr>`
    : "";
  const contractRow = product.contractNum
    ? `<tr><td style="padding:8px 12px;color:#6b7599;border-bottom:1px solid #2a3050">Договор</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #2a3050">${product.contractNum}</td></tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:32px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#181c27;border-radius:12px;overflow:hidden;border:1px solid #2a3050;max-width:100%">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#f0a500,#e05c2a);padding:24px 32px">
            <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;letter-spacing:3px;color:#0f1117;line-height:1">СКЛАД ПРО</div>
            <div style="font-size:11px;color:rgba(15,17,23,0.7);text-transform:uppercase;letter-spacing:2px;margin-top:4px">Система управления запасами</div>
          </td>
        </tr>

        <!-- ALERT BANNER -->
        <tr>
          <td style="background:${product.quantity === 0 ? "rgba(255,71,87,0.15)" : "rgba(255,211,42,0.1)"};border-bottom:3px solid ${product.quantity === 0 ? "#ff4757" : "#ffd32a"};padding:20px 32px;text-align:center">
            <div style="font-size:36px;margin-bottom:8px">${statusEmoji}</div>
            <div style="font-family:Impact,sans-serif;font-size:22px;letter-spacing:2px;color:${product.quantity === 0 ? "#ff4757" : "#ffd32a"}">${statusText}</div>
            <div style="font-size:13px;color:#6b7599;margin-top:6px">${now}</div>
          </td>
        </tr>

        <!-- PRODUCT INFO -->
        <tr>
          <td style="padding:28px 32px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6b7599;margin-bottom:16px">Информация о товаре</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a3050;border-radius:8px;overflow:hidden">
              <tr style="background:#1f2538">
                <td style="padding:8px 12px;color:#6b7599;border-bottom:1px solid #2a3050;width:40%">Наименование</td>
                <td style="padding:8px 12px;font-weight:700;font-size:15px;color:#e8ecf4;border-bottom:1px solid #2a3050">${product.name}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;color:#6b7599;border-bottom:1px solid #2a3050">Артикул (SKU)</td>
                <td style="padding:8px 12px;font-family:monospace;color:#f0a500;border-bottom:1px solid #2a3050">${product.sku}</td>
              </tr>
              <tr style="background:#1f2538">
                <td style="padding:8px 12px;color:#6b7599;border-bottom:1px solid #2a3050">Категория</td>
                <td style="padding:8px 12px;color:#e8ecf4;border-bottom:1px solid #2a3050">${product.category}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;color:#6b7599;border-bottom:1px solid #2a3050">Текущий остаток</td>
                <td style="padding:8px 12px;font-weight:700;font-size:18px;color:${product.quantity === 0 ? "#ff4757" : "#ffd32a"};border-bottom:1px solid #2a3050">${product.quantity} ${product.unit}</td>
              </tr>
              <tr style="background:#1f2538">
                <td style="padding:8px 12px;color:#6b7599;border-bottom:1px solid #2a3050">Минимальный остаток</td>
                <td style="padding:8px 12px;color:#e8ecf4;border-bottom:1px solid #2a3050">${product.minQuantity} ${product.unit}</td>
              </tr>
              ${clientRow}
              ${contractRow}
            </table>
          </td>
        </tr>

        <!-- CALL TO ACTION -->
        <tr>
          <td style="padding:0 32px 28px">
            <div style="background:#1f2538;border:1px solid #2a3050;border-radius:8px;padding:16px 20px">
              <div style="font-size:13px;color:#6b7599;line-height:1.6">
                ${product.quantity === 0
                  ? "🚨 <strong style='color:#ff4757'>Товар полностью отсутствует на складе.</strong> Необходимо срочно оформить пополнение запаса."
                  : `⚠️ Текущий остаток <strong style='color:#ffd32a'>${product.quantity} ${product.unit}</strong> достиг или опустился ниже минимального уровня (<strong>${product.minQuantity} ${product.unit}</strong>). Рекомендуется пополнить запас.`
                }
              </div>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0f1117;padding:16px 32px;text-align:center;border-top:1px solid #2a3050">
            <div style="font-size:11px;color:#6b7599">
              Это автоматическое уведомление от системы <strong style="color:#f0a500">СкладПро</strong>.<br/>
              Войдите в систему, чтобы оформить операцию пополнения.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `
[СкладПро] ${statusText} — ${product.name}

Время: ${now}
Товар: ${product.name}
Артикул: ${product.sku}
Категория: ${product.category}
Текущий остаток: ${product.quantity} ${product.unit}
Минимальный остаток: ${product.minQuantity} ${product.unit}
${product.clientName ? `Клиент: ${product.clientName}` : ""}
${product.contractNum ? `Договор: ${product.contractNum}` : ""}

${product.quantity === 0
  ? "Товар полностью отсутствует на складе. Необходимо срочно оформить пополнение."
  : `Остаток ниже минимального уровня. Рекомендуется пополнить запас.`
}
  `.trim();

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `"СкладПро" <${ALERT_FROM}>`,
      to:   ALERT_TO,
      subject: `${statusEmoji} [СкладПро] ${statusText}: ${product.name} (${product.sku})`,
      text,
      html,
    });
    console.log(`[Email] ✅ Алерт отправлен: ${product.name} — ${product.quantity} ${product.unit}`);
  } catch (err: any) {
    console.error(`[Email] ❌ Ошибка отправки алерта для "${product.name}":`, err.message);
  }
}

// ─── МАССОВАЯ ПРОВЕРКА (вызывается при старте) ─────────────
export async function checkAndNotifyLowStock(products: Array<{
  name: string; sku: string; category: string; quantity: number;
  minQuantity: number; unit: string; clientName?: string; contractNum?: string;
}>): Promise<void> {
  const lowItems = products.filter(
    p => p.minQuantity > 0 && p.quantity <= p.minQuantity
  );
  if (!lowItems.length) return;
  console.log(`[Email] Найдено товаров с низким остатком: ${lowItems.length}`);
  for (const item of lowItems) {
    await sendLowStockAlert(item);
  }
}
