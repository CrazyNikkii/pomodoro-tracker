import React, { useState, useEffect } from "react";

type TimerMode = "IDLE" | "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";

const FOCUS_MINUTES = 0.05;
const SHORT_BREAK_MINUTES = 0.05;
const LONG_BREAK_MINUTES = 0.1;

const Timer: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>("IDLE");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const sessionEndedRef = React.useRef(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const getModeSeconds = (mode: TimerMode) => {
    switch (mode) {
      case "FOCUS":
        return FOCUS_MINUTES * 60;
      case "SHORT_BREAK":
        return SHORT_BREAK_MINUTES * 60;
      case "LONG_BREAK":
        return LONG_BREAK_MINUTES * 60;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    sessionEndedRef.current = false;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1 && !sessionEndedRef.current) {
          sessionEndedRef.current = true;
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          handleSessionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);
  const handleSessionEnd = () => {
    if (mode === "FOCUS" && sessionStartTime) {
      const endedAt = new Date();
      const durationMinutes =
        (endedAt.getTime() - sessionStartTime.getTime()) / 60000;

      const payload = {
        startedAt: sessionStartTime.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMinutes: Math.max(1, Math.round(durationMinutes)),
      };

      console.log("Sending session to backend:", payload); // debug log

      fetch("http://localhost:5000/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) {
            console.error("Backend rejected the session:", res.status);
          }
          return res.json();
        })
        .catch((err) => console.error("Failed to save session:", err));

      const newCount = completedFocusSessions + 1;
      setCompletedFocusSessions(newCount);

      const nextMode = newCount % 4 === 0 ? "LONG_BREAK" : "SHORT_BREAK";
      setMode(nextMode);
      setSecondsLeft(getModeSeconds(nextMode));
      setIsRunning(false);
      setSessionStartTime(null);
    } else {
      setMode("FOCUS");
      setSecondsLeft(getModeSeconds("FOCUS"));
      setIsRunning(false);
    }
  };

  const startTimer = (newMode?: TimerMode) => {
    const m = newMode || mode || "FOCUS";
    setMode(m);
    setSecondsLeft(getModeSeconds(m));
    setIsRunning(true);

    if (m === "FOCUS") {
      setSessionStartTime(new Date());
    }
  };

  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(getModeSeconds("FOCUS"));
    setMode("IDLE");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Pomodoro Timer</h2>
      <h3>Mode: {mode}</h3>
      <h1>{formatTime(secondsLeft)}</h1>
      <button onClick={() => startTimer()}>Start</button>
      <button onClick={pauseTimer}>Pause</button>
      <button onClick={resetTimer}>Reset</button>
      <p>Completed focus sessions: {completedFocusSessions}</p>
    </div>
  );
};

export default Timer;
