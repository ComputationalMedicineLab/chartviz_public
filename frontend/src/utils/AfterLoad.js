/**
 * Loads some data and defers rendering children until the data is loaded
 */
import React from 'react';
import { RingLoader } from 'react-spinners';
import { noop } from 'lodash';

export default class AfterLoad extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true };
    this.doLoad = this.doLoad.bind(this);
  }

  doLoad() {
    const postload = this.props.postload || noop;
    this.setState({ loading: true }, async () => {
      const data = await this.props.loader();
      this.setState({ loading: false, data }, postload);
    });
  }

  componentDidMount() {
    this.doLoad();
  }

  componentDidUpdate(props) {
    if (props.reloadkey !== this.props.reloadkey)
      this.doLoad();
  }

  render() {
    if (this.state.loading) {
      return (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <RingLoader color='#36D7B7' />
        </div>
      );
    }
    return this.props.children(this.state.data);
  }
}
