import React from 'react';
import ReactDOM from 'react-dom';
import RollRank from './RollRank';
import promise from 'es6-promise';

promise.polyfill();

ReactDOM.render(<RollRank />, document.querySelector('#rollrank-app'));
