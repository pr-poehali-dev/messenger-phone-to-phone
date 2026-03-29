import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Mock data ────────────────────────────────────────────────
const CHATS = [
  { id: 1, name: "Алексей Смирнов", avatar: "АС", online: true, lastMsg: "Увидимся завтра!", time: "14:32", unread: 3, color: "from-violet-500 to-purple-600" },
  { id: 2, name: "Мария Кузнецова", avatar: "МК", online: true, lastMsg: "Фото отправила 📸", time: "13:15", unread: 0, color: "from-pink-500 to-rose-500" },
  { id: 3, name: "Дизайн-команда", avatar: "ДК", online: false, lastMsg: "Дмитрий: Макеты готовы", time: "11:00", unread: 12, color: "from-cyan-500 to-blue-500" },
  { id: 4, name: "Иван Петров", avatar: "ИП", online: false, lastMsg: "Ок, принял 👍", time: "Вчера", unread: 0, color: "from-emerald-500 to-teal-500" },
  { id: 5, name: "Стартап Буст", avatar: "СБ", online: true, lastMsg: "Встреча в 16:00!", time: "Вчера", unread: 2, color: "from-orange-500 to-amber-500" },
];

const MESSAGES: Record<number, { id: number; text: string; mine: boolean; time: string }[]> = {
  1: [
    { id: 1, text: "Привет! Как дела? 😊", mine: false, time: "14:20" },
    { id: 2, text: "Всё отлично! Работаем над проектом", mine: true, time: "14:22" },
    { id: 3, text: "Здорово! Когда покажешь результат?", mine: false, time: "14:28" },
    { id: 4, text: "Увидимся завтра!", mine: false, time: "14:32" },
    { id: 5, text: "Договорились, до встречи! 🚀", mine: true, time: "14:33" },
  ],
  2: [
    { id: 1, text: "Привет Маша!", mine: true, time: "12:50" },
    { id: 2, text: "Привет! Отправляю фото с мероприятия", mine: false, time: "13:00" },
    { id: 3, text: "Фото отправила 📸", mine: false, time: "13:15" },
  ],
};

const CONTACTS = [
  { id: 1, name: "Алексей Смирнов", phone: "+7 900 123-45-67", online: true, avatar: "АС", color: "from-violet-500 to-purple-600" },
  { id: 2, name: "Дмитрий Волков", phone: "+7 905 987-65-43", online: false, avatar: "ДВ", color: "from-blue-500 to-indigo-600" },
  { id: 3, name: "Иван Петров", phone: "+7 910 111-22-33", online: false, avatar: "ИП", color: "from-emerald-500 to-teal-500" },
  { id: 4, name: "Мария Кузнецова", phone: "+7 915 444-55-66", online: true, avatar: "МК", color: "from-pink-500 to-rose-500" },
  { id: 5, name: "Ольга Новикова", phone: "+7 920 777-88-99", online: true, avatar: "ОН", color: "from-orange-500 to-amber-500" },
  { id: 6, name: "Стартап Буст", phone: "+7 925 000-11-22", online: false, avatar: "СБ", color: "from-cyan-500 to-blue-500" },
];

const NOTIFICATIONS = [
  { id: 1, icon: "MessageCircle", text: "Алексей Смирнов написал вам", time: "2 мин назад", color: "text-violet-400" },
  { id: 2, icon: "UserPlus", text: "Ольга Новикова добавила вас в контакты", time: "15 мин назад", color: "text-cyan-400" },
  { id: 3, icon: "Video", text: "Пропущенный видеозвонок от Марии", time: "1 час назад", color: "text-pink-400" },
  { id: 4, icon: "Users", text: "Вас добавили в группу «Стартап Буст»", time: "3 часа назад", color: "text-emerald-400" },
  { id: 5, icon: "Bell", text: "Новое обновление приложения доступно", time: "Вчера", color: "text-amber-400" },
];

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ initials, color, size = "md", online }: { initials: string; color: string; size?: "sm" | "md" | "lg" | "xl"; online?: boolean }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-xl" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white`}>{initials}</div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0e0e1a] ${online ? "bg-emerald-400" : "bg-gray-500"}`} />
      )}
    </div>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────
const TABS = [
  { id: "chats", icon: "MessageCircle", label: "Чаты" },
  { id: "contacts", icon: "Users", label: "Контакты" },
  { id: "notifications", icon: "Bell", label: "Уведомления" },
  { id: "profile", icon: "User", label: "Профиль" },
  { id: "settings", icon: "Settings", label: "Настройки" },
];

// ─── Chats ───────────────────────────────────────────────────
function ChatsView({ onOpenChat }: { onOpenChat: (id: number) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input placeholder="Поиск чатов..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {CHATS.map((chat, i) => (
          <button key={chat.id} onClick={() => onOpenChat(chat.id)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, opacity: 0, animationFillMode: "forwards" }}>
            <Avatar initials={chat.avatar} color={chat.color} online={chat.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-white truncate">{chat.name}</span>
                <span className="text-xs text-white/35 ml-2 flex-shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45 truncate">{chat.lastMsg}</span>
                {chat.unread > 0 && (
                  <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 rounded-full btn-gradient text-xs flex items-center justify-center px-1.5 font-bold">{chat.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="px-4 pb-4">
        <button className="w-full btn-gradient py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
          <Icon name="Plus" size={16} />Новый чат
        </button>
      </div>
    </div>
  );
}

// ─── Chat dialog ─────────────────────────────────────────────
function ChatView({ chatId, onBack, onVideoCall }: { chatId: number; onBack: () => void; onVideoCall: () => void }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState(MESSAGES[chatId] || []);
  const chat = CHATS.find(c => c.id === chatId);
  if (!chat) return null;

  const send = () => {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, { id: Date.now(), text: input, mine: true, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full animate-scale-in">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
        <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={20} />
        </button>
        <Avatar initials={chat.avatar} color={chat.color} online={chat.online} />
        <div className="flex-1">
          <div className="font-semibold text-sm">{chat.name}</div>
          <div className="text-xs text-emerald-400">{chat.online ? "в сети" : "не в сети"}</div>
        </div>
        <button onClick={onVideoCall} className="w-9 h-9 rounded-full bg-white/8 hover:bg-violet-500/30 transition-colors flex items-center justify-center text-white/70 hover:text-violet-300">
          <Icon name="Video" size={17} />
        </button>
        <button className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 transition-colors flex items-center justify-center text-white/70">
          <Icon name="Phone" size={17} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"} animate-fade-in`}
            style={{ animationDelay: `${i * 30}ms`, opacity: 0, animationFillMode: "forwards" }}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.mine ? "btn-gradient rounded-br-sm" : "bg-white/8 rounded-bl-sm"}`}>
              {msg.text}
              <div className={`text-[10px] mt-1 ${msg.mine ? "text-white/60" : "text-white/35"} text-right`}>{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-white/8">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex-shrink-0 rounded-xl bg-white/8 hover:bg-white/15 transition-colors flex items-center justify-center text-white/50">
            <Icon name="Paperclip" size={16} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Сообщение..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors" />
          <button onClick={send} className="w-9 h-9 flex-shrink-0 btn-gradient rounded-xl flex items-center justify-center">
            <Icon name="Send" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Contacts ────────────────────────────────────────────────
function ContactsView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input placeholder="Поиск контактов..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition-colors" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {CONTACTS.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, opacity: 0, animationFillMode: "forwards" }}>
            <Avatar initials={c.avatar} color={c.color} online={c.online} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white">{c.name}</div>
              <div className="text-xs text-white/40">{c.phone}</div>
            </div>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-xl bg-white/6 hover:bg-violet-500/25 transition-colors flex items-center justify-center text-white/50 hover:text-violet-300">
                <Icon name="MessageCircle" size={14} />
              </button>
              <button className="w-8 h-8 rounded-xl bg-white/6 hover:bg-cyan-500/25 transition-colors flex items-center justify-center text-white/50 hover:text-cyan-300">
                <Icon name="Video" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <button className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 text-white/70 transition-colors">
          <Icon name="UserPlus" size={16} />Добавить контакт
        </button>
      </div>
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────
function NotificationsView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs text-white/40">{NOTIFICATIONS.length} уведомлений</span>
        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Очистить все</button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {NOTIFICATIONS.map((n, i) => (
          <div key={n.id} className="flex items-start gap-3 p-3.5 rounded-2xl glass hover:bg-white/5 transition-all cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0">
              <Icon name={n.icon} size={16} className={n.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/85 leading-snug">{n.text}</p>
              <span className="text-xs text-white/35 mt-1 block">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────
function ProfileView() {
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-4">
      <div className="relative mx-4 mt-4 rounded-3xl overflow-hidden p-6 text-center" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.3))", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%,#7c3aed 0%,transparent 60%), radial-gradient(circle at 80% 20%,#06b6d4 0%,transparent 50%)" }} />
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-2xl font-black text-white mx-auto mb-3 animate-float ring-4 ring-white/10">ВМ</div>
          <h2 className="font-bold text-lg text-white">Владимир Морозов</h2>
          <p className="text-white/50 text-sm mt-0.5">@morozov_v</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-400">В сети</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {[
          { icon: "Phone", label: "Телефон", value: "+7 900 000-00-00" },
          { icon: "AtSign", label: "Никнейм", value: "@morozov_v" },
          { icon: "Info", label: "О себе", value: "Разработчик, люблю космос 🚀" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/4 border border-white/8">
            <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon} size={15} />
            </div>
            <div>
              <div className="text-xs text-white/40">{item.label}</div>
              <div className="text-sm text-white font-medium">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { icon: "Image", label: "Медиа", count: "48" },
          { icon: "Link", label: "Ссылки", count: "12" },
          { icon: "File", label: "Файлы", count: "7" },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-2xl bg-white/4 border border-white/8 text-center">
            <Icon name={item.icon} size={18} className="text-violet-400 mx-auto mb-1" />
            <div className="font-bold text-white">{item.count}</div>
            <div className="text-xs text-white/40">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────
function SettingsView() {
  const sections = [
    {
      title: "Аккаунт",
      items: [
        { icon: "User", label: "Личные данные", desc: "Имя, фото, статус" },
        { icon: "Lock", label: "Конфиденциальность", desc: "Кто видит информацию" },
        { icon: "Shield", label: "Безопасность", desc: "Пароль, двухфакторная" },
      ]
    },
    {
      title: "Уведомления",
      items: [
        { icon: "Bell", label: "Push-уведомления", desc: "Сообщения и звонки" },
        { icon: "Volume2", label: "Звуки", desc: "Рингтоны и сигналы" },
      ]
    },
    {
      title: "Приложение",
      items: [
        { icon: "Palette", label: "Оформление", desc: "Тема и цвета" },
        { icon: "Globe", label: "Язык", desc: "Русский" },
        { icon: "HelpCircle", label: "Помощь", desc: "FAQ и поддержка" },
      ]
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2 px-1">{section.title}</h3>
          <div className="space-y-1">
            {section.items.map((item) => (
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

// ─── Video Call ───────────────────────────────────────────────
function VideoCallView({ contact, onClose }: { contact: typeof CHATS[0]; onClose: () => void }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [calling, setCalling] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-scale-in" style={{ background: "linear-gradient(160deg,#1a0533 0%,#0d1a2e 50%,#031a0e 100%)" }}>
      <div className="absolute inset-0">
        <div className="orb w-80 h-80 opacity-25 top-[-60px] left-[-60px]" style={{ background: "var(--grad-1)" }} />
        <div className="orb w-64 h-64 opacity-20 bottom-[-40px] right-[-40px]" style={{ background: "var(--grad-2)" }} />
        <div className="orb w-48 h-48 opacity-15 top-1/2 right-[-20px]" style={{ background: "var(--grad-3)" }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl">
            {contact.avatar}
          </div>
          {calling && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-violet-400/50" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
              <span className="absolute inset-0 rounded-full border-2 border-violet-400/30" style={{ animation: "pulse-ring 1.5s ease-out 0.5s infinite" }} />
            </>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white">{contact.name}</h2>
        <p className="text-white/50 mt-1 text-sm">{calling ? "Вызов..." : "00:42"}</p>

        {!videoOff && (
          <div className="absolute bottom-32 right-4 w-24 h-32 rounded-2xl overflow-hidden border border-white/20 bg-gradient-to-br from-white/10 to-white/5">
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="User" size={32} className="text-white/30" />
            </div>
          </div>
        )}
      </div>

      <div className="relative pb-10 px-8 flex items-center justify-center gap-5">
        <button onClick={() => setMuted(m => !m)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? "bg-red-500/80" : "bg-white/12 hover:bg-white/20"}`}>
          <Icon name={muted ? "MicOff" : "Mic"} size={22} className="text-white" />
        </button>
        <button onClick={() => setVideoOff(v => !v)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${videoOff ? "bg-red-500/80" : "bg-white/12 hover:bg-white/20"}`}>
          <Icon name={videoOff ? "VideoOff" : "Video"} size={22} className="text-white" />
        </button>
        <button onClick={onClose} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all hover:scale-105">
          <Icon name="PhoneOff" size={26} className="text-white" />
        </button>
        <button className="w-14 h-14 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center transition-all">
          <Icon name="ScreenShare" size={22} className="text-white" />
        </button>
        <button className="w-14 h-14 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center transition-all">
          <Icon name="Users" size={22} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────
const SECTION_TITLES: Record<string, string> = {
  chats: "Чаты",
  contacts: "Контакты",
  notifications: "Уведомления",
  profile: "Профиль",
  settings: "Настройки",
};

// ─── App ──────────────────────────────────────────────────────
export default function Index() {
  const [tab, setTab] = useState("chats");
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [videoCall, setVideoCall] = useState<typeof CHATS[0] | null>(null);

  const handleVideoCall = () => {
    const chat = CHATS.find(c => c.id === openChatId);
    if (chat) setVideoCall(chat);
  };

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto relative overflow-hidden" style={{ background: "#0e0e1a" }}>
      {/* Background orbs */}
      <div className="orb w-72 h-72 opacity-15 top-[-80px] left-[-60px]" style={{ background: "var(--grad-1)" }} />
      <div className="orb w-56 h-56 opacity-10 bottom-20 right-[-40px]" style={{ background: "var(--grad-2)" }} />

      {/* Header */}
      {!openChatId && (
        <div className="relative flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Pulse</span>
            <h1 className="text-xl font-black gradient-text leading-tight">{SECTION_TITLES[tab]}</h1>
          </div>
          {tab === "chats" && (
            <button className="w-9 h-9 btn-gradient rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="Edit3" size={15} />
            </button>
          )}
          {tab === "notifications" && (
            <div className="w-6 h-6 rounded-full btn-gradient flex items-center justify-center text-xs font-bold">{NOTIFICATIONS.length}</div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        {openChatId ? (
          <ChatView chatId={openChatId} onBack={() => setOpenChatId(null)} onVideoCall={handleVideoCall} />
        ) : (
          <div className="h-full">
            {tab === "chats" && <ChatsView onOpenChat={setOpenChatId} />}
            {tab === "contacts" && <ContactsView />}
            {tab === "notifications" && <NotificationsView />}
            {tab === "profile" && <ProfileView />}
            {tab === "settings" && <SettingsView />}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      {!openChatId && (
        <div className="relative flex-shrink-0 px-3 pb-4 pt-2 glass border-t border-white/8">
          <div className="flex items-center justify-around">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? "text-white" : "text-white/35 hover:text-white/60"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${active ? "btn-gradient shadow-lg" : "bg-transparent"}`}>
                    <Icon name={t.icon} size={18} />
                  </div>
                  <span className={`text-[10px] font-medium transition-all ${active ? "gradient-text font-bold" : ""}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Call overlay */}
      {videoCall && <VideoCallView contact={videoCall} onClose={() => setVideoCall(null)} />}
    </div>
  );
}
