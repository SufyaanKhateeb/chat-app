const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { SocketAddress } = require('net')
const {addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on("connection", (socket) => {
    console.log('New WebSocket connection',socket.id)

    socket.on('join', (options = { username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if(error) {
            return callback(error)
        }
        
        socket.join(user.room)

        socket.emit("updateComm", generateMessage('Admin', "Welcome new user!!"))
        socket.broadcast.to(user.room).emit('updateComm', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback("Profanity is not allowed.")
        }
        if(message === "$clear")
            io.to(user.id).emit('updateComm', generateMessage(user.username, message, user.color));
        else
            io.to(user.room).emit('updateComm', generateMessage(user.username, message, user.color))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.lat},${location.long}`, user.color))
        callback("Location shared!")
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('updateComm', generateMessage('Admin',`${user.username} has left.`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log("Listening at port", port)
})