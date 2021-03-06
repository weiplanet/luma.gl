import {resolveModules, getDependencyGraph} from 'luma.gl/shadertools/src/lib/shader-modules';
import test from 'tape-catch';

// Dummy shader modules with dependencies
const fp32 = {
  name: 'fp32'
};

const fp64 = {
  name: 'fp64'
};

const project = {
  name: 'project',
  dependencies: [fp32]
};

const project64 = {
  name: 'project64',
  dependencies: [project, fp64]
};

test('ShaderModules#import', t => {
  t.ok(resolveModules !== undefined, 'resolveModules import successful');
  t.ok(getDependencyGraph !== undefined, 'getDependencyGraph import successful');
  t.end();
});

test('ShaderModules#getShaderDependencies', t => {
  const result = resolveModules([project64, project]);
  t.deepEqual(result, [fp32.name, project.name, fp64.name, project64.name], 'Module order is correct');
  t.end();
});

test('ShaderModules#getDependencyGraph', t => {
  const result = {};
  getDependencyGraph({
    modules: [project64, project],
    level: 0,
    result
  });
  t.deepEqual(result, {
    [fp32.name]: 2,
    [project.name]: 1,
    [fp64.name]: 1,
    [project64.name]: 0
  }, 'Module dependecny is correct');
  t.end();
});
