/**
 * Interactive single System Overview
 */
import React from 'react';
import { Icon } from 'react-icons-kit';
import { remove } from 'react-icons-kit/fa/remove'
import debounce from 'lodash/debounce';

import { axisBottom, axisLeft } from 'd3-axis';
import { zip } from 'd3-array';
import { hsl } from 'd3-color';
import { scaleLinear, scaleTime } from 'd3-scale';
import { area, line } from 'd3-shape';
import { mouse, select } from 'd3-selection';
import { curveMonotoneX } from 'd3-shape';
import { timeYear, timeMonth, timeDay } from 'd3-time';
import { timeFormat } from 'd3-time-format';

import PhecodeLabel from './PhecodeLabel';
import { SVGTooltip } from '../utils';
import TickTooltip from '../TickTooltip';

const width = 880;
const height = 480;

export default class Detail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.xaxis = React.createRef();
    this.yaxis = React.createRef();
    this.curve = React.createRef();
    this.overlay = React.createRef();
    this.phecodeOverlays = [];
  }

  setOffset = debounce((offsetX) => {
    this.setState({offsetX});
  }, 10)

  /* Property preprocessing */
  static getDerivedStateFromProps(props, state) {
    const {range, dategrid, chapter} = props;
    const curve = zip(dategrid, chapter.intensity).map(([x, y]) => ({x, y}));
    const color = hsl(chapter.color || 'steelblue');

    const X = scaleTime()
      .domain([
        timeYear(dategrid[0]),
        timeDay.ceil(dategrid[dategrid.length - 1])
      ])
      .range([0, width]);

    /* Y scale domain is scaled to fit the input curve plus 10% */
    const Y = scaleLinear()
      .domain([0, Math.max(...chapter.intensity)*1.1])
      .range([height, 0]);

    return {...state, curve, color, X, Y};
  }

  componentDidMount() {
    const { X, Y } = this.state;
    const setOffset = this.setOffset.bind(this);

    /* Let D3 figure out where the mouse is */
    const overlayRefs = [this.overlay, ...this.phecodeOverlays];
    overlayRefs.forEach(ref =>
      select(ref.current)
        .on('mousemove', function() {
          const offsetX = mouse(this)[0];
          setOffset(offsetX);
        })
    );

    /* Build the X axis svg elements */
    select(this.xaxis.current)
      .call(axisBottom(X)
        .ticks(timeYear)
        .tickFormat(timeFormat('%Y'))
        .tickPadding(0)
      )
      .attr('text-anchor', null)
      .selectAll('text')
      .attr('text-anchor', 'start')
      .attr('x', 2)
      .style('font-size', 8)
      .style('font-style', 'italic');

    /* Build the Y axis svg elements */
    select(this.yaxis.current)
      .call(axisLeft(Y));
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
    const { X, Y, curve, color, offsetX } = this.state;
    const { chapter } = this.props;

    const A = area()
      .curve(curveMonotoneX)
      .x(d => X(d.x))
      .y0(height)
      .y1(d => Y(d.y));

    const L = line()
      .curve(curveMonotoneX)
      .x(d => X(d.x))
      .y(d => Y(d.y));

    const topCodes = chapter.phecodes
      .sort((a, b) =>  {
        // Sort first on the number of events.  In the event of a tie, sort
        // lexically by code as string.
        const diff = b.total - a.total;
        if (diff) return diff;
        return a.code > b.code
          ? -1
          : (a.code < b.code ? 1 : 0);
      })
      .slice(0, 5);

    const cells = [];
    this.phecodeOverlays = [];

    topCodes.forEach(phecode => {
      const { id, code, description, icds } = phecode;
      cells.push(
        <PhecodeLabel
          phecode={phecode}
          key={`label-${code}`}
          onClick={() => {
            // console.log('Phecode click handler firing');
            this.props.onSelectPhecode({ id, code, description });
          }}
        />
      );
      const rects = icds
        .reduce((arr, item) => [...arr, ...item.events], [])
        .map(e => new Date(e))
        .sort()
        .map((e, i) => (
          <SVGTooltip key={i} tooltip={hover => <TickTooltip date={e} />}>
            <rect x={X(e)} width={1} height={26} fill='#cb4154' />
          </SVGTooltip>
        ));
      const ref = React.createRef();
      this.phecodeOverlays.push(ref);
      const chart = (
        <svg key={`chart-${code}`} width='100%' viewBox='0 0 960 24'>
          <g transform='translate(80)'>
            {/* Mouse tracking overlay */}
            <rect ref={ref}
              height={height} width={width}
              fill='none' pointerEvents='all'
            />
            <g>{ rects }</g>
            <g transform={`translate(${offsetX || 0})`}>
              <path stroke='black' strokeWidth='1px' d={`M0,0 V${height}`} />
            </g>
          </g>
        </svg>
      );
      cells.push(chart);
    });

    return (
      <div className='system-detail'>
        <div className='system-detail-info'>
          <h4>
            { chapter.description }
            <button className='system-detail-close' onClick={this.props.onRemove}>
              <Icon icon={remove} />
            </button>
          </h4>
          <h4>
            Chapter Phecodes
          </h4>
        </div>
        <div>
          <svg width='100%' height='100%' viewBox='0 0 960 500'>
            <g transform='translate(80)'>
              {/* Intensity chart */}
              <g>
                <path ref={this.curve} d={L(curve)} stroke={color.hex()} fill='none' strokeWidth='2px' />
                <path d={A(curve)} fill={color.brighter().hex()} />
              </g>

              {/* Mouse tracking line */}
              <g transform={`translate(${offsetX || 0})`}>
                <path stroke='black' strokeWidth='1px' d={`M0,0 V${height}`} />
                <g transform={`translate(0 ${this.getCircleY(offsetX)})`}>
                  <circle r={6} strokeWidth={1} stroke='black' fill='none' />
                </g>
              </g>

              {/* Cursor Legend */}
              <g transform='translate(12, 12)'>
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

              {/* Axes */}
              <g ref={this.yaxis} />
              <g ref={this.xaxis} transform={`translate(0 ${height})`} />

              {/* Y Axis Title */}
              <g transform={`translate(-50, ${height / 2})`}>
                <text textAnchor='middle' transform='rotate(-90)'>
                  Events per Diem
                </text>
              </g>

              {/* Mouse tracking overlay */}
              <rect ref={this.overlay}
                height={height} width={width}
                fill='none' pointerEvents='all'
              />
            </g>
          </svg>
        </div>
        { cells }
      </div>
    );
  }
}
