if (/--debug|--inspect/.test(process.execArgv.join(' '))) {
  console.log('Node process is under debugger; extending test timeout.');
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 60 * 24; // seconds
}
