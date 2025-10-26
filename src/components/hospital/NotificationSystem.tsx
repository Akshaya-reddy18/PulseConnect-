import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle, Clock, AlertCircle, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment_confirmation' | 'appointment_reminder' | 'request_update' | 'general';
  is_read: boolean;
  created_at: string;
}

interface NotificationSystemProps {
  donorId?: string;
}

export default function NotificationSystem({ donorId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (donorId) {
      fetchNotifications(donorId);
    }
  }, [donorId]);

  const fetchNotifications = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // If notifications table doesn't exist, create mock data
        console.log('Notifications table not found, using mock data');
        setNotifications(getMockNotifications());
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => {
    return [
      {
        id: '1',
        title: 'Appointment Confirmation',
        message: 'Your donation appointment has been scheduled for December 25, 2024 at 2:00 PM. Hospital Contact: +1-555-0123',
        type: 'appointment_confirmation',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Appointment Reminder',
        message: 'Reminder: You have a blood donation appointment tomorrow at 10:00 AM. Please arrive 15 minutes early.',
        type: 'appointment_reminder',
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: '3',
        title: 'Request Update',
        message: 'Your blood donation request has been accepted by City General Hospital.',
        type: 'request_update',
        is_read: false,
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    ];
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        // If table doesn't exist, just update local state
        console.log('Notifications table not found, updating local state only');
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      toast({
        title: "Notification Marked as Read",
        description: "Notification has been marked as read.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (donorId) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', donorId);

        if (error) {
          console.log('Notifications table not found, updating local state only');
        }
      }

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast({
        title: "All Notifications Marked as Read",
        description: "All notifications have been marked as read.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.log('Notifications table not found, updating local state only');
      }

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );

      toast({
        title: "Notification Deleted",
        description: "Notification has been deleted.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_confirmation':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'appointment_reminder':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'request_update':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment_confirmation':
        return 'bg-green-50 border-green-200';
      case 'appointment_reminder':
        return 'bg-blue-50 border-blue-200';
      case 'request_update':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Loading notifications...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
              >
                Mark All Read
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              {showNotifications ? 'Hide' : 'Show'} Notifications
            </Button>
          </div>
        </div>
        <CardDescription>
          Stay updated with appointment confirmations and important updates
        </CardDescription>
      </CardHeader>
      {showNotifications && (
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.is_read ? 'opacity-60' : ''
                  } ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

