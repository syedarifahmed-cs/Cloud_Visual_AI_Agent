# 🤖 Cloud Visual AI Agent

A real-time Visual AI Agent built using **FastAPI** and **YOLO11n** for live object detection through a web-based camera interface.

The system captures frames from the user's camera, sends them to a FastAPI backend, processes them using the YOLO11n object detection model, and displays detected objects with bounding boxes, confidence scores, FPS, and detection statistics in real time.

---

## 📌 Project Information

| Detail | Information |
|---|---|
| Student Name | Syed Arif Ahmed Zaidi |
| Registration ID | 62536 |
| Course | Cloud Computing |
| Assignment | Assignment 3 |
| Project Type | Visual AI Agent |
| AI Model | YOLO11n |
| Backend | FastAPI |
| Frontend | HTML, CSS, JavaScript |

---

## ✨ Features

- 🎥 Real-time camera-based object detection
- 🤖 YOLO11n AI object detection
- 📦 Multiple object detection
- 👤 Person detection and counting
- 🎯 Confidence score for each detection
- 📊 Real-time detection statistics
- ⚡ FPS monitoring
- 🟢 Live detection status
- 📝 Current detection list
- 📜 Detection history
- 🗑️ Clear detection history
- 💾 Local browser storage for detection history
- 🌐 REST API using FastAPI
- ☁️ Ready for cloud deployment

---

## 🧠 How It Works

```text
User Camera
     ↓
Browser captures video frame
     ↓
JavaScript sends frame to FastAPI
     ↓
FastAPI receives image
     ↓
YOLO11n processes the image
     ↓
Objects + Confidence + Bounding Boxes
     ↓
JSON response
     ↓
Browser displays detection results
