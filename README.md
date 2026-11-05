# 💍 Wedding Video Booth Web Application

An elegant, high-performance wedding video guestbook web application designed for wedding kiosks and interactive guest setups.

---

## ✨ Features

- **🎹 'H' Key Recording Trigger**: Pressing `H` immediately dismisses screensavers, triggers the customizable countdown (e.g. 3s, 5s), and records video & audio. Pressing `H` again wraps up and saves the recording.
- **🖼️ Real-Time PNG Overlay Baking**: Any custom PNG overlay is composited in real time over the live camera feed and **burned directly into the exported video file**.
- **🎨 Admin Panel Customizations**:
  - **Custom Overlay PNG**: Upload your own transparent PNG overlay (1920×1080) or choose from 4 built-in luxury wedding templates (*Gold Floral*, *Vintage Polaroid*, *Champagne Minimalist*, *Botanical Arch*).
  - **Screensaver Video**: Upload any custom looping video (MP4/WebM) or use the built-in romantic ambient bokeh particle animation.
  - **Camera & Mic Selector**: Enumerate and select specific connected webcams, capture cards, USB microphones, and wireless lavaliers with a **live audio VU meter**.
  - **Configurable Countdown**: Adjust the countdown duration (0s, 3s, 5s, 10s) before recording begins.
  - **Recording Duration Limit**: Configurable max recording time (10s, 15s, 30s, 60s, or manual stop).
  - **Video Counter & Gallery**: Live video counter (`#001`, `#002`, etc.), in-browser preview player, individual or batch downloads, and counter reset/adjust.
  - **Auto-Download & Local Persistence**: Records saved directly to local browser IndexedDB storage and optionally auto-downloaded to your computer.
  - **Audio Cues**: Pleasant Web Audio API countdown ticks and celebratory chimes.
  - **Optional Admin PIN**: Protect settings from wedding guests with a passcode.

---

## 🚀 How to Run

### Option 1: Double-Click
Double-click `run-booth.bat` in this folder. It will start the server and open `http://localhost:5173` in your default browser.

### Option 2: Terminal
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome or Microsoft Edge.

---

## ⌨️ Controls & Shortcuts

| Key / Action | Function |
|---|---|
| **`H`** | Start recording countdown (or finish recording early) |
| **`Escape`** | Open / Close the Admin Panel |
| **Top-Right Gear Icon** | Open Admin Panel directly from the screen |
| **Tap Screen / Click Button** | Touch-friendly triggers for touchscreens and tablets |

---

## 🛠️ Admin Panel Overview

Press `Escape` or click the gear icon in the top right to open the Admin Panel:

1. **Camera & Microphone**: Choose specific video & audio devices connected to the PC. Test microphone levels with the live VU meter.
2. **Overlay PNG**: Upload custom transparent wedding PNGs or customize the couple's names and date to auto-generate frames.
3. **Screensaver Video**: Upload an MP4/WebM video of the couple, or enable the ambient animated screensaver. Adjust idle timeout in seconds.
4. **Countdown & Recording**: Set countdown seconds before recording starts, set max duration, and enable auto-downloads.
5. **Recorded Videos**: View all recorded guest wishes, replay them in-app, download `.webm` / `.mp4` files, and manage the video counter.
