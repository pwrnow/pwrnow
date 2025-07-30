import http from 'k6/http';

export let options = {
  stages: [
    { duration: '10s', target: 10 }, // baseline traffic
    { duration: '5s', target: 1000 }, // spike to 1000 users
    { duration: '10s', target: 10 }, // scale down to baseline
  ],
};

export default function () {
  http.get('https://api.pwrnow.pl/v1/events/');
}
