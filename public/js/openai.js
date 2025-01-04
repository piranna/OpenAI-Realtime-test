// Manage the session with OpenAI API


function executor_audioStream(resolve, reject)
{
  // TODO: handle errors

  peerConnection.addEventListener("track", function({streams: [stream]})
  {
    resolve(stream);
  }, {once: true});
}

function executor_dataChannel(resolve, reject)
{
  dataChannel.addEventListener("open", resolve, {once: true})
  dataChannel.addEventListener("error", reject, {once: true})
}



export function greetUser()
{
  sendSystemMessage("Greet the user");

  dataChannel.send(JSON.stringify({type: "response.create"}));
}

export function setSpeechSpeed(speed)
{
  sendSystemMessage(`Set speech speed to ${speed}`);
}

function sendSystemMessage(text)
{
  if (!peerConnection) throw new Error("Session not started");

  const message = {
    event_id: crypto.randomUUID(),  // TODO: use UUIDv7
    item: {
      content: [
        {
          text,
          type: "input_text"
        }
      ],
      role: "system",  // "developer",
      type: "message"
    },
    type: "conversation.item.create"
  }

  console.debug("Sending message:", message);

  dataChannel.send(JSON.stringify(message));
}

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

  await Promise.all([
    pc.setRemoteDescription({sdp, type: "answer"}),
    new Promise(executor_dataChannel)
  ]);

  peerConnection = pc;

  return audioStream || new Promise(executor_audioStream)
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
