import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3004';
const socket = io(SOCKET_URL, {
    transports: ['websocket'], // Add this line
});


function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [serverOnline, setServerOnline] = useState(null); // null = checking, false = down, true = up

    useEffect(() => {
        // Perform health check
        fetch(`${SOCKET_URL}/health`)
            .then((res) => {
                if (!res.ok) throw new Error('Health check failed');
                return res.json();
            })
            .then((data) => {
                if (data.status === 'ok') {
                    setServerOnline(true);
                } else {
                    setServerOnline(false);
                }
            })
            .catch((err) => {
                console.error('Health check failed:', err.message);
                setServerOnline(false);
            });
    }, []);

    useEffect(() => {
        if (!serverOnline) return;

        socket.on('connect', () => {
            console.log(`Connected to ${SOCKET_URL}`);
            setMessages((prev) => [...prev, { from: 'system', text: `Connected to ${SOCKET_URL}` }]);
        });

        socket.on('message', (msg) => {
            console.log(`message ${msg}`);
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('disconnect', () => {
            setMessages((prev) => [...prev, { from: 'system', text: 'Disconnected' }]);
        });

        return () => {
            socket.off('connect');
            socket.off('message');
            socket.off('disconnect');
        };
    }, [serverOnline]);

    const sendMessage = () => {
        if (input.trim() !== '') {
            console.log(input);
            socket.emit('message', input);
            setInput('');
        }
    };

    if (serverOnline === null) {
        return <div style={{ padding: 20 }}>Checking server status...</div>;
    }

    if (!serverOnline) {
        return (
            <div style={{ padding: 20, color: 'red' }}>
                Server is currently unavailable. Please try again later.
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h1>Socket.IO React Chat</h1>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message"
                style={{ padding: '8px', width: '300px' }}
            />
            <button onClick={sendMessage} style={{ marginLeft: '10px' }}>
                Send
            </button>
            <div style={{ marginTop: 20 }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ margin: '5px 0', color: msg.from === 'you' ? 'green' : msg.from === 'other' ? 'blue' : 'gray' }}>
                        <strong>{msg.from}:</strong> {msg.text}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
