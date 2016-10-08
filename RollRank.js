import React, { Component } from 'react';
import range from 'lodash/range';
import 'whatwg-fetch';

// compare two value with direction
function compare(value1, value2, direction = 1) {
  return (value1 - value2) * direction >= 0;
}

// scroll to specific offset
function scrollToElement(id) {
  const currentY = window.pageYOffset ||
    (window.document.documentElement && window.document.documentElement.scrollTop)
    window.document.body.scrollTop || 0;
  const windowHeight = window.innerHeight ||
    (window.document.documentElement && window.document.documentElement.clientHeight) ||
    document.body.clientHeight || 360;

  if (!id) return;
  const $element = document.querySelector('#' + id);
  if (!$element) return;

  const offset = $element.offsetTop - windowHeight + 200;
  const delayUnit = 300 / Math.abs(currentY - offset); // ms
  let delay = 0; // ms

  if (currentY < offset) {
    for (var i = currentY + 1; i <= offset; i++) {
      setTimeout(function(i) {
        window.scroll(0, i);
      }, Math.floor(delay), i);
      delay += delayUnit;
    }
  } else if (currentY > offset) {
    for (var i = currentY - 1; i >= offset; i--) {
      setTimeout(function(i) {
        window.scroll(0, i);
      }, Math.floor(delay), i);
      delay += delayUnit;
    }
  }
}

class RollRank extends Component {
  static defaultProps = {
    src: 'rank.json'
  };
  // initial state
  state = { problems: [], rank: [], history: [] };

  constructor(props) {
    super(props);
    // add key board listener
    window.addEventListener('keydown', e => { this.handleKeyUp(e); });
    //window.addEventListener('keyup', e => { this.handleKeyUp(e); });
    let src = 'rank.json';
    const $meta = document.querySelector('meta[name="rank-src"]');
    if ($meta) {
      src = $meta.attributes.content.value;
    }
    // get remote state
    fetch(src)
      .then(response => response.json())
      .then(res => {
        const { title, problems, rank, history } = res;

        // set page title
        document.title = title;

        this.setState({
          title,
          problems,
          rank,
          history,
          current: {}
        }, () => this.setState({ current: this.move({ rank: Infinity }) }));
      });
  };

  render() {
    const { current, fly, rank, problems } = this.state;

    return (
      <div className="rollrank">
        <div className="rollrank-header">
          <img src="assets/logo.png" alt="logo" />
          <h1>{this.state.title}</h1>
        </div>
        <div className="ranklist">
          <div className="ranklist-header">
            <div className="ranklist-rank">排名</div>
            <div className="ranklist-school">学校</div>
            <div className="ranklist-team">队伍</div>
            {problems.map(p => {
              return <div key={p} className="ranklist-problem">{p}</div>
            })}
            <div className="ranklist-solves">总成绩</div>
          </div>
          {range(rank.length).map(i => {
            const r = rank[i];
            let style = {
              top: this.y(r.rank),
              zIndex: 1,
              backgroundColor: '#fff'
            };

            if (r.id === fly) {
              style.zIndex = 99;
              style.animation = '1.2s raise';
            }
            if (r.id === current.id) {
              style.backgroundColor = '#0cf';
            }

            return (
              <div
                id={r.id}
                key={i}
                className="ranklist-item"
                style={style}>
                <div className="ranklist-rank">{r.rank}</div>
                <div className="ranklist-school">{r.school}</div>
                <div className="ranklist-team">{r.team}</div>
                {r.problems.map(p => {
                  if (p.submits === 0) {
                    return (<div key={p.id} className="ranklist-problem ranklist-problem--untouched">{p.id}</div>);
                  } else if (p.reveal > 0) {
                    return (<div key={p.id} className="ranklist-problem ranklist-problem--unknown">{`${p.submits - p.reveal}+${p.reveal}`}</div>);
                  } else if (p.solved) {
                    return (<div key={p.id} className="ranklist-problem ranklist-problem--accepted">{`${p.submits}-${p.time}`}</div>);
                  } else {
                    return (<div key={p.id} className="ranklist-problem ranklist-problem--wrong">-{p.submits}</div>);
                  }
                })}
                <div className="ranklist-solves">{`${r.solves} - ${r.penalty}`}</div>
              </div>
            );
          })}
        </div>
        <div className="rollrank-footer" style={{ marginTop: (this.state.rank.length * 48 + 20) + 'px' }}>
          <div className="empty-flex"></div>
          <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h24v24H0V0z" fill="none"/>
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          with
          <svg fill="#ff0000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          by Herobs
          <div className="empty-flex"></div>
        </div>
      </div>
    );
  };
  // get y with rank
  y(rank) {
    // ranklist item height
    const height = 42;
    // margin between ranklist items
    const margin = 6;
    // ranklist header height
    const header = 72;

    return (rank - 1) * (height + margin) + header;
  };
  // format seconds to hh:mm:ss
  format(seconds) {
    let hours = Math.floor(seconds / 3600);
    if (hours < 10) hours = '0' + hours;

    seconds %= 3600;
    let minutes = Math.floor(seconds / 60);
    if (minutes < 10) minutes = '0' + minutes;

    seconds %= 60;
    if (seconds < 10) seconds = '0' + seconds;

    return hours + ':' + minutes + ':' + seconds;
  };
  // key up handler
  handleKeyUp(e) {
    if (this.acting) {
      e.preventDefault();
      return;
    }

    const keyCodes = {
      13: 'Enter',
      32: ' ',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
    };
    const keys = {
      forward: ['ArrowRight', ' ', 'Enter'],
      backward: ['ArrowLeft'],
      up: ['ArrowUp'],
      down: ['ArrowDown'],
    };
    // key map
    const keymap = Object.keys(keys).reduce((keymap, action) => {
      keys[action].forEach(key => keymap[key] = action);
      return keymap;
    }, {});

    const action = keymap[e.key] || keymap[keyCodes[e.keyCode]];
    if (action) {
      // prevent default key behaviour
      e.preventDefault();
      this.acting = true;
      this[action](err => {
        this.acting = false;
      });
    }
  };
  // move current
  move(current, direction = -1) {
    const { rank } = this.state;
    let found = { id: null, rank: Infinity * direction };

    for (let i = 0; i < rank.length; i++) {
      if (rank[i].id !== current.id &&
        compare(rank[i].rank, current.rank, direction) &&
        compare(found.rank, rank[i].rank, direction)) {
        found = rank[i];
      }
    }

    scrollToElement(found.id);

    return found;
  }
  // move up
  up(callback) {
    this.setState({ current: this.move(this.state.current) }, callback);
  }
  // move down
  down(callback) {
    this.setState({ current: this.move(this.state.current, 1) }, callback);
  }
  // the reveal problem in current
  reveal(current) {
    let problem = null;
    for (let i = 0; i < current.problems.length; i++) {
      if (current.problems[i].reveal > 0) {
        problem = current.problems[i];
        break;
      }
    }

    return problem;
  }
  // find next conceal team
  next(current, direction = -1) {
    const problem = this.reveal(current);
    if (problem) {
      return current;
    } else {
      return this.move(current, direction);
    }
  }
  // reveal an unknown problem at tail
  forward(callback) {
    const { current, rank, history } = this.state;

    if (current.problems) {
      const problem = this.reveal(current);
      if (problem) {
        problem.reveal = 0;

        if (problem.solved) {
          current.solves++;
          current.penalty += problem.time;
          this.adjust(current, 1, callback)
        } else {
          this.setState({ current }, () => {
            setTimeout(() => {
              this.setState({ current: this.next(current) }, callback);
            }, 500);
          });
        }
      } else {
        this.setState({ current: this.next(current) }, callback);
      }
    }
  };
  // undo the last action in the history
  backward() {
  };
  // adjust the rank
  // and update relative ranks
  adjust(current, direction, callback) {
    let { rank } = this.state, increment = 0;
    const oldCurrentRank = current.rank;

    for (let i = 0; i < rank.length; i++) {
      if (rank[i].id === current.id) continue;
      if (compare(current.rank, rank[i].rank, direction) &&
        this.compare(current, rank[i], direction)) {
        rank[i].rank++;
        increment++;
      }
    }
    current.rank -= increment;

    if (increment) {
      this.setState({ current }, () => {
        setTimeout(() => {
          this.setState({ fly: current.id, rank: rank},
            () => {
            setTimeout(() => {
              let next = { id: null };
              for (let i = 0; i < rank.length; i++) {
                if (oldCurrentRank === rank[i].rank) {
                  next = rank[i];
                }
              }
              this.setState({ current: next }, callback);
            }, 1200);
          });
        }, 500);
      })
    } else {
      this.setState({ current: this.next(current), rank }, callback);
    }
  };
  // compare rank
  compare(r1, r2, direction) {
    if (r1.solves === r2.solves) {
      if (r1.penalty === r2.penalty) {
        return r1.id.localeCompare(r2.id) * direction >= 0;
      } else {
        return compare(r2.penalty, r1.penalty);
      }
    } else {
      return compare(r1.solves, r2.solves, direction);
    }
  }
}

export default RollRank;
