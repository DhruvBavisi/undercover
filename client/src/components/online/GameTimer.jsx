import React, { useState, useEffect, useRef } from 'react';

const GameTimer = ({ duration = 60, isActive = false, onTimeUp, isPaused = false, onTick }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const intervalRef = useRef(null);
    const onTimeUpRef = useRef(onTimeUp);

    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    // Reset timer when duration or isActive changes
    useEffect(() => {
        if (isActive) {
            setTimeLeft(duration);
        }
    }, [duration, isActive]);

    // Countdown
    useEffect(() => {
        clearInterval(intervalRef.current);

        if (isActive && !isPaused && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    const next = prev - 1;
                    if (next <= 0) {
                        clearInterval(intervalRef.current);
                        onTimeUpRef.current?.();
                        return 0;
                    }
                    return next;
                });
            }, 1000);
        }

        return () => clearInterval(intervalRef.current);
    }, [isActive, isPaused]);

    // Stop interval when timeLeft reaches 0
    useEffect(() => {
        if (timeLeft <= 0) {
            clearInterval(intervalRef.current);
        }
    }, [timeLeft]);

    // Report changes
    useEffect(() => {
        onTick?.(timeLeft);
    }, [timeLeft, onTick]);

    const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0;
    const circumference = 2 * Math.PI * 22;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage > 50) return '#22c55e';
        if (percentage > 25) return '#eab308';
        return '#ef4444';
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`;
        return `${secs}`;
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="56" height="56" className="transform -rotate-90">
                <circle
                    cx="28" cy="28" r="22"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                    fill="none"
                />
                <circle
                    cx="28" cy="28" r="22"
                    stroke={getColor()}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>
            <span className={`absolute text-sm font-bold ${percentage <= 25 ? 'text-red-400 animate-pulse' : 'text-white'
                }`}>
                {formatTime(timeLeft)}
            </span>
        </div>
    );
};

export default GameTimer;
