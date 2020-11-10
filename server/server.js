const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// for socket
const socket = require('socket.io');
const socketUpload = require('./upload.js')

const app = express();

app.use(cors({
  origin: '*'
}));

// for parsing application/xwww-
app.use(bodyParser.urlencoded({
  extended: true
}));

const server = app.listen(5000, () => {
  console.log('Started in 5000');
});

const io = socket(server);

io.sockets.on('connection', (socket) => {
    console.log(`new connection id: ${socket.id}`);
    socketUpload(socket);
});