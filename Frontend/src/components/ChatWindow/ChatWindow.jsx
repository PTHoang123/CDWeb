import React, { useMemo, useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";
import {
  Smile, Image as ImageIcon,
  Paperclip, Contact, Scan,
  Type, Zap, CreditCard,
  MoreHorizontal, ThumbsUp,
  Send, Search, PanelRightClose,
  Sticker, FileText, Folder, UserPlus,
  Video, Phone, PhoneOff, Mic
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import "./chatWindow.css";
import Modal from "../Modal/Modal";
import useWs from "../../context/useWs";
import ImageGalleryModal from "./ImageGalleryModal";
import {
  wsCheckUserOnline,
  wsGetPeopleChatMes,
  wsGetRoomChatMes,
  wsSendChat,
} from "../../api/chatApi";
import { resolveApiUrl } from "../../api/runtime";

const safeEncode = (str) => {
  try {
    // Chuyển Emoji/Tiếng Việt sang dạng Base64 an toàn
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error("Encode error", e);
    return str;
  }
};

const safeDecode = (str) => {
  try {
    // Thử giải mã Base64 sang UTF-8
    return decodeURIComponent(escape(atob(str)));
  } catch {
    // Nếu không phải Base64 (tin nhắn cũ hoặc text thường), giữ nguyên
    return str;
  }
};

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
  } catch {
    // Bỏ qua lỗi
  }

  if (typeof rawContent === "string") {
    // Check base64 image hoặc link ảnh
    if (rawContent.startsWith("STICKER|")) {
      const stickerUrl = rawContent.replace("STICKER|", "");
      return { type: "sticker", content: stickerUrl };
    }

    if (rawContent.startsWith("data:image") || rawContent.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
      return { type: "image", content: rawContent };
    }
  }

  return { type: "text", content: safeDecode(rawContent) };
};

// Hàm kiểm tra xem nội dung là File, Ảnh hay Text
const parseMessageContent = (rawContent) => {
  // 1. Kiểm tra xem có phải là JSON File (đã quy ước dataType="file_base64")
  try {
    if (typeof rawContent === "string" && rawContent.trim().startsWith("{")) {
      const parsed = JSON.parse(rawContent);
      if (parsed && parsed.dataType === "file_base64") {
        return { type: "file", content: parsed };
      }
    }
  } catch {
    // bỏ qua lỗi
  }

  if (typeof rawContent === "string") {
    if (rawContent.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || rawContent.startsWith("data:image")) {
      return { type: "image", content: rawContent };
    }
  }

  // 3. Mặc định là Text
  return { type: "text", content: safeDecode(rawContent) };
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
                                     onMessagesUpdate,
}) {

  const { client, connected } = useWs();

  const nextIdRef = useRef(1);
  const nextId = () => String(nextIdRef.current++);

  const [presence, setPresence] = useState("unknown"); // online | offline | unknown
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const handleImageClick = (msg) => {
    console.log("Clicked image:", msg);
    setSelectedGalleryImg(msg);
    setIsGalleryOpen(true);
  };

  const [historyLoading, setHistoryLoading] = useState(false);
  const inputRef = useRef(null);

  // --- States cho Modal Mời thành viên ---
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");

  // --- States & Refs cho Video Call WebRTC ---
  const [callState, setCallState] = useState("idle"); // idle, calling, receiving, active
  const [callData, setCallData] = useState(null); // Lưu { to, from, sdp }
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const rtcServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

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
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages, onMessagesUpdate]);

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
          // ✅ Không gọi wsJoinRoom ở đây nữa — chỉ lấy lịch sử
          // Nếu user chưa là thành viên, backend sẽ trả về error
          await wsGetRoomChatMes(client, chatTo, 1);
          const res = await waitForEvent(client, "GET_ROOM_CHAT_MES", {
            timeoutMs: 8000,
          });

          // Nếu chưa là thành viên, backend trả error
          if (res.status === "error") {
            if (!cancelled) setMessages([{
              id: "sys-not-member",
              side: "left",
              type: "text",
              author: "System",
              content: res.mes || "Bạn chưa tham gia room này.",
              time: ""
            }]);
            return;
          }

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
              id: nextId(),
              side,
              author,
              type: type,
              content: content,
              time: typeof time === "string"
                  ? time
                  : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
              id: nextId(),
              side,
              author,
              type: type,
              content: content,
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

  // --- LẮNG NGHE TÍN HIỆU WEBRTC ---
  useEffect(() => {
    if (!client) return;
    const off = client.on("json", async (payload) => {
      const unwrapped = unwrapServerMessage(payload);
      if (unwrapped?.event !== "WEBRTC_SIGNAL") return;

      const signalData = unwrapped.data;
      if (signalData.to !== currentUsername) return; // Chỉ xử lý nếu gọi đúng mình

      const { from, signalType, sdp, candidate } = signalData;
      const pc = peerConnectionRef.current;

      if (signalType === "offer") {
        setCallState("receiving");
        setCallData({ from, to: currentUsername, sdp });
      } else if (signalType === "answer") {
        setCallState("active");
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } else if (signalType === "ice") {
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else if (signalType === "end" || signalType === "reject") {
        endCallLocal();
        if (signalType === "reject") alert(`${from} đã từ chối cuộc gọi.`);
      }
    });
    return () => off();
  }, [client, currentUsername]);

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
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // --- XỬ LÝ STICKER ---
  const handleSendSticker = (url) => {
    // 1. Tạo nội dung gửi đi với tiền tố quy ước
    const contentToSend = `STICKER|${url}`;

    // 2. Gửi lên Server (Quan trọng: Phải có bước này mới lưu được)
    if (client && connected) {
      wsSendChat(client, {
        type: chatType, // 'room' hoặc 'people'
        to: chatTo,
        mes: contentToSend // Gửi chuỗi "STICKER|url..."
      }).catch(err => console.error("Lỗi gửi sticker:", err));
    }

    // 3. Hiển thị ngay lên UI (Optimistic Update) để người dùng thấy mượt mà
    const newMessage = {
      id: nextId(),
      side: "right",
      type: "sticker", // Loại tin nhắn là sticker
      content: url,    // Chỉ lưu URL để hiển thị
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setShowStickerPicker(false); // Đóng bảng chọn sticker
  };

  // --- XỬ LÝ FILE / ẢNH / FOLDER ---
  const handleImageSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
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
            content: imageUrl,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setMessages((prev) => [...prev, newMessage]);

          // 3. Gửi Link qua Chat Server
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

const handleFileSelect = async (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const fileArray = Array.from(files);

  for (const file of fileArray) {
    if (file.size > 5 * 1024 * 1024) { // Giới hạn 5MB
      alert("File quá lớn (>5MB)"); 
      continue;
    }

    // Tạo bộ khung dữ liệu tạm thời để hiển thị lên UI trước (Optimistic UI)
    const fileSizeStr = (file.size / 1024).toFixed(1) + " KB";
    
    // Khởi tạo FormData để truyền file vật lý lên Server
    const formData = new FormData();
    formData.append("file", file); // Tên tham số "file" phải khớp với @RequestParam("file") ở Spring Boot

    try {
      // 1. Gửi file lên API Upload của Spring Boot (Cổng 8082)
      // Bạn có thể dùng chung API upload-voice cũ hoặc tạo một API upload-file riêng ở backend
      const response = await fetch(resolveApiUrl("/api/chat/media/upload-voice"), {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        }
      });

      if (!response.ok) {
        console.error("Lỗi upload file lên server:", response.status);
        alert("Không thể upload file tài liệu.");
        continue;
      }

      const result = await response.json(); // Nhận về JSON chứa { url: "..." }

      if (result.url) {
        // 2. Tạo cấu trúc file Payload gọn nhẹ (Chỉ chứa URL chứ không chứa chuỗi Base64 nặng nề nữa)
        const filePayload = {
          dataType: "file_url", // Đổi tên để phân biệt với base64 cũ nếu cần
          name: file.name,
          size: fileSizeStr,
          type: file.type,
          data: resolveApiUrl(result.url) // Lưu thẳng link tải file từ Backend
        };

        const msgString = JSON.stringify(filePayload);

        // 3. Bắn gói tin JSON siêu nhẹ này qua WebSocket (Chỉ mất vài mili-giây, không lo crash)
        if (client && connected) {
          await wsSendChat(client, { type: chatType, to: chatTo, mes: msgString });
        }

        // 4. Đẩy lên màn hình chat của mình
        setMessages(prev => [...prev, {
          id: Date.now(),
          side: "right",
          type: "file",
          content: filePayload,
          author: currentUsername,
          time: new Date().toLocaleTimeString("vi-VN", {hour: "2-digit", minute:"2-digit"})
        }]);
      }

    } catch (error) {
      console.error("Lỗi trong quá trình xử lý gửi file:", error);
    }
  }

  // Dọn dẹp menu sau khi tất cả các file trong vòng lặp đã xử lý xong
  e.target.value = ""; 
  setShowAttachMenu(false);
};

  // --- XỬ LÝ FOLDER (Upload cả thư mục) ---
  const handleFolderSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newMessage = {
        id: nextId(),
        side: "right",
        type: "folder",
        content: {
          name: "Thư mục tải lên",
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

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Receive messages from server
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

      setMessages((prev) => {
        const isMe = isSameUser(from, currentUsername);

        // Tránh lặp tin nhắn (Deduplication logic)
        if (isMe && prev.length > 0) {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.content === content && lastMsg.type === type) {
                return prev;
            }
        }

        return [
          ...prev,
          {
            id: nextId(),
            side: isMe ? "right" : "left",
            author: from || "Unknown",
            type: type,
            content: content,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ];
      });
    });

    return () => off();
  }, [client, chatType, chatTo, currentUsername]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSend) return;

    const mes = text.trim();

    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        side: "right",
        type: "text",
        content: mes,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setText("");
    setShowEmojiPicker(false);

    try {
      const encodedMes = safeEncode(mes);
      await wsSendChat(client, { type: chatType, to: chatTo, mes: encodedMes });
    } catch {
      // optional: mark as failed
    }
  }

  const handleQuickAction = async () => {
    if (canSend) {
      document.querySelector(".chatWindow__composer")?.requestSubmit();
    } else {
      const likeEmoji = "👍";
      const next = {
        id: nextId(),
        side: "right",
        type: "text",
        content: likeEmoji,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, next]);
      try {
        if (client && connected) {
          const encodedMes = safeEncode(likeEmoji);
          await wsSendChat(client, {
            type: chatType,
            to: chatTo,
            mes: encodedMes
          });
        }
      } catch (e) {
        console.error("Lỗi gửi Like:", e);
      }
    }
  };
// Khởi tạo các biến global ở phạm vi file để quản lý trạng thái ghi âm
let mediaRecorder = null;
let audioChunks = [];
let startTime = 0;

/**
 * 1. Hàm bắt đầu ghi âm bằng Micro
 */
const startVoiceRecording = async () => {
    // CHÈN DÒNG NÀY: Để kiểm tra chuột đã ăn vào nút chưa
    console.log(">>> 1. Đã nhận sự kiện click/bấm giữ chuột!"); 
    
    audioChunks = [];
    startTime = Date.now();
    
    // Kiểm tra xem trình duyệt có hỗ trợ hoặc có bị chặn quyền không
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Trình duyệt của bạn ĐANG CHẶN Micro do không có HTTPS (Secure Context)!");
        return;
    }

    try {
        console.log(">>> 2. Đang xin quyền Micro từ hệ thống...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        console.log(">>> 3. Đã được cấp quyền! Bắt đầu ghi âm...");
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        
         mediaRecorder.onstop = async () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append("file", audioBlob, "voice.webm");
    
    try {
        // 1. Gọi API Upload file lên Backend Spring Boot qua cổng 8082
        const response = await fetch(resolveApiUrl("/api/chat/media/upload-voice"), {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });
        
        if (!response.ok) {
            console.error("Lỗi Upload File:", response.status);
            return;
        }
        
        const result = await response.json();
        
        if (result.url) {
            // =========================================================================
            // BƯỚC 2: CẬP NHẬT NGAY VÀO STATE ĐỂ HIỂN THỊ LÊN UI CỦA MÌNH (REAL-TIME)
            // =========================================================================
            const nextVoice = {
                id: nextId(), // Sử dụng hàm sinh ID giống hệt hàm Like của bạn
                side: "right", // Mình gửi thì hiển thị bên phải
                type: "text",  // Giữ "text" để nhảy vào bộ lọc link file âm thanh của MessageBubble
                content: result.url, // Chuỗi thô: "/uploads/voice/xxx.webm"
                duration: duration,  // Truyền số giây để MessageBubble hiển thị thời lượng
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            
            // Đẩy ngay vào danh sách tin nhắn để vẽ lên màn hình không cần reload
            setMessages((prev) => [...prev, nextVoice]);

            // =========================================================================
            // BƯỚC 3: BẮN QUA WEBSOCKET CHO ĐỐI PHƯƠNG (GIỮ NGUYÊN LINK THÔ KHÔNG MÃ HÓA)
            // =========================================================================
            if (client && connected) { // Sử dụng đúng biến client và connected của bạn
                await wsSendChat(client, {
                    type: chatType,   // Đồng bộ biến chatType (people/room) giống nút Like
                    to: chatTo,       // Đồng bộ biến chatTo giống nút Like
                    mes: result.url,  // Đường dẫn file âm thanh
                    duration: duration // Đính kèm thời lượng cho đối phương nhận được
                });
            }
        }
    } catch (e) {
        console.error("Lỗi gửi tin nhắn thoại:", e);
    }
};
        
        mediaRecorder.start();
    } catch (error) {
        // CHÈN DÒNG NÀY: Để xem lỗi cụ thể là gì
        alert("Lỗi Micro: " + error.message);
        console.error("Lỗi chi tiết:", error);
    }
};

/**
 * 2. Hàm dừng ghi âm khi người dùng thả tay
 */
const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Tắt mic để bảo mật/tiết kiệm pin
        console.log("Đã dừng thu âm.");
    }
};

/**
 * 3. Hàm gửi tin nhắn CHỮ (Vẫn bọc mã hóa chống lỗi font tiếng Việt)
 */
const sendTextMessage = (text) => {
    wsSendChat(client, {
        type: "people",
        to: chatTo,
        mes: safeEncode(text)
    });
};

/**
 * 4. Hàm render hiển thị một tin nhắn đơn lẻ trên UI
 */
const renderSingleMessage = (msg) => {
    // Bước 1: Thử giải mã nội dung tin nhắn bằng hàm safeDecode
    const rawContent = safeDecode(msg.mes);

    // Bước 2: Kiểm tra nếu nội dung là đường dẫn file âm thanh thoại
    if (rawContent.includes("/uploads/voice/")) {
        return (
            <div key={msg.id} className="chat-bubble voice">
                🎤 <span>Tin nhắn thoại ({msg.duration || 0}s)</span>
                <audio controls src={resolveApiUrl(rawContent)} />
            </div>
        );
    }

    // Bước 3: Nếu không phải link voice, hiển thị text bình thường
    return (
        <div key={msg.id} className="chat-bubble text">
            {rawContent}
        </div>
    );
};

  // --- HÀM XỬ LÝ MỜI BẠN BÈ VÀO NHÓM ---
  const handleInviteToRoom = () => {
    setIsInviteModalOpen(true);
    setInviteUsername("");
    setInviteStatus("");
  };

  const handleConfirmInvite = async () => {
    const friendName = inviteUsername.trim();
    if (!friendName) return;

    if (client && connected) {
        const sysMsg = `${currentUsername} đã thêm ${friendName.trim()} vào nhóm.`;
        const encodedMes = safeEncode(sysMsg);

        try {
            await wsSendChat(client, { type: "room", to: chatTo, mes: encodedMes });
            setMessages((prev) => [
              ...prev,
              {
                id: nextId(),
                side: "right",
                type: "text",
                content: sysMsg,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }
            ]);
            setInviteStatus(`Đã thêm ${friendName.trim()} thành công!`);
            setTimeout(() => {
                setIsInviteModalOpen(false);
            }, 1500);
        } catch (e) {
            setInviteStatus("Lỗi khi mời thành viên!");
        }
    }
  };

  // --- CÁC HÀM XỬ LÝ VIDEO CALL WEBRTC ---
  const startCall = async () => {
    try {
      setCallState("calling");
      setCallData({ to: chatTo, from: currentUsername });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(rtcServers);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          client.sendJson({ action: "onchat", data: { event: "WEBRTC_SIGNAL", data: { to: chatTo, signalType: "ice", candidate: event.candidate } } });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      client.sendJson({ action: "onchat", data: { event: "WEBRTC_SIGNAL", data: { to: chatTo, signalType: "offer", sdp: offer } } });
    } catch (e) {
      alert("Không thể truy cập Camera/Micro. " + e.message);
      endCallLocal();
    }
  };

  const acceptCall = async () => {
    try {
      setCallState("active");
      const { from, sdp } = callData;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(rtcServers);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          client.sendJson({ action: "onchat", data: { event: "WEBRTC_SIGNAL", data: { to: from, signalType: "ice", candidate: event.candidate } } });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      client.sendJson({ action: "onchat", data: { event: "WEBRTC_SIGNAL", data: { to: from, signalType: "answer", sdp: answer } } });
    } catch (e) {
      alert("Không thể truy cập Camera/Micro.");
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (callData && callData.from) {
      client.sendJson({ action: "onchat", data: { event: "WEBRTC_SIGNAL", data: { to: callData.from, signalType: "reject" } } });
    }
    endCallLocal();
  };

  const endCall = () => {
    const target = callState === "calling" ? callData?.to : callData?.from;
    if (target) client.sendJson({ action: "onchat", data: { event: "WEBRTC_SIGNAL", data: { to: target, signalType: "end" } } });
    endCallLocal();
  };

  const endCallLocal = () => {
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(track => track.stop()); localStreamRef.current = null; }
    setCallState("idle");
    setCallData(null);
  };

  const MOCK_STICKERS = [
    "https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=46366&size=130",
    "https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=46367&size=130",
    "https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=46368&size=130",
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
          {/* NÚT GỌI VIDEO - CHỈ HIỆN KHI CHAT 1-1 */}
          {chatType === "people" && (
            <div className="header-icon" title="Gọi Video" onClick={startCall}>
              <Video size={22} />
            </div>
          )}

          {chatType === "room" && (
            <div
              className="header-icon"
              title="Thêm thành viên"
              onClick={handleInviteToRoom}
            >
              <UserPlus size={22} />
            </div>
          )}
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
        {messages.map((m, index) => {
          const date = new Date(m.id || Date.now());
          const dateString = date.toLocaleDateString("vi-VN");
          let lastDate;
          lastDate = dateString;
          const showDate = dateString !== lastDate;
          return (
              <React.Fragment key={m.id || index}>
                {showDate && (
                    <div className="date-separator">
                      <span>{dateString}</span>
                    </div>
                )}
                <MessageBubble
                    message={m}
                    onImageClick={handleImageClick}
                />
              </React.Fragment>
          );
        })}
        {/* --- CÁC POPUP CHỨC NĂNG --- */}
        <div className="chat-popups">
          {showEmojiPicker && (
            <div className="popup-container emoji-area">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={350}
                width="100%"
              />
            </div>
          )}

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
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="sticker-placeholder">
                    Sticker {i}
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <button
  type="button" // 1. BẮT BUỘC: Ép trình duyệt hiểu đây CHỈ là một nút bấm thường, KHÔNG dùng để submit form
  className={`toolbar-icon ${showAttachMenu ? "active" : ""}`}
  onClick={(e) => {
    e.preventDefault();  // 2. Chặn hành vi submit mặc định của form
    e.stopPropagation(); // 3. Chặn sự kiện nổi bọt lên các thẻ cha bên ngoài
    toggleAttachMenu();  // 4. Gọi hàm đóng/mở menu của bạn
  }}
  title="Đính kèm file"
  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} // Reset style nút nếu cần
>
  <Paperclip size={20} />
</button>

          <div className="toolbar-icon" title="Gửi Danh thiếp">
            <Contact size={20} />
          </div>
          <div className="toolbar-icon" title="Chụp màn hình">
            <Scan size={20} />
          </div>
          <div className="toolbar-icon" title="Định dạng tin nhắn">
            <Type size={20} />
          </div>
          <div className="toolbar-icon" title="Gửi tin nhắn thoại" onMouseDown={startVoiceRecording} onMouseUp={stopVoiceRecording}>
            <Mic size={20} />
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
              ref={inputRef}
            className="chatWindow__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Nhập @, tin nhắn tới ${title}`}
            onFocus={() => {
              if (!showEmojiPicker) {
                setShowStickerPicker(false);
                setShowAttachMenu(false);
              }
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
        key={selectedGalleryImg?.id ?? selectedGalleryImg?.content ?? "none"}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        currentImage={selectedGalleryImg}
        onSelectImage={setSelectedGalleryImg}
        allMessages={messages}
      />

      {/* Modal Mời Thành Viên */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Thêm thành viên"
      >
        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#333" }}>
              Tên tài khoản
            </label>
            <input
              type="text"
              style={{
                width: "100%", padding: "10px", borderRadius: "6px",
                border: "1px solid #ccc", outline: "none", boxSizing: "border-box", color: "#333"
              }}
              placeholder="Nhập tên tài khoản..."
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmInvite()}
              autoFocus
            />
          </div>

          {inviteStatus && (
            <div style={{ color: inviteStatus.includes("thành công") ? "#19c37d" : "red", marginBottom: "15px", fontSize: "14px" }}>
              {inviteStatus}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button onClick={() => setIsInviteModalOpen(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#f5f5f5", color: "#333", cursor: "pointer" }}>
              Hủy
            </button>
            <button onClick={handleConfirmInvite} disabled={!inviteUsername.trim()} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#0068ff", color: "white", cursor: "pointer", opacity: !inviteUsername.trim() ? 0.7 : 1 }}>
              Thêm
            </button>
          </div>
        </div>
      </Modal>

      {/* --- MÀN HÌNH GỌI VIDEO --- */}
      {callState !== "idle" && (
        <div className="video-call-overlay">
          <div className="videos-wrapper">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          </div>
          <div className="call-controls">
            {callState === "receiving" ? (
              <>
                <div style={{ marginRight: "20px", fontSize: "18px" }}>{callData?.from} đang gọi video...</div>
                <button onClick={acceptCall} style={{ background: "#00c853", padding: "12px 24px", border: "none", borderRadius: "24px", color: "white", cursor: "pointer", display: "flex", gap: "8px", fontWeight: "bold" }}>
                  <Phone size={20} /> Nghe
                </button>
                <button onClick={rejectCall} style={{ background: "#ff3b30", padding: "12px 24px", border: "none", borderRadius: "24px", color: "white", cursor: "pointer", display: "flex", gap: "8px", fontWeight: "bold" }}>
                  <PhoneOff size={20} /> Từ chối
                </button>
              </>
            ) : (
              <>
                {callState === "calling" && <div style={{ marginRight: "20px", fontSize: "18px" }}>Đang gọi {callData?.to}...</div>}
                <button onClick={endCall} style={{ background: "#ff3b30", padding: "12px 24px", border: "none", borderRadius: "24px", color: "white", cursor: "pointer", display: "flex", gap: "8px", fontWeight: "bold" }}>
                  <PhoneOff size={20} /> Kết thúc
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}