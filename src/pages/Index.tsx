import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

// ─── Types ───────────────────────────────────────────────────
interface User { id: number; name: string; phone: string; username?: string; bio?: string; online?: boolean; }
interface Chat { id: number; name: string; partner_id?: number; partner_online?: boolean; last_msg?: string; last_time?: string; unread: number; is_group: boolean; }
interface Message { id: number; sender_id: number; sender_name: string; text: string; created_at: string; mine: boolean; media_url?: string; media_type?: string; }

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const COLORS = [
  "from-violet-500 to-purple-600", "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500", "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500", "from-indigo-500 to-blue-600",
];
function colorFor(id: number) { return COLORS[id % COLORS.length]; }

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.getDate() === now.getDate()) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ name, id, size = "md", online }: { name: string; id: number; size?: "sm" | "md" | "lg" | "xl"; online?: boolean }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-xl" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colorFor(id)} flex items-center justify-center font-bold text-white`}>{initials(name)}</div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0e0e1a] ${online ? "bg-emerald-400" : "bg-gray-500"}`} />
      )}
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────
function AuthView({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!phone || !password || (mode === "register" && !name)) { setError("Заполните все поля"); return; }
    setLoading(true);
    const res = mode === "register" ? await api.register(name, phone, password) : await api.login(phone, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    localStorage.setItem("pulse_token", res.token);
    onAuth(res.user);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 animate-fade-in">
      <div className="absolute inset-0">
        <div className="orb w-72 h-72 opacity-20 top-[-60px] left-[-60px]" style={{ background: "var(--grad-1)" }} />
        <div className="orb w-56 h-56 opacity-15 bottom-0 right-[-40px]" style={{ background: "var(--grad-2)" }} />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 btn-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-float">
            <Icon name="MessageCircle" size={30} />
          </div>
          <h1 className="text-3xl font-black gradient-text">Pulse</h1>
          <p className="text-white/40 text-sm mt-1">Мессенджер нового поколения</p>
        </div>
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode === m ? "btn-gradient" : "text-white/40 hover:text-white/70"}`}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          {mode === "register" && (
            <div>
              <label className="text-xs text-white/40 mb-1 block">Имя</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/60 transition-colors" />
            </div>
          )}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Телефон</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 900 000-00-00" type="tel"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/60 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Пароль</label>
            <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="••••••••" type="password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/60 transition-colors" />
          </div>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full btn-gradient py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50">
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chats ───────────────────────────────────────────────────
function ChatsView({ onOpenChat }: { onOpenChat: (chat: Chat) => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { const res = await api.chatList(); if (res.chats) setChats(res.chats); setLoading(false); }, []);
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-2">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input placeholder="Поиск чатов..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {loading && <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>}
        {!loading && chats.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <Icon name="MessageCircle" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет чатов — перейди в Контакты и начни!</p>
          </div>
        )}
        {chats.map((chat, i) => (
          <button key={chat.id} onClick={() => onOpenChat(chat)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left animate-fade-in"
            style={{ animationDelay: `${i * 30}ms`, opacity: 0, animationFillMode: "forwards" }}>
            <Avatar name={chat.name || "?"} id={chat.partner_id || chat.id} online={chat.partner_online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-white truncate">{chat.name}</span>
                <span className="text-xs text-white/35 ml-2 flex-shrink-0">{formatTime(chat.last_time)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45 truncate">{chat.last_msg || "Нет сообщений"}</span>
                {chat.unread > 0 && <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 rounded-full btn-gradient text-xs flex items-center justify-center px-1.5 font-bold">{chat.unread}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────
const EMOJIS = ["😀","😂","🥰","😍","🤩","😎","🥺","😭","😤","🤔","👍","👎","❤️","🔥","✨","🎉","🙏","💯","😅","🤣","😊","😇","🥳","😬","🤯","💀","👀","🫶","🤝","💪","🎯","🚀","💬","🌟","💥","🎁","🌈","🍕","☕","🐶"];
function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-14 left-0 z-50 w-72 glass rounded-2xl p-3 shadow-2xl border border-white/10 animate-scale-in">
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => { onPick(e); onClose(); }}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-colors">{e}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Chat dialog ─────────────────────────────────────────────
function ChatView({ chat, onBack, onVideoCall, onAudioCall }: { chat: Chat; onBack: () => void; onVideoCall: () => void; onAudioCall: () => void }) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => { const res = await api.chatMessages(chat.id); if (res.messages) { setMsgs(res.messages); setLoading(false); } }, [chat.id]);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    const text = input.trim(); if (!text) return;
    setInput("");
    const res = await api.chatSend(chat.id, text);
    if (res.message) setMsgs(prev => [...prev, res.message]);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    const maxMb = file.type.startsWith("video") ? 50 : 10;
    if (file.size > maxMb * 1024 * 1024) { alert(`Файл слишком большой (макс ${maxMb} МБ)`); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(",")[1];
      const up = await api.chatUpload(b64, file.name, file.type);
      if (up.url) {
        const res = await api.chatSendMedia(chat.id, "", up.url, up.media_type);
        if (res.message) setMsgs(prev => [...prev, res.message]);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full animate-scale-in">
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0">
        <button onClick={onBack} className="text-white/50 hover:text-white transition-colors"><Icon name="ArrowLeft" size={20} /></button>
        <Avatar name={chat.name || "?"} id={chat.partner_id || chat.id} online={chat.partner_online} />
        <div className="flex-1">
          <div className="font-semibold text-sm">{chat.name}</div>
          <div className={`text-xs ${chat.partner_online ? "text-emerald-400" : "text-white/35"}`}>{chat.partner_online ? "в сети" : "не в сети"}</div>
        </div>
        <button onClick={onVideoCall} className="w-9 h-9 rounded-full bg-white/8 hover:bg-violet-500/30 transition-colors flex items-center justify-center text-white/70 hover:text-violet-300"><Icon name="Video" size={17} /></button>
        <button onClick={onAudioCall} className="w-9 h-9 rounded-full bg-white/8 hover:bg-emerald-500/30 transition-colors flex items-center justify-center text-white/70 hover:text-emerald-300"><Icon name="Phone" size={17} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" onClick={() => setShowEmoji(false)}>
        {loading && <div className="flex justify-center py-8"><div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>}
        {!loading && msgs.length === 0 && <div className="text-center py-12 text-white/25 text-sm">Начните общение!</div>}
        {msgs.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.mine ? "items-end" : "items-start"}`}>
            <div className={`text-[11px] mb-1 px-1 font-medium ${msg.mine ? "text-violet-300/70" : "text-white/45"}`}>
              {msg.mine ? "Вы" : msg.sender_name}
            </div>
            <div className={`max-w-[75%] rounded-2xl overflow-hidden ${msg.mine ? "rounded-br-sm" : "rounded-bl-sm"}`}>
              {msg.media_type === "image" && msg.media_url && (
                <img src={msg.media_url} onClick={() => setLightbox(msg.media_url!)}
                  className="w-full max-w-[240px] rounded-2xl cursor-pointer hover:opacity-90 transition-opacity object-cover"
                  style={{ maxHeight: 200 }} />
              )}
              {msg.media_type === "video" && msg.media_url && (
                <video src={msg.media_url} controls
                  className="w-full max-w-[240px] rounded-2xl"
                  style={{ maxHeight: 200 }} />
              )}
              {(msg.text || !msg.media_url) && (
                <div className={`px-4 py-2.5 text-sm leading-relaxed ${msg.mine ? "btn-gradient" : "bg-white/8"} ${msg.media_url ? "mt-1" : ""}`}>
                  {msg.text}
                  <div className={`text-[10px] mt-1 ${msg.mine ? "text-white/60" : "text-white/35"} text-right`}>{formatTime(msg.created_at)}</div>
                </div>
              )}
              {msg.media_url && !msg.text && (
                <div className={`px-3 py-1 text-[10px] ${msg.mine ? "text-white/60" : "text-white/35"} text-right`}>{formatTime(msg.created_at)}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-white/8 flex-shrink-0 relative">
        {showEmoji && <EmojiPicker onPick={e => setInput(p => p + e)} onClose={() => setShowEmoji(false)} />}
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEmoji(v => !v)}
            className={`w-9 h-9 flex-shrink-0 rounded-xl transition-colors flex items-center justify-center text-lg ${showEmoji ? "bg-violet-500/30 text-violet-300" : "bg-white/8 hover:bg-white/15 text-white/50"}`}>😊</button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-9 h-9 flex-shrink-0 rounded-xl bg-white/8 hover:bg-white/15 transition-colors flex items-center justify-center text-white/50 disabled:opacity-40">
            {uploading ? <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> : <Icon name="Paperclip" size={16} />}
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Сообщение..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors" />
          <button onClick={send} className="w-9 h-9 flex-shrink-0 btn-gradient rounded-xl flex items-center justify-center"><Icon name="Send" size={15} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Contacts ────────────────────────────────────────────────
function ContactsView({ onStartChat }: { onStartChat: (chat: Chat) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);

  useEffect(() => { api.contactsAll().then(res => { if (res.users) setUsers(res.users); setLoading(false); }); }, []);
  useEffect(() => {
    if (search.length >= 2) api.contactsSearch(search).then(res => { if (res.users) setUsers(res.users); });
    else if (search.length === 0) api.contactsAll().then(res => { if (res.users) setUsers(res.users); });
  }, [search]);

  const startChat = async (u: User) => {
    setStarting(u.id);
    const res = await api.chatCreate(u.id);
    setStarting(null);
    if (res.chat_id) onStartChat({ id: res.chat_id, name: u.name, partner_id: u.id, partner_online: u.online, unread: 0, is_group: false });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-2">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или телефону..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {loading && <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" /></div>}
        {!loading && users.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? "Никого не найдено" : "Пока нет других пользователей"}</p>
          </div>
        )}
        {users.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all animate-fade-in"
            style={{ animationDelay: `${i * 30}ms`, opacity: 0, animationFillMode: "forwards" }}>
            <Avatar name={u.name} id={u.id} online={u.online} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white">{u.name}</div>
              <div className="text-xs text-white/40">{u.phone}</div>
            </div>
            <button onClick={() => startChat(u)} disabled={starting === u.id}
              className="w-9 h-9 rounded-xl bg-white/6 hover:bg-violet-500/25 transition-colors flex items-center justify-center text-white/50 hover:text-violet-300 disabled:opacity-50">
              {starting === u.id ? <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" /> : <Icon name="MessageCircle" size={16} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────
function ProfileView({ currentUser, onLogout, onUpdate }: { currentUser: User; onLogout: () => void; onUpdate: (u: User) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await api.profileUpdate(name, bio, currentUser.username || "");
    setSaving(false); setEditing(false);
    onUpdate({ ...currentUser, name, bio });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-4">
      <div className="relative mx-4 mt-2 rounded-3xl overflow-hidden p-6 text-center" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.3))", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%,#7c3aed 0%,transparent 60%), radial-gradient(circle at 80% 20%,#06b6d4 0%,transparent 50%)" }} />
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-2xl font-black text-white mx-auto mb-3 animate-float ring-4 ring-white/10">
            {initials(currentUser.name)}
          </div>
          {editing ? (
            <input value={name} onChange={e => setName(e.target.value)} className="text-center font-bold text-lg text-white bg-white/10 border border-white/20 rounded-xl px-3 py-1 outline-none w-full mb-1" />
          ) : (
            <h2 className="font-bold text-lg text-white">{currentUser.name}</h2>
          )}
          <p className="text-white/50 text-sm mt-0.5">{currentUser.phone}</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs text-emerald-400">В сети</span>
          </div>
        </div>
      </div>
      <div className="px-4 mt-4 space-y-2">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/4 border border-white/8">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center flex-shrink-0 mt-0.5"><Icon name="Info" size={15} /></div>
          <div className="flex-1">
            <div className="text-xs text-white/40">О себе</div>
            {editing ? (
              <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Расскажи о себе..."
                className="text-sm text-white font-medium bg-white/10 border border-white/20 rounded-lg px-2 py-1 outline-none w-full mt-0.5" />
            ) : (
              <div className="text-sm text-white font-medium">{bio || "Не указано"}</div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 mt-4 flex gap-2">
        {editing ? (
          <>
            <button onClick={save} disabled={saving} className="flex-1 btn-gradient py-3 rounded-2xl font-semibold text-sm disabled:opacity-50">{saving ? "Сохранение..." : "Сохранить"}</button>
            <button onClick={() => setEditing(false)} className="px-4 py-3 rounded-2xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">Отмена</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="flex-1 py-3 rounded-2xl border border-white/10 text-white/70 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
            <Icon name="Edit3" size={14} />Редактировать
          </button>
        )}
      </div>
      <div className="px-4 mt-3">
        <button onClick={onLogout} className="w-full py-3 rounded-2xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
          <Icon name="LogOut" size={14} />Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────
function NotificationsView() {
  return (
    <div className="flex-1 h-full flex items-center justify-center">
      <div className="text-center text-white/30">
        <Icon name="Bell" size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Уведомлений пока нет</p>
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────
function SettingsView() {
  const sections = [
    { title: "Аккаунт", items: [{ icon: "Lock", label: "Конфиденциальность", desc: "Кто видит информацию" }, { icon: "Shield", label: "Безопасность", desc: "Пароль, двухфакторная" }] },
    { title: "Уведомления", items: [{ icon: "Bell", label: "Push-уведомления", desc: "Сообщения и звонки" }, { icon: "Volume2", label: "Звуки", desc: "Рингтоны и сигналы" }] },
    { title: "Приложение", items: [{ icon: "Palette", label: "Оформление", desc: "Тема и цвета" }, { icon: "Globe", label: "Язык", desc: "Русский" }, { icon: "HelpCircle", label: "Помощь", desc: "FAQ и поддержка" }] },
  ];
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-4">
      {sections.map(section => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2 px-1">{section.title}</h3>
          <div className="space-y-1">
            {section.items.map(item => (
              <button key={item.label} className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/8 transition-all text-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-600/30 flex items-center justify-center flex-shrink-0">
                  <Icon name={item.icon} size={15} className="text-violet-300" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-white/40">{item.desc}</div>
                </div>
                <Icon name="ChevronRight" size={14} className="text-white/25" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Incoming Call Banner ─────────────────────────────────────
function IncomingCallBanner({ call, onAnswer, onReject }: {
  call: { id: number; caller_name: string; caller_id: number; call_type: string };
  onAnswer: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] px-4 pt-4 animate-slide-in">
      <div className="glass rounded-2xl p-4 border border-white/15 shadow-2xl flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorFor(call.caller_id)} flex items-center justify-center font-bold text-white`}>
            {initials(call.caller_name)}
          </div>
          <span className="absolute inset-0 rounded-full border-2 border-violet-400/50 animate-ping" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{call.caller_name}</p>
          <p className="text-white/50 text-xs flex items-center gap-1">
            <Icon name={call.call_type === "video" ? "Video" : "Phone"} size={10} />
            Входящий {call.call_type === "video" ? "видеозвонок" : "звонок"}
          </p>
        </div>
        <button onClick={onReject} className="w-11 h-11 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center transition-all">
          <Icon name="PhoneOff" size={18} className="text-white" />
        </button>
        <button onClick={onAnswer} className="w-11 h-11 rounded-full bg-emerald-500/80 hover:bg-emerald-600 flex items-center justify-center transition-all">
          <Icon name={call.call_type === "video" ? "Video" : "Phone"} size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Call View (WebRTC) ───────────────────────────────────────
function CallView({
  callId, callType, partnerName, partnerId, partnerUserId, isOutgoing, onClose
}: {
  callId: number; callType: "audio" | "video"; partnerName: string; partnerId: number;
  partnerUserId: number; isOutgoing: boolean; onClose: () => void;
}) {
  const [status, setStatus] = useState<"ringing" | "active" | "ended">(isOutgoing ? "ringing" : "active");
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const lastSignalIdRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const stopAll = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); }
  }, []);

  const endCall = useCallback(async () => {
    await api.callEnd(callId);
    stopAll();
    onClose();
  }, [callId, stopAll, onClose]);

  const startPoll = useCallback(() => {
    pollTimerRef.current = setInterval(async () => {
      const res = await api.callPoll(callId, lastSignalIdRef.current);
      if (!res.signals) return;
      if (res.call_status === "rejected" || res.call_status === "ended") {
        stopAll(); onClose(); return;
      }
      if (res.call_status === "active" && status !== "active") setStatus("active");
      for (const sig of res.signals) {
        lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);
        const pc = pcRef.current;
        if (!pc) return;
        if (sig.signal_type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sig.payload)));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await api.callSignal(callId, partnerUserId, "answer", answer);
        } else if (sig.signal_type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sig.payload)));
        } else if (sig.signal_type === "ice-candidate") {
          try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(sig.payload))); } catch (_e) { /* ignore */ }
        }
      }
    }, 1000);
  }, [callId, partnerUserId, status, stopAll, onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      }).catch(() => null);
      if (cancelled || !stream) return;
      localStreamRef.current = stream;
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) remoteVideoRef.current.srcObject = e.streams[0];
      };

      pc.onicecandidate = async (e) => {
        if (e.candidate) await api.callSignal(callId, partnerUserId, "ice-candidate", e.candidate);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("active");
          durationTimerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        }
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") endCall();
      };

      if (isOutgoing) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await api.callSignal(callId, partnerUserId, "offer", offer);
      }

      startPoll();
    })();
    return () => { cancelled = true; stopAll(); };
  }, []);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !muted; });
    }
  }, [muted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !videoOff; });
    }
  }, [videoOff]);

  const formatDur = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-scale-in" style={{ background: "linear-gradient(160deg,#1a0533 0%,#0d1a2e 50%,#031a0e 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb w-80 h-80 opacity-25 top-[-60px] left-[-60px]" style={{ background: "var(--grad-1)" }} />
        <div className="orb w-64 h-64 opacity-20 bottom-[-40px] right-[-40px]" style={{ background: "var(--grad-2)" }} />
      </div>

      {callType === "video" && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-28 right-4 w-28 h-36 rounded-xl object-cover border border-white/20 shadow-xl z-10" />
        </>
      )}

      <div className="relative flex-1 flex flex-col items-center justify-center">
        {callType === "audio" && (
          <div className="relative mb-6">
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${colorFor(partnerId)} flex items-center justify-center text-3xl font-black text-white shadow-2xl`}>
              {initials(partnerName)}
            </div>
            {status === "ringing" && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-violet-400/50" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
                <span className="absolute inset-0 rounded-full border-2 border-violet-400/30" style={{ animation: "pulse-ring 1.5s ease-out 0.5s infinite" }} />
              </>
            )}
          </div>
        )}
        {callType === "audio" && (
          <>
            <h2 className="text-2xl font-bold text-white">{partnerName}</h2>
            <p className="text-white/50 mt-1 text-sm">
              {status === "ringing" ? "Вызов..." : status === "active" ? formatDur(duration) : "Завершён"}
            </p>
          </>
        )}
        {callType === "video" && status === "active" && (
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <span className="glass px-3 py-1 rounded-full text-xs text-white/70">{formatDur(duration)}</span>
          </div>
        )}
        {callType === "video" && status === "ringing" && (
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${colorFor(partnerId)} flex items-center justify-center text-2xl font-black text-white shadow-2xl mb-4`}>
              {initials(partnerName)}
            </div>
            <h2 className="text-xl font-bold text-white">{partnerName}</h2>
            <p className="text-white/50 mt-1 text-sm">Видеозвонок...</p>
          </div>
        )}
      </div>

      <div className="relative pb-10 px-8 flex items-center justify-center gap-5">
        <button onClick={() => setMuted(m => !m)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? "bg-red-500/80" : "bg-white/12 hover:bg-white/20"}`}>
          <Icon name={muted ? "MicOff" : "Mic"} size={22} className="text-white" />
        </button>
        {callType === "video" && (
          <button onClick={() => setVideoOff(v => !v)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${videoOff ? "bg-red-500/80" : "bg-white/12 hover:bg-white/20"}`}>
            <Icon name={videoOff ? "VideoOff" : "Video"} size={22} className="text-white" />
          </button>
        )}
        <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all hover:scale-105">
          <Icon name="PhoneOff" size={26} className="text-white" />
        </button>
        {callType === "audio" && (
          <button className="w-14 h-14 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center transition-all">
            <Icon name="Volume2" size={22} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────
const TABS = [
  { id: "chats", icon: "MessageCircle", label: "Чаты" },
  { id: "contacts", icon: "Users", label: "Контакты" },
  { id: "notifications", icon: "Bell", label: "Уведомления" },
  { id: "profile", icon: "User", label: "Профиль" },
  { id: "settings", icon: "Settings", label: "Настройки" },
];
const TITLES: Record<string, string> = { chats: "Чаты", contacts: "Контакты", notifications: "Уведомления", profile: "Профиль", settings: "Настройки" };

// ─── Types for calls ─────────────────────────────────────────
interface ActiveCall {
  callId: number;
  callType: "audio" | "video";
  partnerName: string;
  partnerId: number;
  partnerUserId: number;
  isOutgoing: boolean;
}
interface IncomingCall {
  id: number;
  caller_name: string;
  caller_id: number;
  call_type: string;
  chat_id: number;
}

// ─── App ──────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("chats");
  const [openChat, setOpenChat] = useState<Chat | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("pulse_token");
    if (token) { api.me().then(res => { if (res.user) setUser(res.user); setAuthChecked(true); }); }
    else setAuthChecked(true);
  }, []);

  // Polling incoming calls when logged in
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const res = await api.callIncoming();
      if (res.call && !activeCall) setIncomingCall(res.call);
      else if (!res.call) setIncomingCall(null);
    };
    const t = setInterval(check, 2000);
    return () => clearInterval(t);
  }, [user, activeCall]);

  const handleLogout = async () => { await api.logout(); localStorage.removeItem("pulse_token"); setUser(null); };
  const openChatView = (chat: Chat) => { setOpenChat(chat); setTab("chats"); };

  const startCall = async (chat: Chat, type: "audio" | "video") => {
    if (!chat.partner_id) return;
    const res = await api.callStart(chat.id, chat.partner_id, type);
    if (res.call_id) {
      setActiveCall({
        callId: res.call_id,
        callType: type,
        partnerName: chat.name,
        partnerId: chat.partner_id,
        partnerUserId: chat.partner_id,
        isOutgoing: true,
      });
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    await api.callAnswer(incomingCall.id);
    setActiveCall({
      callId: incomingCall.id,
      callType: incomingCall.call_type as "audio" | "video",
      partnerName: incomingCall.caller_name,
      partnerId: incomingCall.caller_id,
      partnerUserId: incomingCall.caller_id,
      isOutgoing: false,
    });
    setIncomingCall(null);
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    await api.callReject(incomingCall.id);
    setIncomingCall(null);
  };

  if (!authChecked) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#0e0e1a" }}>
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto relative overflow-hidden" style={{ background: "#0e0e1a" }}>
      <div className="orb w-72 h-72 opacity-15 top-[-80px] left-[-60px]" style={{ background: "var(--grad-1)" }} />
      <div className="orb w-56 h-56 opacity-10 bottom-20 right-[-40px]" style={{ background: "var(--grad-2)" }} />

      {!user ? <AuthView onAuth={setUser} /> : (
        <>
          {!openChat && (
            <div className="relative flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Pulse</span>
                <h1 className="text-xl font-black gradient-text leading-tight">{TITLES[tab]}</h1>
              </div>
              {tab === "chats" && (
                <button onClick={() => setTab("contacts")} className="w-9 h-9 btn-gradient rounded-xl flex items-center justify-center shadow-lg">
                  <Icon name="Edit3" size={15} />
                </button>
              )}
            </div>
          )}

          <div className="relative flex-1 overflow-hidden">
            {openChat ? (
              <ChatView chat={openChat} onBack={() => setOpenChat(null)}
                onVideoCall={() => startCall(openChat, "video")}
                onAudioCall={() => startCall(openChat, "audio")} />
            ) : (
              <div className="h-full">
                {tab === "chats" && <ChatsView onOpenChat={openChatView} />}
                {tab === "contacts" && <ContactsView onStartChat={openChatView} />}
                {tab === "notifications" && <NotificationsView />}
                {tab === "profile" && <ProfileView currentUser={user} onLogout={handleLogout} onUpdate={setUser} />}
                {tab === "settings" && <SettingsView />}
              </div>
            )}
          </div>

          {!openChat && (
            <div className="relative flex-shrink-0 px-3 pb-4 pt-2 glass border-t border-white/8">
              <div className="flex items-center justify-around">
                {TABS.map(t => {
                  const active = tab === t.id;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? "text-white" : "text-white/35 hover:text-white/60"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${active ? "btn-gradient shadow-lg" : "bg-transparent"}`}>
                        <Icon name={t.icon} size={18} />
                      </div>
                      <span className={`text-[10px] font-medium ${active ? "gradient-text font-bold" : ""}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {incomingCall && !activeCall && (
        <IncomingCallBanner call={incomingCall} onAnswer={answerCall} onReject={rejectCall} />
      )}

      {activeCall && (
        <CallView
          callId={activeCall.callId}
          callType={activeCall.callType}
          partnerName={activeCall.partnerName}
          partnerId={activeCall.partnerId}
          partnerUserId={activeCall.partnerUserId}
          isOutgoing={activeCall.isOutgoing}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}