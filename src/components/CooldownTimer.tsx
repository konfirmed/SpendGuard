import React, { useState, useEffect, useCallback } from 'react';

interface CooldownTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

/**
 * Full-screen modal cooldown timer component
 * Provides a thoughtful pause before purchase decisions
 */
const CooldownTimer: React.FC<CooldownTimerProps> = ({ 
  seconds, 
  onComplete, 
  onSkip, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(1, seconds || 30));
  const [canSkip, setCanSkip] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onComplete(), 300); // Allow fade out animation
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onSkip(), 300); // Allow fade out animation
  }, [onSkip]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    // Allow skipping after 5 seconds minimum
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, Math.min(5000, timeLeft * 1000));

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(skipTimer);
      clearInterval(countdown);
    };
  }, [timeLeft, handleComplete]);

  const formatTime = (time: number): string => {
    if (time <= 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const secs = time % 60;
    return minutes > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : secs.toString();
  };

  const progressPercentage = Math.min(100, Math.max(0, ((seconds - timeLeft) / seconds) * 100));

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 font-sans z-50 transition-opacity duration-300 ${className}`}>
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center space-y-6 transform transition-transform duration-300 scale-100">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Take a Moment
          </h2>
          <p className="text-gray-600">
            Before completing this purchase, let's pause and reflect. Is this something you really need right now?
          </p>
        </div>

        {/* Timer Display */}
        <div className="space-y-4">
          <div className="text-6xl font-mono font-bold text-blue-600" aria-live="polite">
            {formatTime(timeLeft)}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Reflection Questions */}
        <div className="text-left space-y-2 bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Consider:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Do I have a specific need for this item?</li>
            <li>• Can I wait 24 hours to decide?</li>
            <li>• Is this within my budget?</li>
            <li>• Have I compared alternatives?</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canSkip && (
            <button
              onClick={handleSkip}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              type="button"
            >
              Proceed Anyway
            </button>
          )}
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => window.history.back(), 300);
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            type="button"
          >
            Take More Time to Decide
          </button>
        </div>

        {/* Small print */}
        <p className="text-xs text-gray-400">
          This pause is brought to you by SpendGuard
        </p>
      </div>
    </div>
  );
};

export default CooldownTimer;