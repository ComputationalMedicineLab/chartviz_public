import React from 'react';
import styled from 'styled-components';
import capitalize from 'lodash/capitalize';
import * as moment from 'moment';

import { titlecase } from '../utils';

export default class RecentMeds extends React.Component {
  render() {
    const { meds } = this.props;

    const rows = meds
      .sort((A, B) => A.name < B.name ? -1 : 1)
      .map(({ name, strength, route, frequency, dose, duration, events}, i) =>
        <tr key={i}
          className='clickable'
          title='Click goes to Medication Tab'
          onClick={() => this.props.onClick(name)}
        >
          <td>
            {events[0].format('YYYY-MM-DD')}
          </td>
          <td>
            <strong>{ titlecase(name) }</strong>
            {" "}{ strength }
            {" "}{ dose && capitalize(dose) }
            {" "}{ route }
            {" "}{ frequency }
            {" "}{ duration && `(x${ duration })` }
          </td>
        </tr>
      );

    if (rows.length == 0) {
      rows.push(
        <tr key='no-data'>
          <td rowSpan={2}>
            No medication data for this patient
          </td>
        </tr>
      );
    }

    return (
      <table className='charts'>
        <thead
          style={{
            backgroundColor: 'whitesmoke',
            borderTop: '1px solid gray',
          }}
        >
          <tr>
            <th style={{ width: '12ch' }} />
            <th style={{ width: 'auto' }} />
          </tr>
          <tr className='section-header' style={{ padding: 0 }}>
            <th colSpan={2}>Recent Medications</th>
          </tr>
        </thead>
        <tbody>
          { rows }
        </tbody>
      </table>
    );
  }
}
