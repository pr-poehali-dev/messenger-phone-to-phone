const URLS = {
  auth: "https://functions.poehali.dev/3aa2dc4e-19e5-4093-a361-b95d3a524e1c",
  chats: "https://functions.poehali.dev/93a30372-2e66-4c68-9e8f-e5e9b226aa20",
  contacts: "https://functions.poehali.dev/5942a00c-70bf-40fb-abef-8effa45ac51a",
  calls: "https://functions.poehali.dev/e2361b36-7016-44ba-80d5-b79e4aaba674",
};

function getToken() {
  return localStorage.getItem("pulse_token") || "";
}

async function call(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": getToken() },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (typeof data === "string") return JSON.parse(data);
    return data;
  } catch {
    return { error: text };
  }
}

export const api = {
  register: (name: string, phone: string, password: string) =>
    call(URLS.auth, { action: "register", name, phone, password }),

  login: (phone: string, password: string) =>
    call(URLS.auth, { action: "login", phone, password }),

  me: () => call(URLS.auth, { action: "me" }),

  logout: () => call(URLS.auth, { action: "logout" }),

  chatList: () => call(URLS.chats, { action: "list" }),

  chatCreate: (partner_id: number) => call(URLS.chats, { action: "create", partner_id }),

  chatMessages: (chat_id: number) => call(URLS.chats, { action: "messages", chat_id }),

  chatSend: (chat_id: number, text: string) => call(URLS.chats, { action: "send", chat_id, text }),

  contactsAll: () => call(URLS.contacts, { action: "all" }),

  contactsSearch: (q: string) => call(URLS.contacts, { action: "search", q }),

  profileUpdate: (name: string, bio: string, username: string) =>
    call(URLS.contacts, { action: "profile", name, bio, username }),

  chatUpload: (file_data: string, file_name: string, file_type: string) =>
    call(URLS.chats, { action: "upload", file_data, file_name, file_type }),

  chatSendMedia: (chat_id: number, text: string, media_url: string, media_type: string) =>
    call(URLS.chats, { action: "send", chat_id, text, media_url, media_type }),

  callStart: (chat_id: number, callee_id: number, call_type: "audio" | "video") =>
    call(URLS.calls, { action: "start", chat_id, callee_id, call_type }),

  callAnswer: (call_id: number) =>
    call(URLS.calls, { action: "answer", call_id }),

  callReject: (call_id: number) =>
    call(URLS.calls, { action: "reject", call_id }),

  callEnd: (call_id: number) =>
    call(URLS.calls, { action: "end", call_id }),

  callSignal: (call_id: number, to_user_id: number, signal_type: string, payload: unknown) =>
    call(URLS.calls, { action: "signal", call_id, to_user_id, signal_type, payload }),

  callPoll: (call_id: number, since_id: number) =>
    call(URLS.calls, { action: "poll", call_id, since_id }),

  callIncoming: () =>
    call(URLS.calls, { action: "incoming" }),
};