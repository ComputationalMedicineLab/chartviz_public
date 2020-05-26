/**
 * This component is a performance optimization that truncates rendering of child components
 */
import React from 'react';
import { CSSTransition } from 'react-transition-group';
import { interpolateLab } from 'd3-interpolate';
import flatten from 'lodash/flatten';
import groupBy from 'lodash/groupBy';

import MainLabel from './MainLabel';
import MainChart from './MainChart';
import DetailRows from './DetailRows';
import TBody from './TBody';

function toLabel({strength, route, frequency}) {
  return [strength, route, frequency].join(' ').toLowerCase();
}

export default class MedicationRow extends React.Component {
  /**
   * This is performance critical, no touch
   */
  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.detail !== nextProps.detail
      || this.props.name !== nextProps.name
    );
  }

  render() {
    const colorScale = interpolateLab('firebrick', 'steelblue');

    const strengthGroups = Object.entries(groupBy(this.props.meds, 'strength'))
      .sort((A, B) => B[1][0].strength_num - A[1][0].strength_num)
      .map(([strength, meds], i, arr) => {
        const labels = Object.keys(groupBy(meds, toLabel));
        const events = flatten(meds.map(m => m.events)).sort();

        const point = arr.length > 1 ? i / (arr.length - 1) : 0;
        const fill = colorScale(point);
        // console.log(`${this.props.name}:${strength} - ${point}/${fill}`);
        return { strength, labels, events, fill };
      });

    const multirow = strengthGroups.length > 1;
    const styles = { borderBottom: '1px gainsboro dashed' };
    if (this.props.multirow) {
      styles.cursor = 'pointer';
    }
    if (this.props.detail) {
      styles.borderTop = '1px solid black';
      styles.backgroundColor = 'whitesmoke';
    }
    return (
      <React.Fragment>
        <TBody id={this.props.slug}>
          <tr style={styles} onClick={this.props.toggle}>
            <td>
              <MainLabel
                detail={this.props.detail}
                meds={this.props.meds}
                multirow={multirow}
                name={this.props.name}
              />
            </td>
            <td>
              <MainChart
                strengthGroups={strengthGroups}
                X={this.props.X}
              />
            </td>
          </tr>
        </TBody>
        <CSSTransition
          in={this.props.detail}
          timeout={500}
          classNames='medrow'
        >
          <DetailRows
            code={this.props.name}
            strengthGroups={strengthGroups}
            X={this.props.X}
          />
        </CSSTransition>
      </React.Fragment>
    );
  }
}
