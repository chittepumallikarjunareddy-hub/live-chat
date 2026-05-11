import { escapeHtml } from "./ui.js";

// WebRTC State
export const webrtcState = {
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  currentCallType: null, // "audio" | "video"
  callWith: null,
  isCaller: false,
  currentUser: null,
};

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

// UI Elements
let activeCallModal, incomingCallDialog, incomingAvatar, incomingName, incomingType;
let acceptCallBtn, declineCallBtn, endCallBtn, toggleMicBtn, toggleVideoBtn;
let localVideo, remoteVideo, remoteAudio, activeCallAvatar, activeCallName, activeCallStatus;
let callAvatarFallback, localVideoContainer;
let currentSocket = null;
let pendingOffer = null;
let iceCandidateQueue = [];

export function initWebRTCUI(socket) {
  currentSocket = socket;
  activeCallModal = document.getElementById("active-call-modal");
  incomingCallDialog = document.getElementById("incoming-call-dialog");
  incomingAvatar = document.getElementById("incoming-call-avatar");
  incomingName = document.getElementById("incoming-call-name");
  incomingType = document.getElementById("incoming-call-type");
  
  acceptCallBtn = document.getElementById("accept-call-btn");
  declineCallBtn = document.getElementById("decline-call-btn");
  endCallBtn = document.getElementById("end-call-btn");
  toggleMicBtn = document.getElementById("toggle-mic-btn");
  toggleVideoBtn = document.getElementById("toggle-video-btn");
  
  localVideo = document.getElementById("local-video");
  remoteVideo = document.getElementById("remote-video");
  remoteAudio = document.getElementById("remote-audio");
  activeCallAvatar = document.getElementById("active-call-avatar");
  activeCallName = document.getElementById("active-call-name");
  activeCallStatus = document.getElementById("active-call-status");
  callAvatarFallback = document.getElementById("call-avatar-fallback");
  localVideoContainer = document.getElementById("local-video-container");

  endCallBtn.onclick = () => endCall(currentSocket);
}

export function startCall(socket, currentUser, targetUser, type) {
  if (webrtcState.peerConnection) return; // Already in a call
  
  webrtcState.callWith = targetUser;
  webrtcState.currentCallType = type;
  webrtcState.isCaller = true;
  webrtcState.currentUser = currentUser;
  
  showActiveCallModal(targetUser, type, "Calling...");
  
  socket.emit("webrtc:call-initiate", {
    targetUser,
    caller: currentUser,
    type
  });
}

export function handleIncomingCall(socket, currentUser, caller, type) {
  if (webrtcState.peerConnection || webrtcState.callWith) {
    // Busy
    socket.emit("webrtc:call-decline", { targetUser: caller, responder: currentUser });
    return;
  }
  
  webrtcState.callWith = caller;
  webrtcState.currentCallType = type;
  webrtcState.isCaller = false;
  webrtcState.currentUser = currentUser;
  
  incomingName.textContent = caller;
  incomingAvatar.src = `https://api.dicebear.com/7.x/initials/svg?seed=${escapeHtml(caller)}&backgroundColor=00a884`;
  incomingType.textContent = type === "video" ? "Incoming video call..." : "Incoming voice call...";
  incomingCallDialog.classList.remove("hidden");
  
  acceptCallBtn.onclick = async () => {
    incomingCallDialog.classList.add("hidden");
    socket.emit("webrtc:call-accept", { targetUser: caller, responder: currentUser });
    await setupWebRTC(socket, currentUser, caller, type, false);
    showActiveCallModal(caller, type, "Connecting...");
  };
  
  declineCallBtn.onclick = () => {
    incomingCallDialog.classList.add("hidden");
    socket.emit("webrtc:call-decline", { targetUser: caller, responder: currentUser });
    resetWebRTCState();
  };
}

export async function handleCallAccepted(socket, currentUser, responder) {
  if (webrtcState.callWith !== responder) return;
  activeCallStatus.textContent = "Connecting...";
  await setupWebRTC(socket, currentUser, responder, webrtcState.currentCallType, true);
}

export function handleCallDeclined(reason) {
  if (reason === "offline") {
    alert("User is offline or unavailable.");
  } else {
    alert("Call declined");
  }
  endCall(null, false);
}

export function handleOffer(socket, currentUser, caller, offer) {
  if (webrtcState.callWith !== caller) return;
  
  if (!webrtcState.peerConnection) {
    pendingOffer = offer;
    return;
  }
  
  processOffer(socket, currentUser, caller, offer);
}

function processOffer(socket, currentUser, caller, offer) {
  webrtcState.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => webrtcState.peerConnection.createAnswer())
    .then(answer => webrtcState.peerConnection.setLocalDescription(answer))
    .then(() => {
      socket.emit("webrtc:answer", {
        targetUser: caller,
        responder: currentUser,
        answer: webrtcState.peerConnection.localDescription
      });
      // Process queued candidates
      iceCandidateQueue.forEach(candidate => {
        webrtcState.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
      iceCandidateQueue = [];
    })
    .catch(err => console.error("Error processing offer:", err));
}

export function handleAnswer(responder, answer) {
  if (webrtcState.callWith !== responder || !webrtcState.peerConnection) return;
  webrtcState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    .then(() => {
      iceCandidateQueue.forEach(candidate => {
        webrtcState.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
      iceCandidateQueue = [];
    })
    .catch(err => console.error("Error processing answer:", err));
}

export function handleIceCandidate(sender, candidate) {
  if (webrtcState.callWith !== sender) return;
  if (!webrtcState.peerConnection || !webrtcState.peerConnection.remoteDescription) {
    iceCandidateQueue.push(candidate);
    return;
  }
  webrtcState.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

export function handleCallEnded() {
  endCall(null, false); // Don't emit call-end since we received it
}

async function setupWebRTC(socket, currentUser, targetUser, type, isCaller) {
  try {
    let stream = new MediaStream();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true
      });
    } catch (err) {
      console.warn("Could not access requested media devices:", err);
      try {
        // Fallback to audio only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (type === "video") activeCallStatus.textContent = "Audio-Only Mode";
      } catch (err2) {
        console.warn("Could not access any media devices:", err2);
        activeCallStatus.textContent = "Simulated Camera (Hardware Missing)";
        stream = createDummyStream();
      }
    }
    
    webrtcState.localStream = stream;
    if (type === "video") {
      localVideo.srcObject = stream;
      localVideoContainer.classList.remove("hidden");
    }
    
    webrtcState.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    stream.getTracks().forEach(track => {
      webrtcState.peerConnection.addTrack(track, stream);
    });
    
    webrtcState.peerConnection.ontrack = (event) => {
      webrtcState.remoteStream = event.streams[0];
      if (type === "video") {
        remoteVideo.srcObject = webrtcState.remoteStream;
        remoteVideo.classList.remove("hidden");
        callAvatarFallback.classList.add("hidden");
      } else {
        remoteAudio.srcObject = webrtcState.remoteStream;
      }
      activeCallStatus.textContent = "";
    };
    
    webrtcState.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice-candidate", {
          targetUser: targetUser,
          sender: currentUser,
          candidate: event.candidate
        });
      }
    };
    
    if (isCaller) {
      const offer = await webrtcState.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video"
      });
      await webrtcState.peerConnection.setLocalDescription(offer);
      socket.emit("webrtc:offer", {
        targetUser: targetUser,
        caller: currentUser,
        offer: webrtcState.peerConnection.localDescription
      });
    } else if (pendingOffer) {
      processOffer(socket, currentUser, targetUser, pendingOffer);
      pendingOffer = null;
    }
    
    // Wire up UI controls
    toggleMicBtn.onclick = () => {
      const audioTrack = webrtcState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        toggleMicBtn.classList.toggle("text-white", audioTrack.enabled);
        toggleMicBtn.classList.toggle("text-rose-500", !audioTrack.enabled);
      }
    };
    
    toggleVideoBtn.onclick = () => {
      const videoTrack = webrtcState.localStream?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        toggleVideoBtn.classList.toggle("text-white", videoTrack.enabled);
        toggleVideoBtn.classList.toggle("text-rose-500", !videoTrack.enabled);
        if (!videoTrack.enabled) {
          localVideoContainer.classList.add("hidden");
        } else {
          localVideoContainer.classList.remove("hidden");
        }
      }
    };
    
  } catch (err) {
    console.error("Critical error in setupWebRTC:", err);
    endCall(socket);
  }
}

export function endCall(socket, emit = true) {
  if (emit && socket && webrtcState.callWith) {
    socket.emit("webrtc:call-end", { targetUser: webrtcState.callWith, sender: webrtcState.currentUser });
  }
  
  if (webrtcState.localStream) {
    webrtcState.localStream.getTracks().forEach(track => track.stop());
  }
  
  if (webrtcState.peerConnection) {
    webrtcState.peerConnection.close();
  }
  
  resetWebRTCState();
}

function resetWebRTCState() {
  webrtcState.peerConnection = null;
  webrtcState.localStream = null;
  webrtcState.remoteStream = null;
  webrtcState.currentCallType = null;
  webrtcState.callWith = null;
  webrtcState.isCaller = false;
  webrtcState.currentUser = null;
  pendingOffer = null;
  iceCandidateQueue = [];
  
  if (activeCallModal) activeCallModal.classList.add("hidden");
  if (incomingCallDialog) incomingCallDialog.classList.add("hidden");
  if (remoteVideo) remoteVideo.classList.add("hidden");
  if (remoteVideo) remoteVideo.srcObject = null;
  if (localVideo) localVideo.srcObject = null;
  if (remoteAudio) remoteAudio.srcObject = null;
  if (callAvatarFallback) callAvatarFallback.classList.remove("hidden");
  if (localVideoContainer) localVideoContainer.classList.add("hidden");
  
  if (toggleMicBtn) {
    toggleMicBtn.classList.add("text-white");
    toggleMicBtn.classList.remove("text-rose-500");
  }
  if (toggleVideoBtn) {
    toggleVideoBtn.classList.add("text-white");
    toggleVideoBtn.classList.remove("text-rose-500");
  }
}

function showActiveCallModal(contact, type, statusText) {
  activeCallModal.classList.remove("hidden");
  activeCallName.textContent = contact;
  activeCallAvatar.src = `https://api.dicebear.com/7.x/initials/svg?seed=${escapeHtml(contact)}&backgroundColor=00a884`;
  activeCallStatus.textContent = statusText;
  
  if (type === "audio") {
    toggleVideoBtn.classList.add("hidden");
  } else {
    toggleVideoBtn.classList.remove("hidden");
  }
}

function createDummyStream() {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  
  let x = canvas.width / 2;
  let y = canvas.height / 2;
  let dx = 3;
  let dy = 3;
  
  function draw() {
    ctx.fillStyle = "#111b21";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = "center";
    ctx.fillStyle = "#00a884";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("No Camera", x, y);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#8696a0";
    ctx.fillText("Simulated Video", x, y + 35);
    
    x += dx;
    y += dy;
    
    // Bounce within a safe center area so object-cover doesn't crop it
    if (x < 120 || x > canvas.width - 120) dx = -dx;
    if (y < 60 || y > canvas.height - 60) dy = -dy;
    
    requestAnimationFrame(draw);
  }
  draw();
  
  let stream;
  try {
    stream = canvas.captureStream(30);
  } catch (e) {
    stream = new MediaStream(); // Fallback for browsers that don't support captureStream
  }
  
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(0, audioCtx.currentTime); // Silent
    oscillator.connect(dest);
    oscillator.start();
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }
  } catch (e) {
    console.warn("Could not create dummy audio track", e);
  }
  
  return stream;
}
