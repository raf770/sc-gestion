import { NextRequest, NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import path from 'path'

const propertyId = '279909061'

const client = new BetaAnalyticsDataClient({
  keyFilename: path.join(process.cwd(), 'src', 'config', 'ga-credentials.json'),
})

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const startDate = `${days}daysAgo`

  try {
    // 1. Overview metrics
    const [overview] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    })

    const row = overview.rows?.[0]
    const metrics = {
      users: parseInt(row?.metricValues?.[0]?.value || '0'),
      newUsers: parseInt(row?.metricValues?.[1]?.value || '0'),
      sessions: parseInt(row?.metricValues?.[2]?.value || '0'),
      pageviews: parseInt(row?.metricValues?.[3]?.value || '0'),
      bounceRate: parseFloat(row?.metricValues?.[4]?.value || '0'),
      avgDuration: parseFloat(row?.metricValues?.[5]?.value || '0'),
    }

    // 2. Top pages
    const [pages] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    })

    const topPages = (pages.rows || []).map(r => ({
      page: r.dimensionValues?.[0]?.value || '',
      views: parseInt(r.metricValues?.[0]?.value || '0'),
      users: parseInt(r.metricValues?.[1]?.value || '0'),
    }))

    // 3. Traffic sources
    const [sources] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    })

    const totalSessions = metrics.sessions || 1
    const topSources = (sources.rows || []).map(r => ({
      source: r.dimensionValues?.[0]?.value || '',
      sessions: parseInt(r.metricValues?.[0]?.value || '0'),
      pct: Math.round((parseInt(r.metricValues?.[0]?.value || '0') / totalSessions) * 1000) / 10,
    }))

    // 4. Daily data
    const [daily] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    })

    const dailyData = (daily.rows || []).map(r => ({
      date: r.dimensionValues?.[0]?.value || '',
      users: parseInt(r.metricValues?.[0]?.value || '0'),
      sessions: parseInt(r.metricValues?.[1]?.value || '0'),
    }))

    // Format avg duration
    const totalSeconds = Math.round(metrics.avgDuration)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const avgDurationStr = `${minutes}m ${seconds}s`

    return NextResponse.json({
      users: metrics.users,
      newUsers: metrics.newUsers,
      sessions: metrics.sessions,
      pageviews: metrics.pageviews,
      bounceRate: Math.round(metrics.bounceRate * 1000) / 10,
      avgDuration: avgDurationStr,
      topPages,
      topSources,
      daily: dailyData,
    })
  } catch (error: any) {
    console.error('GA4 Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
