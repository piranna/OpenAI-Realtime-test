// UI event handlers


import {startSession, stopSession} from './openai.js';


export function checkbox_onChange({target})
{
  audio[target.id] = this.checked;

  microphoneTrack?.applyConstraints(audio);

  console.debug(audio)
}

export function start_onClick({target})
{
  target.disabled = true;
  target.textContent = 'Starting...';

  // Get local audio track from microphone input in the browser
  const promiseMicrophoneStream = navigator.mediaDevices.getUserMedia({audio})

  promiseMicrophoneStream.then(whenMicrophoneStream)

  const audioElement = document.createElement("audio");

  void startSession(promiseMicrophoneStream, audioElement)
    .then(whenStarted.bind(target), whenStartSession_failed.bind(target))
    .finally(whenFinally.bind(target));
}

function stop_onClick({target})
{
  target.disabled = true;
  target.textContent = 'Stopping...';

  microphoneTrack?.stop();
  microphoneTrack = null;

  void stopSession()
    .then(whenStopped.bind(target), whenStopSession_failed.bind(target))
    .finally(whenFinally.bind(target));
}


// Microphone stream
function whenMicrophoneStream(stream)
{
  const [track] = stream.getAudioTracks();

  microphoneTrack = track;
}


// Start the session

function whenStarted()
{
  this.textContent = 'Stop'

  // Switch the event listeners
  this.removeEventListener('click', start_onClick);
  this.addEventListener('click', stop_onClick);
}

function whenStartSession_failed(error)
{
  // TODO: show an error message to the user
  console.error(error);

  this.textContent = 'Start';
}


// Stop the session

function whenStopped()
{
  this.textContent = 'Start'

  // Switch the event listeners
  this.removeEventListener('click', stop_onClick);
  this.addEventListener('click', start_onClick);
}

function whenStopSession_failed(error)
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


// Audio constraints for the microphone input
let audio = {}
let microphoneTrack = null;
