import React from 'react';
import capitalize from 'lodash/capitalize';
import nth from 'lodash/nth';
import last from 'lodash/last';
import isNil from 'lodash/isNil';
import { Icon } from 'react-icons-kit';
import { circleUp } from 'react-icons-kit/icomoon/circleUp';
import { circleDown } from 'react-icons-kit/icomoon/circleDown';
import styled from 'styled-components';
import * as moment from 'moment';


export default class RecentLabs extends React.Component {
  constructor(props) {
    super(props);
    this.formatValue = this.formatValue.bind(this);
    this.getRngIndicator = this.getRngIndicator.bind(this);
    this.renderChangeInValue = this.renderChangeInValue.bind(this);
    this.renderLabRow = this.renderLabRow.bind(this);
    this.renderSectionHead = this.renderSectionHead.bind(this);
  }

  formatValue({ value, unit }) {
    let valDisplay = `${value.toFixed(2)}`;
    if (unit && unit !== '.')
      valDisplay += ` ${unit}`;
    return valDisplay;
  }

  getRngIndicator(lab) {
    let lo = lab.normal_min;
    let hi = lab.normal_max;
    if (lo === hi || isNil(lo) || isNil(hi)) {
      lo = lab.perc_25;
      hi = lab.perc_75;
    }
    if (lab.value > hi) return 'H';
    if (lab.value < lo) return 'L';
    return '';
  }

  renderChangeInValue(final, prior) {
    const n = final.value - prior.value;
    const u = final.unit === prior.unit
      ? (final.unit !== '.' && final.unit ? final.unit : '')
      : '?';
    let icon = '';
    let color = 'initial';
    if (n > 0) {
      icon = <Icon icon={circleUp} />;
      color = 'firebrick';
    }
    if (n < 0) {
      icon = <Icon icon={circleDown} />;
      color = 'steelblue';
    }
    const valDiff = this.formatValue({ value: n, unit: u });
    const dateDiff = moment
      .duration(final.datetime.diff(prior.datetime))
      .humanize();
    return (
      <td style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ color, flexBasis: '26px', flexShrink: 0 }}>
          { icon }
        </span>
        <em style={{ fontSize: '0.75em', flex: 1 }}>
          { valDiff } in { dateDiff }
        </em>
      </td>
    );
  }

  renderLabRow(lab, i) {
    const { code, description, events } = lab;
    const label = (
      <td>
        <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.2em' }}>
          { code }
        </span>
        {" "}
        { capitalize(description) }
      </td>
    );

    if (events.length == 0) {
      return (
        <tr key={i}
          className='clickable'
          onClick={() => this.props.onClick(code)}
        >
          { label }
          <td colSpan={4} style={{ textAlign: 'center', fontSize: '0.75em' }}>
            <em>No Record</em>
          </td>
        </tr>
      );
    }

    const final = nth(events, -1);
    const prior = nth(events, -2);
    const vals = events.map(e => e.value).sort((a, b) => a - b);
    // Determine if normal or interquartile range
    let lo = final.normal_min;
    let hi = final.normal_max;
    let rngCode = '';
    let rngLabel = 'Normal Range';
    if (lo === hi || isNil(lo) || isNil(hi)) {
      lo = lab.perc_25;
      hi = lab.perc_75;
      rngCode = '(IQR)';
      rngLabel = 'InterQuartile Range';
    }
    return (
      <tr key={i}
        className='clickable'
        onClick={() => this.props.onClick(code)}
      >
        { label }
        <td style={{ fontSize: '0.75em' }}>
          <span style={{ padding: '0 1ch' }}>
            { this.formatValue(final) }
          </span>
          <span style={{ color: 'red', fontWeight: 'bold' }}>
            { this.getRngIndicator(final) }
          </span>
        </td>
        <td style={{ fontSize: '0.75em' }}>
          <span style={{ padding: '0 1ch' }} title={rngLabel}>
            { lo.toFixed(2) } - { hi.toFixed(2) }{" "}<em>{ rngCode }</em>
          </span>
        </td>
        <td style={{ fontSize: '0.75em' }}>
          <span style={{ padding: '0 1ch' }}>
            { final.datetime.format('YYYY-MM-DD HH:mm:ss') }
          </span>
        </td>
        { prior && this.renderChangeInValue(final, prior) }
      </tr>
    );
  }

  renderSectionHead(title) {
    return (
      <tr key={title}>
        <td colSpan={5} className='table-section-header'>
          <strong>{ title }</strong>
        </td>
      </tr>
    );
  }

  render() {
    const {chem, cbc, other} = this.props.labs;
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
    if (rows.length == 0) {
      rows.push(
        <tr key='no-data' id='no-data'>
          <td colSpan={3}><em>No lab data for this patient</em></td>
        </tr>
      );
    }

    return (
      <table id='overview-labs-table' className='charts'>
        <thead style={{
          backgroundColor: 'whitesmoke',
          borderBottom: '1px solid gray',
        }}>
          <tr>
            <th style={{ width: '26ch' }} />
            <th style={{ width: '8ch'  }} />
            <th style={{ width: '12ch' }} />
            <th style={{ width: '12ch' }} />
            <th style={{ width: '16ch' }} />
          </tr>
          <tr style={{ textAlign: 'center' }}>
            <th style={{ padding: '0.33em' }}>Labs</th>
            <th>Value</th>
            <th>Range</th>
            <th>Time</th>
            <th>Change in Value</th>
          </tr>
        </thead>
        <tbody>
          { rows }
        </tbody>
      </table>
    );
  }
}
