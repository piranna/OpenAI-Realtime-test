// UI event handlers


import {mixerStream, setAudioStream, setNoiseSourceUrl} from './mixer.js';
import {startSession, stopSession} from './openai.js';


export function checkbox_onChange({target})
{
  audio[target.id] = this.checked;

  microphoneTrack?.applyConstraints(audio);

  console.debug(audio)
}

export function select_onChange({target: {value}})
{
  noiseSourceUrl = value;

  if(microphoneTrack)
    void setNoiseSourceUrl(noiseSourceUrl).catch(console.error);
}

export function start_onClick({target})
{
  target.disabled = true;
  target.textContent = 'Starting...';

  let model = document.getElementById('model')
  let voice = document.getElementById('voice')

  model.disabled = true;
  voice.disabled = true;

  // Get the model and voice from the select elements
  model = model.value;
  voice = voice.value;

  // Get local audio track from microphone input in the browser
  const promiseMicrophoneStream = mediaDevices.getUserMedia({audio})

  promiseMicrophoneStream.then(whenMicrophoneStream)

  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;
  audioElement.srcObject = mixerStream();

  void Promise.all([
      startSession(promiseMicrophoneStream, {model, voice})
      .then(whenSessionStarted),
      setNoiseSourceUrl(noiseSourceUrl)
    ])
    .then(whenStarted.bind(target), whenStarted_failed.bind(target))
    .finally(whenFinally.bind(target));
}

function stop_onClick({target})
{
  target.disabled = true;
  target.textContent = 'Stopping...';

  microphoneTrack?.stop();
  microphoneTrack = null;

  void stopSession()
    .then(whenStopped.bind(target))
    .catch(whenStopped_failed.bind(target))
    .finally(whenFinally.bind(target));
}


// Microphone stream
function whenMicrophoneStream(stream)
{
  [microphoneTrack] = stream.getAudioTracks();
}


// Start the session

function whenSessionStarted(audioStream)
{
  setAudioStream(audioStream);

  // BUG: see https://issues.chromium.org/issues/40094084
  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;
  audioElement.muted = true;
  audioElement.srcObject = audioStream;
}

function whenStarted()
{
  this.textContent = 'Stop'

  // Switch the event listeners
  this.removeEventListener('click', start_onClick);
  this.addEventListener('click', stop_onClick);
}

function whenStarted_failed(error)
{
  // TODO: show an error message to the user
  console.error(error);

  document.getElementById('model').disabled = false
  document.getElementById('voice').disabled = false

  this.textContent = 'Start';
}


// Stop the session

function whenStopped()
{
  setAudioStream(null);
  void setNoiseSourceUrl(null);

  document.getElementById('model').disabled = false
  document.getElementById('voice').disabled = false

  this.textContent = 'Start'

  // Switch the event listeners
  this.removeEventListener('click', stop_onClick);
  this.addEventListener('click', start_onClick);
}

function whenStopped_failed(error)
{
  // TODO: show an error message to the user
  console.error(error);

  this.textContent = 'Stop';
}


// Finally, re-enable the button

function whenFinally()
{
  this.disabled = false;
}


const {mediaDevices} = navigator;


// Audio constraints for the microphone input
let audio = {}
let microphoneTrack = null;
let noiseSourceUrl = null;
