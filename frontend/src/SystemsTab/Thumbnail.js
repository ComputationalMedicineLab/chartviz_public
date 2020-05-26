/**
 * Provides a thumbnail grid view of a single system
 */
import React, { Component } from 'react';
import { Icon } from 'react-icons-kit';
import { blocked } from 'react-icons-kit/icomoon/blocked'

import { zip } from 'd3-array';
import { hsl } from 'd3-color';
import { scaleLinear, scaleTime } from 'd3-scale';
import { area, line, curveNatural } from 'd3-shape';

const NoSign = `
  M150,0
  A150 150 0 1 0 150,300
  A150 150 0 1 0 150,0Z
  M75.586,54.102
  A121.429 121.429 0 0 1 150,28.571
  A121.429 121.429 0 0 1 271.429,150
  A121.429 121.429 0 0 1 245.898,224.414Z
  M224.414,245.898
  A121.429 121.429 0 0 1 150,271.429
  A121.429 121.429 0 0 1 28.571,150
  A121.429 121.429 0 0 1 54.102,75.586Z
`;

export default class Thumbnail extends Component {
  constructor(props) {
    super(props);
    this.state = { isHovered: false };
  }

  componentDidUpdate(prevProps) {
    const id = `thumbnail-${this.props.chapter.code}`;
    // Scroll to this component whenever it becomes focused (i.e. its
    // corresponding detail is being shown)
    if (this.props.isFocused && !prevProps.isFocused) {
      document.getElementById(id).scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  renderChart() {
    const {chapter, dategrid, range} = this.props;
    const {isHovered} = this.state;
    const color = hsl(chapter.color);

    const X = scaleTime()
      .domain([
        dategrid[0],
        dategrid[dategrid.length - 1],
      ])
      .range([0, 960]);

    const Y = scaleLinear()
      .domain(range)
      .range([500, 0]);

    const A = area()
      .curve(curveNatural)
      .x(d => X(d.x))
      .y0(500)
      .y1(d => Y(d.y));

    const L = line()
      .curve(curveNatural)
      .x(d => X(d.x))
      .y(d => Y(d.y));

    const curve = zip(dategrid, chapter.intensity).map(
      ([x, y]) => ({x, y})
    );

    const titleText = (
      <text x='50%' y='20%'
        textAnchor='middle'
        alignmentBaseline='hanging'
        style={{ fontSize: '4em' }}
        fillOpacity={isHovered ? 1.0 : 0.3}
      >
        { chapter.description }
      </text>
    );

    return (
      <g>
        { !isHovered && titleText }
        <path d={L(curve)} stroke={color.hex()} fill='none' strokeWidth='2px' />
        <path d={A(curve)} fill={color.brighter().hex()} />
        { isHovered && titleText }
      </g>
    );
  }

  renderEmpty() {
    const {chapter} = this.props;
    const {isHovered} = this.state;
    const titleText = (
      <text x='50%' y='20%'
        textAnchor='middle'
        alignmentBaseline='hanging'
        style={{ fontSize: '4em' }}
        fillOpacity={isHovered ? 1.0 : 0.75}
      >
        { chapter.description }
      </text>
    );
    return (
      <g fill='#f1f1f1'>
        <rect height='100%' width='100%' fill='#000' fillOpacity='0.33' />
        { !isHovered && titleText }
        <path d={NoSign}
          transform="scale(0.75, 0.75) translate(480, 250)"
          fillOpacity={isHovered ? 1.0 : 0.75}
        />
        { isHovered && titleText }
      </g>
    );
  }

  render() {
    const id = `thumbnail-${this.props.chapter.code}`;
    return (
      <div className='system-thumbnail' onClick={this.props.toggleFocus}>
        <svg
          id={id}
          viewBox='0 0 960 500'
          width='100%'
          height='100%'
          onMouseEnter={() => this.setState({ isHovered: true })}
          onMouseLeave={() => this.setState({ isHovered: false })}
        >
          {
            this.props.chapter.phecodes.length == 0
              ? this.renderEmpty()
              : this.renderChart()
          }
        </svg>
      </div>
    );
  }
}
