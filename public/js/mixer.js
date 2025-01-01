export function mixerStream()
{
  audioContext = new AudioContext();
  destination = audioContext.createMediaStreamDestination();

  audioGain = audioContext.createGain();
  audioGain.gain.value = 1.0; // Adjust the volume of the WebRTC audio

  noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.2; // Adjust the volume of the background noise

  return destination.stream;
}

// Create a MediaStreamAudioSourceNode from the WebRTC track and adjust volume
// with GainNode and connect the stream pipeline
export function setAudioStream(audioStream)
{
  audioGain.disconnect();
  audioStreamSource?.disconnect();

  if(!audioStream) return;

  audioStreamSource = audioContext.createMediaStreamSource(audioStream);
  audioStreamSource.connect(audioGain).connect(destination);
}

export async function setNoiseSourceUrl(noiseSourceUrl)
{
  noiseSource?.stop();

  noiseGain.disconnect();
  noiseSource?.disconnect();

  if(!noiseSourceUrl) return;

  await fetch(noiseSourceUrl)
    .then(whenResponse)
    .then(audioContext.decodeAudioData.bind(audioContext))
    .then(whenAudioData);
}

async function whenResponse(response)
{
  if (!response.ok) throw new Error(response.statusText);

  return response.arrayBuffer();
}

function whenAudioData(buffer)
{
  noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  noiseSource.connect(noiseGain).connect(destination);
  noiseSource.start(0);
}


let audioContext;
let destination;

let audioGain
let noiseGain

let audioStreamSource;
let noiseSource;
