/**
 * Small utility component to provide default formatting for displaying codes
 * and descriptions.
 */
import React from 'react';

const FormattedCode = ({ code, description }) => (
  <span>
    <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.2em' }}>
      { code }
    </span>
    {" "}
    { description }
  </span>
);

export default FormattedCode;
