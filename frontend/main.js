import p5 from "p5";
import lands from "./lands.json";

const sketch = (p) => {
  function coordsToPixel(coords) {
    const denmark = [7, 58, 14.3, 53.5];

    let v = [];
    v[0] = p.map(coords[0], denmark[0], denmark[2], 0, p.width);
    v[1] = p.map(coords[1], denmark[1], denmark[3], 0, p.height);
    return v;
  }

  let mapLayer;
  let visLayer;

  function drawLand() {
    lands.features.forEach((feature) => {
      const poly = feature.geometry.coordinates;
      poly.forEach((ca) => {
        ca.forEach((cb) => {
          mapLayer.beginShape();
          mapLayer.stroke(51);
          mapLayer.strokeWeight(1);
          mapLayer.fill(120, 150, 93);
          cb.forEach((cc) => {
            let v = coordsToPixel(cc);
            mapLayer.vertex(v[0], v[1]);
          });
          mapLayer.endShape(p.CLOSE);
        });
      });
    });

    p.image(mapLayer, 0, 0);
  }

  class Ping {
    constructor(coords, serial) {
      this.coords = coords;
      this.serial = serial.slice(-4);
      this.serial_pos = coordsToPixel(coords);
      this.v = coordsToPixel(coords);
      this.r = 5;
      this.r_step = 1;
      this.max_r = 50;
      this.growing = true;
    }

    grow() {
      if (this.growing) {
        this.r += this.r_step;
        if (this.r > this.max_r) {
          this.growing = false;
        }

        // make the serial_pos float up wobbly
        this.serial_pos[0] += p.random(-1, 1);
        this.serial_pos[1] += p.random(-1, -3);
      }
    }

    draw() {
      visLayer.fill(217, 182, 59, p.map(this.r, 5, this.max_r, 255, 0));
      // visLayer.noStroke();
      visLayer.stroke(51, 51, 51, p.map(this.r, 5, this.max_r, 255, 0));
      visLayer.ellipse(this.v[0], this.v[1], this.r, this.r);

      visLayer.fill(51, 51, 51, p.map(this.r, 5, this.max_r, 255, 0));
      visLayer.textSize(18);
      visLayer.textAlign(p.CENTER, p.CENTER);
      visLayer.text(this.serial, this.serial_pos[0], this.serial_pos[1]);
    }
  }

  let pings = [];
  let totalMessages = 0;

  function pingFromLocation(coords, serial) {
    pings.push(new Ping(coords, serial));
    totalMessages += 1;
  }

  function setupGraphics() {
    mapLayer = p.createGraphics(p.width, p.height);
    visLayer = p.createGraphics(p.width, p.height);

    drawLand();
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      setupGraphics();
    };

    setupGraphics();

    const socket = new WebSocket("ws://localhost:8080");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      pingFromLocation(data["coords"], data["serial"]);
    };
  };

  p.draw = () => {
    p.background(57, 84, 143);

    visLayer.clear();

    // write total messages
    visLayer.fill(120, 150, 93);
    visLayer.textSize(24);
    visLayer.textAlign(p.LEFT, p.TOP);
    visLayer.text("msg count: " + totalMessages, 10, 10);

    pings.forEach((ping) => {
      ping.grow();
      ping.draw();
    });

    p.image(mapLayer, 0, 0);
    p.image(visLayer, 0, 0);

    // remove pings that are done growing
    pings = pings.filter((ping) => ping.growing);
  };
};

new p5(sketch);
