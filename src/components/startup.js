export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Initial setup…`;

  const run = [];

  // Generic workaround for a sudo/container bug
  // https://github.com/sudo-project/sudo/issues/42
  run.push([
    'bash', '-c',
    `'echo "Set disable_coredump false" >> /etc/sudo.conf'`
  ]);

  return { name, desc, run, success: `Initial setup completed` };
}
