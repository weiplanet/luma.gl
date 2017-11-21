/* eslint-disable no-var, max-statements */
import {GL, AnimationLoop, AnimationLoopOffThread, Matrix4, radians, setParameters, pickModels,
  Cube, picking, dirlight} from 'luma.gl';
import createWorker from 'webworkify-webpack';
import {animationLoopOptions} from './worker';

// Required by webworkify-webpack :(
// TODO - investigate other web worker solutions
const worker = createWorker(require.resolve('./worker'));

let pickPosition = [0, 0];
function mousemove(e) {
  pickPosition = [e.offsetX, e.offsetY];
}
function mouseleave(e) {
  pickPosition = null;
}

const animationLoop = new AnimationLoop(animationLoopOptions);

const animationLoopOffThread = new AnimationLoopOffThread({
  worker,
  // onInitialize: ({canvas}) => {
  //   canvas.addEventListener('mousemove', mousemove);
  //   canvas.addEventListener('mouseleave', mouseleave);
  // },
  // onFinalize: ({canvas}) => {
  //   canvas.removeEventListener('mousemove', mousemove);
  // }
});

animationLoop.getInfo = () => {
  return `
    <p>
    Cube drawn with <b>instanced rendering</b>.
    <p>
    A luma.gl <code>Cube</code>, rendering 65,536 instances in a
    single GPU draw call using instanced vertex attributes.
  `;
};

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
  window.animationLoopOffThread = animationLoopOffThread;
}
