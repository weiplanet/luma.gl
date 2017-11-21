import {
  AnimationLoopOffThread
} from 'luma.gl';
import createWorker from 'webworkify-webpack';

// Required by webworkify-webpack :(
// TODO - investigate other web worker solutions
const worker = createWorker(require.resolve('./worker'));

const animationLoop = new AnimationLoopOffThread({worker});

animationLoop.getInfo = () => {
  return `
    <p>
    Simple <b>shadow mapping</b>.
    <p>
    A luma.gl <code>Cube</code>, rendering into a shadowmap framebuffer
    and then rendering onto the screen.
  `;
};

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}

