const express = require('express');
const expressApp = express();
const httpServer = require('http').createServer(expressApp);
const io = require('socket.io')(httpServer, {
    cors: { origin: true }
})

const port = process.env.PORT || 5000;

io.on('connection', (socket) => {
    console.log('user online')
    socket.on('image-data', (data) => {
        socket.broadcast.emit('image-data', data)
    })
    socket.on('clear', (data) => {
        io.emit('clear', data)
    })
    socket.on('setBrush', (data) => {
        socket.broadcast.emit('setBrush', data)
    })
    socket.on('canvasUndo', (data) => {
        socket.broadcast.emit('canvasUndo', data)
    })
    socket.on('undo-photo', ({ photoData }) => {
        socket.broadcast.emit('undo-data', ({ undoData: photoData }))
    })
})

httpServer.listen(port, () => {
    console.log('Server running at', port)
})
