import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const tokenRate = new Rate('business_token_rate');
const promptLength = new Trend('business_prompt_length');
const responseLength = new Trend('business_response_length');
const customDuration = new Trend('business_response_duration');
const requestCount = new Counter('business_request_count');
const errorCount = new Counter('business_error_count');

export let options = {
  stages: [
    { duration: '15s', target: 3 },   // Warm-up with fewer users
    { duration: '30s', target: 5 },   // Moderate load
    { duration: '15s', target: 0 },   // Scale down
  ],
  thresholds: {
    // Response time thresholds adjusted for AI API reality
    'http_req_duration': [
      'p(95)<12000',  // 95% of requests should be below 12s
      'p(99)<15000',  // 99% of requests should be below 15s
      'max<20000',    // No request should take more than 20s
    ],
    // Error rate thresholds
    'http_req_failed': ['rate<0.15'],  // Allow up to 15% errors due to rate limits
    // Custom metric thresholds
    'business_token_rate': ['rate>0.85'],  // 85% successful responses
    'business_response_duration': ['p(95)<15000'],  // Business logic timing
    'business_request_count': ['count>30'],  // Minimum 30 requests for local testing
    'http_reqs': ['rate>0.5'],  // At least 0.5 RPS on average
  },
  // Add tags for better Grafana filtering
  tags: {
    service: 'chatbot-api',
    environment: __ENV.TEST_ENV || 'local'
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  let requestDuration;

  group('AI Chat API', function () {
    const prompt = 'What is artificial intelligence?';
    promptLength.add(prompt.length);
    requestCount.add(1);

    const payload = JSON.stringify({
      prompt: prompt
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '30s',
      tags: { endpoint: 'chat' }  // Tag for Grafana filtering
    };

    const startTime = new Date();
    let res = http.post(`${BASE_URL}/chat/`, payload, params);
    requestDuration = new Date() - startTime;
    customDuration.add(requestDuration);

    // Check response
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has valid response': (r) => r.body.length > 0,
    });

    // Record response metrics
    if (res.status === 200) {
      tokenRate.add(1);  // Successful response
      responseLength.add(res.body.length);
    } else {
      tokenRate.add(0);  // Failed response
      errorCount.add(1);
      console.log(`Error: ${res.status} - ${res.body}`);
    }

    // Log detailed metrics every 5th iteration for more frequent feedback
    if (__ITER % 5 === 0) {
      console.log(`
        Iteration: ${__ITER}
        VUs: ${__VU}
        Response Time: ${requestDuration}ms
        Response Size: ${res.body.length} bytes
        Status: ${res.status}
        Error Rate: ${errorCount.value / requestCount.value}
        Total Requests: ${requestCount.value}
      `);
    }
  });

  // Dynamic sleep based on response time with shorter minimum
  const minSleep = 1;
  const maxSleep = 3;
  const sleepTime = Math.min(maxSleep, Math.max(minSleep, requestDuration / 1000));
  sleep(sleepTime);
}
