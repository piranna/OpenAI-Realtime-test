// Initiate the event listeners for the UI elements


import {start_onClick} from './ui.js';


document.addEventListener('DOMContentLoaded', function()
{
  const startStop = document.getElementById('startStop');

  startStop.addEventListener('click', start_onClick);
})
