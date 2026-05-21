// Telegram Bot API helper. Set TELEGRAM_BOT_TOKEN in Supabase secrets.
const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

export async function sendTelegram(chatId: string, text: string, topicId?: number) {
  if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (topicId) body.message_thread_id = topicId;
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}: ${await res.text()}`);
  return res.json();
}
