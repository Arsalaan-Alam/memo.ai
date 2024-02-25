import React, { useState, useEffect, useRef } from "react";
import * as poseDetection from '@tensorflow-models/pose-detection';
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./options";
import '@tensorflow/tfjs-backend-webgl';

export default function PostureDetector() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [postureFeedback, setPostureFeedback] = useState("");
  const [studySessionTime, setStudySessionTime] = useState(0);
  const studyTimerRef = useRef(null);
  const goodPosturePosition = useRef(null);
  const badPostureTimer = useRef(null);
    // Ref to store the preloaded model
  const poseDetectorRef = useRef(null);

    // Preload the PoseNet model
  useEffect(() => {
    const loadModel = async () => {
      console.log("Loading PoseNet model")
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
  

  let interval; // To hold the interval ID
  const BAD_POSTURE_THRESHOLD = 2; // 3 seconds

  useEffect(() => {
    let interval;
    if (isCapturing) {
      studyTimerRef.current = Date.now(); // Start the study session timer
      interval = setInterval(() => {
        setStudySessionTime((prevTime) => prevTime + 1);
      }, 1000); // Update every second
    } else if (!isCapturing && studyTimerRef.current) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isCapturing]);

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
  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
    if (!isCapturing) {
      setStudySessionTime(0); 
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
      if (Math.abs(pose.keypoints[2].y - goodPosturePosition.current) > 50) {
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

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-5">
      <header className="text-center mb-8">
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
            className={`px-4 py-2 text-white rounded ${isCapturing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={toggleCapture}
          >
            {isCapturing ? "Pause" : "Start"} Session
          </button>
        </div>
        <div className="mt-4">
          {
            postureFeedback && (
              <div>Posture Status: {postureFeedback}</div>
            )
          }
          <div className="text-lg font-semibold">
            Session Time: {new Date(studySessionTime * 1000).toISOString().substr(11, 8)}
          </div>
        </div>
      </header>
    </div>
  );
}