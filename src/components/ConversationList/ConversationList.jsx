import React, { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Users, X } from "lucide-react";
import Modal from "../Modal/Modal";
import useWs from "../../context/useWs";
import { wsGetUserList } from "../../api/chatApi";
import "./conversationList.css";

const MOCK_SEARCH_RESULTS = [
  {
    id: 101,
    name: "Nguyễn Văn A",
    phone: "0987654321",
    avatar: "https://ui-avatars.com/api/?name=A",
  },
  {
    id: 102,
    name: "Trần Thị B",
    phone: "0912345678",
    avatar: "https://ui-avatars.com/api/?name=B",
  },
  {
    id: 103,
    name: "Lê C",
    phone: "0999888777",
    avatar: "https://ui-avatars.com/api/?name=C",
  },
];

function unwrapServerMessage(message) {
  const event = message?.event ?? message?.data?.event;
  const status = message?.status ?? message?.data?.status;
  const mes = message?.mes ?? message?.data?.mes;
  const data = message?.data?.data ?? message?.data ?? message;
  return { event, status, mes, data };
}

function normalizeUserListPayload(payload) {
  const data = payload ?? {};

  const roomsRaw = [];

  const usersRaw = [];

  const listRaw = Array.isArray(data) ? data : null;
  console.log("Raw list data from server:", listRaw);
  const rooms = (Array.isArray(roomsRaw) ? roomsRaw : []).map((r) => {
    const name = typeof r === "string" ? r : r?.name ?? r?.id ?? String(r);
    return { type: "room", id: String(name), name: String(name) };
  });

  let users = (Array.isArray(usersRaw) ? usersRaw : []).map((u) => {
    const name =
      typeof u === "string" ? u : u?.name ?? u?.user ?? u?.id ?? String(u);
    return { type: "people", id: String(name), name: String(name) };
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

      return { rooms: typedRooms, users: typedUsers };
    }

    // Otherwise treat it as a plain user list
    users = listRaw.map((u) => {
      const name =
        typeof u === "string" ? u : u?.name ?? u?.user ?? u?.id ?? String(u);
      return { type: "people", id: String(name), name: String(name) };
    });
  }

  return { rooms, users };
}

const ConversationList = ({ onSelectConversation, selectedKey }) => {
  const { client, connected } = useWs();

  const [activeTab, setActiveTab] = useState("priority");
  const [selectedId, setSelectedId] = useState(selectedKey ?? "");
  const [isOpenAddFriend, setIsOpenAddFriend] = useState(false);
  const [isOpenCreateGroup, setIsOpenCreateGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const effectiveSelectedId = selectedKey ?? selectedId;

  useEffect(() => {
    if (!connected) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      console.log("Raw user list response:", unwrapped);
      const normalized = normalizeUserListPayload(unwrapped.data);

      setRooms(normalized.rooms);
      setUsers(normalized.users);
    });

    wsGetUserList(client).catch(() => {
      setListLoading(false);
    });

    return () => off();
  }, [client, connected]);

  const conversationItems = useMemo(() => {
    return {
      rooms,
      users,
    };
  }, [rooms, users]);

  // Hàm giả lập tìm kiếm User
  const handleSearchUser = () => {
    if (!searchTerm) return;
    setIsLoading(true);
    setTimeout(() => {
      setSearchResults(MOCK_SEARCH_RESULTS);
      setIsLoading(false);
    }, 500);
  };

  // Hàm reset lại khi đóng
  const handleCloseModal = () => {
    setIsOpenAddFriend(false);
    setIsOpenCreateGroup(false);
    setSearchTerm("");
    setSearchResults([]);
    setGroupName("");
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

  return (
    <div className="conv-list">
      {/* Header */}
      <div className="conv-header">
        <div className="conv-search-box">
          <Search size={16} color="#7589a3" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="conv-search-input"
          />
        </div>
        {/* Bắt sự kiện click mở Modal */}
        <div
          className="conv-icon-btn"
          onClick={() => setIsOpenAddFriend(true)}
          title="Thêm bạn"
        >
          <UserPlus size={20} />
        </div>
        <div
          className="conv-icon-btn"
          onClick={() => setIsOpenCreateGroup(true)}
          title="Tạo nhóm"
        >
          <Users size={20} />
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
                    <div className="conv-message">User</div>
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
                  <img src={user.avatar} className="avatar-small" alt="" />
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-phone">{user.phone}</div>
                  </div>
                  <button className="btn-outline">Kết bạn</button>
                </div>
              ))
            )}
            {/* Gợi ý khi chưa tìm */}
            {!isLoading && searchResults.length === 0 && (
              <div className="empty-state">Nhập từ khóa để tìm bạn bè</div>
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
                  onChange={() => {}}
                  style={{ marginRight: 10 }}
                />
                <img src={user.avatar} className="avatar-small" alt="" />
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button
              className="btn-primary full-width"
              disabled={!groupName || selectedUsers.length < 2}
            >
              Tạo nhóm ({selectedUsers.length})
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConversationList;
