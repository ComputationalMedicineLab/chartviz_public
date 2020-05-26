/**
 * Displays a value with more information on hover
 */
import React from 'react';
import isNil from 'lodash/isNil';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';

import VertInfoTable from '../VertInfoTable';
import HoverableText from '../HoverableText';

export default class Value extends React.Component {
  shouldComponentUpdate(props) {
    // only update if the timestamp changes
    if (this.props.result && !props.result)
      return true;
    const curr = this.props.result.datetime;
    const next = props.result.datetime;
    return !curr.isSame(next);
  }

  getIndicator = () => {
    const { value, normal_min: nmin, normal_max: nmax } = this.props.result;
    let indicator = '';
    if (nmin !== nmax && !isNil(nmin) && !isNil(nmax)) {
      if (value > nmax) indicator = 'H';
      if (value < nmin) indicator = 'L';
    }
    return indicator;
  }

  formatValue = () => {
    const { value, unit } = this.props.result;
    let valDisplay = `${value.toFixed(2)}`;
    if (unit && unit !== '.')
      valDisplay += ` ${unit}`;
    return valDisplay;
  }

  render() {
    const { code, result } = this.props;
    if (!result)
      return null;
    const { datetime } = result;
    const valDisplay = this.formatValue();

    let lo = result.normal_min;
    let hi = result.normal_max;
    let rngLabel = 'Normal Range';
    if (lo === hi || isNil(lo) || isNil(hi)) {
      lo = this.props.perc_25;
      hi = this.props.perc_75;
      rngLabel = 'InterQuartile Range';
    }

    return (
      <HoverableText
        targetId={`lab-${code}-most-recent-value`}
        target={
          <span>
            <em style={{ fontSize: '0.75em', padding: '0 1ch' }}>
              { valDisplay }
            </em>
            <span style={{ color: 'red', fontWeight: 'bold', fontSize: '0.75rem' }}>
              { this.getIndicator() }
            </span>
          </span>
        }
        header={`${code} Most Recent Value`}
        body={
          <VertInfoTable data={[
            { label: 'Date', value: datetime.format('YYYY-MM-DD HH:mm') },
            { label: 'Value', value: valDisplay },
            { label: rngLabel, value: `${lo.toFixed(2)} - ${hi.toFixed(2)}` },
          ]} />
        }
      />
    );
  }
}
