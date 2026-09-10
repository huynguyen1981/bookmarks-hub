export async function onRequestDelete(context) {
  const { id } = context.params;

  if (!id) {
    return Response.json({ error: 'Missing ID' }, { status: 400 });
  }

  // Xóa khỏi D1 Database
  await context.env.DB.prepare(`DELETE FROM bookmarks WHERE id = ?`).bind(id).run();

  // Bắn Realtime Broadcast cho tất cả Tab khác tự mất item
  try {
    await fetch("https://bookmarks-ws.nguyenhuy-1981-hcm.workers.dev/broadcast", {
      method: "POST",
      body: JSON.stringify({ type: 'BOOKMARK_DELETED' })
    });
  } catch (e) {
    console.error("WS Broadcast error:", e);
  }

  return Response.json({ success: true, deletedId: id });
}
