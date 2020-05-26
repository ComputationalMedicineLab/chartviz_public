/**
 * Thumbnail style chart quick overview
 */
import React from 'react';
import { Icon } from 'react-icons-kit';
import { cog } from 'react-icons-kit/fa/cog'
import { th } from 'react-icons-kit/fa/th'
import { list } from 'react-icons-kit/fa/list'

import Detail from './Detail';
import Thumbnail from './Thumbnail';

import { AfterLoad } from '../utils';
import { createCondition, fetchSystemsTab } from '../api';
import { PatientCtx } from '../contexts';

import './styles.css';


export default class SystemsTab extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = {
      view: 'grid',
      range: [0.0, 0.25],
      detailSystem: '',
    };
    this.toggleDetail = this.toggleDetail.bind(this);
    this.renderJSX = this.renderJSX.bind(this);
  }

  toggleDetail(code) {
    this.state.detailSystem === code
      ? this.setState({ detailSystem: '' })
      : this.setState({ detailSystem: code });
  }

  renderJSX({ dategrid, chapters }) {
    const { range } = this.state;
    const { history } = this.props;
    const patient = this.context;
    const charts = [];
    Object.values(chapters).forEach(chapter => {
      const empty = chapter.phecodes.length == 0;
      charts.push(
        <Thumbnail
          key={chapter.code}
          chapter={chapter}
          toggleFocus={() => empty || this.toggleDetail(chapter.code)}
          isFocused={chapter.code == this.state.detailSystem}
          dategrid={dategrid}
          range={range}
        />
      );
      if (this.state.detailSystem === chapter.code) {
        const detailKey = `${chapter.code}-detail`;
        charts.push(
          <Detail
            onRemove={() => this.setState({ detailSystem: '' })}
            key={detailKey}
            chapter={chapter}
            patientId={patient.id}
            onSelectPhecode={phecode => {
              createCondition(patient.id, phecode.id)
                .then(patient.updateTabs)
                .then(() => history.push(`/${patient.id}/phecodes/${phecode.id}`));
            }}
            dategrid={dategrid}
            range={range}
          />
        );
      }
    });
    return  (
      <div id='systems-overview'>
        { charts }
      </div>
    );
  }

  render() {
    return (
      <AfterLoad
        loader={() => fetchSystemsTab(this.context)}
        reloadkey={this.context.id}
      >
        { this.renderJSX }
      </AfterLoad>
    );
  }
}
