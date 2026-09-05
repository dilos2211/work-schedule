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

    if (url.pathname.startsWith("/api/shifts")) {
      try {
        // Автоматически проверяем/создаем таблицу
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // 1. Обработка GET-запроса (Загрузка данных)
        if (request.method === "GET") {
          const dateParam = url.searchParams.get("date"); // например, "2026-04"
          
          let query = "SELECT * FROM reports";
          let stmt;

          if (dateParam) {
            query += " WHERE date LIKE ?";
            stmt = env.DB.prepare(query).bind(dateParam + "%");
          } else {
            stmt = env.DB.prepare(query);
          }

          const { results } = await stmt.all();

          return new Response(JSON.stringify({ success: true, reports: results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // 2. Обработка POST-запроса (Сохранение данных)
        if (request.method === "POST") {
          const data = await request.json();
          const reportDate = data.date || new Date().toISOString().slice(0, 7);

          // Проверяем, есть ли уже запись за этот месяц, чтобы обновлять или добавлять
          await env.DB.prepare(
            "INSERT INTO reports (date, data) VALUES (?, ?)"
          ).bind(reportDate, JSON.stringify(data)).run();

          return new Response(JSON.stringify({ success: true, message: 'Отчет успешно сохранен в базу Cloudflare D1!' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};