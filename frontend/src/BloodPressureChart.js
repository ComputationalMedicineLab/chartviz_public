import React from 'react';
import * as moment from 'moment';
import { min, max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { timeFormat } from 'd3-time-format';
import { timeYear, timeMonth, timeDay } from 'd3-time';

const chartWd = 900;
const chartHt = 300;
const top = 20;
const right = 20;
const bottom = 30;
const left = 40;
const svgHt = chartHt + top + bottom;
const svgWd = chartWd + left + right;
const viewBox = `0 0 ${svgWd} ${svgHt}`;

function stroke(status) {
  switch(status) {
    case 'normal': return 'silver';
    case 'pre-hypertensive': return 'lightcoral';
    case 'hypertensive': return 'firebrick';
    case 'hypotensive': return 'steelblue';
  }
}

export default class BloodPressureChart extends React.Component {
  constructor(props) {
    super(props);
    this.drawAxes = this.drawAxes.bind(this);
    this.xAxisRef = React.createRef();
    this.yAxisRef = React.createRef();
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

  get yDomain() {
    return [
      min(this.props.bloodPressure, d => d.diastolic),
      max(this.props.bloodPressure, d => d.systolic),
    ];
  }

  get xScale() {
    return scaleTime()
      .domain(this.xDomain)
      .nice()
      .range([0, chartWd]);
  }

  get yScale() {
    return scaleLinear()
      .domain(this.yDomain)
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

    select(this.yAxisRef.current)
      .call(axisLeft(this.yScale))
      .selectAll('text')
      .style('font-size', 8)
      .style('font-style', 'italic');
  }

  render() {
    const X = this.xScale;
    const Y = this.yScale;
    const [lo, hi] = X.domain();

    const bloodPressure = this.props.bloodPressure
      .filter(({ date }) => date.isBetween(lo, hi));


    const bars = [];
    const circles = [];
    bloodPressure.map(({ date, systolic, diastolic, status }, i) => {
      const x = X(date);
      const yS = Y(systolic);
      const yD = Y(diastolic);
      bars.push(
        <line
          key={`bar-${i}`}
          x1={x} y1={yS+2} x2={x} y2={yD-2}
          stroke={stroke(status)}
          strokeWidth={2}
          strokeOpacity={0.5}
        />
      );
      circles.push(
        <circle
          key={`sys-${i}`}
          cy={yS} cx={x} r={2}
          fill='firebrick' fillOpacity={0.5}
        />
      );
      circles.push(
        <circle
          key={`dia-${i}`}
          cy={yD} cx={x} r={2}
          fill='steelblue' fillOpacity={0.5}
        />
      );
    });

    let pulseCharts = [];
    if (this.props.showPulse) {
      pulseCharts = this.props.pulse
        .filter(({ date }) => date.isBetween(lo, hi))
        .map(({ date, value }, i) => (
          <rect
            key={i}
            y={Y(value)} x={X(date)} height={5} width={5} rx={2} ry={2}
            fill='green' fillOpacity={0.6}
          />
        ));
    }

    return (
      <svg viewBox={viewBox}>
        <g transform={`translate(${left}, ${top})`}>
          {/* Axes */}
          <g transform={`translate(0, ${chartHt})`} ref={this.xAxisRef} />
          <g ref={this.yAxisRef} />

          {/* The Actual Chart */}
          <g>{ bars }</g>
          {/* <g>{ circle }</g> */}
          <g>{ this.props.showPulse && pulseCharts }</g>

          {/* Circles Legend */}
          <g transform='translate(10, 10)'>
            <rect width={121} height={30} fill='white' stroke='black' />
            <g transform='translate(10, 14)'>
              <circle cy={-4} r={4} fill='firebrick' fillOpacity={0.5} />
              <text x={8} style={{ fontSize: '12px' }} >
                Systolic
              </text>
            </g>
            <g transform='translate(10, 26)'>
              <circle cy={-4} r={4} fill='steelblue' fillOpacity={0.5} />
              <text x={8} style={{ fontSize: '12px' }} >
                Diastolic
              </text>
            </g>
          </g>

          {/* Lines legend */}
          <g transform='translate(10, 50)'>
            <rect width={121} height={60} fill='white' stroke='black' />
            <g transform='translate(10, 16)'>
              <rect
                y={-9} x={-4}
                height={10} width={10} rx={2} ry={2}
                fill='silver' fillOpacity={0.5}
                stroke='gray' strokeWidth={1}
              />
              <text x={8} style={{ fontSize: '12px' }} >
                Normal
              </text>
            </g>
            <g transform='translate(10, 30)'>
              <rect
                y={-9} x={-4}
                height={10} width={10} rx={2} ry={2}
                fill='lightcoral' fillOpacity={0.5}
                stroke='gray' strokeWidth={1}
              />
              <text x={8} style={{ fontSize: '12px' }} >
                Pre-Hypertensive
              </text>
            </g>
            <g transform='translate(10, 42)'>
              <rect
                y={-9} x={-4}
                height={10} width={10} rx={2} ry={2}
                fill='firebrick' fillOpacity={0.5}
                stroke='gray' strokeWidth={1}
              />
              <text x={8} style={{ fontSize: '12px' }} >
                Hypertensive
              </text>
            </g>
            <g transform='translate(10, 54)'>
              <rect
                y={-9} x={-4}
                height={10} width={10} rx={2} ry={2}
                fill='steelblue' fillOpacity={0.5}
                stroke='gray' strokeWidth={1}
              />
              <text x={8} style={{ fontSize: '12px' }} >
                Hypotensive
              </text>
            </g>
          </g>

        </g>
      </svg>
    );
  }
}
