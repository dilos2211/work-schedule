export default {
  async fetch(request, env) {
    // Поддержка CORS для запросов со страницы
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Обработка сохранения отчета
    if (request.method === "POST" && new URL(request.url).pathname === "/api/save") {
      try {
        const data = await request.json();
        
        await env.DB.prepare(
          `INSERT INTO reports (year, month, total_days, base_hours, overtime_hours, total_hours, gross_pay, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          data.year,
          data.month,
          data.total_days,
          data.base_hours,
          data.overtime_hours,
          data.total_hours,
          data.gross_pay,
          new Date().toISOString()
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
