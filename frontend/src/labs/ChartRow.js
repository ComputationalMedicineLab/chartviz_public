import React from 'react';
import nth from 'lodash/nth';
import last from 'lodash/last';
import { quantile } from 'd3-array';
import { scaleLinear } from 'd3-scale';

import Change from './Change';
import Chart from './Chart';
import Label from './Label';
import TBody from './TBody';
import Value from './Value';

export default class ChartRow extends React.Component {

  render() {
    const { lab } = this.props;

    const rowStyle = this.props.highlight
      ? { backgroundColor: 'lightgoldenrodyellow' }
      : {};

    const colorscale = scaleLinear()
      .domain([lab.perc_10, lab.perc_50, lab.perc_90])
      .range(['steelblue', 'silver', 'firebrick']);

    // using tbody (instead of tr) as the outer tag at this level lets me add
    // "hidden" rows (or expandable rows) as needed
    return (
      <TBody id={this.props.id}>
        <tr onClick={this.props.rowClick} style={rowStyle}>
          <td className='label' style={{ padding: '0.5rem 0' }}>
            <div style={{ marginRight: '0.5rem' }}>
              <Label lab={lab} />
            </div>
          </td>
          <td style={{ borderBottom: 'none' }}>
            <Chart
              X={this.props.X}
              lab={lab}
              colorscale={colorscale}
            />
          </td>
          <td>
            <Value
              code={lab.code}
              result={last(lab.events)}
              perc_25={lab.perc_25}
              perc_75={lab.perc_75}
            />
          </td>
          <td>
            <Change
              code={lab.code}
              ult={last(lab.events)}
              penult={nth(lab.events, -2)}
            />
          </td>
        </tr>
      </TBody>
    );
  }
}
