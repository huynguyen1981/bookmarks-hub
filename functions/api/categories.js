export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare(
    `SELECT * FROM categories ORDER BY name ASC`
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { name, color } = await context.request.json();
  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });

  try {
    const res = await context.env.DB.prepare(
      `INSERT INTO categories (name, color) VALUES (?, ?)`
    ).bind(name, color || '#3b82f6').run();

    // Báo Realtime cho các client qua WebSocket
    await notifyRealtime(context, 'CATEGORY_ADDED');

    return Response.json({ success: true, id: res.meta.last_row_id });
  } catch (e) {
    return Response.json({ error: 'Category already exists or invalid' }, { status: 400 });
  }
}

async function notifyRealtime(context, action) {
  if (context.env.WEBSOCKET_HUB) {
    const id = context.env.WEBSOCKET_HUB.idFromName("global");
    const hub = context.env.WEBSOCKET_HUB.get(id);
    await hub.fetch("http://internal/broadcast", {
      method: "POST",
      body: JSON.stringify({ type: action })
    });
  }
}
