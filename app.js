// Connect to WebSocket Server
const socket = io("http://localhost:5000");

// State Management
let currentMode = "Internet Mode";
let localStream = null;

// Tab Navigation Logic
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Internet vs SIM Mode Switcher
function toggleMode() {
    const isChecked = document.getElementById('modeSwitch').checked;
    currentMode = isChecked ? "SIM Mode" : "Internet Mode";
    document.getElementById('modeLabel').innerHTML = isChecked 
        ? `<i class="fa-solid fa-sim-card"></i> SIM Mode` 
        : `<i class="fa-solid fa-wifi"></i> Internet Mode`;

    socket.emit('mode-change', { mode: currentMode });
    alert(`Switched to ${currentMode}`);
}

// File Handle UI
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('fileName').innerText = file.name;
        document.getElementById('fileSize').innerText = (file.size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        document.getElementById('fileDetails').classList.remove('hidden');
    }
}

// Super-Fast AWS Multipart Upload Simulator
async function startUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) return alert("براہ کرم پہلے فائل سلیکٹ کریں!");

    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    progressContainer.classList.remove('hidden');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = progress + "%";
        progressText.innerText = `Uploading chunks: ${progress}% completed...`;

        if (progress >= 100) {
            clearInterval(interval);
            progressText.innerText = "✅ 10+ Hours Video Uploaded Successfully!";
        }
    }, 300);
}

// Messaging API Calls
async function sendSMS() {
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;
    if (!phone || !message) return alert("فون نمبر اور میسج لکھیں!");

    try {
        const res = await fetch("http://localhost:5000/api/sim/send-sms", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toPhoneNumber: phone, messageText: message })
        });
        const data = await res.json();
        alert(data.success ? "SMS کامیابی سے بھیج دیا گیا!" : "Error: " + data.error);
    } catch (err) {
        alert("سرور کے ساتھ کنیکشن کا مسئلہ ہے!");
    }
}

async function sendWhatsApp() {
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;
    if (!phone || !message) return alert("فون نمبر اور میسج لکھیں!");

    try {
        const res = await fetch("http://localhost:5000/api/whatsapp/send-message", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toPhoneNumber: phone, messageText: message })
        });
        const data = await res.json();
        alert(data.success ? "واٹس ایپ میسج بھیج دیا گیا!" : "Error: " + data.error);
    } catch (err) {
        alert("سرور کے ساتھ کنیکشن کا مسئلہ ہے!");
    }
}

// WebRTC Video Calling Logic
async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
        alert("کیمرا اور مائیک آن ہو چکا ہے!");
    } catch (err) {
        alert("کیمرا یا مائیک تک رسائی نہیں مل سکی!");
    }
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        document.getElementById('localVideo').srcObject = null;
        alert("کال ختم کر دی گئی ہے۔");
    }
}
