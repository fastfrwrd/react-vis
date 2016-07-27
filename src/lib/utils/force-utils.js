// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter
} from 'd3-force';

/**
 * given a force-directed graph node, return its id.
 * @param {object} node
 * @returns {string} id
 */
export function nodeId(node) {
  return node.id;
}

/**
 * given a force-directed graph link, return its id.
 * @param {object} link
 * @returns {string} id
 */
export function linkId(link) {
  return `${link.source.id || link.source}=>${link.target.id || link.target}`;
}

/**
 * run the simulation and stop it after the appropriate number of steps.
 * @param {object} simulation - a d3-force simulation ready to be run
 * @param {number} steps - the number of times to call tick
 * @returns {object} the run simulation
 */
export function runSimulation(simulation, steps = 300) {
  simulation.restart();

  // run the simulation to fruition and stop it.
  let i = 0;
  while (i < steps) {
    simulation.tick();
    i++;
  }

  simulation.stop();

  return simulation;
}

const ALPHA_FACTORS = [
  'alpha',
  'alphaDecay',
  'alphaMin',
  'alphaTarget',
  'velocityDecay'
];

/**
 * given the options, create a simulation.
 * @param {object} options
 * @param {number} options.height
 * @param {number} options.width
 * @param {object} options.data
 * @param {array} options.data.nodes
 * @param {array} options.data.links
 * @param {function} [options.chargeStrength]
 * @param {number} [options.alpha]
 * @param {number} [options.alphaDecay]
 * @param {number} [options.alphaMin]
 * @param {number} [options.alphaTarget]
 * @param {number} [options.velocityDecay]
 * @returns {object} d3-force simulation
 */
export function createSimulation(options) {
  // create a new simuation which contains standard parametersf
  const simulation = forceSimulation()
    .force('link', forceLink().id(nodeId))
    .force('charge', forceManyBody())
    .force('center', forceCenter(options.width / 2, options.height / 2));

  // apply the alpha factors that were set in the options
  ALPHA_FACTORS.forEach(alphaFactorName => {
    if (options.hasOwnProperty(alphaFactorName)) {
      simulation[alphaFactorName](options[alphaFactorName]);
    }
  });

  // apply the radius factor to our simulation
  if (options.chargeStrength) {
    simulation.force('charge').strength(options.chargeStrength);
  }

  // set the nodes and links for this simulation. provide
  // new instances to avoid mutating the underlying values.
  simulation.nodes(
    options.data.nodes.map(
      ({id, radius}) => ({id, radius})
    )
  );
  simulation.force('link').links(
    options.data.links.map(
      ({source, target, value}) => ({source, target, value})
    )
  );

  return simulation;
}
