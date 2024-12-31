// Initiate the event listeners for the UI elements


import {checkbox_onChange, start_onClick} from './ui.js';


document.addEventListener('DOMContentLoaded', function()
{
  const autoGainControl = document.getElementById('autoGainControl');
  const echoCancellation = document.getElementById('echoCancellation');
  const noiseSuppression = document.getElementById('noiseSuppression');
  const startStop = document.getElementById('startStop');

  autoGainControl.addEventListener('change', checkbox_onChange);
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
