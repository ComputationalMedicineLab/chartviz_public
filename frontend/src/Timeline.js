/**
 * A generic timeline component and some helper functions
 */
import React from 'react';
import isNil from 'lodash/isNil';
import { axisBottom } from 'd3-axis';
import { scaleTime } from 'd3-scale';
import { select } from 'd3-selection';
import { timeFormat } from 'd3-time-format';
import { timeYear, timeMonth, timeDay } from 'd3-time';
import last from 'lodash/last';

export default class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.xaxis = React.createRef();
  }

  componentDidMount() {
    this.drawAxis();
  }

  componentDidUpdate(props) {
    this.drawAxis();
  }

  drawAxis() {
    const { X, timeframe } = this.props;
    let axisGen = axisBottom(X).tickPadding(0);

    if (timeframe === 'month') {
      axisGen
        .ticks(timeDay)
        .tickFormat(timeFormat('%e'))
    }
    else if (timeframe === 'year') {
      axisGen
        .ticks(timeMonth)
        .tickFormat(timeFormat('%b'))
    }
    else {
      axisGen
        .ticks(timeYear)
        .tickFormat(timeFormat('%Y'));
    }

    const axis = select(this.xaxis.current).call(axisGen);

    axis
      .attr('text-anchor', null)
      .selectAll('text')
      .attr('text-anchor', 'start')
      .attr('x', 2)
      .attr('y', '50%')
      .attr('dy', 0)
      .attr('alignment-baseline', 'middle')
      .style('font-size', 8)
      .style('font-style', 'italic');

    axis
      .select('.domain')
      .remove();

    axis
      .selectAll('.tick line')
      .attr('y2', '100%');

    axis
      .select('.tick:last-of-type')
      .remove();
  }

  render() {
    const offset = isNil(this.props.offset) ? 10 : this.props.offset;

    return (
      <svg width='100%' viewBox='0 0 960 24'>
        <g ref={this.xaxis} transform={`translate(${offset})`}/>
      </svg>
    );
  }
}
