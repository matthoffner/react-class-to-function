# react-class-to-function

The most basic conversion, converts:

```js
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
```

to

```js
import React from "react";
import { string, number } from "prop-types";

export default function ReactExample({ foo, bar }) {
  return (
    <div>
      {foo}
      {bar}
    </div>
  );
}
ReactExample.propTypes = {
  foo: string,
  bar: number
};
ReactExample.defaultProps = {
  foo: "test",
  bar: 2
};
```

## How to use

```sh
jscodeshift -t index.js react-class.js
```
