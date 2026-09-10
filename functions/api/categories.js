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

    // Gọi Broadcast sang Worker WebSocket
    try {
      await fetch("https://bookmarks-ws.nguyenhuy-1981-hcm.workers.dev/broadcast", {
        method: "POST",
        body: JSON.stringify({ type: 'CATEGORY_ADDED' })
      });
    } catch (e) {}

    return Response.json({ success: true, id: res.meta.last_row_id });
  } catch (e) {
    return Response.json({ error: 'Category already exists or invalid' }, { status: 400 });
  }
}
