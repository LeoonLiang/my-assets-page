<script setup lang="ts">
import { useHead, useFetch } from '#imports'
import { computed, ref } from 'vue'

interface Asset {
  id?: number
  name: string
  date: string
  cover: string
  price: number | string
  status: number
  retire_date?: string
  retire_reason?: string
  sell_date?: string
  sell_price?: number | string
  content?: string
  updated?: string
  [key: string]: any
}

interface AssetsResponse {
  title: string
  author: string
  showGithubLink: boolean
  assets: Asset[]
}

const { data: assetsData } = await useFetch<AssetsResponse>('/api/assets')

// Extract title and author from API response
const pageTitle = computed(() => assetsData.value?.title || 'Assets - My Assets Page')
const pageAuthor = computed(() => assetsData.value?.author || 'My')

const seoKeywords = computed(() => {
  const names = (assetsData.value?.assets || []).map((a: any) => a.name).slice(0, 10)
  const baseKeywords = ['资产', '资产管理', '个人资产', '财务', '数码']
  return [...baseKeywords, ...names].join(', ')
})

const ogImage = computed(() => {
  const firstCover = (assetsData.value?.assets || []).find((a: any) => a.cover)?.cover
  return firstCover || '/android-chrome-512x512.png'
})

useHead({
  title: pageTitle,
  link: [
    { rel: 'canonical', href: '/' }
  ],
  meta: [
    { name: 'description', content: pageAuthor.value + ' Assets Page' },
    { name: 'keywords', content: seoKeywords.value },
    { name: 'robots', content: 'index,follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: pageAuthor.value + ' Assets Page' },
    { property: 'og:url', content: '/' },
    { property: 'og:image', content: ogImage.value },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle.value },
    { name: 'twitter:description', content: pageAuthor.value + ' Assets Page' },
    { name: 'twitter:image', content: ogImage.value }
  ]
})

// Normalize assets
const normalizedAssets = computed(() => {
  if (!assetsData.value?.assets) return []
  
  return assetsData.value.assets.map((item: any) => {
    const purchaseDate = new Date(item.date)
    const now = new Date()
    
    // Determine end date based on status
    let endDate = now
    if (item.status == 0 && item.retire_date) {
      endDate = new Date(item.retire_date)
    } else if (item.status == 2 && item.sell_date) {
      endDate = new Date(item.sell_date)
    }
    
    // Calculate difference in days (ignoring hours)
    const purchaseTime = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate()).getTime()
    const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime()
    
    const diffTime = Math.abs(endTime - purchaseTime)
    const usedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    
    const price = Number(item.price) || 0
    const sellPrice = Number(item.sell_price) || 0
    const netCost = item.status == 2 ? Math.max(0, price - sellPrice) : price
    const dailyCost = netCost / usedDays

    // Sell recovery percentage
    const recoveryRate = price > 0 ? Math.round((sellPrice / price) * 100) : 0
    
    // Convert status to string for display/filter
    let statusText = '未知'
    if (item.status == 1) statusText = '服役中'
    else if (item.status == 0) statusText = '已退役'
    else if (item.status == 2) statusText = '已卖出'
    
    return {
      ...item,
      price,
      usedDays,
      dailyCost,
      sellPrice,
      recoveryRate,
      statusText
    }
  }).sort((a: any, b: any) => {
    // Active items first, then retired/sold
    const statusOrder: Record<string, number> = { '服役中': 0, '已退役': 1, '已卖出': 2 }
    const orderDiff = (statusOrder[a.statusText] ?? 2) - (statusOrder[b.statusText] ?? 2)
    if (orderDiff !== 0) return orderDiff
    return b.price - a.price
  })
})

// Current filter
const currentFilter = ref('全部')
const filterOptions = ['全部', '服役中', '已退役', '已卖出']

const filteredAssets = computed(() => {
  if (currentFilter.value === '全部') return normalizedAssets.value
  return normalizedAssets.value.filter((a: any) => a.statusText === currentFilter.value)
})

// Dashboard computations
const totalAssets = computed(() => {
  return normalizedAssets.value
    .filter((item: any) => item.status !== 2)
    .reduce((sum: number, item: any) => sum + item.price, 0)
})

const totalDailyCost = computed(() => {
  return normalizedAssets.value
    .filter((item: any) => item.statusText === '服役中')
    .reduce((sum: number, item: any) => sum + item.dailyCost, 0)
})

const activeCount = computed(() => normalizedAssets.value.filter((a: any) => a.statusText === '服役中').length)
const retiredCount = computed(() => normalizedAssets.value.filter((a: any) => a.statusText === '已退役').length)
const soldCount = computed(() => normalizedAssets.value.filter((a: any) => a.statusText === '已卖出').length)

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="page-container">
    <header class="header">
      <div class="header-top">
        <h1>{{ pageTitle }}</h1>
        <a v-if="assetsData?.showGithubLink" href="https://github.com/LeoonLiang/my-assets-page/issues/1" target="_blank" class="github-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
      
      <!-- Dashboard Card -->
      <div class="dashboard-card">
        <div class="dashboard-title">
          <span>资产总览</span>
          <span class="count-badge">{{ activeCount }}/{{ normalizedAssets.length }}</span>
        </div>
        
        <div class="dashboard-stats">
          <div class="stat-item">
            <span class="stat-label">总资产</span>
            <span class="stat-value"><span class="currency">¥</span>{{ formatCurrency(totalAssets) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">日均成本</span>
            <span class="stat-value"><span class="currency">¥</span>{{ formatCurrency(totalDailyCost) }}</span>
          </div>
        </div>
        
        <div class="dashboard-divider"></div>
        
        <div class="status-summary">
          <div class="summary-item">
            <span class="summary-label">服役中 <span class="summary-value">{{ activeCount }}</span></span>
            <div class="progress-bar active-bar"></div>
          </div>
          <div class="summary-item">
            <span class="summary-label">已退役 <span class="summary-value">{{ retiredCount }}</span></span>
            <div class="progress-bar retired-bar"></div>
          </div>
          <div class="summary-item">
            <span class="summary-label">已卖出 <span class="summary-value">{{ soldCount }}</span></span>
            <div class="progress-bar sold-bar"></div>
          </div>
        </div>
      </div>
    </header>

    <main>
      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <div class="tabs-scroll">
          <button 
            v-for="option in filterOptions" 
            :key="option"
            class="tab-btn"
            :class="{ active: currentFilter === option }"
            @click="currentFilter = option"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Asset Grid -->
      <div class="grid-container">
        <div
          v-for="item in filteredAssets"
          :key="item.id"
          class="asset-card"
          :class="{
            'card-retired': item.statusText === '已退役',
            'card-sold': item.statusText === '已卖出'
          }"
        >
          <div class="card-header">
            <div class="card-image-box">
              <img :src="item.cover" :alt="item.name" />
            </div>
            <div class="card-status-pill" :class="{
              'pill-active': item.statusText === '服役中',
              'pill-retired': item.statusText === '已退役',
              'pill-sold': item.statusText === '已卖出'
            }">
              <span class="dot"></span> {{ item.statusText }}
            </div>
          </div>
          
          <div class="card-info">
            <h3 class="card-name">{{ item.name }}</h3>
            
            <!-- 服役中 -->
            <template v-if="item.statusText === '服役中'">
              <p class="card-meta">¥{{ formatCurrency(item.price) }} | 已使用{{ item.usedDays }}天</p>
              <div class="card-daily-cost">
                <span class="currency">¥</span><span class="cost-value">{{ formatCurrency(item.dailyCost) }}</span><span class="cost-unit">/天</span>
              </div>
            </template>
            
            <!-- 已退役 -->
            <template v-else-if="item.statusText === '已退役'">
              <p class="card-meta">¥{{ formatCurrency(item.price) }} | 使用了{{ item.usedDays }}天 | ¥{{ formatCurrency(item.dailyCost) }}/天</p>
              <div class="card-retire-info">
                <span class="retire-reason">{{ item.retire_reason || '已退役' }}</span>
              </div>
            </template>
            
            <!-- 已卖出 -->
            <template v-else-if="item.statusText === '已卖出'">
              <p class="card-meta">¥{{ formatCurrency(item.price) }} | 使用了{{ item.usedDays }}天 | ¥{{ formatCurrency(item.dailyCost) }}/天</p>
              <div class="card-sell-info">
                <span class="sell-price">卖出 ¥{{ formatCurrency(item.sellPrice) }}</span>
                <span class="recovery-badge">回血 {{ item.recoveryRate }}%</span>
              </div>
            </template>
          </div>
        </div>
      </div>
      
      <div v-if="filteredAssets.length === 0" class="empty-state">
        <p>暂无数据</p>
      </div>
    </main>

    <footer class="footer">
      <a href="https://github.com/LeoonLiang/my-assets-page/issues/1" target="_blank" class="footer-link">
        本项目开源，欢迎 Fork
      </a>
    </footer>
  </div>
</template>

<style>
:root {
  --text-main: #111827;
  --text-muted: #6b7280;
  --card-bg: #ffffff;
  --primary: #86efac;
  --radius-lg: 24px;
  --radius-md: 16px;
  --radius-sm: 8px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: linear-gradient(180deg, #dcfce7 0%, #f3f4f6 300px);
  background-attachment: fixed;
  color: var(--text-main);
  min-height: 100vh;
}

.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

/* Footer */
.footer {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem 0;
}

.footer-link {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--text-main);
  text-decoration: underline;
}

/* Header */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.header-top h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
}

.github-link {
  color: var(--text-muted);
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
}

.github-link:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.8);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 999px;
  padding: 4px 12px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
}

/* Dashboard Card */
.dashboard-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  margin-bottom: 2rem;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.count-badge {
  background: #f1f5f9;
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
}

.dashboard-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
}

.currency {
  font-size: 1rem;
  margin-right: 2px;
  font-weight: 700;
}

.dashboard-divider {
  border-top: 1px dashed #e5e7eb;
  margin: 0 -1.5rem 1.5rem -1.5rem;
}

/* Status Summary */
.status-summary {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.summary-value {
  font-weight: 700;
  color: var(--text-main);
}

.progress-bar {
  height: 4px;
  border-radius: 2px;
  width: 100%;
  background: #f1f5f9;
}

.active-bar {
  background: #a3e635; /* Lime-green */
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.25rem;
}

.tabs-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-scroll::-webkit-scrollbar { display: none; }

.tab-btn {
  white-space: nowrap;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: none;
  background: var(--card-bg);
  color: var(--text-muted);
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  font-size: 0.85rem;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #1f2937;
  color: white;
}

.filter-icons {
  display: flex;
  gap: 0.25rem;
}

.icon-btn.small {
  background: transparent;
  padding: 4px;
  color: var(--text-main);
}

/* Grid */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}



/* Asset Card */
.asset-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

.card-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  margin-bottom: 1rem;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.card-image-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image-box img {
  max-width: 75%;
  max-height: 80%;
  object-fit: contain;
}

.card-status-pill {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.70rem;
  font-weight: 500;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.pill-active .dot {
  width: 6px;
  height: 6px;
  background: #a3e635;
  border-radius: 50%;
}
.pill-retired .dot {
  width: 6px;
  height: 6px;
  background: #9ca3af;
  border-radius: 50%;
}
.pill-sold .dot {
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
}

.card-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-name {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0 0 1rem 0;
}

.card-daily-cost {
  margin-top: auto;
}

.card-daily-cost .currency {
  font-weight: 700;
  font-size: 0.85rem;
}

.card-daily-cost .cost-value {
  font-weight: 800;
  font-size: 1.15rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
}

.card-daily-cost .cost-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-muted);
}

/* Retired / Sold card states */
.card-retired {
  opacity: 0.75;
}

.card-sold {
  opacity: 0.75;
}

.card-retire-info {
  margin-top: auto;
}

.retire-reason {
  font-size: 0.8rem;
  color: var(--text-muted);
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
}

.card-sell-info {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.sell-price {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-main);
}

.recovery-badge {
  font-size: 0.75rem;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-block;
  width: fit-content;
  font-weight: 600;
}

@media (max-width: 480px) {
  body {
    font-size: 13px;
  }

  .page-container {
    padding: 1rem 0.75rem;
  }

  .header-top {
    margin-bottom: 1rem;
    padding: 0 0.25rem;
  }

  .header-top h1 {
    font-size: 1.55rem;
  }

  .dashboard-card {
    padding: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .dashboard-title {
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .dashboard-stats {
    margin-bottom: 1rem;
  }

  .stat-label {
    font-size: 0.75rem;
    margin-bottom: 0.35rem;
  }

  .stat-value {
    font-size: 1.2rem;
  }

  .currency {
    font-size: 0.85rem;
  }

  .status-summary {
    gap: 0.9rem;
  }

  .filter-tabs {
    margin-bottom: 1rem;
    padding: 0;
  }

  .tab-btn {
    padding: 0.35rem 0.85rem;
    font-size: 0.75rem;
  }

  .grid-container {
    gap: 0.75rem;
  }

  .asset-card {
    padding: 0.85rem;
  }

  .card-header {
    height: 70px;
    margin-bottom: 0.75rem;
    justify-content: flex-start;
  }

  .card-name {
    font-size: 0.9rem;
  }

  .card-meta {
    font-size: 0.65rem;
    margin: 0 0 0.75rem 0;
  }

  .card-image-box {
    justify-content: flex-start;
  }

  .card-image-box img {
    max-width: 50%;
    max-height: 72%;
  }

  .card-status-pill {
    top: 6px;
    right: 6px;
    padding: 2px 6px;
    font-size: 0.6rem;
    gap: 3px;
    background: rgba(255, 255, 255, 0.85);
  }

  .card-status-pill .dot {
    width: 5px;
    height: 5px;
  }

  .card-daily-cost .currency {
    font-size: 0.75rem;
  }

  .card-daily-cost .cost-value {
    font-size: 0.95rem;
  }

  .card-daily-cost .cost-unit {
    font-size: 0.65rem;
  }
}

@media (max-width: 340px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
