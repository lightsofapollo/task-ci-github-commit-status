var debugStatus =
      require('debug')('task-ci-github-commit-status:verify-status');

var debugResponse =
    require('debug')('task-ci-github-commit-status:verify-response');

var githubFactory = require('./github');

/**
state constants here mostly for documentation
*/
var STATES = require('./states');

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

    // if the error object has a code of 404 then its not a critical failure but
    // the pull request number is probably invalid.
    if (err && err.code === 404) {
      debugStatus('pr number invalid');
      return callback(null, false, STATES.INVALID_PR);
    }

    if (err) return callback(err);

    // if the pull request is closed abort
    if (pullRequest.state !== 'open') {
      debugStatus('pr not opened');
      return callback(null, false, STATES.CLOSED);
    }

    // if we cannot merge the pull request then we are done
    if (!pullRequest.mergeable) {
      debugStatus('pr not mergeable');
      return callback(null, false, STATES.CANNOT_MERGE);
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
      return callback(null, false, STATES.CI_NO_STATUS);
    }

    var state = statusList[0] && statusList[0].state;

    // everything else with a status
    switch (state) {
      case 'pending':
        debugStatus('pr status is pending');
        return callback(null, false, STATES.PENDING);

      case 'success':
        debugStatus('pr status success');
        return callback(null, true);
        break;

      default:
        debugStatus('pr status', state);
        return callback(null, false, STATES.CI_FAIL);
    }
  }

  debugStatus('github.pullRequest.get');
  github.pullRequests.get(prOpts, onPullRequest);

}

module.exports = verifyPullRequest;
