import React from 'react';
import { createPortal } from 'react-dom';

const tooltipRoot = document.getElementById('tooltip-root');

export default class TooltipPortal extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    tooltipRoot.appendChild(this.el);
  }

  componentWillUnmount() {
    tooltipRoot.removeChild(this.el);
  }

  render() {
    const { top, left } = this.props;
    // Set up the positioning framework we need for the tooltip
    const tooltip = (
      <div style={{ position: 'fixed', zIndex: 1, top, left }}>
        <div style={{ position: 'relative' }}>
          { this.props.children }
        </div>
      </div>
    );
    return createPortal(tooltip, this.el);
  }
}
