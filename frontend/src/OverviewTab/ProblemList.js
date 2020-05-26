import React from 'react';

import PhecodeLabel from '../SystemsTab/PhecodeLabel';
import Timeline from '../Timeline';

export default class ProblemList extends React.Component {
  constructor(props) {
    super(props);
    this.renderRow = this.renderRow.bind(this);
  }

  renderRow(phecode) {
    const { X } = this.props;
    const rects = phecode.icds
      .reduce((arr, item) => [...arr, ...item.events], [])
      .map(e => new Date(e))
      .sort()
      .map((e, i) =>
        <rect key={i} x={X(e)} width={1} height='100%' fill='#cb4154' />
      );
    return (
      <tr key={phecode.id}
        className='clickable'
        onClick={() => this.props.onClick(phecode)}
      >
        <td className='label'>
          <PhecodeLabel phecode={phecode} />
        </td>
        <td style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          { phecode.date_range[0] }
        </td>
        <td style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          { phecode.date_range[1] }
        </td>
        <td>
          <svg width='100%' viewBox='0 0 960 24'>
            <g transform='translate(10)'>{ rects }</g>
          </svg>
        </td>
        <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>
          { phecode.final_intensity.toFixed(4) }
        </td>
        <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>
          { phecode.auc.toFixed(4) }
        </td>
      </tr>
    );
  }

  render() {
    const rows = this.props.phecodes.map(this.renderRow);
    return (
      <table className='charts'>
        <thead style={{ backgroundColor: 'whitesmoke' }}>
          <tr>
            <th style={{ width: `26ch` }}></th>{/* Code / Desc */}
            <th style={{ width: `10ch` }}></th>{/* First Mention */}
            <th style={{ width: `10ch` }}></th>{/* Latest Mention */}
            <th style={{ width: `auto` }}></th>{/* Tick Chart */}
            <th style={{ width: `12ch` }}></th>{/* Final intensity */}
            <th style={{ width: `12ch` }}></th>{/* Area under intensity curve */}
          </tr>
          <tr>
            <th rowSpan={2} className='label'>
              Phecode
            </th>
            <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px dashed gainsboro' }}>
              Mention
            </th>
            <th rowSpan={2} className='timeline'>
              <Timeline X={this.props.X} />
            </th>
            <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px dashed gainsboro' }}>
              Intensity
            </th>
          </tr>
          <tr style={{ textAlign: 'center' }}>
            <th>First</th>
            <th>Last</th>
            <th>Current</th>
            <th>AUC</th>
          </tr>
        </thead>
        <tbody>
          { rows }
        </tbody>
      </table>
    );
  }
}
