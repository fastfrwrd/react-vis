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

import React, {PropTypes} from 'react';

import * as forceUtils from '../utils/force-utils';

/**
 * create and run a simulation based on the props.
 * @param {object} props
 * @returns {object} the d3-force simulation, run to fruition
 */
function _getSimulation(props) {
  if (props.simulationFactory) {
    return forceUtils.runSimulation(props.simulationFactory(props));
  }

  return forceUtils.runSimulation(
    forceUtils.createSimulation(props)
  );
}

/**
 * map the original props to an O(1) lookup map by id. also
 * apply defaults at this time for hydrating later.
 * @param {array} items - an array of objects
 * @param {function} _id - a method that, when called with the
 *   item, will return the id
 * @param {object} defaults - an optional object containing
 *   default values to assign befroe applying the value from items
 * @returns {object} map of values with defaults applied with
 *   the ids as the keys
 */
function _mapItemsById(items, _id, defaults) {
  return items.reduce(
    (obj, item) => Object.assign(obj, {
      [_id(item)]: Object.assign({}, defaults, item)
    }), {}
  );
}

/**
 * immutably return an object which hydrates the values
 * from the item map onto the provided item.
 * @param {object} item
 * @param {function} _id - a method that, when called with the
 *   item, will return the id
 * @param {object} map - the return value of _mapItemsById
 * @returns {object} hydrated item
 */
function _hydrateFromMap(item, _id, map) {
  return Object.assign({}, item, map[_id(item)]);
}

const NODE_DEFAULTS = {
  radius: 5,
  opacity: 1,
  color: '#333',
  stroke: '#fff',
  strokeWidth: 1.5,
  showLabel: false
};

const LINK_DEFAULTS = {
  opacity: 0.6,
  color: '#999'
};

ForceDirectedGraph.propTypes = {
  // data
  nodes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    group: PropTypes.number
  })).isRequired,
  links: PropTypes.arrayOf(PropTypes.shape({
    source: PropTypes.string,
    target: PropTypes.string,
    value: PropTypes.number
  })).isRequired,

  // display
  width: PropTypes.number,
  height: PropTypes.number,

  // create custom simulations
  simulationFactory: PropTypes.func,

  // adjust parameters of the default simulation
  alpha: PropTypes.number,
  alphaDecay: PropTypes.number,
  alphaMin: PropTypes.number,
  alphaTarget: PropTypes.number,
  velocityDecay: PropTypes.number,
  chargeStrength: PropTypes.func,

  // adjust label display
  labelAttr: PropTypes.string,
  labelOffset: PropTypes.shape({
    x: PropTypes.func,
    y: PropTypes.func
  }),
  showLabels: PropTypes.bool,

  // interaction bindings
  onBlurNode: PropTypes.func,
  onClickLabel: PropTypes.func,
  onClickNode: PropTypes.func,
  onHoverNode: PropTypes.func
};

ForceDirectedGraph.defaultProps = {
  width: 900,
  height: 600,
  labelAttr: 'id',
  labelOffset: {
    x: node => (node.radius / 2) + 5,
    y: node => 5 - node.radius
  },
  showLabels: false,
  onBlurNode() {},
  onClickLabel() {},
  onClickNode() {},
  onHoverNode() {}
};

function ForceDirectedGraph(props) {
  const {
    width,
    height,
    nodes,
    links,
    labelAttr,
    labelOffset,
    showLabels
  } = props;
  const nodeMap = _mapItemsById(nodes, forceUtils.nodeId, NODE_DEFAULTS);
  const linkMap = _mapItemsById(links, forceUtils.linkId, LINK_DEFAULTS);
  const simulation = _getSimulation(props);

  const linkElements = [];
  const nodeElements = [];
  const labelElements = [];

  // hydrate the nodes and create an array of nodes and labels
  simulation.nodes().forEach(positionNode => {
    const node = _hydrateFromMap(positionNode, forceUtils.nodeId, nodeMap);

    nodeElements.push(
      <circle
        className="force-directed-graph--node"
        key={forceUtils.nodeId(node)}
        cx={positionNode.x}
        cy={positionNode.y}
        r={node.radius}
        fill={node.color}
        opacity={node.opacity}
        stroke={node.stroke}
        strokeWidth={node.strokeWidth}
        style={node.style}
        onMouseEnter={() => props.onHoverNode(node)}
        onMouseLeave={() => props.onBlurNode(node)}
        onClick={() => props.onClickNode(node)}
      />
    );

    if (showLabels || node.showLabel) {
      labelElements.push(
        <text
          className="force-directed-graph--label"
          key={`${forceUtils.nodeId(node)}-label`}
          style={node.labelStyle}
          x={node.x + labelOffset.x(node)}
          y={node.y + labelOffset.y(node)}
          onClick={() => props.onClickLabel(node)}
        >
          {node[labelAttr]}
        </text>
      );
    }
  });

  // hydrate the links and create an array of links
  simulation.force('link').links().forEach(positionLink => {
    const {source, target} = positionLink;
    const link = _hydrateFromMap(positionLink, forceUtils.linkId, linkMap);

    linkElements.push(
      <line
        className="force-directed-graph--link"
        key={forceUtils.linkId(link)}
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke={link.color}
        opacity={link.opacity}
        style={link.style}
        strokeWidth={Math.sqrt(link.value)}
      />
    );
  });

  return (
    <svg className="force-directed-graph" width={width} height={height}>
      {props.children}
      <g className="force-directed-graph--links">{linkElements}</g>
      <g className="force-directed-graph--nodes">{nodeElements}</g>
      <g className="force-directed-graph--labels">{labelElements}</g>
    </svg>
  );
}

export default ForceDirectedGraph;
