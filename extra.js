const socket = io('http://localhost:3000');
let peers = new Map();
let stream = null;
let username = null;
let roomId = null;

let users = [];
socket.on('update-users', (userList) => {
    users = userList;
    const userListElement = document.getElementById('users');
    userListElement.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userListElement.appendChild(li);
    });
});

username = prompt("Lütfen bir kullanıcı adı girin:") || `Kull-${Math.floor(Math.random() * 1000)}`;
roomId = prompt("Hangi odaya katılmak istersiniz? (örneğin: oda1):") || 'oda1';
socket.emit('join-room', roomId, username);

function startCall() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(s => {
            stream = s;
            document.getElementById('status').textContent = 'Durum: Aramaya hazır...';
            document.getElementById('start-call').disabled = true;
            document.getElementById('end-call').disabled = false;

            users.forEach(user => {
                if (user !== username) {
                    createPeer(user, true);
                }
            });

            socket.on('user-joined', (user) => {
                if (user !== username) {
                    createPeer(user, true);
                }
            });

            socket.on('user-left', (user) => {
                if (peers.has(user)) {
                    peers.get(user).close();
                    peers.delete(user);
                }
            });
        })
        .catch(error => {
            console.error("Mikrofon hatası:", error);
            document.getElementById('status').textContent = 'Durum: Mikrofona erişilemedi!';
            alert("Mikrofon erişimi reddedildi. Tarayıcı ayarlarını kontrol et.");
        });
}

function createPeer(userId, initiator) {
    const peer = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });
    peers.set(userId, peer);

    if (stream) {
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }

    peer.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play().catch(e => console.error("Ses oynatma hatası:", e));
    };

    peer.onnegotiationneeded = async () => {
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit('signal', { signal: peer.localDescription, roomId, to: userId });
            console.log("Sinyal gönderildi:", userId);
        } catch (e) {
            console.error("Sinyal oluşturma hatası:", e);
        }
    };

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { signal: event.candidate, roomId, to: userId });
        }
    };

    socket.on('signal', (data) => {
        if (data.to === username) {
            const peer = peers.get(data.from);
            if (peer) {
                if (data.signal.type === 'offer') {
                    peer.setRemoteDescription(new RTCSessionDescription(data.signal)).then(() => {
                        peer.createAnswer().then(answer => {
                            peer.setLocalDescription(answer);
                            socket.emit('signal', { signal: answer, roomId, to: data.from });
                            console.log("Cevap sinyali gönderildi:", data.from);
                        });
                    }).catch(e => console.error("Offer işleme hatası:", e));
                } else if (data.signal.type === 'answer') {
                    peer.setRemoteDescription(new RTCSessionDescription(data.signal))
                        .catch(e => console.error("Answer işleme hatası:", e));
                } else if (data.signal.candidate) {
                    peer.addIceCandidate(new RTCIceCandidate(data.signal))
                        .catch(e => console.error("ICE candidate işleme hatası:", e));
                }
            }
        }
    });
}

function endCall() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        peers.forEach((peer, user) => peer.close());
        peers.clear();
        document.getElementById('status').textContent = 'Durum: Arama sona erdi.';
        document.getElementById('start-call').disabled = false;
        document.getElementById('end-call').disabled = true;
    }
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (message) {
        socket.emit('chat-message', { roomId, username, message });
        input.value = '';
    }
}

socket.on('chat-message', (data) => {
    if (data.roomId === roomId) {
        const messages = document.getElementById('messages');
        const li = document.createElement('li');
        li.textContent = `${data.username}: ${data.message}`;
        messages.appendChild(li);
        messages.scrollTop = messages.scrollHeight;
    }
});

document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});