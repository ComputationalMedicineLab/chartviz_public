import React from 'react';
import TooltipPortal from './TooltipPortal';


export default class SVGTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hover: false, top: 0, left: 0 };
    this.ref = React.createRef();
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.renderTooltip = this.renderTooltip.bind(this);
  }

  onMouseEnter(event) {
    const hover = true;
    let { top, right: left, height } = this.ref.current.getBoundingClientRect();
    this.setState({ hover, top, left, height });
  }

  onMouseLeave(event) {
    this.setState({ hover: false });
  }

  renderTooltip() {
    const { hover, left, top, height } = this.state;
    return (
      <TooltipPortal left={left} top={top}>
        <div className='tooltip-wrapper' style={{
          transform: `translate(-50%, calc(-90% - ${height}px))`
        }}>
          { this.props.tooltip(hover) }
        </div>
      </TooltipPortal>
    );
  }

  render() {
    const { hover, top, left } = this.state;
    let children = this.props.children;
    if (typeof children === 'function') {
      children = children(hover);
    }
    return (
      <g ref={this.ref}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
        { children }
        { hover && this.renderTooltip() }
      </g>
    );
  }
}
