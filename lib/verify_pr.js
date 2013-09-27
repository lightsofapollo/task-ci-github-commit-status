var github = require('./github');

/**
state constants here mostly for documentation
*/
var STATES = {
  cannot_merge: 'cannot_merge',
  ci_failed: 'ci_failed',
  ci_pending: 'ci_pending'
};

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
  var prOpts = {
    repo: options.repo,
    user: options.user,
    number: options.number
  };

  function onPullRequest(err, result) {
    if (err) return callback(err);

    github.statuses.get(
      { repo: prOpts.repo, user: prOpts.user, sha: result.base.sha },
      onStatus
    );
  }

  function onStatus(err, statusList) {
    if (err) return callback(err);
    var last = statusList[statusList.length - 1];

    callback(null, {
      success: true
    });
  }

  github.pullRequests.get(prOpts, onPullRequest);

}

module.exports = verifyPullRequest;
