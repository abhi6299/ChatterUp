import './env.js'
import * as http from 'http';
import express from 'express';
import {Server} from 'socket.io';
import cors from 'cors';
import { connect } from './configMongoose.js';
import { userModel } from './user.schema.js';
import { chatModel } from './chat.schema.js';

const app = express();

const server = http.createServer(app);
let num_of_clients = 0;
const io = new Server(server,{
    cors:{
        origin:'*',
        methods:['GET','POST'],
    }
})
io.on('connection',(socket)=>{
    console.log('Socket connection established', ++num_of_clients);
    
    socket.on('username',async(data)=>{
        socket.username = data;
        // console.log(data);
        const newUser = new userModel({activeUser:data});
        await newUser.save();
        userModel.find({}, 'activeUser')
            .then(users => {
            const names = users.map(user => user.activeUser); // Use user.activeUser to retrieve the activeUser field
            socket.emit('updateUsername',socket.username);
            io.emit('headerAndFooter', { names, length:names.length});
            })
            .catch(err => {
            console.error('Error fetching names:', err);
            });
        chatModel.find().sort({timestamp:1})
            .then(data=>{
                socket.emit('broadcast-prev-message',data);
            }).catch(err=>{
                console.log('Error in fetching chat document',err);
            })
    })

    socket.on('typing', data=>{
        console.log(data);
        socket.broadcast.emit('typing', data);
    });
    socket.on('stoppedTyping', (data) => {
        socket.broadcast.emit('stoppedTyping', data);
    });

    socket.on('new-msg',(data)=>{
        let userMessage = {text:data.input, profile:data.profile, username:socket.username, timestamp: new Date()};
        socket.broadcast.emit('broadcast-new-message',userMessage); // emitting new event by server

        const newChat = new chatModel({username:socket.username,profile:data.profile,text:data.input,timestamp:new Date()});
        newChat.save();

    })

    socket.on('disconnect',async ()=>{
        console.log('disconnected',--num_of_clients);
        await userModel.findOneAndDelete({ activeUser: socket.username })
        .then(deletedUser => {
          if (!deletedUser) {
            console.log('No user found for deletion.');
            return;
          }
          console.log('Deleted user:', deletedUser);
      
          // Fetch remaining usernames after deletion
          userModel.find({}, 'activeUser')
            .then(users => {
              const names = users.map(user => user.activeUser);
              io.emit('headerAndFooter', { names, length:names.length});
            })
            .catch(err => {
              console.error('Error fetching remaining usernames:', err);
              // Handle errors
            });
        })
    })      
})

//http communication listening
server.listen(3000,()=>{
    console.log('Server started on port 3000!');
    connect();
})