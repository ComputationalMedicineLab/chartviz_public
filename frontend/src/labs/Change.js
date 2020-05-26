/**
 * Expresses the change in value between the two latest observations of this lab
*/
import React from 'react';
import isNil from 'lodash/isNil';
import * as moment from 'moment';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { Icon } from 'react-icons-kit';
import { circleUp } from 'react-icons-kit/icomoon/circleUp';
import { circleDown } from 'react-icons-kit/icomoon/circleDown';

import HoverableText from '../HoverableText';

export default class Change extends React.Component {
  formatValue = (result) => {
    const { value, unit } = result;
    let valDisplay = `${value.toFixed(2)}`;
    if (unit && unit !== '.')
      valDisplay += ` ${unit}`;
    return valDisplay;
  }

  render() {
    const { code, ult, penult: pen } = this.props;

    if (!ult || !pen)
      return '';

    const n = ult.value - pen.value;
    const u = ult.unit === pen.unit
      ? (ult.unit !== '.' && ult.unit ? ult.unit : '')
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
      .duration(ult.datetime.diff(pen.datetime))
      .humanize();

    return (
      <HoverableText
        targetId={`lab-${code}-change-in-value`}
        target={
          <span>
            <span style={{ color }}>
              { icon }
            </span>
            <em style={{ fontSize: '0.75em', padding: '0 1ch' }}>
              { valDiff } in { dateDiff }
            </em>
          </span>
        }
        header={`${code} Most Recent Change in Value`}
        body={
          <table>
            <thead>
              <tr>
                <th style={{ width: '14ch' }}></th>
                <th style={{ width: '18ch' }}></th>
                <th style={{ width: '18ch' }}></th>
              </tr>
              <tr style={{ borderBottom: '1px solid gray', backgroundColor: 'whitesmoke' }}>
                <th style={{ borderRight: '1px solid gray' }}></th>
                <th>Date</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th style={{ borderRight: '1px solid gray', backgroundColor: 'whitesmoke' }}>
                  Penultimate
                </th>
                <td>{ pen.datetime.format('YYYY-MM-DD HH:mm') }</td>
                <td>{ this.formatValue(pen) }</td>
              </tr>
              <tr>
                <th style={{ borderRight: '1px solid gray', backgroundColor: 'whitesmoke' }}>
                  Final Event
                </th>
                <td>{ ult.datetime.format('YYYY-MM-DD HH:mm') }</td>
                <td>{ this.formatValue(ult) }</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid gray' }}>
                <th style={{ borderRight: '1px solid gray', backgroundColor: 'whitesmoke' }}>
                  Change in Value
                </th>
                <td style={{ backgroundColor: 'lightgoldenrodyellow' }}>
                  { dateDiff }
                </td>
                <td style={{ backgroundColor: 'lightgoldenrodyellow' }}>
                  { valDiff }
                </td>
              </tr>
            </tfoot>
          </table>
        }
      />
    );
  }
}
