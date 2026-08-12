const { io } = require('socket.io-client');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to server!');
});

socket.on('statusChange', (data) => {
  console.log('Received status change:', data);
});