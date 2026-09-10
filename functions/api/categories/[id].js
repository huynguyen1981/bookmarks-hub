export async function onRequestDelete(context) {
  const { id } = context.params;

  if (!id) {
    return Response.json({ error: 'Missing ID' }, { status: 400 });
  }

  // 1. Reset các bookmark thuộc category này về NULL (hoặc không phân loại)
  await context.env.DB.prepare(
    `UPDATE bookmarks SET category_id = NULL WHERE category_id = ?`
  ).bind(id).run();

  // 2. Xóa Category
  await context.env.DB.prepare(
    `DELETE FROM categories WHERE id = ?`
  ).bind(id).run();

  // 3. Broadcast Realtime cho các Tab khác cập nhật
  try {
    await fetch("https://bookmarks-ws.nguyenhuy-1981-hcm.workers.dev/broadcast", {
      method: "POST",
      body: JSON.stringify({ type: 'CATEGORY_DELETED' })
    });
  } catch (e) {
    console.error("WS Broadcast error:", e);
  }

  return Response.json({ success: true, deletedId: id });
}
