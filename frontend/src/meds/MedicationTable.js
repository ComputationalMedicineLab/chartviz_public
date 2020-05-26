/**
 * Renders a table of charts detailing a patient's medications.
 */
import React from 'react';
import capitalize from 'lodash/capitalize';
import groupBy from 'lodash/groupBy';
import isNil from 'lodash/isNil';
import last from 'lodash/last';
import partition from 'lodash/partition';
import * as moment from 'moment';
import { scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';

import Timeline from '../Timeline';
import { slugify } from '../utils';
import MedicationRow from './MedicationRow';

const offset = 6;
const offsetUnit = 'months';

export default class MedicationTable extends React.Component {
  constructor(props) {
    super(props);
    this.renderMedRow = this.renderMedRow.bind(this);
  }

  renderMedRow({name, meds}, i) {
    const { X, toggleDetail } = this.props;
    const slug = slugify(name);
    const detail = this.props.detail === slug;
    return (
      <MedicationRow key={slug}
        detail={detail}
        meds={meds}
        name={name}
        slug={slug}
        toggle={() => toggleDetail(slug)}
        X={X}
      />
    );
  }

  render() {
    const cutoff = moment().subtract(offset, offsetUnit);
    const { meds, X } = this.props;
    const rows = [];

    // Two phases: those mentioned within "the recent past" those mentioned
    // before that.  First group sorted by recentness, second sorted
    // alphabetically
    const medIter = Object.entries(groupBy(meds, m => m.name.toLowerCase()))
      .map(([name, meds]) => {
        meds.sort((A, B) => last(A.events) < last(B.events) ? 1 : -1);
        const latest = last(meds[0].events);
        return { name, meds, latest };
      });

    let [recent, others] = partition(medIter, ({ latest }) => {
      return latest.isAfter(cutoff);
    });

    rows.push(...recent
      .sort((A, B) => {
        // If there's a relevance, sort by that
        const relA = A.meds[0].relevance;
        const relB = B.meds[0].relevance;
        if (!(isNil(relA) || isNil(relB))) {
          return relB - relA;
        }
        return A.name < B.name ? -1 : 1;
      })
      .map(this.renderMedRow)
    );

    if (rows.length > 0) {
      // If there are recents, use a divider between recent and not so recent
      rows.push(
        <tbody key='divider'>
          <tr>
            <td colSpan={2} className='table-section-header'>
              Older than {offset} {capitalize(offsetUnit)}
            </td>
          </tr>
        </tbody>
      );
    }

    rows.push(...others
      .sort((A, B) => A.name < B.name ? -1 : 1)
      .map(this.renderMedRow)
    );

    if (rows.length == 0) {
      rows.push(
        <tbody key='no-data'>
          <tr>
            <td />
            <td colSpan={1}>
              <em>
                No medication data for this patient
              </em>
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <div id='meds-overview' style={{ marginRight: '1vw' }}>
        <table className='charts'>
          <thead>
            <tr>
              <th style={{ width: `26ch` }}></th>
              <th style={{ width: 'auto' }}></th>
            </tr>
            <tr style={{ borderBottom: '1px solid gray' }}>
              <th />
              <th className='timeline'>
                <Timeline X={X} />
              </th>
            </tr>
          </thead>
          { rows }
        </table>
      </div>
    );
  }
}
