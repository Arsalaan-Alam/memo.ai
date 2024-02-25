import React, { useState, useEffect, useRef } from "react";
import * as poseDetection from '@tensorflow-models/pose-detection';
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./options";
import '@tensorflow/tfjs-backend-webgl';
import Link from "next/link";


export default function PostureDetector() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [postureFeedback, setPostureFeedback] = useState("");
  const [timer, setTimer] = useState(0);
  const [pomodoroMode, setPomodoroMode] = useState('work'); // 'work' or 'break'
  const [pomodoroDuration, setPomodoroDuration] = useState(25 * 60); // Default to 25 minutes
  const timerRef = useRef(null);
  const goodPosturePosition = useRef(null);
  const badPostureTimer = useRef(null);
  const poseDetectorRef = useRef(null);
  const BAD_POSTURE_THRESHOLD = 2; // 2 seconds
  const GOOD_POSTURE_THRESHOLD = 50; // 50 pixels
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  let interval;

  useEffect(() => {
    const loadModel = async () => {
      console.log("Loading PoseNet model");
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      poseDetectorRef.current = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig  
      );
    };
    loadModel();
  }, []);
  
  useEffect(() => {
    if (isCapturing && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => {
          if (pomodoroMode === 'work' && prevTimer < pomodoroDuration) {
            return prevTimer + 1;
          } 
          else {
            setPomodoroMode((prevMode) => (prevMode === 'work' ? 'break' : 'work'));
            return 0;
          }
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isCapturing, isTimerRunning, pomodoroMode, pomodoroDuration]);

  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
    setIsTimerRunning(true); // Start the timer when capturing starts
    if (!isCapturing) {
      setTimer(0);
      setPomodoroMode('work');
    }
  };
  

  const beep = (freq = 520, duration = 200*1, vol = 100) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.value = vol * 0.01;
    oscillator.frequency.value = freq;
    oscillator.type = "square";

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration * 0.001);
  };

  const startBadPostureTimer = () => {
    if (!badPostureTimer.current) {
      badPostureTimer.current = Date.now();
    }
  };

  const resetBadPostureTimer = () => {
    badPostureTimer.current = null;
  };

  const checkAndAlertBadPosture = () => {
    if (badPostureTimer.current) {
      const duration = (Date.now() - badPostureTimer.current) / 1000;
      if (duration >= BAD_POSTURE_THRESHOLD) { // If bad posture duration is 3 seconds or more, beep
        beep(); 
        alert("Please maintain posture!")
        resetBadPostureTimer();
      }
    }
  };

  const evaluatePosture = (pose) => {
    if (goodPosturePosition.current === null) {
      console.log("Set the good posture position", pose.keypoints[2].y)
      goodPosturePosition.current = pose.keypoints[2].y;
      setPostureFeedback("Good Posture");
    } else {
      console.log(pose.keypoints[2].y - goodPosturePosition.current);
      if (Math.abs(pose.keypoints[2].y - goodPosturePosition.current) > GOOD_POSTURE_THRESHOLD) {
        setPostureFeedback("Bad Posture");
        checkAndAlertBadPosture(); // Check duration and alert before resetting if posture is good now
        startBadPostureTimer();
      } else {
        setPostureFeedback("Good Posture");
        resetBadPostureTimer();
      }
    }
  };

  const detectWebcamFeed = async (detector) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      video.width = videoWidth;
      video.height = videoHeight;

      const pose = await detector.estimatePoses(video);
      if (!pose || pose.length <= 0 || !pose[0] || !pose[0].keypoints || pose[0].keypoints.length <= 0) return;
      drawResult(pose[0], video, videoWidth, videoHeight, canvasRef);
      evaluatePosture(pose[0]);
    }
  };

  const runPosenet = async () => {
    while (!poseDetectorRef.current) {
      console.error("PoseNet model not loaded");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    interval = setInterval(() => {
      detectWebcamFeed(poseDetectorRef.current);
    }, 100);

  };

  const stopPosenet = () => {
    clearInterval(interval);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    checkAndAlertBadPosture();
    resetBadPostureTimer();
    goodPosturePosition.current = null;
    setPostureFeedback("");
  };

  useEffect(() => {
    if (isCapturing) {
      runPosenet();
    } else {
      stopPosenet();
    }
    return () => stopPosenet();
  }, [isCapturing]);

  const drawResult = (pose, video, videoWidth, videoHeight, canvas) => {
    if (!canvas || !canvas.current) return;
    if (!pose || !pose.keypoints || pose.keypoints.length <= 0) return;
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;
    console.log(pose.keypoints);
    drawKeypoints(pose.keypoints, 0.6, ctx);
    drawSkeleton(pose.keypoints, 0.7, ctx);
  };

  const handleDurationChange = (event) => {
    setPomodoroDuration(Number(event.target.value) * 60);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

 return (
    <div> <nav className="bg-cover" style={{ backgroundImage: "url('/assets/background.jpg')" }} >
    <div className='mx-auto w-70vw py-4 px-6 flex justify-between items-center sticky max-w-7xl'>
    <img src="/assets/mainlogo.png" alt="memo.ai" className="h-10 mt-4" />
    <Link href="/choose">
        <button className="text-white font-medium py-2 px-12 mt-4 rounded text-white-500transition duration-300 ease-in-out focus:outline-none focus:ring focus:border-white" style={{ backgroundColor: "white", color:"#01214F" }}>
            Make Notes
        </button>
    </Link>
    </div>
</nav>

  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-5 bg-cover bg-center" style={{ backgroundImage: "url('/assets/background.jpg')" }}>
    
    <header className="text-center mb-8">
   
      {
        // just show calibarting if the goodPosturePosition is null and isCapturing is true
        goodPosturePosition.current === null && isCapturing ? (
          <div className="text-xl font-semibold text-gray-200">Calibrating...</div>
        ) : null
      }

      {isCapturing ? (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            className="rounded-lg shadow-xl"
            style={{ maxWidth: "100%" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 mx-auto rounded-lg shadow-xl"
            style={{ maxWidth: "100%" }}
          />
        </div>
      ) : null}
      <div className="space-x-4 mt-4">
        <button
          className={`px-4 py-2 text-white rounded ${isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          onClick={toggleCapture}
        >
          {isCapturing ? "Stop" :  "Start"} Session
        </button>

        <select
          className="px-4 py-2 rounded text-gray-800 bg-white dark:bg-gray-700 dark:text-white"
          onChange={handleDurationChange}
          defaultValue={25}
        >
          <option value="25">25 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
        </select>
      </div>
      <div className="mt-4 rounded text-gray-800  dark:text-white">
        {postureFeedback && <div>Posture Status: {postureFeedback}</div>}
        <div className="text-xl font-semibold text-gray-200">
          Time: {formatTime(timer)}
        </div>
        <div className="text-gray-200 text-xl font-semibold">
          Total Duration: {formatTime(pomodoroDuration)}
        </div>
      </div>
    </header>
  </div>
  </div>
);

}