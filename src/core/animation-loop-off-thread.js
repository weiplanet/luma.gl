/* global document */
import AnimationLoop, {requestAnimationFrame, cancelAnimationFrame} from './animation-loop';
import {getPageLoadPromise, createCanvas, getCanvas} from '../webgl-utils';

export default class AnimationLoopOffThread {

  static createWorker(opts) {
    return self => {

      self.animationLoop = new AnimationLoop(Object.assign({}, opts, {
        offScreen: true,
        // Prevent trying to access DOM properties
        useDevicePixels: false,
        autoResizeDrawingBuffer: false
      }));
      self.canvas = null;

      self.addEventListener('message', evt => {
        const {animationLoop} = self;

        switch (evt.data.command) {

        case 'start':
          self.canvas = evt.data.opts.canvas;
          animationLoop.start(evt.data.opts);
          break;

        case 'stop':
          animationLoop.stop();
          break;

        case 'resize':
          self.canvas.width = evt.data.width;
          self.canvas.height = evt.data.height;
          break;

        case 'setViewParameters':
          animationLoop.setViewParameters(evt.data.params);
          break;
        }

      });

    };
  }

  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor({
    worker,
    onInitialize = () => {},
    onFinalize = () => {}
  }) {
    this.worker = worker;

    this.canvas = null;
    this.width = null;
    this.height = null;

    this._updateFrame = this._updateFrame.bind(this);
    this._onInitialize = onInitialize;
    this._onFinalize = onFinalize;
  }

  // Public methods
  start(opts) {
    const {canvas, width, height, throwOnError} = opts;

    // Error reporting function, enables exceptions to be disabled
    function onError(message) {
      if (throwOnError) {
        throw new Error(message);
      }
      // log.log(0, message);
      return null;
    }
    this._stopped = false;
    // console.debug(`Starting ${this.constructor.name}`);
    if (!this._animationFrameId) {
      // Wait for start promise before rendering frame
      this._startPromise = getPageLoadPromise()
      .then(() => {
        let realCanvas;
        if (!canvas) {
          realCanvas = createCanvas({id: 'lumagl-canvas', width, height, onError});
        } else if (typeof canvas === 'string') {
          realCanvas = getCanvas({id: canvas});
        } else {
          realCanvas = canvas;
        }

        if (!realCanvas.transferControlToOffscreen) {
          onError('OffscreenCanvas is not available. Enable Experimental canvas features in chrome://flags');
        }
        const offscreen = realCanvas.transferControlToOffscreen();

        this.worker.postMessage({
          command: 'start',
          opts: Object.assign({}, opts, {canvas: offscreen})
        }, [offscreen]);

        this.canvas = realCanvas;

        this._onInitialize(this);
      })
      .then(() => {
        if (!this._stopped && !this._animationFrameId) {
          this._animationFrameId = requestAnimationFrame(this._updateFrame);
        }
      });
    }
    return this;
  }

  setViewParameters(params) {
    this.worker.postMessage({command: 'setViewParameters', params});
    return this;
  }

  stop() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
      this._stopped = true;
      this._onFinalize(this);
    }
    this.worker.postMessage({command: 'stop'});
    return this;
  }

  _updateFrame() {
    if (this.canvas) {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const width = this.canvas.clientWidth * devicePixelRatio;
      const height = this.canvas.clientHeight * devicePixelRatio;

      if (this.width !== width || this.height !== height) {
        this.width = width;
        this.height = height;
        this.worker.postMessage({
          command: 'resize',
          width,
          height
        });
      }
    }
    this._animationFrameId = requestAnimationFrame(this._updateFrame);
  }

}
