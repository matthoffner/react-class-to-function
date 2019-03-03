import React, { Component } from "react";
import { string, number } from "prop-types";

export default class ReactExample extends Component {
  static propTypes = {
    foo: string,
    bar: number
  };
  static defaultProps = {
    foo: "test",
    bar: 2
  };
  render() {
    return (
      <div>
        {this.props.foo}
        {this.props.bar}
      </div>
    );
  }
}
