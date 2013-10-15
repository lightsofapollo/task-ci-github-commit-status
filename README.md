task-ci-github-commit-status
============================

Task for github commit status will check:

  - is it open
  - can it be merged
  - does it have a commit status
  - is the commit status success


## Usage:

```js
var task = require('task-ci-github-commit-status');

task(
  {
    user: 'githubuser',
    repo: 'githubrepo',
    oauthToken: 'githuboauthtoken', /* optional */
    number: 1222, /* pull request number */
  },
  function(err, success, status) {
    // any case where success !== true
    // status => { state: 'ci_pending', message: '...' }
  }
);

```

## CLI usage:

```sh
# helpss!!
github-pull-status --help

# check on a project's status (11222 is a pull request number)
github-pull-status mozilla-b2g/gaia 11222
# => (exit 0) success pull request #12485 is safe to merge
# or maybe (exit 1) pull request #12487 is not safe to merge: pull request fails on CI
```
