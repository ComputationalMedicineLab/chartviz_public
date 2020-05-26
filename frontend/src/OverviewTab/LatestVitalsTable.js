import React from 'react';
import * as moment from 'moment';
import capitalize from 'lodash/capitalize';
import isNil from 'lodash/isNil';

const identity = A => A;
const fmtDate = str =>
  moment(str).format('YYYY-MM-DD HH:mm:ss');

const vitalOrNA = (vit, vitDate, formatter=identity) => {
  let value = 'N/A';
  let date = 'N/A';
  if (!isNil(vit)) {
    value = formatter(vit);
    if (!isNil(vitDate))
      date = fmtDate(vitDate);
  }
  return {value, date};
}

const DatedVital = ({ label, value, date }) => (
  <tr>
    <th style={{ borderRight: '1px solid gray' }}>{ label }</th>
    <td>{ value }</td>
    <td style={{ fontSize: '0.75em' }}>{ date }</td>
  </tr>
);

const SimpleVital = ({ label, value }) => (
  <tr>
    <th style={{ borderRight: '1px solid gray' }}>
      {label }
    </th>
    <td>
      { value }
    </td>
    <td />
  </tr>
);

export default class LatestVitalsTable extends React.Component {
  render() {
    const { vitals, patient } = this.props;
    const dob = moment.utc(patient.birthdate);
    const age = moment.utc().diff(dob, 'years');
    const height = vitalOrNA(
      vitals.height,
      vitals.height_date,
      ht => `${ht.toFixed(2)} cm`,
    );
    const weight = vitalOrNA(
      vitals.weight,
      vitals.weight_date,
      wt => `${wt.toFixed(2)} kg`,
    );
    const pulse = vitalOrNA(
      vitals.pulse,
      vitals.pulse_date
    );
    const resp = vitalOrNA(
      vitals.resp,
      vitals.resp_date
    );
    const bp = vitalOrNA(
      vitals.blood_pressure,
      vitals.bp_date,
    );
    return (
      <table className='charts'>
        <thead style={{ backgroundColor: 'whitesmoke' }}>
          <tr>
            <th style={{ width: '16ch' }} />
            <th style={{ width: 'auto' }} />
            <th style={{ width: 'auto' }} />
          </tr>
        </thead>
        <tbody>
          <SimpleVital label='Birthdate' value={`${dob.format('YYYY-MM-DD')} (${age}yo)`} />
          <SimpleVital label='Sex' value={capitalize(patient.gender)} />
          <DatedVital label='Height' {...height} />
          <DatedVital label='Weight' {...weight} />
          <SimpleVital label='BMI' value={vitals.bmi ? vitals.bmi.toFixed(2) : 'N/A' } />
          <DatedVital label='Heart Rt.' {...pulse} />
          <DatedVital label='Resp. Rt.' {...resp} />
          <DatedVital label='Blood Pressure' {...bp} />
        </tbody>
      </table>
    );
  }
}
