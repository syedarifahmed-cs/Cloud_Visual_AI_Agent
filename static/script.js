const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const statusText = document.getElementById("status");
const cameraMessage = document.getElementById("camera-message");

const objectCount = document.getElementById("objectCount");
const personCount = document.getElementById("personCount");
const classCount = document.getElementById("classCount");
const avgConfidence = document.getElementById("avgConfidence");

const fpsText = document.getElementById("fps");

const detectionList = document.getElementById("detectionList");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

let stream = null;
let detecting = false;
let processing = false;

// FPS tracking
let lastDetectionTime = null;
let currentFPS = 0;

// Detection history
let detectionHistory = [];


// =========================
// LOAD HISTORY
// =========================

const savedHistory = localStorage.getItem("detectionHistory");

if (savedHistory) {
    try {
        detectionHistory = JSON.parse(savedHistory);
        renderHistory();
    } catch (error) {
        detectionHistory = [];
    }
}


// =========================
// START CAMERA
// =========================

startBtn.addEventListener("click", async () => {

    try {

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480
            },
            audio: false
        });

        video.srcObject = stream;

        video.style.display = "block";
        cameraMessage.style.display = "none";

        statusText.textContent = "● ONLINE";
        statusText.style.color = "#4ade80";

        startBtn.disabled = true;
        stopBtn.disabled = false;

        detecting = true;
        lastDetectionTime = null;

        detectLoop();

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "Camera access denied or unavailable.\n\n" +
            "Please allow camera permission in your browser."
        );
    }
});


// =========================
// STOP CAMERA
// =========================

stopBtn.addEventListener("click", () => {

    detecting = false;

    if (stream) {

        stream.getTracks().forEach(track => {
            track.stop();
        });

        stream = null;
    }

    video.srcObject = null;

    video.style.display = "none";
    cameraMessage.style.display = "flex";

    statusText.textContent = "● OFFLINE";
    statusText.style.color = "#ff6b6b";

    startBtn.disabled = false;
    stopBtn.disabled = true;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    objectCount.textContent = "0";
    personCount.textContent = "0";
    classCount.textContent = "0";
    avgConfidence.textContent = "0%";
    fpsText.textContent = "0";

    currentFPS = 0;
    lastDetectionTime = null;

    detectionList.innerHTML =
        '<p class="empty">No objects detected yet.</p>';
});


// =========================
// DETECTION LOOP
// =========================

async function detectLoop() {

    if (!detecting) {
        return;
    }

    if (
        video.readyState >= 2 &&
        !processing
    ) {

        processing = true;

        try {

            await sendFrame();

        } catch (error) {

            console.error(
                "Detection error:",
                error
            );

        }

        processing = false;
    }

    setTimeout(
        detectLoop,
        300
    );
}


// =========================
// SEND FRAME TO FASTAPI
// =========================

async function sendFrame() {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current camera frame
    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Convert frame to JPEG
    const blob = await new Promise(resolve => {

        canvas.toBlob(
            resolve,
            "image/jpeg",
            0.75
        );

    });

    const formData = new FormData();

    formData.append(
        "file",
        blob,
        "camera.jpg"
    );

    // Send to FastAPI
    const response = await fetch(
        "/detect",
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {

        throw new Error(
            `Server error: ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.success) {
        return;
    }


    // =========================
    // FPS CALCULATION
    // =========================

    const now = performance.now();

    if (lastDetectionTime !== null) {

        const difference =
            (now - lastDetectionTime) / 1000;

        if (difference > 0) {

            currentFPS =
                1 / difference;

            fpsText.textContent =
                currentFPS.toFixed(1);
        }
    }

    lastDetectionTime = now;


    // =========================
    // STATISTICS
    // =========================

    objectCount.textContent =
        data.object_count;

    personCount.textContent =
        data.person_count;


    // Unique object classes
    const uniqueClasses =
        new Set(
            data.detections.map(
                detection => detection.name
            )
        );

    classCount.textContent =
        uniqueClasses.size;


    // Average confidence
    if (data.detections.length > 0) {

        const totalConfidence =
            data.detections.reduce(
                (sum, detection) =>
                    sum + detection.confidence,
                0
            );

        const average =
            totalConfidence /
            data.detections.length;

        avgConfidence.textContent =
            average.toFixed(1) + "%";

    } else {

        avgConfidence.textContent =
            "0%";
    }


    // Draw boxes
    drawDetections(
        data.detections
    );

    // Update current detection list
    updateDetectionList(
        data.detections
    );


    // Save detection history
    addToHistory(
        data.detections
    );
}


// =========================
// DRAW YOLO BOXES
// =========================

function drawDetections(detections) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    detections.forEach(detection => {

        const box =
            detection.box;

        const x =
            box.x1;

        const y =
            box.y1;

        const width =
            box.x2 - box.x1;

        const height =
            box.y2 - box.y1;


        // Bounding box
        ctx.strokeStyle =
            "#4ade80";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            x,
            y,
            width,
            height
        );


        // Label
        const label =
            `${detection.name} ${detection.confidence}%`;

        ctx.font =
            "bold 16px Arial";

        const textWidth =
            ctx.measureText(label).width;

        const labelHeight = 25;


        ctx.fillStyle =
            "#4ade80";

        ctx.fillRect(
            x,
            Math.max(
                0,
                y - labelHeight
            ),
            textWidth + 12,
            labelHeight
        );


        ctx.fillStyle =
            "#06110a";

        ctx.fillText(
            label,
            x + 6,
            Math.max(
                18,
                y - 7
            )
        );

    });
}


// =========================
// CURRENT DETECTION LIST
// =========================

function updateDetectionList(
    detections
) {

    if (detections.length === 0) {

        detectionList.innerHTML =
            '<p class="empty">No objects detected.</p>';

        return;
    }

    detectionList.innerHTML = "";

    detections.forEach(detection => {

        const item =
            document.createElement("div");

        item.className =
            "detection-item";

        item.innerHTML = `
            <span class="detection-name">
                ${detection.name}
            </span>

            <span class="detection-confidence">
                ${detection.confidence}%
            </span>
        `;

        detectionList.appendChild(
            item
        );
    });
}


// =========================
// ADD HISTORY
// =========================

function addToHistory(
    detections
) {

    if (detections.length === 0) {
        return;
    }

    const time =
        new Date().toLocaleTimeString();

    detections.forEach(detection => {

        detectionHistory.unshift({

            name:
                detection.name,

            confidence:
                detection.confidence,

            time:
                time

        });

    });


    // Keep last 50 records
    detectionHistory =
        detectionHistory.slice(
            0,
            50
        );


    // Save in browser
    localStorage.setItem(
        "detectionHistory",
        JSON.stringify(
            detectionHistory
        )
    );


    renderHistory();
}


// =========================
// RENDER HISTORY
// =========================

function renderHistory() {

    if (
        detectionHistory.length === 0
    ) {

        historyList.innerHTML =
            '<p class="empty">No detection history.</p>';

        return;
    }

    historyList.innerHTML = "";

    detectionHistory.forEach(
        record => {

            const item =
                document.createElement("div");

            item.className =
                "history-item";

            item.innerHTML = `

                <span class="history-object">
                    ${record.name}
                </span>

                <span class="history-confidence">
                    ${record.confidence}%
                </span>

                <span class="history-time">
                    ${record.time}
                </span>

            `;

            historyList.appendChild(
                item
            );

        }
    );
}


// =========================
// CLEAR HISTORY
// =========================

clearHistoryBtn.addEventListener(
    "click",
    () => {

        detectionHistory = [];

        localStorage.removeItem(
            "detectionHistory"
        );

        renderHistory();

    }
);