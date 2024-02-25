import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

const color = "aqua";
const boundingBoxColor = "red";
const lineWidth = 2;

export const tryResNetButtonName = "tryResNetButton";
export const tryResNetButtonText = "[New] Try ResNet50";
const tryResNetButtonTextCss = "width:100%;text-decoration:underline;";
const tryResNetButtonBackgroundCss = "background:#e61d5f;";

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMobile() {
  return isAndroid() || isiOS();
}

function setDatGuiPropertyCss(propertyText, liCssString, spanCssString = "") {
  var spans = document.getElementsByClassName("property-name");
  for (var i = 0; i < spans.length; i++) {
    var text = spans[i].textContent || spans[i].innerText;
    if (text == propertyText) {
      spans[i].parentNode.parentNode.style = liCssString;
      if (spanCssString !== "") {
        spans[i].style = spanCssString;
      }
    }
  }
}

export function updateTryResNetButtonDatGuiCss() {
  setDatGuiPropertyCss(
    tryResNetButtonText,
    tryResNetButtonBackgroundCss,
    tryResNetButtonTextCss
  );
}

/**
 * Toggles between the loading UI and the main canvas UI.
 */
export function toggleLoadingUI(
  showLoadingUI,
  loadingDivId = "loading",
  mainDivId = "main"
) {
  if (showLoadingUI) {
    document.getElementById(loadingDivId).style.display = "block";
    document.getElementById(mainDivId).style.display = "none";
  } else {
    document.getElementById(loadingDivId).style.display = "none";
    document.getElementById(mainDivId).style.display = "block";
  }
}

function toTuple({ y, x }) {
  return [y, x];
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
/**
 * Draw the skeleton of a body on the video.
 * @param keypoints A list of keypoints.
 */
export function drawSkeleton(keypoints: any, poseId: any, ctx: any) {
  // Each poseId is mapped to a color in the color palette.
  const color = 'White';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;

  poseDetection.util
    .getAdjacentPairs(poseDetection.SupportedModels.MoveNet)
    .forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      const scoreThreshold = 0.3 || 0;

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
}
/**
 * Draw pose keypoints onto a canvas
 */
export function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    // const { y, x } = keypoint;
    const y = keypoint.y;
    const x = keypoint.x;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

/**
 * Converts an arary of pixel data into an ImageData object
 */
export async function renderToCanvas(a, ctx) {
  const [height, width] = a.shape;
  const imageData = new ImageData(width, height);

  const data = await a.data();

  for (let i = 0; i < height * width; ++i) {
    const j = i * 4;
    const k = i * 3;

    imageData.data[j + 0] = data[k + 0];
    imageData.data[j + 1] = data[k + 1];
    imageData.data[j + 2] = data[k + 2];
    imageData.data[j + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw an image on a canvas
 */
export function renderImageToCanvas(image, size, canvas) {
  canvas.width = size[0];
  canvas.height = size[1];
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
}

