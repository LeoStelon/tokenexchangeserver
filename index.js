const express = require("express");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const APP_ID = "7ccc18980cc34fe8b55adad2dc1dfc41";
const APP_CERTIFICATE = "83631bc32c8a4b8d917194d1716ffe14";

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const nocache = (req, resp, next) => {
	resp.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
	resp.header("Expires", "-1");
	resp.header("Pragma", "no-cache");
	next();
};

io.on("connection", (socket) => {
	console.log("Someone joined");

	// join the socket
	socket.on("join", (userid) => {
		socket.join(userid);
		socket.emit("joined", userid);
	});

	socket.on("video_call_offer", (data) => {
		console.log("Video Call Offer triggered");
		socket.broadcast.to(data.userId).emit("video_call_offer", data);
	});

	socket.on("audio_call_offer", (userid) => {
		console.log("Audio Call Offer triggered");
		socket.broadcast.to(userid).emit("audio_call_offer", "audio_call_offer");
	});

	socket.on("call_end", (userid) => {
		console.log("Call End triggered");
		socket.broadcast.to(userid).emit("call_end", "video_call_end");
	});
});

const generateAccessToken = (req, resp) => {
	// set response header
	resp.header("Acess-Control-Allow-Origin", "*");
	// get channel name
	const channelName = req.query.channelName;
	if (!channelName) {
		return resp.status(500).json({ error: "channel is required" });
	}
	// get uid
	let uid = req.query.uid;
	if (!uid || uid == "") {
		uid = 0;
	}
	// get role
	let role = RtcRole.SUBSCRIBER;
	if (req.query.role == "publisher") {
		role = RtcRole.PUBLISHER;
	}
	// get the expire time
	let expireTime = req.query.expireTime;
	if (!expireTime || expireTime == "") {
		expireTime = 3600;
	} else {
		expireTime = parseInt(expireTime, 10);
	}
	// calculate privilege expire time
	const currentTime = Math.floor(Date.now() / 1000);
	const privilegeExpireTime = currentTime + expireTime;
	// build the token
	const token = RtcTokenBuilder.buildTokenWithUid(
		APP_ID,
		APP_CERTIFICATE,
		channelName,
		uid,
		role,
		privilegeExpireTime
	);
	// return the token
	return resp.json({ token: token, channelName });
};

app.get("/access_token", nocache, generateAccessToken);

// START THE SERVER =================================================================
const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log(`Express server listening on port ${port}`);
});

// socket.on("join2", (roomId) => {
// 	const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 };
// 	const numberOfClients = roomClients.length;

// 	// These events are emitted only to the sender socket.
// 	if (numberOfClients == 0) {
// 		console.log(
// 			`Creating room ${roomId} and emitting room_created socket event`
// 		);
// 		socket.join(roomId);
// 		socket.emit("room_created", roomId);
// 	} else if (numberOfClients == 1) {
// 		console.log(
// 			`Joining room ${roomId} and emitting room_joined socket event`
// 		);
// 		socket.join(roomId);
// 		socket.emit("room_joined", roomId);
// 	} else {
// 		console.log(`Can't join room ${roomId}, emitting full_room socket event`);
// 		socket.emit("full_room", roomId);
// 	}
// });

// // These events are emitted to all the sockets connected to the same room except the sender.
// socket.on("start_call", (roomId) => {
// 	console.log(`Broadcasting start_call event to peers in room ${roomId}`);
// 	socket.broadcast.to(roomId).emit("start_call");
// });
// socket.on("webrtc_offer", (event) => {
// 	console.log(
// 		`Broadcasting webrtc_offer event to peers in room ${event.roomId}`
// 	);
// 	socket.broadcast.to(event.roomId).emit("webrtc_offer", event.sdp);
// });
// socket.on("webrtc_answer", (event) => {
// 	console.log(event);
// 	console.log(
// 		`Broadcasting webrtc_answer event to peers in room ${event.roomId}`
// 	);
// 	socket.broadcast.to(event.roomId).emit("webrtc_answer", event.sdp);
// });
// socket.on("webrtc_ice_candidate", (event) => {
// 	console.log(
// 		`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`
// 	);
// 	socket.broadcast.to(event.roomId).emit("webrtc_ice_candidate", event);
// });
