suite('verify_pr', function() {
  var verify = require('../lib/verify_pr'),
      github = require('../lib/github');

  setup(function() {
    this.sinon = sinon.sandbox.create();
  });

  teardown(function() {
    this.sinon.restore();
  });

  function pullRequest(overrides) {
    var base = {
      mergeable: true,
      base: {
        sha: 'myshaisbetterthenyoursha'
      }
    };

    if (overrides) {
      for (var key in overrides) base[key] = overrides[key];
    }

    return base;
  };

  function pullRequestStatus(list) {
    var result = [];
    list.forEach(function(item) {
      result.push({
        state: item
      });
    });

    return result;
  }

  suite('verify pull request', function() {
    var user = 'james',
        repo = 'gaia',
        prNumber = 3333;

    test('success', function(done) {
      // input of operation
      var input = { user: user, repo: repo, number: prNumber };

      // stub predefined output
      var pr = pullRequest(),
          statusList = pullRequestStatus(['fail', 'success']);

      // pull request get success
      var get = this.sinon.stub(github.pullRequests, 'get');
      get.callsArgWithAsync(1, null, pr);

      // status request success
      var status = this.sinon.stub(github.statuses, 'get');
      status.callsArgWithAsync(1, null, statusList);

      verify(
        { user: user, repo: repo, number: prNumber },
        function(err, result) {
          // calls get
          assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

          // get pr is before status check
          assert(get.calledBefore(status), 'gets before status');

          // status check
          assert.calledWithMatch(
            status,
            sinon.match({ user: user, repo: repo, sha: pr.base.sha }),
            sinon.match.any
          );

          // result of successful operation
          assert.ok(!err, 'there is no err');
          assert.deepEqual(result, {
            success: true
          });

          done();
        }
      );
    });

  });
});
