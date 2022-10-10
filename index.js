import mitt from 'mitt';
import { Parser } from '@n.see/gif-parser';

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

const gifCollection = [];

function frameLoop(timeStamp) {
    gifCollection.forEach(gif => {
        if (!gif.loaded || !gif.frames || gif.frames.length === 0) {
            return;
        }
        if (gif._idx === gif.frames.length) {
            gif._idx = 0;
        }
        const frame = gif.frames[gif._idx];
        frame.index = gif._idx;
        if (!frame.dataURL) {
            const maxWidth = gif.maxWidth, maxHeight = gif.maxHeight;
            const { imageData, left, top } = frame;
            const canvas = getCanvas();
            canvas.width = maxWidth;
            canvas.height = maxHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, left, top);
            frame.dataURL = canvas.toDataURL();
            frame.maxWidth = maxWidth;
            frame.maxHeight = maxHeight;

            const offCanvas = getOffscreenCanvas();
            if (offCanvas) {
                offCanvas.width = maxWidth;
                offCanvas.height = maxHeight;
                const offCtx = offCanvas.getContext('2d');
                offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
                offCtx.putImageData(imageData, left, top);
                frame.imageBitMap = offCanvas.transferToImageBitmap();
            }
        }
        if (!gif._time) {
            gif._mitt.emit('frame', frame);
            gif._time = timeStamp;
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
        this.loaded = false;
        this.frames = [];
        if (!options.url) {
            console.error('not find gif url');
        } else {
            fetch(options.url).then(res => res.arrayBuffer()).then(arrayBuffer => {
                const parser = new Parser(arrayBuffer);
                parser.export();
                this.frames = parser.getFrames();
                let maxWidth = 0, maxHeight = 0;
                this.frames.forEach(frame => {
                    const { width, height, left, top } = frame;
                    maxWidth = Math.max(maxWidth, width + left);
                    maxHeight = Math.max(maxHeight, height + top);
                });
                this.maxWidth = maxWidth;
                this.maxHeight = maxHeight;
                gifCollection.push(this);
                this.loaded = true;
            }).catch(error => {
                console.error(error);
            });
        }
    }

    on(eventType, handler) {
        this._mitt.on(eventType, handler);
        return this;
    }

    off(eventType, handler) {
        this._mitt.off(eventType, handler);
        return this;
    }

    dispose() {

    }
}
