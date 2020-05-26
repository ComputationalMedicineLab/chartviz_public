/**
 * Simulates a 'labs-I've-ordered' widget that would exist in a production
 * system backed by live updating data.
 */
import React from 'react';
import * as moment from 'moment';
import capitalize from 'lodash/capitalize';

import FormattedCode from './FormattedCode';

const states = [
  'Ordered',
  'Drawn',
  'Received',
  'Done'
];

const randomNumber = (lo, hi) => {
  return Math.floor(Math.random() * (hi - lo) + lo);
}

const randomDate = () => {
  return moment().subtract(randomNumber(0, 7), 'days');
}

const randomState = () => {
  return states[randomNumber(0, 4)];
};

const randomizeLab = ({events, code, description}) => {
  const order = { code };
  order.description = capitalize(description);
  order.datetime = randomDate();
  order.status = randomState();
  if (order.status === 'Done') {
    const { value, unit } = events[0];
    order.value = value;
    order.unit = unit;
  }
  return order;
};

const coinToss = () => Math.random() > 0.5;
const hasEvents = ({ events }) => events.length;

// Generate some labs for use based on what exists in the patient's record
const labGenerator = ({chem, cbc, other}) => {
  chem = chem.filter(hasEvents).filter(coinToss).map(randomizeLab);
  cbc = cbc.filter(hasEvents).filter(coinToss).map(randomizeLab);
  other = other.filter(coinToss).map(randomizeLab).sort((A, B) => {
    return A.description > B.description ? 1 : -1;
  });
  return [...chem, ...cbc, ...other];
}

export default class LabOrders extends React.Component {
  shouldComponentUpdate() {
    return false;
  }
  render() {
    const vals = labGenerator(this.props.labs)
    const rows = vals
      .map(lab => {
        let status = lab.status;
        let background = '';
        if (lab.status === 'Done') {
          background = 'linear-gradient(90deg, white, lightseagreen)';
          status = lab.value.toFixed(2);
          if (lab.unit && lab.unit !== '.')
            status += lab.unit;
        }
        return (
          <tr
            key={lab.code}
            className='clickable'
            onClick={() => this.props.onClick(lab.code)}
          >
            <td>
              <FormattedCode
                code={lab.code}
                description={lab.description}
              />
            </td>
            <td style={{ fontSize: '0.75em' }}>
              <span style={{ padding: '0 1ch' }}>
                { lab.datetime.format('YYYY-MM-DD HH:mm:ss') }
              </span>
            </td>
            <td style={{ fontSize: '0.75em', background }}>
              <span style={{ padding: '0 1ch' }}>
                { status }
              </span>
            </td>
          </tr>
        );
      });

    return (
      <table className='charts'>
        <thead style={{
          backgroundColor: 'whitesmoke',
          borderBottom: '1px solid gray',
        }}>
          <tr>
            <th style={{ width: '20ch' }} />
            <th style={{ width: '12ch' }} />
            <th style={{ width: '12ch' }} />
          </tr>
          <tr className='section-header'>
            <th colSpan={3}>
              Ordered Labs
            </th>
          </tr>
          <tr style={{ textAlign: 'center' }}>
            <th>Lab</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          { rows }
        </tbody>
      </table>
    );
  }
}
