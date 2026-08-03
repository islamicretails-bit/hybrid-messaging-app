require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { S3Client, CreateMultipartUploadCommand } = require('@aws-sdk/client-s3');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Serve Static Frontend Files (index.html, style.css, app.js)
app.use(express.static(__dirname));

// ----------------------------------------------------
// 1. AWS S3 v3 Configuration (For 10+ Hour Large Files)
// ----------------------------------------------------
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || 'test_key',
        secretAccessKey: process.env.AWS_SECRET_KEY || 'test_secret',
    }
});

// Multipart Upload for massive video files
app.post('/api/upload/start-multipart', async (req, res) => {
    const { fileName, fileType } = req.body;
    const command = new CreateMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'test-bucket',
        Key: `videos/${Date.now()}_${fileName}`,
        ContentType: fileType,
    });
    try {
        const multipart = await s3Client.send(command);
        res.json({ uploadId: multipart.UploadId, key: multipart.Key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// 2. Twilio Setup (GSM Calls, SMS, & WhatsApp)
// ----------------------------------------------------
const twilioClient = twilio(
    process.env.TWILIO_SID || 'AC_dummy', 
    process.env.TWILIO_AUTH_TOKEN || 'dummy_token'
);

// Send SMS to normal phone number
app.post('/api/sim/send-sms', async (req, res) => {
    const { toPhoneNumber, messageText } = req.body;
    try {
        const sms = await twilioClient.messages.create({
            body: messageText,
            from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
            to: toPhoneNumber
        });
        res.json({ success: true, sid: sms.sid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send WhatsApp Message
app.post('/api/whatsapp/send-message', async (req, res) => {
    const { toPhoneNumber, messageText } = req.body;
    try {
        const message = await twilioClient.messages.create({
            body: messageText,
            from: 'whatsapp:' + (process.env.TWILIO_PHONE_NUMBER || '+1234567890'),
            to: `whatsapp:${toPhoneNumber}`
        });
        res.json({ success: true, sid: message.sid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// 3. WebSockets for Real-Time Chat & Video Calls
// ----------------------------------------------------
io.on('connection', (socket) => {
    console.log('⚡ Client Connected:', socket.id);

    socket.on('mode-change', (data) => {
        console.log(`User ${socket.id} switched to ${data.mode}`);
    });

    socket.on('call-user', (data) => {
        io.to(data.userToCall).emit('call-made', { signal: data.signalData, from: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Hybrid Server running on http://localhost:${PORT}`));
