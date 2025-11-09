import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching currencies from OxaPay...');

    const response = await fetch('https://api.oxapay.com/v1/common/currencies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('OxaPay API error:', response.status, response.statusText);
      throw new Error('Failed to fetch currencies from OxaPay');
    }

    const data = await response.json();
    console.log('OxaPay response:', JSON.stringify(data, null, 2));

    // Check if data exists and has the expected structure
    if (!data || !data.data) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid response structure');
    }

    // Extract and format currency list
    const currencies = Object.entries(data.data).map(([symbol, info]: [string, any]) => {
      // Handle different network structures
      let networks: string[] = [];
      if (Array.isArray(info.networks)) {
        networks = info.networks.map((net: any) => net.network || net);
      } else if (info.networks && typeof info.networks === 'object') {
        // If networks is an object, extract keys or values
        networks = Object.keys(info.networks);
      }

      return {
        symbol,
        name: info.name || symbol,
        networks,
      };
    });

    console.log('Parsed currencies:', currencies.length, 'coins');

    return NextResponse.json({
      currencies,
      count: currencies.length,
      success: true
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);

    // Fallback to default currencies if API fails
    const fallbackCurrencies = [
      { symbol: 'USDT', name: 'Tether', networks: ['Ethereum', 'Tron', 'BSC'] },
      { symbol: 'BTC', name: 'Bitcoin', networks: ['Bitcoin'] },
      { symbol: 'ETH', name: 'Ethereum', networks: ['Ethereum'] },
      { symbol: 'LTC', name: 'Litecoin', networks: ['Litecoin'] },
      { symbol: 'TRX', name: 'TRON', networks: ['Tron'] },
    ];

    console.log('Using fallback currencies');

    return NextResponse.json({
      currencies: fallbackCurrencies,
      count: fallbackCurrencies.length,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
