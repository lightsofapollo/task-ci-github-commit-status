module.exports = {
  CI_FAIL: {
    state: 'ci_fail',
    message: 'pull request fails on CI'
  },

  CI_PENDING: {
    state: 'ci_pending',
    message: 'pull request status is pending'
  },

  CANNOT_MERGE: {
    state: 'cannot_merge',
    message: 'pull request cannot be merged'
  }
};
