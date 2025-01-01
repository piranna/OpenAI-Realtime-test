// Initiate the event listeners for the UI elements


import {checkbox_onChange, select_onChange, start_onClick} from './ui.js';


document.addEventListener('DOMContentLoaded', function()
{
  // Get the UI elements
  const autoGainControl = document.getElementById('autoGainControl');
  const backgroundNoise = document.getElementById('backgroundNoise');
  const echoCancellation = document.getElementById('echoCancellation');
  const noiseSuppression = document.getElementById('noiseSuppression');
  const startStop = document.getElementById('startStop');

  // Add event listeners
  autoGainControl.addEventListener('change', checkbox_onChange);
  backgroundNoise.addEventListener('change', select_onChange);
  echoCancellation.addEventListener('change', checkbox_onChange);
  noiseSuppression.addEventListener('change', checkbox_onChange);
  startStop.addEventListener('click', start_onClick);

  // Initialize the audio constraints from the checkboxes
  checkbox_onChange.call(autoGainControl, {target: autoGainControl});
  checkbox_onChange.call(echoCancellation, {target: echoCancellation});
  checkbox_onChange.call(noiseSuppression, {target: noiseSuppression});

  // Enable the Start button after the page is loaded
  startStop.disabled = false;
})
