const URLS = {
  auth: "https://functions.poehali.dev/3aa2dc4e-19e5-4093-a361-b95d3a524e1c",
  chats: "https://functions.poehali.dev/93a30372-2e66-4c68-9e8f-e5e9b226aa20",
  contacts: "https://functions.poehali.dev/5942a00c-70bf-40fb-abef-8effa45ac51a",
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
};
