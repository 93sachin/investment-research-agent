const yahooFinance = require('yahoo-finance2').default;

async function test() {
  console.log('Testing yahooFinance search for Apple...');
  try {
    const results = await yahooFinance.search('Apple');
    console.log('Search results quotes length:', results?.quotes?.length);
    if (results?.quotes) {
      console.log('First quote:', results.quotes[0]);
    }
  } catch (err) {
    console.error('Search error:', err);
  }

  console.log('\nTesting yahooFinance quote for AAPL...');
  try {
    const quote = await yahooFinance.quote('AAPL');
    console.log('Quote price:', quote?.regularMarketPrice);
  } catch (err) {
    console.error('Quote error:', err);
  }
}

test();
