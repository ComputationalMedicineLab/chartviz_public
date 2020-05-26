import React from 'react';
import last from 'lodash/last';
import { axisBottom } from 'd3-axis';

import Timeline from '../Timeline';
import { slugify } from '../utils';

import ChartRow from './ChartRow';
import TimelineNav from './TimelineNav';

export default class LabChartTable extends React.Component {
  constructor(props) {
    super(props);
    this.renderLabRow = this.renderLabRow.bind(this);
    this.renderSectionHead = this.renderSectionHead.bind(this);
  }

  renderSectionHead(title) {
    return (
      <tbody key={title}>
        <tr>
          <td colSpan={4} className='table-section-header'>
            { title }
          </td>
        </tr>
      </tbody>
    );
  }

  renderLabRow(lab, key) {
    const { X, detail, setDetail } = this.props;
    const slug = slugify(`lab-${lab.code}`);

    return (
      <ChartRow
        key={key}
        id={slug}
        X={X}
        lab={lab}
        rowClick={() => setDetail(slug)}
        highlight={detail === slug ? 1 : 0}
      />
    );
  }

  render() {
    let { chem, cbc, other } = this.props.labs;
    cbc = cbc.filter(lab => lab.events.length > 0);

    if (this.props.timeframe !== undefined) {
      const [lo, hi] = this.props.X.domain();
      const onlyRecent = ({ events }) => {
        const evt = last(events).datetime;
        return evt.isBetween(lo, hi);
      };
      cbc = cbc.filter(onlyRecent);
      chem = chem.filter(onlyRecent);
      other = other.filter(onlyRecent);
    }

    const rows = [];
    let i = 0;
    if (chem.length > 0) {
      rows.push(this.renderSectionHead('Chemistries'));
      chem.forEach(lab => rows.push(this.renderLabRow(lab, i++)));
    }
    if (cbc.length > 0) {
      rows.push(this.renderSectionHead('CBC'));
      cbc.forEach(lab => rows.push(this.renderLabRow(lab, i++)));
    }
    if (other.length > 0) {
      if (rows.length > 0) {
        rows.push(this.renderSectionHead('Other Labs'));
      }
      other.forEach(lab => rows.push(this.renderLabRow(lab, i++)));
    }

    if (!rows.length) {
      rows.push(
        <tbody key='no-data'>
          <tr>
            <td />
            <td colSpan={3}>
              <em>
                No relevant labs found
              </em>
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <table className='charts'>
        <thead>
          <tr>
            <th style={{ width: '26ch' }}></th>
            <th style={{ width: 'auto' }}></th>
            <th style={{ width: '14ch' }}></th>
            <th style={{ width: '20ch' }}></th>
          </tr>
          <tr style={{ borderBottom: '1px solid gray' }}>
            <th className='label'>
              <div style={{ marginRight: '0.5rem' }}>
                <TimelineNav
                  timeframe={this.props.timeframe}
                  onTimeframeSelect={this.props.setTimeframe}
                />
              </div>
            </th>
            <th className='timeline'>
              <Timeline X={this.props.X} timeframe={this.props.timeframe} />
            </th>
            <th>
              <div style={{ marginLeft: '0.5rem' }}>Latest Value</div>
            </th>
            <th>
              <div style={{ marginLeft: '0.5rem' }}>Value Change</div>
            </th>
          </tr>
        </thead>
        { rows }
      </table>
    );
  }
}
