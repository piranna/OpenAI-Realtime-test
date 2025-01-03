# OpenAI-Realtime-test

Test of OpenAI Realtime API for educational purposes

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?name=openai-realtime-test&repository=piranna%2FOpenAI-Realtime-test&branch=main&instance_type=free)

## Requirements and implemented features

The system implements all the functionality specified in the last scenario indicated, which consists of:

- the user can use the system in an environment with background noise
- eliminating said background noise
- the system generates a response
- the generated response includes background noise, simulating that it is in a
  cafeteria, a call center or similar
- implementing a minimal and functional interface
- low latency and high precision in any language

Also, although it has not been specified in this last requested scenario, part
of the functionality indicated initially has also been implemented,
specifically:

- use of the OpenAI API in real time
- being able to dynamically change the background sound to simulate
- publishing the application on a public server

However, it has not been possible to implement the functionality of controlling
the speed of speech in the generated response, since the OpenAI API does not
allow controlling the speed of the generated response in real time, being only
available in the voice generation API. Using it would also have allowed the
development of an application more focused on the backend server, but this would
entail a significant decrease in the user experience, since the response times
would be much longer and not in real time, especially with long responses. The
alternative was to "simulate" said speech speed by modifying the playback ratio
of the generated response, but this is not a viable solution since the response
is generated in real time, so it could not be accelerated (only slowed down)
unless the complete response is obtained, which is not viable in a real-time
system.

However, it is possible to tell OpenAI to make the generated response faster or
slower during the conversation itself, so a viable solution would be to
internally send text-based speed control commands generated from a slider,
perhaps listening to system events to know when the agent has finished speaking
and not interrupting him, so that these commands are integrated into the
conversation, but it would be an experimental solution and has not been
implemented in this system, so it is only proposed as an alternative to test in
the future.

Regarding the low latency and high precision requirements of the system in any
language, the OpenAI real-time API recommendation of connecting via WebRTC
directly from the web browser has been followed. This might seem to contradict
the initial indications of using an architecture based on the use of a backend
server with minimal integration of the user interface. However, it has been
decided to make this approach more browser-centric both for the simplicity of
the overall system architecture, as there are fewer elements involved and not
having to manually manage audio fragments on both the server and the client for
playback, and also for performance, as the audio does not have to go through an
intermediate server that increases its latency.

However, the system still makes use of a backend server as requested, whose only
functionalities consist of serving the ephemeral authentication tokens (which is
a more secure solution and the recommended one as it does not allow access
tokens to leave the server), and serving the static content files (web page,
Javascript, and audio files with background noise). As for the integration of
the user interface, this is minimal and isolated from the code responsible for
the integration with OpenAI and the mixing of background noise, with these last
two functionalities being developed as generic Javascript code without the use
of browser-specific APIs or the graphical interface. The backend server is built
as a Fastify plugin, both for performance (it is one of the fastest open source
web servers out there) and so that it can be easily integrated with other
systems. For this same reason, all the values ​​and parameters (access URL, LLM
model to use, voice, path of the static files...) are set as default values
​​from the options, so that they can later be overwritten with the desired
values.

Also, as required, a minimal and functional interface is used made only with
HTML and Javascript without the use of additional libraries or frameworks, and
only adding the CSS stylesheet [Tacit](https://yegor256.github.io/tacit/) to
provide a more pleasant interface.

The system is deployed on [Koyeb](https://www.koyeb.com/), a PaaS that allows
automatic deployments every time new code is uploaded to a Github repository. In
this way, once the system is configured, there is no need to worry about
deploying it, since it is done automatically. The URL where the application is
available is <https://foreign-gus-mafalda-sfu-16b3afc6.koyeb.app/>.

## Implementation details

Removal of background noise is done by using the browser `getUserMedia` API with
the `autoGainControl`, `echoCancellation`, and `noiseSuppression` constraints
enabled by default. All of them are already enabled by default in all the modern
browsers except for the `autoGainControl` constraint, which is disabled in
Firefox by default. So there's not much advantage on enabling them explicitly,
but allows to have an uniform environment between browsers, and to disable them
for testing purposes.

For the generation of the response with background noise, I was not able to find
any OpenAI API that allows to add background noise to the generated response. It
makes sense, since the API is focused on generating voice responses, and
generation of noise would affect its quality. For this reason, I'm doing the
mixing directly on the browser itself. Initially I planned to just play the
audio files with the background noise, but that would be crude. So for a cleaner
solution that also allows to better handle the audio output, I'm using the Web
Audio API to mix the generated response with the background noise. This also
allows to control the volume of the background noise and the generated response
independently, and provide a single stream with the mixed content to be send to
the audio output.

The selection of the background noise is implemented with a dropdown menu that
allows to select between a cafeteria, a call center, or no background noise. The
audio files are loaded in the background and added to the AudioContext when
selected. The audio files are stored in the `public` directory, so they are
served by the Fastify server.

The frontend is implemented with a single HTML file that contains the minimal
structure of the page, and a set of Javascript modules. The main one is
`index.js`, and it just only set the DOM elements event handlers, enabling the
`Start` button once that the app is ready. On `ui.js` there's all the logic to
handle the user interface elements and the audio logic, delegating de audio
loading and mixing to the `mixer.js` file, and the OpenAI API interaction to the
`openai.js` file. This last one is responsible of creating the RTCPeerConnection
and the RTCDataChannel to send the audio data to the OpenAI API, and to receive
the generated response. Code is optimized to do all possible tasks in parallel,
so it's possible to reduce connection and interaction times. It's not using
classes but instead module level variables to store the state, since all
elements are basically singletons, and by using modules exports their internal
state is not exposed to the global scope or to other modules, so for this case,
it's a simple, secure, and memory efficient way to store the application state.

## Future improvements

As mentioned before, a possible improvement would be to implement a speed
control system based on text commands, that although experimental (specially
regarding how to know and quantify the actual speech speed rates of the agent),
it's a promising solution that could be tested in the future. Another ones that
are being considered in the short-term are:

- allow to handle the volumes of the background noise and the generated response
  independently
- allow to select the voice of the generated response
- add a "welcome" response when connecting to OpenAI
- integrate with a chat system to allow to send text prompts to OpenAI in
  addition to voice commands

Additionally, since the system doesn't have a specific purpose, leaving it open
to the developer to use it as a base for other projects, I was thinking on
develop a "Dungeon Master" personality, so the system can be used as a
interactive storytelling game, where the system can tell the user fragments of a
story or descriptions of a situation similar to the "Choose your own adventure"
books and the graphical or text-mode adventure games, and the user can interact
with the system by asking questions or giving orders to the characters of the
story. This would allow to test the system in a more complex and interactive
environment, and to test the capabilities of the OpenAI API in generating
complex and coherent responses, in addition of integration with other APIs like
the ones that allow to generate images, videos, background noises or sound
effects from text descriptions.
