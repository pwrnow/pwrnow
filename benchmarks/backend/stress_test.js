import http from 'k6/http';

export let options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '20s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '20s', target: 150 },
    { duration: '20s', target: 200 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // <5% errors
    http_req_duration: ['p(95)<1000'], // 95% requests < 1s
  },
};

export default function () {
  http.get('https://api.pwrnow.pl/v1/events/');
}

// Spike test configuration
export let spikeOptions = {
  stages: [
    { duration: '10s', target: 10 }, // normal traffic
    { duration: '5s', target: 200 }, // sudden spike
    { duration: '10s', target: 10 }, // back to normal
  ],
};

export function spikeTest() {
  http.get('https://api.pwrnow.pl/v1/events/');
}
