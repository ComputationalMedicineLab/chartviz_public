import React from 'react';
import * as moment from 'moment';
import { zip } from 'd3-array';
import { scaleLinear } from 'd3-scale';

import Intensity from './Intensity';

import FormattedCode from '../FormattedCode';
import HoverableText from '../HoverableText';
import Timeline from '../Timeline';
import { slugify } from '../utils';

export default class PhecodeICDs extends React.Component {
  constructor(props) {
    super(props);
    this.state = { detail: null };
    this.toggleDetail = this.toggleDetail.bind(this);
    this.renderRow = this.renderRow.bind(this);
  }

  toggleDetail(detail) {
    if (detail === this.state.detail)
      detail = null;
    this.setState({ detail });
  }

  renderRow({ phecode_id, code, dates, description, relevance }, i) {
    const rects = dates
      .map((e, i) => (
        <rect
          key={i}
          x={this.props.X(moment(e))}
          width={1}
          height='100%'
          fill='#cb4154'
        />
      ));

    const style = {};
    if (this.state.detail == code)
      style.backgroundColor = 'lightgoldenrodyellow';

    let onClick = () => this.toggleDetail(code);
    if (relevance < 1.0) {
      onClick = () => this.props.onClick(phecode_id);
    }

    return (
      <tr key={code}
        className='clickable'
        onClick={onClick}
        style={style}
      >
        <td>
          { relevance.toFixed(4) }
        </td>
        <td>
          <HoverableText
            targetId={`icd-${code}-tooltip`}
            target={<FormattedCode code={code} description={description} />}
            header={`${code} - ${description}`}
            body={description}
          />
        </td>
        <td>
          <svg width='100%' viewBox='0 0 960 24'>
            <g>{ rects }</g>
          </svg>
        </td>
      </tr>
    );
  }

  render() {
    const { intensity, dategrid } = this.props;
    const X = this.props.X.range([0, 960]);

    const Y = scaleLinear()
      .domain([0, Math.max(...intensity)*1.1])
      .range([500, 0]);

    const curve = zip(dategrid, intensity)
      .map(([x, y]) => ({x, y}));

    return (
      <table className='charts'>
        <thead>
          <tr>
            <th style={{ width: `6ch` }}></th>
            <th style={{ width: `26ch` }}></th>
            <th style={{ width: 'auto' }}></th>
          </tr>
        </thead>

        <tbody>
          {/* Intensity */}
          <tr>
            <td colSpan={3} className='table-section-header'>
              Code Intensity over Time
            </td>
          </tr>

          <tr className='no-hover'>
            <td colSpan={2} />
            <td style={{ padding: 0 }}>
              <div>
                <Intensity X={X} Y={Y} curve={curve} />
              </div>
            </td>
          </tr>

          {/* Timeline Axis */}
          <tr style={{ borderTop: '1px solid gray', borderBottom: '1px solid gray' }}>
            <th colSpan={2} className='table-section-header'>
              Time
            </th>
            <th className='timeline' style={{ padding: 0 }}>
              <Timeline X={this.props.X} offset={0}/>
            </th>
          </tr>

          {/* Base ICDs */}
          { this.props.base.map(this.renderRow) }

          {/* Additionally Related ICDs */}
          <tr>
            <td colSpan={3} className='table-section-header'>
              Related Codes
            </td>
          </tr>
          {
            this.props.extra
              .sort((A, B) => B.relevance > A.relevance ? 1 : -1)
              .map(this.renderRow)
          }
        </tbody>
      </table>
    );
  }
}
