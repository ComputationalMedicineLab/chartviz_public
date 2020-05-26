import React from 'react';
import debounce from 'lodash/debounce';
import { axisRight } from 'd3-axis';
import { hsl } from 'd3-color';
import { area, line } from 'd3-shape';
import { mouse, select } from 'd3-selection';
import { curveMonotoneX } from 'd3-shape';
import { timeYear, timeMonth, timeDay } from 'd3-time';
import { timeFormat } from 'd3-time-format';


export default class Intensity extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.curve = React.createRef();
    this.overlay = React.createRef();
    this.yaxis = React.createRef();
  }

  setOffset = debounce((offsetX) => {
    this.setState({offsetX});
  }, 10)

  componentDidMount() {
    const setOffset = this.setOffset.bind(this);
    select(this.overlay.current)
      .on('mousemove', function() {
        const offsetX = mouse(this)[0];
        setOffset(offsetX);
      });

    select(this.yaxis.current)
      .call(axisRight(this.props.Y))
      .select('.tick:first-of-type text')
      .attr('dy', '-0.5em');
  }

  getCircleY = (offsetX) => {
    if (!this.curve.current) return 0;
    let beginning = 0;
    let end = this.curve.current.getTotalLength();
    let target, pos;
    while (true) {
      target = Math.floor((beginning + end) / 2);
      pos = this.curve.current.getPointAtLength(target);
      if ((target === end || target === beginning) && pos.x !== offsetX) {
        break;
      }
      if (pos.x > offsetX)      end = target;
      else if (pos.x < offsetX) beginning = target;
      else break; //position found
    }
    return pos.y;
  }

  render() {
    const { X, Y, curve } = this.props;
    const { offsetX } = this.state;
    const color = hsl('steelblue');

    const A = area()
      .curve(curveMonotoneX)
      .x(d => X(d.x))
      .y0(500)
      .y1(d => Y(d.y));

    const L = line()
      .curve(curveMonotoneX)
      .x(d => X(d.x))
      .y(d => Y(d.y));

    return (
      <svg width='100%' viewBox='0 0 960 500'>
        <g>
          {/* Intensity chart */}
          <g>
            <path ref={this.curve} d={L(curve)} stroke={color.hex()} fill='none' strokeWidth='2px' />
            <path d={A(curve)} fill={color.brighter().hex()} />
          </g>

          {/* Mouse tracking line */}
          <g transform={`translate(${offsetX || 0})`}>
            <path stroke='black' strokeWidth='1px' d='M0,0 V500' />
            <g transform={`translate(0 ${this.getCircleY(offsetX)})`}>
              <circle r={6} strokeWidth={1} stroke='black' fill='none' />
            </g>
          </g>

          {/* Cursor Legend */}
          <g transform='translate(60, 12)'>
            <rect x={-4} width={144} height={50} fill='white' stroke='black' />
            <text alignmentBaseline='hanging' y={10} style={{ fontWeight: 'bold' }}>
              Date
            </text>
            <text alignmentBaseline='hanging' y={10} dx='5%'>
              {offsetX ? X.invert(offsetX).toLocaleDateString() : ''}
            </text>
            <text alignmentBaseline='hanging' y={30} style={{ fontWeight: 'bold' }}>
              EPD
            </text>
            <text alignmentBaseline='hanging' y={30} dx='5%'>
              {offsetX ? Y.invert(this.getCircleY(offsetX)).toLocaleString() : ''}
            </text>
          </g>

          {/* The Y Axis, drawn inside the graph */}
          <g ref={this.yaxis} />

          {/* Mouse tracking overlay */}
          <rect ref={this.overlay}
            height='100%' width='100%'
            fill='none' pointerEvents='all'
          />
        </g>
      </svg>
    );
  }
}
