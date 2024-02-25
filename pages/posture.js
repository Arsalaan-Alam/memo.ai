import React, { useState, useEffect, useRef } from "react";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./options";

export default function PostureDetector() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [postureFeedback, setPostureFeedback] = useState("");
  const [badPostureDuration, setBadPostureDuration] = useState(0);
  const goodPosturePosition = useRef(null);
  const badPostureTimer = useRef(null);

  let interval; // To hold the interval ID

  const startBadPostureTimer = () => {
    if (!badPostureTimer.current) {
      badPostureTimer.current = Date.now();
    }
  };

  const resetBadPostureTimer = () => {
    if (badPostureTimer.current) {
      const duration = (Date.now() - badPostureTimer.current) / 1000; // Convert to seconds
      setBadPostureDuration((prev) => prev + duration);
      badPostureTimer.current = null; // Reset the timer
    }
  };

  const evaluatePosture = (pose) => {
    if (goodPosturePosition.current === null) {
      goodPosturePosition.current = pose.keypoints[2].position.y;
      setPostureFeedback("Good Posture");
    } else {
      if (Math.abs(pose.keypoints[2].position.y - goodPosturePosition.current) > 150) {
        setPostureFeedback("Bad Posture");
        startBadPostureTimer();
      } else {
        setPostureFeedback("Good Posture");
        resetBadPostureTimer();
      }
    }
  };

  const detectWebcamFeed = async (posenet_model) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      video.width = videoWidth;
      video.height = videoHeight;

      const pose = await posenet_model.estimateSinglePose(video);
      drawResult(pose, video, videoWidth, videoHeight, canvasRef);

      evaluatePosture(pose); // Evaluate the user's posture
    }
  };

  const runPosenet = async () => {
    const posenet_model = await posenet.load(
      {
      inputResolution: { width: 640, height: 480 },
      scale: 0.8
    }
    );

    interval = setInterval(() => {
      detectWebcamFeed(posenet_model);
    }, 100);
  };

  const stopPosenet = () => {
    clearInterval(interval);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    resetBadPostureTimer(); // Reset bad posture timer when capturing is stopped
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
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;
    drawKeypoints(pose.keypoints, 0.6, ctx);
    drawSkeleton(pose.keypoints, 0.7, ctx);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <header className="text-center mb-8">
        {isCapturing ? (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              className="rounded-lg"
              style={{ maxWidth: "100%" }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 mx-auto rounded-lg"
              style={{ maxWidth: "100%" }}
            />
          </div>
        ) : null}
        <div className="space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setIsCapturing(true)}
          >
            Start Capturing
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => setIsCapturing(false)}
          >
            Stop Capturing
          </button>
        </div>
        <div className="mt-4">
          <div>Posture Status: {postureFeedback}</div>
          {badPostureDuration > 0 && (
            <div>Bad Posture Duration: {badPostureDuration.toFixed(2)} seconds</div>
          )}
        </div>
      </header>
    </div>
  );
}