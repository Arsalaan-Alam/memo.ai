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
    // Implement the logic to evaluate if the posture is good or bad
    // Example: Check if the nose keypoint y position deviates significantly from the goodPosturePosition
    console.log("initial value", goodPosturePosition.current )
    if (goodPosturePosition.current === null) {
        // if (pose) {goodPosturePosition.current = pose.keypoints[2].position.y;}
        goodPosturePosition.current = pose.keypoints[2].position.y;
        console.log("new value", goodPosturePosition.current)
      setPostureFeedback("Good Posture");
    } else {
    //   const currentNosePosition = pose.keypoints.find(k => k.part === "nose")?.position.y;
    console.log(goodPosturePosition.current,'-->', pose.keypoints[2].position.y )
        console.log(`Our difference: ${Math.abs(pose.keypoints[2].position.y - goodPosturePosition.current)}`)
      if (Math.abs(pose.keypoints[2].position.y - goodPosturePosition.current) > 150) { // Threshold for bad posture
        setPostureFeedback("Bad Posture");
        startBadPostureTimer();
      } else {
        setPostureFeedback("Good Posture");
        resetBadPostureTimer();
      }
    }
  };

  const detectWebcamFeed = async (posenet_model) => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4
    ) {
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
    const posenet_model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75,
    });

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
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;
    drawKeypoints(pose.keypoints, 0.6, ctx);
    drawSkeleton(pose.keypoints, 0.7, ctx);
  };

  return (
    <div className="App">
      <header className="App-header">
        {isCapturing ? (
          <div className="">
            <Webcam ref={webcamRef} style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 9,
              width: 640,
              height: 480,
            }} />
            <canvas ref={canvasRef} style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 9,
              width: 640,
              height: 480,
            }} />
          </div>
        ) : <></>}
        <button onClick={() => setIsCapturing(true)}>Start Capturing</button>
        <button onClick={() => setIsCapturing(false)}>Stop Capturing</button>
        <div className="">
        <div>Posture Status: {postureFeedback}</div>
        {badPostureDuration > 0 && <div>Bad Posture Duration: {badPostureDuration.toFixed(2)} seconds</div>}
        </div>

      </header>
    </div>
  );
}
