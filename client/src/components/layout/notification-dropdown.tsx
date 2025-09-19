import { useState, useEffect } from 'react';
import { Bell, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading, error: notificationsError } = useQuery<Notification[]>({
    queryKey: ['/api/protected/notifications'],
    enabled: open, // Only fetch when dropdown is open
  });

  // Fetch unread count
  const { data: countData, isLoading: countLoading } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/protected/notifications/count'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = countData?.unreadCount || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest('PUT', `/api/protected/notifications/${notificationId}/read`),
    onSuccess: () => {
      // Invalidate both notifications and count queries
      queryClient.invalidateQueries({ queryKey: ['/api/protected/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/notifications/count'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest('PUT', '/api/protected/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protected/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/notifications/count'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rfq_submitted':
      case 'rfq_approved':
      case 'rfq_status_change':
        return '📋';
      case 'quote_received':
      case 'quote_accepted':
      case 'quote_rejected':
        return '💰';
      case 'supplier_invitation':
      case 'supplier_verified':
        return '🏢';
      case 'order_created':
      case 'order_status_change':
        return '📦';
      case 'production_update':
        return '⚙️';
      case 'inspection_completed':
        return '✅';
      case 'payout_processed':
        return '💳';
      default:
        return '📨';
    }
  };

  const formatNotificationType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={`relative ${className || ''}`}
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4 mr-2" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end" 
        data-testid="notifications-dropdown"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs"
              data-testid="button-mark-all-read"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notificationsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : notificationsError ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <X className="h-8 w-8 mx-auto mb-2 text-destructive" />
              Failed to load notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2" />
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification: Notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    notification.isRead ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-950/20'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-sm truncate">
                            {notification.title}
                          </h5>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {formatNotificationType(notification.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full"
                onClick={() => setOpen(false)}
                data-testid="button-close-notifications"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}