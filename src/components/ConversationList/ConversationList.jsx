import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {Search, UserPlus, Users, X, LayersPlus} from "lucide-react";
import Modal from "../Modal/Modal";
import useWs from "../../context/useWs";
import {
    wsCheckUserExist,
    wsCheckUserOnline,
    wsGetUserList,
    wsCreateRoom,
    wsJoinRoom,
} from "../../api/chatApi";
import "./conversationList.css";

function unwrapServerMessage(message) {
    const event = message?.event ?? message?.data?.event;
    const status = message?.status ?? message?.data?.status;
    const mes = message?.mes ?? message?.data?.mes;
    const data = message?.data?.data ?? message?.data ?? message;
    return {event, status, mes, data};
}

function waitForEvent(client, targetEvent, {timeoutMs = 8000} = {}) {
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

function parseOnlineStatus(unwrapped) {
    // Common shapes:
    // { event:'CHECK_USER_ONLINE', status:'success', data:{status:true} }
    // or { data:{ online:true } }
    const d = unwrapped?.data ?? {};
    const v = d.status ?? d.online ?? d.isOnline;
    return v === true;
}

function normalizeUserListPayload(payload) {
    const data = payload ?? {};

    const roomsRaw = [];

    const usersRaw = [];

    const listRaw = Array.isArray(data) ? data : null;
    const rooms = (Array.isArray(roomsRaw) ? roomsRaw : []).map((r) => {
        const name = typeof r === "string" ? r : r?.name ?? r?.id ?? String(r);
        return {type: "room", id: String(name), name: String(name)};
    });

    let users = (Array.isArray(usersRaw) ? usersRaw : []).map((u) => {
        const name =
            typeof u === "string" ? u : u?.name ?? u?.user ?? u?.id ?? String(u);
        return {type: "people", id: String(name), name: String(name)};
    });

    if (rooms.length === 0 && users.length === 0 && Array.isArray(listRaw)) {
        const hasTypedItems = listRaw.some(
            (x) => typeof x === "object" && x !== null && "type" in x
        );

        if (hasTypedItems) {
            const typedRooms = [];
            const typedUsers = [];

            for (const item of listRaw) {
                const name =
                    typeof item === "string"
                        ? item
                        : item?.name ?? item?.user ?? item?.id ?? String(item);
                const t = typeof item === "object" && item !== null ? item.type : null;

                if (t === 1) {
                    typedRooms.push({
                        type: "room",
                        id: String(name),
                        name: String(name),
                    });
                } else {
                    typedUsers.push({
                        type: "people",
                        id: String(name),
                        name: String(name),
                    });
                }
            }

            return {rooms: typedRooms, users: typedUsers};
        }

        // Otherwise treat it as a plain user list
        users = listRaw.map((u) => {
            const name =
                typeof u === "string" ? u : u?.name ?? u?.user ?? u?.id ?? String(u);
            return {type: "people", id: String(name), name: String(name)};
        });
    }

    return {rooms, users};
}

const ConversationList = ({
                              onSelectConversation,
                              selectedKey,
                              currentUsername,
                          }) => {
    const {client, connected, user, authReady} = useWs();
    const [activeTab, setActiveTab] = useState("priority");
    const [selectedId, setSelectedId] = useState(selectedKey ?? "");
    const [isOpenAddFriend, setIsOpenAddFriend] = useState(false);
    const [isOpenCreateGroup, setIsOpenCreateGroup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchMessage, setSearchMessage] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [isOpenJoinRoom, setIsOpenJoinRoom] = useState(false);
    const [joinRoomName, setJoinRoomName] = useState("");
    const [onlineMap, setOnlineMap] = useState({});
    const onlineTsRef = useRef({});
    const onlineQueueRef = useRef(Promise.resolve());

    const effectiveSelectedId = selectedKey ?? selectedId;

    const checkUserOnlineOnce = useCallback(
        (username) => {
            const run = async () => {
                if (!authReady || !user) return false;

                try {
                    await wsCheckUserOnline(client, username);
                    const res = await waitForEvent(client, "CHECK_USER_ONLINE", {
                        timeoutMs: 6000,
                    });
                    const isOnline = parseOnlineStatus(res);

                    onlineTsRef.current[username] = Date.now();
                    setOnlineMap((prev) => ({
                        ...prev,
                        [username]: isOnline ? "online" : "offline",
                    }));
                    return isOnline;
                } catch {
                    onlineTsRef.current[username] = Date.now();
                    setOnlineMap((prev) => ({...prev, [username]: "offline"}));
                    return false;
                }
            };

            // Serialize checks to avoid response mixups.
            onlineQueueRef.current = onlineQueueRef.current.then(run, run);
            return onlineQueueRef.current;
        },
        [client, authReady, user]

    );

    // ___ Lắng nghe sự kiện Tạo phòng & Join phòng thành công ___
    useEffect(() => {
        if (!authReady || !client || !user) return;
        const off = client.on("json", (message) => {
            const unwrapped = unwrapServerMessage(message);
            if (
                (unwrapped.event !== "CREATE_ROOM" && unwrapped.event !== "JOIN_ROOM") ||
                unwrapped.status !== "success"
            ) {
                return;
            }
            const roomData = unwrapped.data;
            const ownerId = roomData.own || roomData.owner;
            if (unwrapped.event === "CREATE_ROOM") {
                if (String(ownerId) !== String(user.name)) return;
            }
            const newRoom = {
                type: "room",
                id: String(roomData.id || roomData.name),
                name: String(roomData.name),
            };
            setRooms((prev) => {
                if (prev.some((r) => r.id === newRoom.id)) return prev;
                return [newRoom, ...prev];
            });
            handleCloseModal();
        });
        return () => off();
    }, [client, authReady, user]);
    // ___ Két thúc useEffect Lắng nghe sự kiện tạo phòng và join phòng ___

    // gọi hàm getUser list
    useEffect(() => {
        if (!authReady || !client || !user) return;

        setListLoading(true);

        const off = client.on("json", (response) => {
            const unwrapped = unwrapServerMessage(response);
            if (unwrapped.event !== "GET_USER_LIST") return;

            setListLoading(false);
            if (unwrapped?.status && unwrapped.status !== "success") {
                setRooms([]);
                setUsers([]);
                return;
            }
            const normalized = normalizeUserListPayload(unwrapped.data);

            setRooms(normalized.rooms);
            setUsers(normalized.users);
        });

        wsGetUserList(client).catch(() => {
            setListLoading(false);
        });

        return () => off();
    }, [client, authReady, user]);

    const filteredUsers = useMemo(() => {
        const me = (currentUsername ?? "").trim();
        return me
            ? users.filter((u) => String(u?.id).toLowerCase() !== me.toLowerCase())
            : users;
    }, [users, currentUsername]);

    const conversationItems = useMemo(() => {
        return {
            rooms,
            users: filteredUsers,
        };
    }, [rooms, filteredUsers]);

    // Refresh online status for displayed users (type=people)
    useEffect(() => {
        if (!authReady || !user || !client) return;
        const names = (filteredUsers ?? []).map((u) => String(u.id));
        const now = Date.now();
        const me = (currentUsername ?? "").trim();

        for (const name of names) {
            if (me && name.toLowerCase() === me.toLowerCase()) continue;

            const last = onlineTsRef.current[name] ?? 0;
            if (now - last > 15000) {
                checkUserOnlineOnce(name);
            }
        }
    }, [authReady, filteredUsers, currentUsername, checkUserOnlineOnce]);

// --- HÀM TẠO PHÒNG ---
    const handleCreateRoom = async () => {
        if (!groupName.trim()) return;

        // Nếu đang Re-login hoặc mất mạng thì KHÔNG làm gì cả (vì UI đã hiện Loading che rồi)
        if (!authReady || !user || !client) {
            console.log("Đang chờ kết nối...");
            return;
        }

        try {
            await wsCreateRoom(client, groupName);
            setGroupName("");
            setIsOpenCreateGroup(false);
        } catch (error) {
            console.error("Lỗi tạo phòng:", error);
            // Chỉ alert khi lỗi thật sự từ server trả về
            alert("Lỗi server: " + error.message);
        }
    };

    // --- HÀM THAM GIA PHÒNG ---
    const handleJoinRoom = async () => {
        if (!joinRoomName.trim()) return;

        if (!authReady || !user || !client) {
            console.log("Đang chờ kết nối...");
            return;
        }

        try {
            await wsJoinRoom(client, joinRoomName);
            setJoinRoomName("");
            setIsOpenJoinRoom(false);
        } catch (error) {
            console.error("Lỗi tham gia phòng:", error);
        }
    };


    // Hàm giả lập tìm kiếm User
    const handleSearchUser = async () => {
        const keyword = searchTerm.trim();
        if (!keyword) return;

        const me = (currentUsername ?? "").trim();
        if (me && keyword.toLowerCase() === me.toLowerCase()) {
            setSearchResults([]);
            setSearchMessage("Bạn không thể tìm chính mình");
            return;
        }

        if (!connected) {
            setSearchMessage("Đang kết nối... vui lòng thử lại");
            return;
        }

        setIsLoading(true);
        setSearchMessage("");
        setSearchResults([]);

        try {
            await wsCheckUserExist(client, keyword);
            const res = await waitForEvent(client, "CHECK_USER_EXIST", {
                timeoutMs: 8000,
            });

            const exists = res?.data?.status === true;
            if (!exists) {
                setSearchResults([]);
                setSearchMessage("Không tìm thấy người dùng");
                return;
            }

            const isOnline = await checkUserOnlineOnce(keyword);

            setSearchResults([
                {
                    id: keyword,
                    name: keyword,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        keyword
                    )}`,
                    online: isOnline,
                },
            ]);
        } catch {
            setSearchMessage("Không thể tìm kiếm. Vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm reset lại khi đóng
    const handleCloseModal = () => {
        setIsOpenAddFriend(false);
        setIsOpenCreateGroup(false);
        setIsOpenJoinRoom(false);
        setSearchTerm("");
        setSearchResults([]);
        setSearchMessage("");
        setGroupName("");
        setJoinRoomName("");
        setSelectedUsers([]);
    };

    // Hàm chon thành viên
    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    // UI loading
    if (!authReady) {
        return (
            <div className="conv-list" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <div>Đang khôi phục đăng nhập...</div>
            </div>
        );
    }
    if (!user) return null; // hoặc redirect login


    return (
        <div className="conv-list">
            {/* Header */}
            <div className="conv-header">
                <div className="conv-search-box">
                    <Search size={16} color="#7589a3"/>
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        className="conv-search-input"
                    />
                </div>
                {/* Nút join room */}
                <div
                    className="conv-icon-btn"
                    onClick={() => setIsOpenJoinRoom(true)}
                    title="Tham gia phòng"
                >
                    <LayersPlus size={20}/>
                </div>
                {/* Bắt sự kiện click mở Modal */}
                <div
                    className="conv-icon-btn"
                    onClick={() => setIsOpenAddFriend(true)}
                    title="Thêm bạn"
                >
                    <UserPlus size={20}/>
                </div>
                <div
                    className="conv-icon-btn"
                    onClick={() => setIsOpenCreateGroup(true)}
                    title="Tạo nhóm"
                >
                    <Users size={20}/>
                </div>
            </div>

            {/* Tabs */}
            <div className="conv-tabs">
                <div
                    className={`conv-tab ${activeTab === "priority" ? "active" : ""}`}
                    onClick={() => setActiveTab("priority")}
                >
                    Ưu tiên
                </div>
                <div
                    className={`conv-tab ${activeTab === "other" ? "active" : ""}`}
                    onClick={() => setActiveTab("other")}
                >
                    Khác
                </div>
            </div>

            {/* Danh sách tin nhắn */}
            <div className="conv-items-scroll">
                {listLoading && (
                    <div className="empty-state">Đang tải danh sách...</div>
                )}

                {!listLoading && conversationItems.rooms.length > 0 && (
                    <div className="conv-section">
                        {conversationItems.rooms.map((item) => {
                            const key = `room:${item.id}`;
                            return (
                                <div
                                    key={key}
                                    className={`conv-item ${
                                        effectiveSelectedId === key ? "active" : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedId(key);
                                        onSelectConversation?.({
                                            type: "room",
                                            to: item.id,
                                            name: item.name,
                                            key,
                                        });
                                    }}
                                >
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            item.name
                                        )}`}
                                        alt="avt"
                                        className="conv-avatar"
                                    />
                                    <div className="conv-content">
                                        <div className="conv-row-top">
                                            <span className="conv-name">{item.name}</span>
                                            <span className="conv-time"></span>
                                        </div>
                                        <div className="conv-message">Room</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!listLoading && conversationItems.users.length > 0 && (
                    <div className="conv-section">
                        {conversationItems.users.map((item) => {
                            const key = `people:${item.id}`;
                            const st = onlineMap?.[String(item.id)];
                            const label =
                                st === "online"
                                    ? "Online"
                                    : st === "offline"
                                        ? "Offline"
                                        : "...";
                            return (
                                <div
                                    key={key}
                                    className={`conv-item ${
                                        effectiveSelectedId === key ? "active" : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedId(key);
                                        onSelectConversation?.({
                                            type: "people",
                                            to: item.id,
                                            name: item.name,
                                            key,
                                        });
                                    }}
                                >
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            item.name
                                        )}`}
                                        alt="avt"
                                        className="conv-avatar"
                                    />
                                    <div className="conv-content">
                                        <div className="conv-row-top">
                                            <span className="conv-name">{item.name}</span>
                                            <span className="conv-time"></span>
                                        </div>
                                        <div className="conv-message">{label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!listLoading &&
                    conversationItems.rooms.length === 0 &&
                    conversationItems.users.length === 0 && (
                        <div className="empty-state">
                            {connected ? "Chưa có phòng/người dùng" : "Đang kết nối..."}
                        </div>
                    )}
            </div>

            {/* Thêm bạn bè */}
            <Modal
                isOpen={isOpenAddFriend}
                onClose={handleCloseModal}
                title="Thêm bạn mới"
            >
                <div className="modal-body-custom">
                    <div className="search-row">
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Số điện thoại hoặc tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="btn-primary" onClick={handleSearchUser}>
                            Tìm
                        </button>
                    </div>

                    <div className="result-list">
                        {isLoading ? (
                            <div className="loading-text">Đang tìm kiếm...</div>
                        ) : (
                            searchResults.map((user) => (
                                <div key={user.id} className="user-row">
                                    <img src={user.avatar} className="avatar-small" alt=""/>
                                    <div className="user-info">
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-phone">
                                            {user.online === true
                                                ? "Online"
                                                : user.online === false
                                                    ? "Offline"
                                                    : "..."}
                                        </div>
                                    </div>

                                    <button
                                        className="btn-outline"
                                        onClick={() => {
                                            const key = `people:${user.name}`;
                                            onSelectConversation?.({
                                                type: "people",
                                                to: user.name,
                                                name: user.name,
                                                key,
                                            });
                                            setSelectedId(key);
                                            setIsOpenAddFriend(false);
                                        }}
                                    >
                                        Nhắn tin
                                    </button>
                                </div>
                            ))
                        )}
                        {/* Gợi ý khi chưa tìm */}
                        {!isLoading && searchResults.length === 0 && (
                            <div className="empty-state">
                                {searchMessage || "Nhập từ khóa để tìm bạn bè"}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/*Tạo nhóm*/}
            <Modal
                isOpen={isOpenCreateGroup}
                onClose={handleCloseModal}
                title="Tạo nhóm chat"
            >
                <div className="modal-body-custom">
                    <div className="input-group">
                        <label>Tên nhóm</label>
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Thêm thành viên</label>
                        <div className="search-row">
                            <input
                                type="text"
                                className="modal-input"
                                placeholder="Tìm tên người dùng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn-primary" onClick={handleSearchUser}>
                                Tìm
                            </button>
                        </div>
                    </div>

                    <div className="result-list checkable-list">
                        {searchResults.map((user) => (
                            <div
                                key={user.id}
                                className="user-row"
                                onClick={() => toggleUserSelection(user.id)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => {
                                    }}
                                    style={{marginRight: 10}}
                                />
                                <img src={user.avatar} className="avatar-small" alt=""/>
                                <div className="user-info">
                                    <div className="user-name">{user.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn-primary full-width"
                            disabled={!groupName}
                            onClick={handleCreateRoom}
                        >
                            Tạo nhóm ({selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""})
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Tham gia phòng */}
            <Modal
                isOpen={isOpenJoinRoom}
                onClose={handleCloseModal}
                title="Tham gia phòng chat"
            >
                <div className="modal-body-custom">
                    <div className="input-group">
                        <label>Tên phòng muốn vào</label>
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Nhập tên phòng..."
                            value={joinRoomName}
                            onChange={(e) => setJoinRoomName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                        />
                    </div>
                    <div className="modal-footer">
                        <button
                            className="btn-primary full-width"
                            disabled={!joinRoomName}
                            onClick={handleJoinRoom}
                        >
                            Tham gia ngay
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ConversationList;
