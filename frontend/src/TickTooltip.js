import React from 'react';
import { capitalize } from 'lodash';
import { RingLoader } from 'react-spinners';

import { fetchNotesByDate } from './api';
import { PatientCtx } from './contexts';

export default class TickTooltip extends React.Component {
  static contextType = PatientCtx;
  state = { loading: true };

  componentDidMount() {
    this.setState({ loading: true }, async () => {
      const notes = await fetchNotesByDate(this.context, this.props.date);
      console.dir(notes);
      this.setState({ loading: false, notes });
    });
  }

  render() {
    let content = <RingLoader color='#36D7B7' />;

    if (!this.state.loading) {
      const rows = this.state.notes.map((note, i) => {
        return (
          <tr key={i}>
            <td>{ note.date.format('YYYY-MM-DD') }</td>
            <td>{ note.docType }</td>
            <td>{ capitalize(note.subType) }</td>
          </tr>
        );
      });
      content = (
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: '12ch' }} />
              <th style={{ minWidth: '2ch' }} />
              <th style={{ minWidth: '24ch' }} />
            </tr>
          </thead>
          <tbody>
          { rows }
          </tbody>
        </table>
      );
    }

    return (
      <div className='popup-box note-popup-box'>
        { content }
      </div>
    );
  }
}
