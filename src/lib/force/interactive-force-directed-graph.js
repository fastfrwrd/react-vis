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

import React, {Component, PropTypes} from 'react';

import ForceDirectedGraph from './force-directed-graph';
import {nodeId} from '../utils/force-utils';

const DEFAULT_NODE_STYLES = {
  cursor: 'pointer'
};
const DEFAULT_LABEL_STYLES = {
  cursor: 'pointer'
};

export default class InteractiveForceDirectedGraph extends Component {
  static get propTypes() {
    return Object.assign({
      defaultSelectedNode: PropTypes.shape({
        id: PropTypes.string
      }),
      opacityFactor: PropTypes.number,
      onSelectNode: PropTypes.func,
      onDeselectNode: PropTypes.func
    }, ForceDirectedGraph.propTypes);
  }

  static get defaultProps() {
    return {
      defaultSelectedNode: null,
      opacityFactor: 4,
      onSelectNode() {},
      onDeselectNode() {}
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      hoveredNode: null,
      selectedNode: props.defaultSelectedNode
    };
  }

  onHoverNode(hoveredNode) {
    this.setState({hoveredNode});
  }

  onBlurNode() {
    this.setState({hoveredNode: null});
  }

  onClickNode(selectedNode) {
    const previousNode = this.state.selectedNode;

    // if the user clicked the same node that was already
    // selected, deselect it.
    if (previousNode && nodeId(previousNode) === nodeId(selectedNode)) {
      this.setState({selectedNode: null});
      this.props.onDeselectNode(selectedNode);
    } else {
      this.setState({selectedNode});
      this.props.onSelectNode(selectedNode);
    }
  }

  onClickLabel(selectedNode) {
    this.onClickNode(selectedNode);
  }

  render() {
    const {
      onHoverNode,
      onBlurNode,
      onClickNode,
      onClickLabel,
      nodes,
      links,
      opacityFactor,
      ...spreadableProps
    } = this.props;

    const {
      hoveredNode,
      selectedNode
    } = this.state;

    function _applyOpacity(opacity = 1) {
      return opacity / opacityFactor;
    }

    /* eslint-disable func-style */
    const _createEventHanlder = (name, fn) => (...args) => {
      this[name](...args);
      if (fn) {
        fn(...args);
      }
    };
    /* eslint-enable func-style */

    // style the nodes with opacity and label settings
    // based on selection and hovering.
    const styledNodes = nodes.map(node => Object.assign({}, node, {
      style: Object.assign({}, DEFAULT_NODE_STYLES, node.styles),
      labelStyle: Object.assign({}, DEFAULT_LABEL_STYLES, node.labelStyles),
      showLabel: (selectedNode && nodeId(selectedNode) === nodeId(node)) ||
        (hoveredNode && nodeId(hoveredNode) === nodeId(node)),
      opacity: (selectedNode || hoveredNode) &&
        (!selectedNode || nodeId(selectedNode) !== nodeId(node)) &&
        (!hoveredNode || nodeId(hoveredNode) !== nodeId(node)) ?
          _applyOpacity(node.opacity) :
          node.opacity
    }));

    // style the links based on selection and hovering
    const styledLinks = links.map(link => Object.assign({}, link, {
      opacity: selectedNode || hoveredNode ?
        _applyOpacity(link.opacity) :
        link.opacity
    }));

    return (
      <ForceDirectedGraph
        {...spreadableProps}
        nodes={styledNodes}
        links={styledLinks}
        onHoverNode={_createEventHanlder('onHoverNode', onHoverNode)}
        onBlurNode={_createEventHanlder('onBlurNode', onBlurNode)}
        onClickNode={_createEventHanlder('onClickNode', onClickNode)}
        onClickLabel={_createEventHanlder('onClickNode', onClickLabel)}
      />
    );
  }
}
