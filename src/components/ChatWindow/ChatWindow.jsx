import React, { useMemo, useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";
import {
  Smile, Image as ImageIcon,
  Paperclip, Contact, Scan,
  Type, Zap, CreditCard,
  MoreHorizontal, ThumbsUp,
  Send, Search, PanelRightClose,
  Sticker, FileText, Folder,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import "./chatWindow.css";
import useWs from "../../context/useWs";
import ImageGalleryModal from "./ImageGalleryModal";
import {
  wsCheckUserOnline,
  wsGetPeopleChatMes,
  wsGetRoomChatMes,
  wsJoinRoom,
  wsSendChat,
} from "../../api/chatApi";

function unwrapServerMessage(message) {
  const event = message?.event ?? message?.data?.event;
  const status = message?.status ?? message?.data?.status;
  const data = message?.data?.data ?? message?.data ?? message;
  return { event, status, data };
}

function parseOnlineStatus(unwrapped) {
  const d = unwrapped?.data ?? {};
  const v = d.status ?? d.online ?? d.isOnline;
  return v === true;
}

function waitForEvent(client, targetEvent, { timeoutMs = 6000 } = {}) {
  return new Promise((resolve, reject) => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      off();
      reject(new Error("timeout"));
    }, timeoutMs);

    const off = client.on("json", (msg) => {
      const unwrapped = unwrapServerMessage(msg);
      if (unwrapped.event !== targetEvent) return;
      clearTimeout(timer);
      if (done) return;
      done = true;
      off();
      resolve(unwrapped);
    });
  });
}

function extractHistoryList(unwrapped) {
  const d = unwrapped?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.list)) return d.list;
  if (Array.isArray(d?.messages)) return d.messages;
  if (Array.isArray(d?.mes)) return d.mes;
  // GET_ROOM_CHAT_MES
  if (Array.isArray(d?.chatData)) return d.chatData;
  return [];
}

function normalizeHistoryItem(item) {
  if (item == null) return { content: "" };
  if (typeof item === "string" || typeof item === "number") {
    return { content: String(item) };
  }

  const content =
    item.mes ??
    item.message ??
    item.content ??
    item.text ??
    item.msg ??
    (typeof item === "object" ? JSON.stringify(item) : String(item));

  const author =
    item.from ??
    item.user ??
    item.sender ??
    item.name ??
    item.username ??
    item.author;

  const time =
    item.time ??
    item.actionTime ??
    item.createTime ??
    item.createAt ??
    item.createdAt ??
    item.date;

  return { content: String(content ?? ""), author, time };
}

const IMGBB_API_KEY = "c071f3f96ce5daa2e26d0706786895b6";
// Hàm helper để phân loại nội dung tin nhắn
const parseContentAndType = (rawContent) => {
  try {
    if (typeof rawContent === "string" && rawContent.startsWith("{")) {
      const parsed = JSON.parse(rawContent);
      if (parsed && parsed.dataType === "file_base64") {
        return { type: "file", content: parsed }; // Trả về Object
      }
    }
  } catch (e) {
    // Bỏ qua lỗi
  }

  if (typeof rawContent === "string") {
    // Check base64 image hoặc link ảnh
    if (rawContent.startsWith("data:image") || rawContent.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
      return { type: "image", content: rawContent };
    }
  }

  return { type: "text", content: rawContent };
};
// Hàm kiểm tra xem nội dung là File, Ảnh hay Text
const parseMessageContent = (rawContent) => {
  // 1. Kiểm tra xem có phải là JSON File (đã quy ước dataType="file_base64")
  try {
    if (typeof rawContent === "string" && rawContent.trim().startsWith("{")) {
      const parsed = JSON.parse(rawContent);
      if (parsed && parsed.dataType === "file_base64") {
        return { type: "file", content: parsed }; // Trả về dạng File
      }
    }
  } catch (e) {
    // Bỏ qua lỗi parse nếu là text thường
  }

  // 2. Kiểm tra nếu là Ảnh (Logic cũ của bạn)
  // Lưu ý: Nếu bạn có hàm isImage riêng thì dùng nó, hoặc dùng regex này
  if (typeof rawContent === "string") {
    if (rawContent.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || rawContent.startsWith("data:image")) {
      return { type: "image", content: rawContent };
    }
  }

  // 3. Mặc định là Text
  return { type: "text", content: rawContent };
};

const uploadToImgBB = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) return data.data.url; // Trả về link ảnh
    throw new Error("Upload thất bại");
  } catch (err) {
    console.error(err);
    return null;
  }
};

function isSameUser(a, b) {
  const aa = String(a ?? "")
    .trim()
    .toLowerCase();
  const bb = String(b ?? "")
    .trim()
    .toLowerCase();
  return aa !== "" && aa === bb;
}

function normalizeChatType(v) {
  // v là type nếu v == 0 hoặc "0" hoặc "people" thì trả về "people" ngược lại trả về "room"
  if (v === 0 || v === "0" || v === "people") return "people";
  if (v === 1 || v === "1" || v === "room") return "room";
  return v;
}

export default function ChatWindow({
  title = "Chat",
  initialMessages,
  onToggleInfo,
  chatType = "room", // 'room' | 'people'
  chatTo = "36",
  currentUsername,
}) {

  const { client, connected } = useWs();

  const nextIdRef = useRef(1);
  const nextId = () => String(nextIdRef.current++);

  const [presence, setPresence] = useState("unknown"); // online | offline | unknown
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);


  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!connected) {
      queueMicrotask(() => setPresence("unknown"));
      return;
    }
    // Only check online status for 1:1 chats
    if (chatType !== "people" || !chatTo) {
      queueMicrotask(() => setPresence("unknown"));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await wsCheckUserOnline(client, chatTo);
        const res = await waitForEvent(client, "CHECK_USER_ONLINE", {
          timeoutMs: 6000,
        });
        const isOnline = parseOnlineStatus(res);
        if (!cancelled) setPresence(isOnline ? "online" : "offline");
      } catch {
        if (!cancelled) setPresence("unknown");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, connected, chatType, chatTo]);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState(() => initialMessages ?? []);
  const isImage = (txt) => {
    if (!txt || typeof txt !== 'string') return false;
    // Kiểm tra nếu là link từ ImgBB hoặc có đuôi ảnh
    return txt.includes("ibb.co") || txt.match(/\.(jpeg|jpg|gif|png)$/i) || txt.startsWith("data:image");
  };
  // Load chat history when switching conversation
  useEffect(() => {
    if (!connected) return;
    if (!chatType || !chatTo) return;

    let cancelled = false;

    (async () => {
      try {
        setHistoryLoading(true);
        setMessages([]);

        if (chatType === "room") {
          // phải join room trước khi lấy lịch sử
          await wsJoinRoom(client, chatTo);
          await waitForEvent(client, "JOIN_ROOM", { timeoutMs: 6000 }).catch(
            () => {}
          );

          await wsGetRoomChatMes(client, chatTo, 1);
          const res = await waitForEvent(client, "GET_ROOM_CHAT_MES", {
            timeoutMs: 8000,
          });
          const list = extractHistoryList(res);
          // hiển thị theo thứ tự từ cũ đến mới
          const ordered =
            list.length >= 2 &&
            typeof list?.[0]?.id === "number" &&
            typeof list?.[list.length - 1]?.id === "number" &&
            list[0].id > list[list.length - 1].id
              ? [...list].reverse()
              : list;

          const mapped = ordered.map((raw) => {
            const { content, author, time } = normalizeHistoryItem(raw);
            const side = isSameUser(author, currentUsername) ? "right" : "left";
            let msgType = "text"; // Mặc định là text
            // Kiểm tra nếu nội dung bắt đầu bằng mã Base64 của ảnh
            if (isImage(content)) {
              msgType = "image";
            }
            return {
              id: nextId(),
              side,
              author,
              content: content,
              type: msgType,
              time:
                typeof time === "string"
                  ? time
                  : new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
            };
          });

          if (!cancelled) setMessages(mapped);
          return;
        }

        if (chatType === "people") {
          await wsGetPeopleChatMes(client, chatTo, 1);
          const res = await waitForEvent(client, "GET_PEOPLE_CHAT_MES", {
            timeoutMs: 8000,
          });
          const list = extractHistoryList(res);
          // hiển thị theo thứ tự từ cũ đến mới
          const ordered =
            list.length >= 2 &&
            typeof list?.[0]?.id === "number" &&
            typeof list?.[list.length - 1]?.id === "number" &&
            list[0].id > list[list.length - 1].id
              ? [...list].reverse()
              : list;

          const mapped = ordered.map((raw) => {
            const { content: rawContent, author, time } = normalizeHistoryItem(raw);
            const side = isSameUser(author, currentUsername) ? "right" : "left";
            const { type, content } = parseContentAndType(rawContent);
            return {
              id: nextId(), // Hoặc dùng raw.id nếu có
              side,
              author,
              type: type,       // 'file', 'image', hoặc 'text'
              content: content, // Object (nếu là file) hoặc String (nếu là text/ảnh)
              time: typeof time === "string"
                  ? time
                  : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
          });

          if (!cancelled) setMessages(mapped);
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, connected, chatType, chatTo, currentUsername]);

  // --- States quản lý hiển thị Popup ---
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false); // Menu chọn File/Folder

  // --- Refs cho Input File ---
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // --- XỬ LÝ EMOJI ---
  const handleEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    // Không đóng picker để chọn tiếp, hoặc đóng thì thêm: setShowEmojiPicker(false);
  };

  // --- XỬ LÝ STICKER ---
  const handleSendSticker = (url) => {
    // Gửi sticker coi như gửi một tin nhắn dạng ảnh/sticker
    const newMessage = {
      id: nextId(),
      side: "right",
      type: "sticker", // Đánh dấu là sticker
      content: url,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setShowStickerPicker(false);
  };

  // --- XỬ LÝ FILE / ẢNH / FOLDER ---
  const handleImageSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Thông báo đang xử lý (tùy chọn)
      console.log("Đang upload ảnh...");

      for (const file of Array.from(files)) {
        // 1. Upload file từ máy tính lên ImgBB
        const imageUrl = await uploadToImgBB(file);

        if (imageUrl) {
          // 2. Có link rồi -> Hiển thị lên UI ngay
          const newMessage = {
            id: Date.now() + Math.random(),
            side: "right",
            type: "image",
            content: imageUrl, // Lưu ý: content giờ là URL
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setMessages((prev) => [...prev, newMessage]);

          // 3. Gửi Link qua Chat Server (Không bao giờ bị văng vì link rất nhẹ)
          if (client && connected) {
            wsSendChat(client, {
              type: chatType,
              to: chatTo,
              mes: imageUrl
            }).catch(err => console.error("Lỗi gửi tin:", err));
          }
        } else {
          alert("Lỗi: Không thể upload ảnh này.");
        }
      }
    }
    e.target.value = null;
  };

  // 2. Chọn File thường
  // --- XỬ LÝ FILE (Chọn 1 hoặc nhiều file) ---
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { // Giới hạn 5MB
        alert("File quá lớn (>5MB)"); continue;
      }

      // Convert file sang Base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;

        // Tạo gói tin File JSON
        const filePayload = {
          dataType: "file_base64",
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          type: file.type,
          data: base64
        };

        const msgString = JSON.stringify(filePayload); // Biến thành chuỗi để gửi

        // Gửi đi
        if (client && connected) {
          await wsSendChat(client, { type: chatType, to: chatTo, mes: msgString });
        }

        // Hiển thị ngay (Optimistic UI)
        setMessages(prev => [...prev, {
          id: Date.now(),
          side: "right",
          type: "file",       // Quan trọng: type là file
          content: filePayload, // Quan trọng: content là object
          time: new Date().toLocaleTimeString("vi-VN", {hour: "2-digit", minute:"2-digit"})
        }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
    setShowAttachMenu(false);
  };

  // 3. Chọn Folder
  // --- XỬ LÝ FOLDER (Upload cả thư mục) ---
  const handleFolderSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Folder được tính là 1 tin nhắn gộp
      const newMessage = {
        id: nextId(),
        side: "right",
        type: "folder", // Đánh dấu là folder
        content: {
          name: "Thư mục tải lên", // Tên folder (trình duyệt bảo mật thường chỉ lấy dc tên file con)
          itemCount: files.length,
        },
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, newMessage]);
    }
    e.target.value = null;
    setShowAttachMenu(false);
  };

  // --- HÀM HỖ TRỢ DOWNLOAD ---
  const triggerDownload = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadClick = (msg) => {
    if (msg.type === "image") {
      // Logic cũ cho ảnh
      triggerDownload(msg.content, `image_${msg.id}.png`);
    } else if (msg.type === "file") {
      const fileData = msg.content; // Object { name, data, ... }
      if (fileData && fileData.data) {
        // Tạo link tải từ chuỗi Base64
        const link = document.createElement("a");
        link.href = fileData.data;
        link.download = fileData.name || "download_file";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("File lỗi hoặc không tồn tại nội dung.");
      }
    }
  };


  // --- UI RENDER HELPERS ---
  const toggleEmoji = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowStickerPicker(false);
    setShowAttachMenu(false);
  };

  const toggleSticker = () => {
    setShowStickerPicker(!showStickerPicker);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  const toggleAttachMenu = () => {
    setShowAttachMenu(!showAttachMenu);
    setShowEmojiPicker(false);
    setShowStickerPicker(false);
  };

  // 2. Tạo ref để tham chiếu đến cuối danh sách chat
  const messagesEndRef = useRef(null);

  // 3. Hàm cuộn xuống dưới cùng
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 4. Gọi hàm cuộn mỗi khi danh sách messages thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Receive messages from server (depends on what server pushes)
  useEffect(() => {
    if (!client) return;
    const off = client.on("json", (payload) => {
      const unwrapped = unwrapServerMessage(payload);

      // Ignore responses for history and other request/response events.
      if (
        unwrapped?.event === "GET_ROOM_CHAT_MES" ||
        unwrapped?.event === "GET_PEOPLE_CHAT_MES" ||
        unwrapped?.event === "GET_USER_LIST" ||
        unwrapped?.event === "CHECK_USER_ONLINE" ||
        unwrapped?.event === "CHECK_USER_EXIST" ||
        unwrapped?.event === "JOIN_ROOM"
      ) {
        return;
      }

      const mes = payload?.data?.mes ?? payload?.mes;
      if (!mes) return;

      const payloadType = normalizeChatType(
        payload?.data?.type ?? payload?.type
      );
      const payloadTo = payload?.data?.to ?? payload?.to ?? payload?.data?.room;
      const from =
        payload?.data?.from ??
        payload?.from ??
        payload?.data?.user ??
        payload?.user ??
        payload?.data?.name;

      // Filter incoming messages to the active chat
      if (chatType === "room") {
        if (payloadType && payloadType !== "room") return;
        if (payloadTo && payloadTo !== chatTo) return;
      }
      if (chatType === "people") {
        if (payloadType && payloadType !== "people") return;
        const matchesPeer =
          (from && from === chatTo) ||
          (payloadTo && payloadTo === chatTo) ||
          (from && currentUsername && from === currentUsername);
        if (!matchesPeer) return;
      }
      const { type, content } = parseMessageContent(mes);

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          side: isSameUser(from, currentUsername) ? "right" : "left",
          author: from || "Unknown",
          type: type,
          content: content,
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });

    return () => off();
  }, [client, chatType, chatTo, currentUsername]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSend) return;

    const mes = text.trim();

    // optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        side: "right",
        content: mes,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setText("");
    setShowEmojiPicker(false);

    // send using your protocol
    try {
      if (chatType === "room" && chatTo) {
        await wsJoinRoom(client, chatTo);
        await waitForEvent(client, "JOIN_ROOM", { timeoutMs: 6000 }).catch(
          () => {}
        );
      }
      await wsSendChat(client, { type: chatType, to: chatTo, mes });
    } catch {
      // optional: mark as failed
    }
  }

  const handleQuickAction = () => {
    if (canSend) {
      document.querySelector(".chatWindow__composer")?.requestSubmit();
    } else {
      const next = {
        id: nextId(),
        side: "right",
        content: "👍",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, next]);
    }
  };

  const MOCK_STICKERS = [
    "https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=46366&size=130",
    "https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=46367&size=130",
    "https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=46368&size=130",
    // Thêm link ảnh sticker của bạn vào đây
  ];

  return (
    <section className="chatWindow">
      <header className="chatWindow__header">
        <div className="chatWindow__header-info">
          <div className="chatWindow__title">{title}</div>
          <div className="chatWindow__subtitle">
            {!connected
              ? "Connecting..."
              : historyLoading
              ? "Loading..."
              : chatType === "people"
              ? presence === "online"
                ? "Online"
                : presence === "offline"
                ? "Offline"
                : "..."
              : "Online"}
          </div>
        </div>

        <div className="chatWindow__header-actions">
          <div className="header-icon" title="Tìm kiếm tin nhắn">
            <Search size={22} />
          </div>
          <div
            className="header-icon"
            title="Thông tin hội thoại"
            onClick={onToggleInfo}
          >
            <PanelRightClose size={22} />
          </div>
        </div>
      </header>

      <div className="chatWindow__body">
        {messages.map((m) =>
          m.type === "sticker" ? (
            <div key={m.id} className={`message-row right`}>
              <img src={m.content} alt="sticker" className="sticker-img" />
              <div className="msg-time">{m.time}</div>
            </div>
          ) : m.type === "image" ? (
            <div key={m.id} className={`message-group ${m.side}`}>
              <div className="msg-content-wrapper">
                <img
                  src={m.content}
                  alt="attachment"
                  className="msg-image-display"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    // Đảm bảo dùng đúng hàm setState mà bạn khai báo ở đầu file
                    setSelectedGalleryImg(m);
                    setIsGalleryOpen(true);
                  }}
                />
                <div className="msg-time-mini">{m.time}</div>
              </div>
            </div>
          ) : m.type === "file" ? (
            <div key={m.id} className={`message-group ${m.side}`}>
              <div className="msg-content-wrapper">
                <div
                  className="msg-file-box"
                  // Thêm sự kiện click để tải
                  onClick={() => handleDownloadClick(m)}
                  style={{ cursor: "pointer" }} // Đổi con trỏ chuột
                  title="Nhấn để tải file"
                >
                  <FileText size={32} color="#0068ff" />
                  <div className="file-info">
                    <div className="file-name">{m.content.name}</div>
                    <div className="file-meta">{m.content.size}</div>
                  </div>
                </div>
                <div className="msg-time-mini">{m.time}</div>
              </div>
            </div>
          ) : m.type === "folder" ? (
            <div key={m.id} className={`message-group ${m.side}`}>
              <div className="msg-content-wrapper">
                <div
                  className="msg-file-box"
                  onClick={() => handleDownloadClick(m)}
                  style={{ cursor: "pointer" }}
                  title="Tải thư mục (Zip)"
                >
                  <Folder size={32} color="#f5a623" />
                  <div className="file-info">
                    <div className="file-name">{m.content.name}</div>
                    <div className="file-meta">{m.content.itemCount} items</div>
                  </div>
                </div>
                <div className="msg-time-mini">{m.time}</div>
              </div>
            </div>
          ) : (
            <MessageBubble key={m.id} message={m} />
          )
        )}
        {/* --- CÁC POPUP CHỨC NĂNG (Đặt vị trí absolute so với footer) --- */}
        <div className="chat-popups">
          {/* 1. Emoji Picker */}
          {showEmojiPicker && (
            <div className="popup-container emoji-area">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={350}
                width="100%"
              />
            </div>
          )}

          {/* 2. Sticker Picker */}
          {showStickerPicker && (
            <div className="popup-container sticker-area">
              <div className="sticker-grid">
                {MOCK_STICKERS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    onClick={() => handleSendSticker(url)}
                    alt="sticker"
                  />
                ))}
                {/* Fake thêm icon cho đầy */}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="sticker-placeholder">
                    Sticker {i}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Attach Menu (File/Folder) */}
          {showAttachMenu && (
            <div className="popup-container attach-menu">
              <div
                className="attach-item"
                onClick={() => fileInputRef.current.click()}
              >
                <FileText size={20} className="blue-icon" />
                <span>Chọn File</span>
              </div>
              <div
                className="attach-item"
                onClick={() => folderInputRef.current.click()}
              >
                <Folder size={20} className="yellow-icon" />
                <span>Chọn Thư mục</span>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      <footer className="chatWindow__footer">
        {/* INPUTS ẨN ĐỂ XỬ LÝ FILE */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />
        <input
          type="file"
          ref={fileInputRef}
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
        <input
          type="file"
          ref={folderInputRef}
          style={{ display: "none" }}
          {...{ webkitdirectory: "", directory: "" }}
          onChange={handleFolderSelect}
        />
        <div className="chat-toolbar">
          <div
            className={`toolbar-icon ${showStickerPicker ? "active" : ""}`}
            onClick={toggleSticker}
            title="Sticker"
          >
            <Sticker size={20} />
          </div>
          <div
            className="toolbar-icon"
            onClick={() => imageInputRef.current.click()}
            title="Gửi ảnh"
          >
            <ImageIcon size={20} />
          </div>
          <div
            className={`toolbar-icon ${showAttachMenu ? "active" : ""}`}
            onClick={toggleAttachMenu}
            title="Đính kèm file"
          >
            <Paperclip size={20} />
          </div>

          <div className="toolbar-icon" title="Gửi Danh thiếp">
            <Contact size={20} />
          </div>
          <div className="toolbar-icon" title="Chụp màn hình">
            <Scan size={20} />
          </div>
          <div className="toolbar-icon" title="Định dạng tin nhắn">
            <Type size={20} />
          </div>
          <div className="toolbar-icon" title="Tin nhắn nhanh">
            <Zap size={20} />
          </div>
          <div className="toolbar-icon" title="Ví / Chuyển tiền">
            <CreditCard size={20} />
          </div>
          <div className="toolbar-icon" title="Thêm">
            <MoreHorizontal size={20} />
          </div>
        </div>

        <form className="chatWindow__composer" onSubmit={onSubmit}>
          <input
            className="chatWindow__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Nhập @, tin nhắn tới ${title}`}
            onFocus={() => {
              // Tự động đóng các popup khi gõ phím
              setShowEmojiPicker(false);
              setShowStickerPicker(false);
              setShowAttachMenu(false);
            }}
          />

          <div className="chat-input-actions">
            <div
              className="action-icon-small"
              title="Biểu cảm"
              onClick={toggleEmoji}
            >
              <Smile size={20} />
            </div>
            <div
              className="action-icon-large"
              onClick={handleQuickAction}
              title={canSend ? "Gửi" : "Gửi Like"}
            >
              {canSend ? (
                <Send size={20} color="#0068ff" />
              ) : (
                <ThumbsUp size={20} color="#e5a50a" />
              )}
            </div>
          </div>
        </form>
      </footer>
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        currentImage={selectedGalleryImg}
        allMessages={messages} // Truyền toàn bộ tin nhắn để lọc ảnh bên sidebar
      />
    </section>

  );
}
