import http from 'k6/http';
import { Trend } from 'k6/metrics';

const latency = new Trend('latency');

export let options = {
  stages: [
    { duration: '30s', target: 10 }, // ramp up to 10 users
    { duration: '1m', target: 10 }, // hold at 10 users
    { duration: '30s', target: 0 }, // ramp down
  ],
};

export default function () {
  const res = http.get('https://api.pwrnow.pl/v1/events/');
  latency.add(res.timings.duration);

  if (res.status !== 200) {
    console.error(`❌ Failed with status ${res.status}`);
  }
}
