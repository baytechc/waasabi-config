export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring Redis…`;

  // Needed only for peertube currently
  if (setup.services?.peertube) {
    const run = [];

    // Install Redis components
    run.push([
      '@ospkg',
      'redis',
    ]);

    return { name, desc, run, success: `Redis server deployed.` }
  }

  return { name, desc, skip: `Redis installation is not requested, skipping` }
}
