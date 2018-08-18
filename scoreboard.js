function properties(obj) {
  return _(obj).toPairs().map(([key, value]) => `${key}: ${value}`)
}
function truncate(str) {
  return str.length > 20 ? str.substring(0, 20) + '...' : str;
}
AFRAME.registerComponent('scoreboard', {
  dependencies: ['sync'],
  schema: {
    on: {type: 'string'},
    filter: {type: 'string'},
  },
  init: function () {
    this.syncSys = this.el.components.sync.syncSys;
    if (this.syncSys.isConnected) {
      this.setup();
    }
    else {
      this.el.sceneEl.addEventListener('connected', this.setup.bind(this));
    }
  },
  setup() {
    var dataRef = this.el.components.sync.dataRef;
    this.userId = this.syncSys.userInfo.userId;
    var userRef = dataRef.child('users').child(this.userId);

    userRef.child('displayName').set(this.syncSys.userInfo.displayName);

    this.score = userRef.child('score');

    document.body.addEventListener(this.data.on, this.incrementScore.bind(this));
    dataRef.child('users').on('value', this.renderScores.bind(this));
  },
  incrementScore: function (event) {
    if (!event.target.matches(this.data.filter)) { return; }
    this.score.transaction((val) => val + 1);
  },
  renderScores: function (snapshot) {
    var users = snapshot.val();
    var sortedUsers = _(users).values().filter('score').sortBy('score').reverse().take(20).value();
    // TODO: Do something nicer with people who reach the max score. E.g. display a golden egg!
    var myScore = users[this.userId].score || '';
    // TODO: Make this look pretty
    ReactDOM.render(
      <a-entity>
        <a-entity n-text={properties({text: myScore})} position="-0.85 0.405 -1.75" rotation="-25 0 0" scale="0.12 0.12 0.03" n-cockpit-parent></a-entity>
        {sortedUsers.map((user, i) =>
          <a-entity position='-4.8 15 0' rotation="0 0 0" scale='0.16 0.16 0.16'>
            <a-entity n-text={properties({text: truncate(user.displayName)})} position={`-2 ${-i} 0`}></a-entity>
            {user.score > 200 && <a-entity mixin="golden-egg" position={`6 ${-i - 0.2} 0`}></a-entity>}
            <a-entity n-text={properties({text: user.score})} position={`4 ${-i} 0`}></a-entity>
          </a-entity>
        )}
      </a-entity>,
      this.el
    );
  }
});