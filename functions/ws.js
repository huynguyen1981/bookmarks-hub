export class WebSocketHub {
  constructor(state, env) {
    this.state = state;
    this.sockets = [];
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Xử lý Broadcast nội bộ từ API
    if (url.pathname === "/broadcast" && request.method === "POST") {
      const msg = await request.text();
      this.sockets = this.sockets.filter(ws => {
        try {
          ws.send(msg);
          return true;
        } catch (e) {
          return false; // Lọc bỏ socket đã mất kết nối
        }
      });
      return new Response("OK");
    }

    // Kết nối WebSocket từ Frontend Client
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.state.acceptWebSocket(server);
    this.sockets.push(server);

    return new Response(null, { status: 101, webSocket: client });
  }
}

// Endpoint kết nối WebSocket từ Client
export async function onRequest(context) {
  if (context.request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const id = context.env.WEBSOCKET_HUB.idFromName("global");
  const hub = context.env.WEBSOCKET_HUB.get(id);
  return hub.fetch(context.request);
}
