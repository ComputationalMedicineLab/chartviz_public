/**
 * Provides a component that will truncate its contents and show a popup on hover
 */
import React from 'react';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { slugify } from './utils';

export default class HoverableText extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
    this.toggle = () => this.setState({ isOpen: !this.state.isOpen });
  }

  shouldComponentUpdate(priorProps, priorState) {
    return (
      priorProps.targetId !== this.props.targetId
      || priorState.isOpen !== this.state.isOpen
    );
  }

  render() {
    const targetId = slugify(this.props.targetId);
    const textAlign = this.props.textAlign || 'inherit';
    return (
      <div>
        <div
          onMouseEnter={() => this.setState({isOpen: true})}
          onMouseLeave={() => this.setState({isOpen: false})}
          style={{
            margin: '0!important',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            textAlign,
          }}
          id={targetId}
        >
          { this.props.target }
        </div>
        <div>
          <Popover
            placement="right"
            delay={{show: 0, hide: 0}}
            isOpen={this.state.isOpen}
            target={targetId}
            toggle={this.toggle}
          >
            <PopoverHeader>
              { this.props.header }
            </PopoverHeader>
            <PopoverBody>
              { this.props.body }
            </PopoverBody>
          </Popover>
        </div>
      </div>
    );
  }
}
