import client from './client'

/*
 * earnings.api.js — provider earnings dashboard data
 */

// GET /api/v1/provider/earnings/dashboard
export async function getEarningsDashboard() {
  const { data } = await client.get('/api/v1/provider/earnings/dashboard')
  return data
}
