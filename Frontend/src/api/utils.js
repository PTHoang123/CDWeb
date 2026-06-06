// Hàm mã hóa (Hỗ trợ tiếng Việt và Emoji)
export function safeEncode(str) {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch {
        return str;
    }
}

// Hàm giải mã (Có try-catch để nếu tin nhắn cũ không mã hóa thì vẫn hiện bình thường)
export function safeDecode(str) {
    try {
        return decodeURIComponent(escape(window.atob(str)));
    } catch {
        // Nếu giải mã lỗi (do là tin nhắn cũ dạng text thường), trả về nguyên gốc
        return str;
    }
}