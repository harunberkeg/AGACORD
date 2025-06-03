const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// PUBLIC klasörünü tarayıcıya aç
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfa isteği geldiğinde index.html göster
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io olayları
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı');

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı');
  });

  // Diğer socket olaylarını buraya yazabilirsin
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
