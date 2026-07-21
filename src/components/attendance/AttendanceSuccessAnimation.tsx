import { useEffect, useState } from 'react';
import { CheckCircle, MapPin, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AttendanceSuccessAnimationProps {
  show: boolean;
  userName: string;
  sessionName: string;
  location?: { latitude: number; longitude: number; accuracy: number };
  onAnimationComplete?: () => void;
}

const AttendanceSuccessAnimation = ({ 
  show, 
  userName, 
  sessionName, 
  location,
  onAnimationComplete 
}: AttendanceSuccessAnimationProps) => {
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    if (!show) {
      setAnimationStage(0);
      return;
    }

    const stages = [
      { delay: 0, stage: 1 },     // Show card
      { delay: 300, stage: 2 },   // Show tick animation
      { delay: 800, stage: 3 },   // Show success message
      { delay: 1200, stage: 4 },  // Show details
      { delay: 2500, stage: 5 },  // Complete animation
    ];

    const timeouts = stages.map(({ delay, stage }) =>
      setTimeout(() => setAnimationStage(stage), delay)
    );

    // Call completion callback after animation
    const completionTimeout = setTimeout(() => {
      onAnimationComplete?.();
    }, 3000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completionTimeout);
    };
  }, [show, onAnimationComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card 
        className={`w-full max-w-md mx-auto transform transition-all duration-500 ${
          animationStage >= 1 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <CardContent className="p-8 text-center space-y-6">
          {/* Animated Check Circle */}
          <div className="relative mx-auto w-20 h-20">
            <div 
              className={`absolute inset-0 rounded-full border-4 transition-all duration-700 ${
                animationStage >= 2 
                  ? 'border-green-500 scale-100 opacity-100' 
                  : 'border-gray-300 scale-75 opacity-50'
              }`}
            />
            <CheckCircle 
              className={`w-20 h-20 transition-all duration-500 delay-200 ${
                animationStage >= 2 
                  ? 'text-green-500 scale-100 opacity-100' 
                  : 'text-gray-400 scale-75 opacity-0'
              }`}
            />
            

            {/* Success ripple effect */}
            {animationStage >= 2 && (
              <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-75" />
            )}
          </div>

          {/* Success Message */}
          <div 
            className={`space-y-2 transition-all duration-500 delay-300 ${
              animationStage >= 3 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
              Attendance Marked!
            </h2>
            <p className="text-muted-foreground">
              Your attendance has been successfully recorded
            </p>
          </div>

          {/* Details */}
          <div 
            className={`space-y-3 transition-all duration-500 delay-500 ${
              animationStage >= 4 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="text-left flex-1">
                <p className="font-medium text-green-800 dark:text-green-200">{userName}</p>
                <p className="text-sm text-green-600 dark:text-green-400">{sessionName}</p>
              </div>
            </div>

            {/* Time Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="text-left flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {new Date().toLocaleTimeString()}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Location Info */}
            {location && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-purple-800 dark:text-purple-200">
                    Location Verified
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    ±{location.accuracy.toFixed(0)}m accuracy
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Loading dots for redirect */}
          {animationStage >= 5 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendanceSuccessAnimation;
