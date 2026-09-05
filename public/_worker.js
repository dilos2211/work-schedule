export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Ловим эндпоинт смен
    if (url.pathname.startsWith("/api/shifts")) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, error: "Method Not Allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const data = await request.json();

        // Автоматически создаем таблицу, если её не было
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // Сохраняем отчет в базу
        await env.DB.prepare(
          "INSERT INTO reports (date, data) VALUES (?, ?)"
        ).bind(data.date || new Date().toISOString(), JSON.stringify(data)).run();

        return new Response(JSON.stringify({ success: true, message: 'Отчет успешно сохранен в базу Cloudflare D1!' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Для всех остальных путей отдаем статические файлы сайта
    return env.ASSETS.fetch(request);
  }
};