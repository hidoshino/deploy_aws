const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
})

app.get('/', (request,response)=>{
	return response.json({message: 'Server'})
});


let ListUsers = [];


io.on("connection", (socket) => {
	socket.emit("me", socket.id)


	socket.on("join-connection", (data) => {
		socket.username = data.name;
		ListUsers.push({
			id: data.id,
			name: data.name, 
		})

		console.log(ListUsers);
		ListUsers = ListUsers.filter(u => u.name !=  undefined);
		socket.emit('ok', ListUsers);
		socket.broadcast.emit("list-update", {
			joined: data.name,
			list:  ListUsers
		});
	})
	

	socket.on("disconnect", (data) => {
		ListUsers = ListUsers.filter(u => u != data.user);
		socket.broadcast.emit("callEnded", ListUsers);
	})

	socket.on("callUser", (data) => {
		console.log(`Tentativa de ligação.... \nDe: ${data.from} Para: ${data.userToCall}`);
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("sendMessage", (message) => {
		console.log(`Mensagens: ${JSON.stringify(message)}`);
		socket.broadcast.emit("sendMessage", message);
	})

	socket.on("answerCall", (data) => {
		console.log(`Chamada em andamento.... \n${JSON.stringify(data)}`)
		io.to(data.to).emit("callAccepted", data.signal)
	})



})

server.listen(5001, () => console.log("server is running on port 5000"))
