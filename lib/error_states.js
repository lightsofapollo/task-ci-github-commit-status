module.exports = {
  CI_FAIL: {
    state: 'ci_fail',
    message: 'pull request fails on CI'
  },

  CI_NO_STATUS: {
    state: 'ci_no_status',
    message: 'pull request has no status associated with it'
  },

  PENDING: {
    state: 'pending',
    message: 'pull request status is pending'
  },

  CLOSED: {
    state: 'closed',
    message: 'pull request is closed'
  },

  CANNOT_MERGE: {
    state: 'cannot_merge',
    message: 'pull request cannot be merged'
  }
};
