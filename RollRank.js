import React, { Component } from 'react';
import { Motion, spring, presets } from 'react-motion';
import range from 'lodash/range';
import 'whatwg-fetch';

const springConfig = { stiffness: 120, damping: 14 };
const ySpringConfig = { stiffness: 120, damping: 14, precision: 1 };
const bgSpringConfig = { stiffness: 210, damping: 20, precision: 1 };

// compare two value with direction
function compare(value1, value2, direction = 1) {
  return (value1 - value2) * direction >= 0;
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
    // get remote state
    fetch(this.props.src)
      .then(response => response.json())
      .then(res => {
        const { title, problems, rank, history } = res;

        // set page title
        document.title = title;
        // get last conceal team
        let current = rank.length;
        while (current-- > 0) {
          let found = false;
          rank[current].problems.forEach(p => {
            if (p.reveal === false) found = true;
          });
          if (found) break;
        }
        if (current >= 0) {
          current = rank[current];
        } else {
          current = { team: null };
        }

        this.setState({
          title,
          problems: problems,
          rank: rank,
          history: history,
          current
        });
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
            <div className="ranklist-team">队伍</div>
            {problems.map(p => {
              return <div key={p} className="ranklist-problem">{p}</div>
            })}
            <div className="ranklist-solves">总成绩</div>
          </div>
          {range(rank.length).map(i => {
            //const r = rank.findIndex(r => r.rank === i + 1);
            const r = rank[i];
            const style = r.team === fly ? {
              scale: spring(1.08, springConfig),
              shadow: spring(16, springConfig),
              y: spring(this.y(r.rank), ySpringConfig),
              z: 99,
            } : {
              scale: spring(1, springConfig),
              shadow: spring(1, springConfig),
              y: spring(this.y(r.rank), ySpringConfig),
              z: 1,
            };
            return (
              <Motion style={style} key={i} onRest={() => { if (this.state.fly !== null) this.setState({ fly: null }); }}>
                {({ scale, shadow, y, z }) =>
                  <div
                    className="ranklist-item"
                    style={{
                      backgroundColor: r.team === current.team ? '#0cf' : '#fff',
                      boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0`,
                      transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                      zIndex: z
                    }}>
                    <div className="ranklist-rank">{r.rank}</div>
                    <div className="ranklist-team">{r.team}</div>
                    {r.problems.map(p => {
                      if (p.submits === 0) {
                        return (<div key={p.id} className="ranklist-problem ranklist-problem--untouched">{p.id}</div>);
                      } else {
                        const className = 'ranklist-problem ranklist-problem--' +
                          (p.reveal ? (p.solved ? 'accepted' : 'wrong') : 'unknown');

                        return (
                          <div key={p.id} className={className}>
                            {p.reveal && p.solved ? `${p.submits}-${p.time}` : p.submits}
                          </div>
                        );
                      }
                    })}
                    <div className="ranklist-solves">{`${r.solves} - ${r.penalty}`}</div>
                  </div>
                }
              </Motion>
            );
          })}
        </div>
      </div>
    );
  };
  // get y with rank
  y(rank) {
    // ranklist item height
    const height = 40;
    // margin between ranklist items
    const margin = 6;

    return (rank - 1) * (height + margin);
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
    const now = Math.floor(Date.now() / 1000);
    // one action allowed in a second
    if (this.state.timestamp >= now) {
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
      this[action]();
    }
  };
  // move current
  move(direction = 1) {
    const { current, rank } = this.state;
    let found = { team: null, rank: Infinity * direction };

    for (let i = 0; i < rank.length; i++) {
      if (rank[i].team !== current.team &&
        compare(rank[i].rank, current.rank, direction) &&
        compare(found.rank, rank[i].rank, direction)) {
        found = rank[i];
      }
    }
    this.setState({ current: Object.assign({}, found) });
  }
  // move up
  up() {
    this.move(-1);
  }
  // move down
  down() {
    this.move();
  }
  // reveal an unknown problem at tail
  forward() {
    const { current, fly, rank, history } = this.state;

    if (current.problems) {
      let problem = null;
      for (let i = 0; i < current.problems.length; i++) {
        if (current.problems[i].reveal === false) {
          problem = current.problems[i];
          break;
        }
      }
      if (problem) {
        problem.reveal = true;
        this.setState({ current });

        if (problem.solved) {
          current.solves++;
          current.penalty += problem.time;
          setTimeout(() => {
            this.adjust(current);
          }, 500);
        }
      }
    }
  };
  // undo the last action in the history
  backward() {
  };
  // adjust the rank
  // and update relative ranks
  adjust(r, direction = 1) {
    const { rank } = this.state;
    let newRank = rank.slice(0), newR = null, increment = 0;

    for (let i = 0; i < rank.length; i++) {
      if (r.team === rank[i].team) {
        newR = rank[i];
      } else {
        if (compare(r.rank, rank[i].rank, direction) && this.compare(r, rank[i], direction)) {
          newRank[i].rank++;
          increment++;
        }
      }
    }
    newR.rank -= increment;
    this.setState({ fly: increment ? newR.team : null, rank: newRank });

    let current = { team: null, rank: -Infinity };
    for (let i = 0; i < newRank.length; i++) {
      for (let j = 0; j < newRank[i].problems.length; j++) {
        if (newRank[i].problems[j].reveal === false && newRank[i].rank > current.rank) {
          current = newRank[i];
          break;
        }
      }
    }
    this.setState({ current });
  };
  // compare rank
  compare(r1, r2, direction) {
    if (r1.solves === r2.solves) {
      if (r1.penalty === r2.penalty) {
        return r1.team.localeCompare(r2.team) * direction >= 0;
      } else {
        return compare(r2.penalty, r1.penalty);
      }
    } else {
      return compare(r1.solves, r2.solves, direction);
    }
  }
}

export default RollRank;
