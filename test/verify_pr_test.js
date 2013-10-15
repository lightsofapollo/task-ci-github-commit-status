suite('verify_pr', function() {
  var verify = require('../lib/verify_pr'),
      githubFactory = require('../lib/github');

  var STATES = require('../lib/states');

  var github;
  setup(function() {
    this.sinon = sinon.sandbox.create();

    github = githubFactory.create();
    this.sinon.stub(githubFactory, 'create').returns(github);
  });

  teardown(function() {
    this.sinon.restore();
  });

  function pullRequest(overrides) {
    var base = {
      mergeable: true,
      state: 'open',
      head: {
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

  var user = 'james',
      repo = 'gaia',
      prNumber = 3333,
      oauthToken = 'abcoauthoyey';

  test('success', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // stub predefined output
    var pr = pullRequest(),
        statusList = pullRequestStatus(['success', 'fail']);

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
          sinon.match({ user: user, repo: repo, sha: pr.head.sha }),
          sinon.match.any
        );

        // result of successful operation
        assert.ok(!err, 'there is no err');
        assert.deepEqual(result, true);

        done();
      }
    );
  });

  test('success + oauth', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // stub predefined output
    var pr = pullRequest(),
        statusList = pullRequestStatus(['success', 'fail']);

    // pull request get success
    var get = this.sinon.stub(github.pullRequests, 'get');
    get.callsArgWithAsync(1, null, pr);

    // verify token is set
    var auth = this.sinon.stub(github, 'authenticate');

    // status request success
    var status = this.sinon.stub(github.statuses, 'get');
    status.callsArgWithAsync(1, null, statusList);

    verify(
      { user: user, repo: repo, number: prNumber, oauthToken: oauthToken },
      function(err, result) {
        // calls authenticate
        assert.calledWithMatch(
          auth,
          sinon.match({ type: 'oauth', token: oauthToken })
        );

        // calls get
        assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

        // get pr is before status check
        assert(get.calledBefore(status), 'gets before status');

        // status check
        assert.calledWithMatch(
          status,
          sinon.match({ user: user, repo: repo, sha: pr.head.sha }),
          sinon.match.any
        );

        // result of successful operation
        assert.ok(!err, 'there is no err');
        assert.deepEqual(result, true);

        done();
      }
    );

  });

  test('not mergeable', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // stub predefined output
    var pr = pullRequest({ mergeable: false });

    // pull request get success
    var get = this.sinon.stub(github.pullRequests, 'get');
    get.callsArgWithAsync(1, null, pr);

    verify(
      { user: user, repo: repo, number: prNumber },
      function(err, result, status) {
        // calls get
        assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

        // result of successful operation
        assert.ok(!err, 'there is no err');
        assert.equal(result, false, 'failed task');
        assert.deepEqual(status, STATES.CANNOT_MERGE);
        done();
      }
    );
  });

  test('pull request is closed', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // stub predefined output
    var pr = pullRequest({ state: 'closed' });

    // pull request get success
    var get = this.sinon.stub(github.pullRequests, 'get');
    get.callsArgWithAsync(1, null, pr);

    verify(
      { user: user, repo: repo, number: prNumber },
      function(err, result, status) {
        // calls get
        assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

        // result of successful operation
        assert.ok(!err, 'there is no err');
        assert.equal(result, false, 'task failed');
        assert.equal(status, STATES.CLOSED);
        done();
      }
    );
  });

  test('no status', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // stub predefined output
    var pr = pullRequest(),
        statusList = pullRequestStatus([]);

    // pull request get success
    var get = this.sinon.stub(github.pullRequests, 'get');
    get.callsArgWithAsync(1, null, pr);

    // status request success
    var ciStatus = this.sinon.stub(github.statuses, 'get');
    ciStatus.callsArgWithAsync(1, null, statusList);

    verify(
      { user: user, repo: repo, number: prNumber },
      function(err, result, status) {
        // calls get
        assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

        // get pr is before status check
        assert(get.calledBefore(status), 'gets before status');

        // status check
        assert.calledWithMatch(
          ciStatus,
          sinon.match({ user: user, repo: repo, sha: pr.head.sha }),
          sinon.match.any
        );

        // result of successful operation
        assert.ok(!err, 'there is no err');
        assert.equal(result, false, 'failed task');
        assert.deepEqual(status, STATES.CI_NO_STATUS);
        done();
      }
    );
  });

  test('status: failure', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // stub predefined output
    var pr = pullRequest(),
        statusList = pullRequestStatus(['failure']);

    // pull request get success
    var get = this.sinon.stub(github.pullRequests, 'get');
    get.callsArgWithAsync(1, null, pr);

    // status request success
    var ciStatus = this.sinon.stub(github.statuses, 'get');
    ciStatus.callsArgWithAsync(1, null, statusList);

    verify(
      { user: user, repo: repo, number: prNumber },
      function(err, result, status) {
        // calls get
        assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

        // get pr is before status check
        assert(get.calledBefore(status), 'gets before status');

        // status check
        assert.calledWithMatch(
          ciStatus,
          sinon.match({ user: user, repo: repo, sha: pr.head.sha }),
          sinon.match.any
        );

        // result of successful operation
        assert.ok(!err, 'there is no err');
        assert.equal(result, false, 'task failed');
        assert.deepEqual(status, STATES.CI_FAIL);
        done();
      }
    );
  });

  test('status: pending', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // stub predefined output
    var pr = pullRequest(),
        statusList = pullRequestStatus(['pending']);

    // pull request get success
    var get = this.sinon.stub(github.pullRequests, 'get');
    get.callsArgWithAsync(1, null, pr);

    // status request success
    var ciStatus = this.sinon.stub(github.statuses, 'get');
    ciStatus.callsArgWithAsync(1, null, statusList);

    verify(
      { user: user, repo: repo, number: prNumber },
      function(err, result, status) {
        // calls get
        assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

        // get pr is before status check
        assert(get.calledBefore(ciStatus), 'gets before status');

        // status check
        assert.calledWithMatch(
          ciStatus,
          sinon.match({ user: user, repo: repo, sha: pr.head.sha }),
          sinon.match.any
        );

        // result of successful operation
        assert.ok(!err, 'there is no err');
        assert.equal(result, false, 'task fail');
        assert.deepEqual(status, STATES.PENDING);
        done();
      }
    );
  });

  test('failure: pr not found', function(done) {
    // input of operation
    var input = { user: user, repo: repo, number: prNumber };

    // pull request invalid pr
    var get = this.sinon.stub(github.pullRequests, 'get');
    get.callsArgWithAsync(1, { code: 404 });

    verify(
      { user: user, repo: repo, number: prNumber },
      function(err, result, status) {
        // calls get
        assert.calledWithMatch(get, sinon.match(input), sinon.match.any);

        assert.ok(!err, 'there is no err');
        assert.equal(result, false, 'task failed');
        assert.deepEqual(status, STATES.INVALID_PR);
        done();
      }
    );
  });

});
