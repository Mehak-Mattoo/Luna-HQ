"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { formatUIFriendlyDate } from "@/components/helpers/constants";
import { sharedWithMeNotePath } from "@/components/helpers/routes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
  type AppNotification,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

function notificationLabel(notification: AppNotification) {
  if (notification.message) return notification.message;

  switch (notification.type) {
    case "note_shared":
      return "Shared a note with you";
    default:
      return "New notification";
  }
}

export function NotificationSystem() {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  function handleNotificationClick(notification: AppNotification) {
    if (!notification.read_at) {
      markRead.mutate(notification.id);
    }

    if (notification.note_id != null) {
      router.push(sharedWithMeNotePath(notification.note_id));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {isLoading ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            Loading…
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            No notifications yet
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-0.5 py-2",
                !notification.read_at && "bg-accent/40",
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <span
                className={cn(
                  "text-sm leading-snug",
                  !notification.read_at && "font-medium",
                )}
              >
                {notificationLabel(notification)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatUIFriendlyDate(notification.created_at)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
