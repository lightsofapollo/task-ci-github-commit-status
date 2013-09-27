var debugStatus =
      require('debug')('task-ci-github-commit-status:verify-status');

var debugResponse =
    require('debug')('task-ci-github-commit-status:verify-response');

var githubFactory = require('./github');

/**
state constants here mostly for documentation
*/
var STATES = require('./error_states');

/**
Verify the status of a given pull request

@param {Object} options to verify pull.
@param {String} options.user which the repo is under.
@param {String} options.repo name of the repo.
@param {Number} options.number pull request #
@param {String} [options.oauthToken] oAuth token for github authentication.
@param {Function} callback [Error, Object { success: Boolean, message: '' }]
*/
function verifyPullRequest(options, callback) {
  var github = githubFactory.create();

  var prOpts = {
    repo: options.repo,
    user: options.user,
    number: options.number
  };

  debugStatus('verify', options);

  if (options.oauthToken) {
    github.authenticate({ type: 'oauth', token: options.oauthToken });
    debugStatus('authenticate with oauth');
  }

  function onPullRequest(err, pullRequest) {
    debugResponse('pull request', err, pullRequest);
    if (err) return callback(err);

    // if the pull request is closed abort
    if (pullRequest.state !== 'open') {
      debugStatus('pr not opened');
      callback(null, {
        success: false,
        state: STATES.CLOSED.state,
        message: STATES.CLOSED.message
      });
      return;
    }

    // if we cannot merge the pull request then we are done
    if (!pullRequest.mergeable) {
      debugStatus('pr not mergeable');
      callback(null, {
        success: false,
        state: STATES.CANNOT_MERGE.state,
        message: STATES.CANNOT_MERGE.message
      });
      return;
    }

    debugStatus('github.statuses.get');
    github.statuses.get(
      { repo: prOpts.repo, user: prOpts.user, sha: pullRequest.head.sha },
      onStatus
    );
  }

  function onStatus(err, statusList) {
    debugResponse('pr status', err, statusList);
    if (err) return callback(err);

    // when there is no status or the status list is empty
    if (!Array.isArray(statusList) || !statusList.length) {
      debugStatus('no status');
      callback(null, {
        success: false,
        state: STATES.CI_NO_STATUS.state,
        message: STATES.CI_NO_STATUS.message
      });
      return;
    }

    var last = statusList[statusList.length - 1];
    var state = last.state;

    // everything else with a status
    switch (state) {
      case 'pending':
        debugStatus('pr status is pending');
        callback(null, {
          success: false,
          state: STATES.PENDING.state,
          message: STATES.PENDING.message
        });
        break;

      case 'success':
        debugStatus('pr status success');
        callback(null, { success: true });
        break;

      default:
        debugStatus('pr status', state);
        callback(null, {
          success: false,
          state: STATES.CI_FAIL.state,
          message: STATES.CI_FAIL.message
        });
        break;
    }
  }


  debugStatus('github.pullRequest.get');
  github.pullRequests.get(prOpts, onPullRequest);

}

module.exports = verifyPullRequest;
