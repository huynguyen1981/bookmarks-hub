export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare(`
    SELECT b.id, b.title, b.url, b.created_at, b.category_id, c.name as category_name, c.color as category_color 
    FROM bookmarks b 
    LEFT JOIN categories c ON b.category_id = c.id 
    ORDER BY b.id DESC
  `).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { title, url, category_id } = await context.request.json();
  if (!title || !url) return Response.json({ error: 'Missing title or url' }, { status: 400 });

  const res = await context.env.DB.prepare(
    `INSERT INTO bookmarks (title, url, category_id) VALUES (?, ?, ?)`
  ).bind(title, url, category_id || null).run();

  // Broadcast tín hiệu có Bookmark mới cho tất cả các tab đang mở
  if (context.env.WEBSOCKET_HUB) {
    const id = context.env.WEBSOCKET_HUB.idFromName("global");
    const hub = context.env.WEBSOCKET_HUB.get(id);
    await hub.fetch("http://internal/broadcast", {
      method: "POST",
      body: JSON.stringify({ type: 'BOOKMARK_ADDED' })
    });
  }

  return Response.json({ success: true, id: res.meta.last_row_id });
}
