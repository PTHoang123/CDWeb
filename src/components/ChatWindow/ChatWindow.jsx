import React, { useMemo, useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";
import {
  Smile,
  Image as ImageIcon,
  Paperclip,
  Contact,
  Scan,
  Type,
  Zap,
  CreditCard,
  MoreHorizontal,
  ThumbsUp,
  Send,
  Search,
  PanelRightClose,
  Sticker,
} from "lucide-react";
import "./chatWindow.css";
import useWs from "../../context/useWs";
import { wsCheckUserOnline, wsSendChat } from "../../api/chatApi";

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

export default function ChatWindow({
  title = "Chat",
  initialMessages,
  onToggleInfo,
  // choose where to send
  chatType = "room", // 'room' | 'people'
  chatTo = "ABC",
}) {
  const { client, connected } = useWs();

  const nextIdRef = useRef(1);
  const nextId = () => String(nextIdRef.current++);

  const [presence, setPresence] = useState("unknown"); // online | offline | unknown

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
  const [messages, setMessages] = useState(
    () =>
      initialMessages ?? [
        {
          id: "m1",
          side: "left",
          author: "Huy lofi",
          content: "Tôi bị ngu",
          time: "20:28",
        },
        {
          id: "m2",
          side: "left",
          author: "Hải Bánh",
          content: "chim tao bé",
          time: "20:28",
        },
        { id: "m3", side: "right", content: "ahihi", time: "20:28" },
      ]
  );

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

  // 1. Chọn Ảnh
  // Tìm đến hàm handleImageSelect và thay thế toàn bộ bằng đoạn này:
  const handleImageSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Lặp qua từng file ảnh được chọn
      Array.from(files).forEach((file) => {
        const reader = new FileReader();

        // Khi đọc xong file, nó sẽ chạy hàm này
        reader.onload = (event) => {
          const base64Image = event.target.result; // Đây là chuỗi mã hóa của ảnh

          // Tạo tin nhắn mới dạng ảnh
          const newMessage = {
            id: nextId(),
            side: "right", // Tin nhắn của mình nằm bên phải
            type: "image", // Đánh dấu là ảnh để hiển thị thẻ img
            content: base64Image, // Nội dung chính là cái mã ảnh
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          // Cập nhật vào danh sách tin nhắn để hiện lên màn hình ngay
          setMessages((prev) => [...prev, newMessage]);

          // (Nếu sau này bạn muốn gửi qua WebSocket thì gọi hàm gửi ở đây)
          // wsSendChat(client, ..., "image", base64Image);
        };

        // Bắt đầu đọc file
        reader.readAsDataURL(file);
      });
    }
    // Reset input để chọn lại được cùng 1 ảnh nếu muốn
    e.target.value = null;
  };

  // 2. Chọn File thường
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      console.log("Đã chọn file:", files);
      alert(`Đã chọn file: ${files[0].name}`);
    }
    setShowAttachMenu(false);
  };

  // 3. Chọn Folder
  const handleFolderSelect = (e) => {
    const files = e.target.files; // Trả về list tất cả file trong folder
    if (files.length > 0) {
      console.log("Đã chọn folder, tổng số file:", files.length);
      alert(`Đã chọn folder chứa ${files.length} files.`);
    }
    setShowAttachMenu(false);
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
    const off = client.on("json", (payload) => {
      // Heuristic: if server pushes a chat message it usually contains mes
      const mes = payload?.data?.mes ?? payload?.mes;
      if (!mes) return;

      const from = payload?.data?.from ?? payload?.from ?? payload?.data?.user;

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          side: "left",
          author: from || "Unknown",
          content: String(mes),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });

    return () => off();
  }, [client]);

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
            <div key={m.id} className={`message-row ${m.side}`}>
              <div className="msg-image-wrapper">
                <img
                  src={m.content}
                  alt="attachment"
                  style={{
                    maxWidth: "200px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div className="msg-time">{m.time}</div>
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
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
        <input
          type="file"
          ref={folderInputRef}
          style={{ display: "none" }}
          webkitdirectory=""
          directory=""
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
    </section>
  );
}
