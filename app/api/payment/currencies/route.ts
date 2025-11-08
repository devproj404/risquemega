import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.oxapay.com/v1/common/currencies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch currencies from OxaPay');
    }

    const data = await response.json();

    // Extract and format currency list
    const currencies = Object.entries(data.data || {}).map(([symbol, info]: [string, any]) => ({
      symbol,
      name: info.name,
      networks: info.networks?.map((net: any) => net.network) || [],
    }));

    return NextResponse.json({ currencies });
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

    return NextResponse.json({ currencies: fallbackCurrencies });
  }
}
