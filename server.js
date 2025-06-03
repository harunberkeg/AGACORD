const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
const cors = require('cors');
const path = require('path');

// CORS Ayarı
app.use(cors());

// Statik dosyaları sun (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Anasayfayı gönder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io olayları
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı');

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor.`);
});