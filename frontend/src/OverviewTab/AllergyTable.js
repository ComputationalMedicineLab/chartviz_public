import React from 'react';

const AllergyTable = () => (
  <table className='charts'>
    <thead
      style={{
        backgroundColor: 'whitesmoke',
        borderTop: '1px solid gray',
      }}
    >
      <tr>
        <th style={{ width: '16ch' }} />
        <th style={{ width: 'auto' }} />
      </tr>
      <tr className='section-header' style={{ padding: 0 }}>
        <th colSpan={2}>Allergic Reactions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Sulfa Drugs</td>
        <td style={{ background: 'linear-gradient(90deg, white, firebrick)' }}>
          Anaphylaxis
        </td>
      </tr>
      <tr>
        <td>Steel Polish</td>
        <td>Dermatologic Reaction</td>
      </tr>
      <tr>
        <td>Lactose</td>
        <td>Intolerance</td>
      </tr>
    </tbody>
  </table>
);

export default AllergyTable;
