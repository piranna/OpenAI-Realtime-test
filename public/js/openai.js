// Manage the session with OpenAI API


async function start()
{
  const response = await fetch("/start");

  if (!response.ok)
    throw new Error(`Failed to get token: ${response.statusText}`);

  const {EPHEMERAL_KEY, baseUrl, model} = await response.json();

  // Create a peer connection
  const pc = new RTCPeerConnection();

  // Set up to play remote audio from the model
  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;

  pc.addEventListener("track", function({streams: [stream]})
  {
    audioElement.srcObject = stream;
  });

  // Set up data channel for sending and receiving events
  dataChannel = pc.createDataChannel("oai-events");

  return {EPHEMERAL_KEY, baseUrl, model, pc}
}


export async function startSession()
{
  if (peerConnection) throw new Error("Session already started");

  const [{EPHEMERAL_KEY, baseUrl, model, pc}, ms] = await Promise.all([
    // Get an ephemeral key from the Fastify server
    start(),
    // Get local audio track from microphone input in the browser
    navigator.mediaDevices.getUserMedia({audio: true})
  ]);

  // Add microphone track to the peer connection
  pc.addTrack(ms.getTracks()[0]);

  // Start the session using the Session Description Protocol (SDP)
  const offer = await pc.createOffer();

  const [sdpResponse] = await Promise.all([
    fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp"
      }
    }),
    pc.setLocalDescription(offer)
  ])

  const sdp = await sdpResponse.text()
  await pc.setRemoteDescription({sdp, type: "answer"});

  peerConnection = pc;
}

// Stop current session, clean up peer connection and data channel
export async function stopSession()
{
  dataChannel?.close();
  dataChannel = null;

  peerConnection?.close();
  peerConnection = null;
}


let dataChannel;
let peerConnection;
