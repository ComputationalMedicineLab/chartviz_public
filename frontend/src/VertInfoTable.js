import React from 'react';

export default class VertInfoTable extends React.PureComponent {
  render() {
    const { widths, data } = this.props;
    return (
      <table className='vert-info'>
        <thead>
          <tr>
            { widths && widths.map((width, i) => (
              <th key={i} style={{ width }}></th>
            ))}
          </tr>
        </thead>
        <tbody>
          { data.map(({label, value, rowProps}, i) => {
            rowProps = rowProps || {};
            return (
              <tr key={i} {...rowProps}>
                <th>{ label }</th>
                <td>{ value }</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}
