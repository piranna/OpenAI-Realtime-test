// UI event handlers


import {startSession, stopSession} from './openai.js';


export function start_onClick({target})
{
  target.disabled = true;
  target.textContent = 'Starting...';

  void startSession()
    .then(whenStarted.bind(target), whenStartSession_failed.bind(target))
    .finally(whenFinally.bind(target));
}

function stop_onClick({target})
{
  target.disabled = true;
  target.textContent = 'Stopping...';

  void stopSession()
    .then(whenStopped.bind(target), whenStopSession_failed.bind(target))
    .finally(whenFinally.bind(target));
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
