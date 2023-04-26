# Messages from Teton's fleet - visualized

This is a cute visualization of messages coming from the devices of [Teton.ai](https://teton.ai) in the wild.

Each ping is a message sent by one of the devices. The messages are transmitted using the MQTT protocol, which are caught in the backend component. The client is notified about new messages via a websocket connection. The visualization is using [p5.js](https://p5js.org).

https://user-images.githubusercontent.com/33018844/234694295-c78c8f3d-c8fa-4bdd-9f7d-46b41e083f64.mov

The data for the map is taken from [Natural Earth Data](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/).

This project is inspired by [GitHub's Globe](https://github.blog/2020-12-21-how-we-built-the-github-globe/) project.
