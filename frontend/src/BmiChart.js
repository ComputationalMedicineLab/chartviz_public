import React from 'react';
import * as moment from 'moment';
import { axisBottom, axisLeft } from 'd3-axis';
import { line } from 'd3-shape';
import { select } from 'd3-selection';
import { timeYear } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { scaleLinear, scaleTime } from 'd3-scale';

const margin = {
  left: 40,
  right: 20,
  top: 20,
  bottom: 20,
};

const dim = {
  width: 960,
  height: 320,
};

export default class BmiChart extends React.Component {
  constructor(props) {
    super(props);
    this.yaxis = React.createRef();
    this.xaxis = React.createRef();
    this.X = scaleTime()
      .domain([moment('2000-01-01'), moment()])
      .nice()
      .range([0, dim.width - margin.right - margin.left]);
    this.Y = scaleLinear()
      .domain([10, 50])
      .range([dim.height - margin.top - margin.bottom, 0]);
  }

  componentDidMount() {
    const xaxis = select(this.xaxis.current).call(
      axisBottom(this.X)
        .ticks(timeYear)
        .tickFormat(timeFormat('%Y'))
        .tickPadding(0)
    );

    xaxis
      .attr('text-anchor', null)
      .selectAll('text')
      .attr('text-anchor', 'start')
      .attr('x', 2)
      .attr('alignment-baseline', 'middle')
      .style('font-size', 8)
      .style('font-style', 'italic');

    xaxis
      .select('.tick:last-of-type text')
      .remove();

    const yaxis = select(this.yaxis.current).call(axisLeft(this.Y));

    yaxis
      .selectAll('text')
      .style('font-size', 8)
      .style('font-style', 'italic');
  }

  render() {
    const { bmi } = this.props;

    const Line = line()
      .x(d => this.X(d.date))
      .y(d => this.Y(d.value));

    return (
      <svg viewBox={`0 0 ${dim.width} ${dim.height}`}>
        <g
          transform={`translate(${margin.left}, ${dim.height - margin.bottom})`}
          ref={this.xaxis}
        />
        <g
          transform={`translate(${margin.left}, ${margin.top})`}
          ref={this.yaxis}
        />
        <g transform={`translate(${margin.left+1}, ${margin.top})`}>
          <rect
            fill='whitesmoke'
            width={dim.width - margin.left - margin.right}
            height={dim.height - margin.top - margin.bottom}
          />
          <path d={Line(bmi)} stroke='steelblue' fill='none' />
        </g>
      </svg>
    );
  }
}
