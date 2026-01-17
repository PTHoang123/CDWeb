// Hàm mã hóa (Hỗ trợ tiếng Việt và Emoji)
function safeEncode(str) {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        return str;
    }
}

// Hàm giải mã (Có try-catch để nếu tin nhắn cũ không mã hóa thì vẫn hiện bình thường)
function safeDecode(str) {
    try {
        return decodeURIComponent(escape(window.atob(str)));
    } catch (e) {
        // Nếu giải mã lỗi (do là tin nhắn cũ dạng text thường), trả về nguyên gốc
        return str;
    }
}