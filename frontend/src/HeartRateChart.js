import React from 'react';
import * as moment from 'moment';
import { min, max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { timeFormat } from 'd3-time-format';
import { timeYear, timeMonth, timeDay } from 'd3-time';

const chartWd = 900;
// two charts separated by `middle`
const chartHt = 120;
const middle = 10;
const top = 20;
const right = 20;
const bottom = 30;
const left = 40;
const svgHt = (chartHt * 2) + middle + top + bottom;
const svgWd = chartWd + left + right;
const viewBox = `0 0 ${svgWd} ${svgHt}`;

export default class HeartRateChart extends React.Component {
  constructor(props) {
    super(props);
    this.drawAxes = this.drawAxes.bind(this);
    this.xAxisRef = React.createRef();
    this.pulseAxisRef = React.createRef();
    this.respRtAxisRef = React.createRef();
  }

  componentDidMount() {
    this.drawAxes();
  }

  componentDidUpdate(props) {
    if (props.timeframe !== this.props.timeframe)
      this.drawAxes();
  }

  get xDomain() {
    const { timeframe } = this.props;
    let xstart;
    if (timeframe == 'month') {
      xstart = moment.utc().subtract(1, 'months');
    } else if (timeframe == 'year') {
      xstart = moment.utc().subtract(1, 'years');
    } else {
      xstart = moment.utc('2001-01-01');
    }
    const xstop = moment.utc();
    return [xstart, xstop];
  }

  get pulseDomain() {
    return [
      min(this.props.pulse, d => d.value),
      max(this.props.pulse, d => d.value),
    ];
  }

  get respRtDomain() {
    return [
      min(this.props.respRt, d => d.value),
      max(this.props.respRt, d => d.value),
    ];
  }

  get xScale() {
    return scaleTime()
      .domain(this.xDomain)
      .nice()
      .range([0, chartWd]);
  }

  get pulseScale() {
    return scaleLinear()
      .domain(this.pulseDomain)
      .nice()
      .range([chartHt, 0]);
  }

  get respRtScale() {
    return scaleLinear()
      .domain(this.respRtDomain)
      .nice()
      .range([chartHt, 0]);
  }

  drawAxes() {
    const { timeframe } = this.props;
    let axisGen = axisBottom(this.xScale).tickPadding(0);

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

    const xAxis = select(this.xAxisRef.current)
      .call(axisGen);

    xAxis
      .attr('text-anchor', null)
      .selectAll('text')
      .attr('text-anchor', 'start')
      .attr('x', 2)
      .attr('alignment-baseline', 'middle')
      .style('font-size', 8)
      .style('font-style', 'italic');
    xAxis
      .select('.tick:last-of-type text')
      .remove();

    select(this.pulseAxisRef.current)
      .call(axisLeft(this.pulseScale))
      .selectAll('text')
      .style('font-size', 8)
      .style('font-style', 'italic');

    select(this.respRtAxisRef.current)
      .call(axisLeft(this.respRtScale))
      .selectAll('text')
      .style('font-size', 8)
      .style('font-style', 'italic');
  }

  render() {
    const [xmin, xmax] = this.xDomain;

    const pulse = this.props.pulse
      .filter(({ date }) => date.isBetween(xmin, xmax))
      .map(({ date, value }, i) =>
        <circle
          key={i} r={2}
          cx={this.xScale(date)}
          cy={this.pulseScale(value)}
          fill='firebrick' fillOpacity={0.5}
        />
      );

    const respRt = this.props.respRt
      .filter(({ date }) => date.isBetween(xmin, xmax))
      .map(({ date, value }, i) =>
        <circle
          key={i} r={2}
          cx={this.xScale(date)}
          cy={this.respRtScale(value)}
          fill='steelblue' fillOpacity={0.5}
        />
      );

    return (
      <svg viewBox={viewBox}>
        <g transform={`translate(${left}, ${top})`}>
          {/* Axes */}
          <g ref={this.xAxisRef} transform={`translate(0, ${(chartHt * 2) + middle})`} />
          <g ref={this.pulseAxisRef} />
          <g ref={this.respRtAxisRef} transform={`translate(0, ${(chartHt + middle)})`} />

          {/* The Actual Charts */}
          <g>{ pulse }</g>
          <g transform={`translate(0, ${chartHt + middle})`}>{ respRt }</g>

          {/* Legend */}
          <g transform='translate(10, 10)'>
            <rect width={121} height={30} fill='white' stroke='black' />
            <g transform='translate(10, 14)'>
              <circle cy={-4} r={4} fill='firebrick' fillOpacity={0.5} />
              <text x={8} style={{ fontSize: '12px' }} >
                Pulse
              </text>
            </g>

            <g transform='translate(10, 26)'>
              <circle cy={-4} r={4} fill='steelblue' fillOpacity={0.5} />
              <text x={8} style={{ fontSize: '12px' }} >
                Respiratory Rate
              </text>
            </g>
          </g>
        </g>
      </svg>
    );
  }
}
