/**
 * Wraps an Occurrence chart for the patient's Medications.  Handles loading
 * the med data and setting a row as highlighted based on the location hash (if
 * it exists)
 */
import React from 'react';
import head from 'lodash/head';
import last from 'lodash/last';
import { scaleTime } from 'd3-scale';
import { timeDay, timeYear } from 'd3-time';

import { AfterLoad } from './utils';
import MedicationTable from './meds/MedicationTable';
import { fetchMedsTab } from './api';
import { PatientCtx } from './contexts';

export default class MedsTab extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = { detail: null };
    this.toggleDetail = this.toggleDetail.bind(this);
    this.handleHash = this.handleHash.bind(this);
    this.renderJSX = this.renderJSX.bind(this);
  }

  componentDidUpdate(props) {
    if (props.location.hash !== this.props.location.hash)
      this.handleHash();
  }

  toggleDetail(detail) {
    if (detail === this.state.detail)
      detail = null;
    this.setState({ detail });
  }

  handleHash() {
    const { hash } = this.props.location;
    if (!hash) return;
    const name = hash.slice(1).toLowerCase();
    this.setState({ detail: name }, () => setTimeout(() => {
      // force the follup handler to happen in the following tick so that the
      // element we're trying to get with getElementById definitely exists
      const el = document.getElementById(name);
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      }
    }, 0));
  }

  renderJSX({ meds, dategrid }) {
    const X = scaleTime()
      .domain([
        timeYear(head(dategrid)),
        timeDay(last(dategrid))
      ])
      .nice()
      .range([0, 940]);
    return (
      <MedicationTable
        X={X}
        meds={meds}
        detail={this.state.detail}
        toggleDetail={this.toggleDetail}
      />
    );
  }

  render() {
    return (
      <AfterLoad
        loader={() => fetchMedsTab(this.context)}
        reloadkey={this.context.id}
        postload={this.handleHash}
      >
        { this.renderJSX }
      </AfterLoad>
    );
  }
}
