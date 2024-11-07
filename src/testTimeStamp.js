const timestamp = new Date();
const options = {
  timeZone: 'Europe/Amsterdam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

const localizedTimestamp = timestamp.toLocaleString('nl-NL', options).replace(/:/g, '-').replace(/,/g, '--').replace(/\s+/g, '');

console.log(localizedTimestamp);