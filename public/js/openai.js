// Manage the session with OpenAI API


// Get an ephemeral key from the Fastify server
async function start({model, voice})
{
  const body = JSON.stringify({model, voice});

  let response = await fetch(
    "/start",
    {body, headers: {"Content-Type": "application/json"}, method: "POST"}
  );

  if (!response.ok)
    throw new Error(`Failed to get token: ${response.statusText}`);

  response = await response.json();

  // Create a peer connection
  const pc = new RTCPeerConnection();

  // Set up data channel for sending and receiving events
  dataChannel = pc.createDataChannel("oai-events");

  return {...response, pc}
}


export async function startSession(promiseMicrophoneStream, options)
{
  if (peerConnection) throw new Error("Session already started");

  const [
    {EPHEMERAL_KEY, baseUrl, model, pc},
    microphoneStream
  ] = await Promise.all([
    start(options),
    promiseMicrophoneStream
  ]);

  // Add microphone track to the peer connection
  pc.addTrack(microphoneStream.getAudioTracks()[0]);

  let audioStream;
  pc.addEventListener("track", function({streams: [stream]})
  {
    audioStream = stream;
  }, {once: true});

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

  if(audioStream) return audioStream;

  return new Promise(function(resolve, reject)
  {
    // TODO: handle errors

    pc.addEventListener("track", function({streams: [stream]})
    {
      resolve(stream);
    }, {once: true});
  })
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
