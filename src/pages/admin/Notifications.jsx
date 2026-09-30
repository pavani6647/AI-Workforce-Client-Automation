import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  Info,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import {
  getStore,
  subscribeToStore,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateStore,
} from "../../data/store";

const ADMIN_ROLE = "admin";
const ADMIN_NAME = "Admin";

const typeConfig = {
  task: {
    icon: ClipboardCheck,
    label: "Task",
  },
  deliverable: {
    icon: Check,
    label: "Deliverable",
  },
  system: {
    icon: Info,
    label: "System",
  },
  requirement: {
    icon: MessageSquare,
    label: "Requirement",
  },
  user: {
    icon: UserPlus,
    label: "User",
  },
  ai: {
    icon: Sparkles,
    label: "AI",
  },
  warning: {
    icon: AlertCircle,
    label: "Warning",
  },
};

function formatTime(dateString) {
  if (!dateString) return "Unknown time";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const diff = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getNotificationConfig(type) {
  return typeConfig[type] || typeConfig.system;
}

export default function Notifications() {
  const [store, setStore] = useState(() => getStore());
  const [filter, setFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    return subscribeToStore(setStore);
  }, []);

  const notifications = useMemo(() => {
    return [...(store.notifications || [])]
      .filter(
        (notification) =>
          notification.recipientRole === ADMIN_ROLE &&
          notification.recipient === ADMIN_NAME
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [store.notifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.read);
    }

    if (filter === "read") {
      return notifications.filter((notification) => notification.read);
    }

    return notifications;
  }, [notifications, filter]);

  const markAsRead = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    setSelectedNotification({
      ...notification,
      read: true,
    });
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    markAllNotificationsAsRead(ADMIN_ROLE, ADMIN_NAME);
  };

  const handleDelete = (notificationId) => {
    updateStore((current) => ({
      ...current,
      notifications: (current.notifications || []).filter(
        (notification) => notification.id !== notificationId
      ),
    }));

    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(null);
    }
  };

  const handleClearRead = () => {
    updateStore((current) => ({
      ...current,
      notifications: (current.notifications || []).filter(
        (notification) =>
          !(
            notification.recipientRole === ADMIN_ROLE &&
            notification.recipient === ADMIN_NAME &&
            notification.read
          )
      ),
    }));

    setSelectedNotification(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Bell size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>
                <p className="text-sm text-slate-500">
                  Stay updated with activity across your workforce platform.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={17} />
              Mark all read
            </button>

            <button
              type="button"
              onClick={handleClearRead}
              disabled={
                notifications.filter((notification) => notification.read)
                  .length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={17} />
              Clear read
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Notifications
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-600">Unread</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-600">Read</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {notifications.length - unreadCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: unreadCount },
            {
              key: "read",
              label: "Read",
              count: notifications.length - unreadCount,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                filter === item.key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  filter === item.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredNotifications.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Bell size={28} />
              </div>

              <h2 className="text-lg font-semibold text-slate-800">
                No notifications
              </h2>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {filter === "unread"
                  ? "You are all caught up. There are no unread notifications."
                  : "Notifications generated by activity in the platform will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => {
                const config = getNotificationConfig(notification.type);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={`group flex gap-4 p-4 transition hover:bg-slate-50 sm:p-5 ${
                      !notification.read ? "bg-blue-50/40" : "bg-white"
                    }`}
                  >
                    {/* Icon */}
                    <button
                      type="button"
                      onClick={() => markAsRead(notification)}
                      className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        notification.read
                          ? "bg-slate-100 text-slate-500"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <Icon size={20} />
                    </button>

                    {/* Content */}
                    <button
                      type="button"
                      onClick={() => markAsRead(notification)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <h3
                            className={`truncate text-sm ${
                              notification.read
                                ? "font-medium text-slate-700"
                                : "font-bold text-slate-900"
                            }`}
                          >
                            {notification.title || "Notification"}
                          </h3>

                          {!notification.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <span className="shrink-0 text-xs text-slate-400">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                        {notification.message || "No additional information."}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {config.label}
                        </span>

                        {!notification.read && (
                          <span className="text-xs font-medium text-blue-600">
                            Unread
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex shrink-0 items-start gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                      {!notification.read && (
                        <button
                          type="button"
                          title="Mark as read"
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <Check size={17} />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete notification"
                        onClick={() => handleDelete(notification.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail modal */}
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    {(() => {
                      const Icon = getNotificationConfig(
                        selectedNotification.type
                      ).icon;

                      return <Icon size={20} />;
                    })()}
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Notification Details
                    </h2>
                    <p className="text-xs text-slate-500">
                      {formatTime(selectedNotification.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedNotification.title}
                  </h3>

                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {
                      getNotificationConfig(selectedNotification.type)
                        .label
                    }
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-400">Recipient</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {selectedNotification.recipient || ADMIN_NAME}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="mt-1 font-semibold text-emerald-600">
                      Read
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh hint */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <RefreshCw size={13} />
          Notifications update automatically when platform activity occurs.
        </div>
      </div>
    </div>
  );
}