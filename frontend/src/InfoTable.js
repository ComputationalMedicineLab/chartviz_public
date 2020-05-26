import React from 'react';

export default class InfoTable extends React.PureComponent {
  render() {
    const { widths, labels, data } = this.props;
    return (
      <table className='info'>
        <thead>
          {
            widths &&
              <tr>
                { widths.map((width, i) => <th key={i} style={{ width }}></th>)}
              </tr>
          }
          {
            labels &&
              <tr>
                { labels.map((header, i) => <th key={i}>{ header }</th>)}
              </tr>
          }
        </thead>
        <tbody>
          { data.map(({values, rowProps}, i) => {
            rowProps = rowProps || {};
            return (
              <tr key={i} {...rowProps}>
                { values.map((val, i) => <td key={i}>{ val }</td>) }
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}
