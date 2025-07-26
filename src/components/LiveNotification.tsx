import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Activity, CheckCircle, Bell } from "lucide-react";

interface Notification {
  id: string;
  type: 'new_patient' | 'critical_alert' | 'treatment_complete' | 'wait_time_alert';
  title: string;
  message: string;
  timestamp: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export const LiveNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Simulate real-time notifications for demo
    const demoNotifications = [
      {
        id: '1',
        type: 'critical_alert' as const,
        title: 'CRITICAL PATIENT',
        message: 'Maria Rodriguez - Chest pain with cardiac symptoms',
        timestamp: new Date(),
        urgency: 'critical' as const
      },
      {
        id: '2', 
        type: 'new_patient' as const,
        title: 'New Check-in',
        message: 'Lucas Anderson - Food poisoning symptoms',
        timestamp: new Date(Date.now() + 15000),
        urgency: 'low' as const
      },
      {
        id: '3',
        type: 'treatment_complete' as const,
        title: 'Treatment Complete',
        message: 'Grace Johnson - Ready for discharge',
        timestamp: new Date(Date.now() + 30000),
        urgency: 'medium' as const
      },
      {
        id: '4',
        type: 'wait_time_alert' as const,
        title: 'Long Wait Alert',
        message: 'Ahmed Hassan waiting 45+ minutes',
        timestamp: new Date(Date.now() + 45000),
        urgency: 'high' as const
      }
    ];

    let timeoutIds: NodeJS.Timeout[] = [];

    demoNotifications.forEach((notification, index) => {
      const delay = index * 15000; // 15 seconds apart
      const timeoutId = setTimeout(() => {
        setCurrentNotification(notification);
        setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setCurrentNotification(null);
        }, 5000);
      }, delay);
      
      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical_alert': return AlertTriangle;
      case 'new_patient': return Clock;
      case 'treatment_complete': return CheckCircle;
      case 'wait_time_alert': return Bell;
      default: return Bell;
    }
  };

  const getUrgencyColor = (urgency: Notification['urgency']) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
          >
            <Card className={`border-l-4 shadow-lg ${getUrgencyColor(currentNotification.urgency)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {(() => {
                      const Icon = getNotificationIcon(currentNotification.type);
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{currentNotification.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {currentNotification.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90">{currentNotification.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {currentNotification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};