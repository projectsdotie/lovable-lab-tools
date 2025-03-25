
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlarmClock, Pause, Play, RotateCcw, Clock } from "lucide-react";

export function TimeTools() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="stopwatch">Stopwatch</TabsTrigger>
          <TabsTrigger value="alarm">Alarm</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timer" className="mt-4">
          <Timer />
        </TabsContent>
        
        <TabsContent value="stopwatch" className="mt-4">
          <Stopwatch />
        </TabsContent>
        
        <TabsContent value="alarm" className="mt-4">
          <Alarm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Timer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(minutes * 60 + seconds);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeLeft(minutes * 60 + seconds);
  }, [minutes, seconds]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current as number);
            setIsActive(false);
            // Play sound or notification here
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(minutes * 60 + seconds);
  };

  return (
    <Card className="glass">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between space-x-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  disabled={isActive}
                  className="text-center"
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="seconds">Seconds</Label>
                <Input
                  id="seconds"
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                  disabled={isActive}
                  className="text-center"
                />
              </div>
            </div>

            <div className="text-5xl font-light tracking-tight">
              {formatTime()}
            </div>
          </div>

          <div className="flex justify-center space-x-2">
            {!isActive ? (
              <Button onClick={handleStart} size="sm" className="gap-1">
                <Play className="h-4 w-4" /> Start
              </Button>
            ) : (
              <Button onClick={handlePause} size="sm" variant="secondary" className="gap-1">
                <Pause className="h-4 w-4" /> Pause
              </Button>
            )}
            <Button onClick={handleReset} size="sm" variant="outline" className="gap-1">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const formatTime = () => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
  };

  return (
    <Card className="glass">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="text-6xl font-light tracking-tighter">
            {formatTime()}
          </div>

          <div className="flex justify-center space-x-2">
            {!isActive ? (
              <Button onClick={handleStart} size="sm" className="gap-1">
                <Play className="h-4 w-4" /> Start
              </Button>
            ) : (
              <Button onClick={handlePause} size="sm" variant="secondary" className="gap-1">
                <Pause className="h-4 w-4" /> Pause
              </Button>
            )}
            <Button onClick={handleReset} size="sm" variant="outline" className="gap-1">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Alarm() {
  const [alarmTime, setAlarmTime] = useState("");
  const [isSet, setIsSet] = useState(false);
  const [status, setStatus] = useState("");
  const intervalRef = useRef<number | null>(null);

  const setAlarm = () => {
    if (!alarmTime) {
      setStatus("Please set a time");
      return;
    }
    
    setIsSet(true);
    setStatus(`Alarm set for ${alarmTime}`);
    
    // Check every second if the alarm time has been reached
    intervalRef.current = window.setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      if (currentTime === alarmTime) {
        setStatus("Time's up!");
        // Play sound or notification here
        clearInterval(intervalRef.current as number);
        setIsSet(false);
      }
    }, 1000);
  };

  const cancelAlarm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsSet(false);
    setStatus("Alarm canceled");
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Card className="glass">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alarmTime">Set Alarm Time</Label>
              <Input
                id="alarmTime"
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                disabled={isSet}
                className="text-center"
              />
            </div>

            {status && (
              <div className={cn(
                "text-sm font-medium",
                status.includes("up") ? "text-green-500" : ""
              )}>
                {status}
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-2">
            {!isSet ? (
              <Button onClick={setAlarm} size="sm" className="gap-1">
                <AlarmClock className="h-4 w-4" /> Set Alarm
              </Button>
            ) : (
              <Button onClick={cancelAlarm} size="sm" variant="destructive" className="gap-1">
                <AlarmClock className="h-4 w-4" /> Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
