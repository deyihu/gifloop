import mitt from 'mitt';
import { parseGIF, decompressFrames } from 'gifuct-js';

let canvas, offscreenCanvas;
function getCanvas() {
    if (canvas) {
        return canvas;
    }
    canvas = document.createElement('canvas');
    return canvas;
}

function getOffscreenCanvas() {
    if (offscreenCanvas) {
        return offscreenCanvas;
    }
    if (OffscreenCanvas) {
        offscreenCanvas = new OffscreenCanvas(10, 10);
    }
    return offscreenCanvas;
}

function putImageData(canvas, frame, gif) {
    const { maxWidth, maxHeight } = gif;
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { patch, left, top, width, height } = frame;
    const imageData = new ImageData(patch, width, height);
    ctx.putImageData(imageData, left, top);
    frame.maxWidth = maxWidth;
    frame.maxHeight = maxHeight;
}

function initFrameDataURL(frame, gif) {
    const canvas = getCanvas();
    putImageData(canvas, frame, gif);
    frame.dataURL = canvas.toDataURL();

    const offCanvas = getOffscreenCanvas();
    if (offCanvas) {
        putImageData(offCanvas, frame, gif);
        frame.imageBitMap = offCanvas.transferToImageBitmap();
    }
}

const gifCollection = [];

function frameLoop(timeStamp) {
    gifCollection.forEach(gif => {
        const frames = gif.frames;
        if (!gif.loaded || !gif._playing || !frames || frames.length === 0) {
            return;
        }
        if (gif._idx === frames.length) {
            gif._idx = 0;
        }
        const frame = frames[gif._idx];
        frame.index = gif._idx;
        if (!frame.dataURL) {
            initFrameDataURL(frame, gif);
        }
        if (!gif._time) {
            gif._time = timeStamp;
            gif._idx++;
            gif._mitt.emit('frame', frame);
        } else {
            if (timeStamp - gif._time >= gif.options.loopTime) {
                gif._time = timeStamp;
                gif._idx++;
                gif._mitt.emit('frame', frame);
            }
        }
    });
    requestAnimationFrame(frameLoop);
}
setTimeout(() => {
    requestAnimationFrame(frameLoop);
}, 16);

export class GIF {
    constructor(options) {
        this.options = Object.assign({}, { loopTime: 70 }, options);
        this.options.loopTime = Math.max(17, this.options.loopTime);
        this._mitt = mitt();
        this._idx = 0;
        this._playing = true;
        this.loaded = false;
        this.frames = [];
        if (!options.url) {
            console.error('not find gif url');
        } else {
            fetch(options.url).then(res => res.arrayBuffer()).then(arrayBuffer => {
                const gif = parseGIF(arrayBuffer);
                const frames = decompressFrames(gif, true);
                this.frames = frames;
                let maxWidth = 0, maxHeight = 0;
                this.frames.forEach(frame => {
                    const { width, height, left, top } = frame.dims;
                    maxWidth = Math.max(maxWidth, width + left);
                    maxHeight = Math.max(maxHeight, height + top);
                    frame.gif = this;
                    frame = Object.assign(frame, frame.dims);
                });

                this.maxWidth = maxWidth;
                this.maxHeight = maxHeight;
                this.frames.forEach(frame => {
                    initFrameDataURL(frame, this);
                });
                gifCollection.push(this);
                this.loaded = true;
            }).catch(error => {
                console.error(error);
            });
        }
    }

    config(options = {}) {
        this.options = Object.assign(this.options, options);
        return this;
    }

    on(eventType, handler) {
        this._mitt.on(eventType, handler);
        return this;
    }

    off(eventType, handler) {
        this._mitt.off(eventType, handler);
        return this;
    }

    play() {
        this._playing = true;
        return this;
    }

    pause() {
        this._playing = false;
        return this;
    }

    isPlay() {
        return this._playing;
    }

    dispose() {
        const index = gifCollection.indexOf(this);
        if (index > -1) {
            gifCollection.splice(index, 1);
        }
        this._mitt.all.clear();
        this.frames = null;
        return this;
    }
}
