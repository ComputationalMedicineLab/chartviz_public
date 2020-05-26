/**
 * Provides a visualization of lab events over time
 */
import React from 'react';
import styled from 'styled-components';
import isNil from 'lodash/isNil';

import TBody from './TBody';

import VertInfoTable from '../VertInfoTable';
import { SVGTooltip } from '../utils';

const BaseLine = styled.line.attrs({
  x1: 0,  x2: '100%',
  y1: 12, y2: 12,
  stroke: '#404040',
})`
  opacity: 0.2;
  ${TBody}:hover & {
    opacity: 1.0
  };
  transition: opacity 100ms;
`;

export default class Chart extends React.Component {
  renderLab = (lab, i=-1) => {
    const { datetime, unit, value } = lab;
    const { colorscale, X } = this.props;

    let lo = lab.normal_min;
    let hi = lab.normal_max;
    let rangeLabel = 'Normal Range';
    if (lo === hi || isNil(lo) || isNil(hi)) {
      lo = this.props.lab.perc_25;
      hi = this.props.lab.perc_75;
      rangeLabel = 'InterQuartile Range';
    }

    let cy = 12;
    if (value > hi) cy = 6;
    if (value < lo) cy = 18;

    const data = [
      {label: 'Date', value: datetime.format('YYYY-MM-DD HH:mm')},
      {label: 'Value', value: value.toFixed(2)},
      {label: rangeLabel, value: `${lo.toFixed(2)} - ${hi.toFixed(2)}`}
    ];

    if (unit !== '.' && unit)
      data[1].value += ` ${unit}`;

    const tooltip = hover => (
      <div className='popup-box'>
        <VertInfoTable data={data} />
      </div>
    );
    const children = hover => (
      <circle r={6}
        cx={X(datetime)}
        cy={cy}
        fill={colorscale(value)}
        fillOpacity={hover ? 1.0 : 0.5}
        stroke='black'
        strokeWidth={hover ? '1px' : 0}
      />
    );

    return <SVGTooltip tooltip={tooltip} children={children} />;
  }

  render() {
    return (
      <svg id={`lab-${this.props.name}`}
        viewBox='0 0 960 24'
        preserveAspectRatio='xMinYMid'
        width='100%'
      >
        <g transform='translate(10)'>
          { this.props.lab.events.map(this.renderLab) }
        </g>
        <BaseLine />
      </svg>
    );
  }
}
