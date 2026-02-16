const CONSTANTS = { STORAGE_DATA_KEY: 'dungeonCounterData', STORAGE_THEME_KEY: 'dungeonTheme' };

class EventEmitter {
    constructor() { this.events = {}; }
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    }
    emit(event, payload) {
        if (this.events[event]) this.events[event].forEach(listener => listener(payload));
    }
}

class Utils {
    static escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
    static createEl(tag, className = '', textContent = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent) el.textContent = textContent;
        return el;
    }
    static formatTime(ms) {
        if (isNaN(ms) || ms < 0) return "00:00.00";
        const totalSec = Math.floor(ms / 1000);
        const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const s = String(totalSec % 60).padStart(2, '0');
        const msStr = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
        return `${m}:${s}.${msStr}`;
    }
    static formatShortTime(ms) {
        if (isNaN(ms) || ms < 0) return "00:00";
        const totalSec = Math.floor(ms / 1000);
        return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
    }
    static parseTimeToMs(timeStr) {
        try {
            const parts = timeStr.trim().split(':');
            if (parts.length !== 2) return null;
            const m = parseInt(parts[0], 10);
            const secParts = parts[1].split('.');
            const s = parseInt(secParts[0], 10);
            let ms = 0;
            if (secParts[1]) {
                const msStr = secParts[1].substring(0, 2).padEnd(2, '0');
                ms = parseInt(msStr, 10) * 10; 
            }
            if (isNaN(m) || isNaN(s) || isNaN(ms)) return null;
            return (m * 60000) + (s * 1000) + ms;
        } catch (e) { return null; }
    }
    static formatRealTime(isoString) {
        if (!isoString) return '';
        const formatter = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
        return formatter.format(new Date(isoString));
    }
    static formatDuration(ms) {
        if (isNaN(ms) || ms < 0) return "알 수 없음";
        const t = Math.floor(ms / 1000);
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = t % 60;
        if (h > 0) return `${h}시간 ${m}분 ${s}초`;
        if (m > 0) return `${m}분 ${s}초`;
        return `${s}초`;
    }
    static getDiffNode(time, avgTime) {
        if (!avgTime) return document.createTextNode('');
        const diff = time - avgTime;
        const absDiff = Math.abs(diff);
        if (diff < 0) return this.createEl('span', 'diff-badge diff-fast', `▼ ${this.formatTime(absDiff)}`);
        if (diff > 0) return this.createEl('span', 'diff-badge diff-slow', `▲ ${this.formatTime(absDiff)}`);
        return this.createEl('span', 'diff-badge diff-same', `- 00:00.00`);
    }
    static formatMoney(num) {
        if (isNaN(num)) return '0 키나';
        return parseInt(num, 10).toLocaleString() + ' 키나';
    }
    static parseNumber(str) {
        if (!str) return 0;
        return parseInt(String(str).replace(/,/g, ''), 10) || 0;
    }
    static getGradeBadge(grade) {
        const badge = this.createEl('span', 'badge-s bg-' + grade);
        if(grade === 'white') badge.textContent = '일반';
        else if(grade === 'green') badge.textContent = '고급';
        else if(grade === 'blue') badge.textContent = '희귀';
        return badge;
    }
    static createTrendSvg(prices, type) {
        if(prices.length < 2) return this.createEl('div', 'empty-msg', '데이터가 부족하여 차트를 생성할 수 없습니다.');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 40');
        svg.style.width = '100%'; svg.style.height = '60px'; svg.style.overflow = 'visible';
        
        const max = Math.max(...prices); const min = Math.min(...prices);
        const range = max - min === 0 ? 1 : max - min;
        const color = type === 'buy' ? '#89b4fa' : '#f38ba8';

        let points = prices.map((p, i) => {
            const x = (i / (prices.length - 1)) * 100;
            const y = 40 - (((p - min) / range) * 30 + 5); 
            return `${x},${y}`;
        }).join(' ');

        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', points); polyline.setAttribute('fill', 'none');
        polyline.setAttribute('stroke', color); polyline.setAttribute('stroke-width', '2');
        svg.appendChild(polyline);

        prices.forEach((p, i) => {
            const x = (i / (prices.length - 1)) * 100;
            const y = 40 - (((p - min) / range) * 30 + 5);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', '2.5');
            circle.setAttribute('fill', color);
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = this.formatMoney(p);
            circle.appendChild(title); svg.appendChild(circle);
        });
        return svg;
    }
    static isValidSchema(data) {
        if (!data || typeof data !== 'object') return false;
        if (typeof data.targetRuns !== 'number' || data.targetRuns < 1) return false;
        if (data.runRecords && !Array.isArray(data.runRecords)) return false;
        if (data.history && !Array.isArray(data.history)) return false;
        return true;
    }
}

class AppStore extends EventEmitter {
    constructor() {
        super();
        this.state = {
            targetRuns: 10,
            shareTemplate: "🔥오늘 도태 {현재}/{목표} 완! (평균 {평균} / 최고 {최고})",
            currentRunCount: 0,
            sessionStartTime: null,
            runRecords: [],
            history: [],
            isRunning: false,
            startTime: 0,
            elapsedTime: 0,
            marketItems: [], 
            inventory: {}, 
            tradeHistory: [] 
        };
        this.saveTimer = null;
        this.loadData();
    }
    getState() { return this.state; }
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveData();
    }
    loadData() {
        try {
            const data = localStorage.getItem(CONSTANTS.STORAGE_DATA_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                if (Utils.isValidSchema(parsed)) {
                    if(parsed.shareTemplate === undefined) parsed.shareTemplate = "🔥오늘 도태 {현재}/{목표} 완! (평균 {평균} / 최고 {최고})";
                    if (!parsed.marketItems) parsed.marketItems = [];
                    if (!parsed.inventory) parsed.inventory = {};
                    if (!parsed.tradeHistory) parsed.tradeHistory = [];
                    this.setState({ ...parsed, history: parsed.history || [] });
                }
            }
        } catch (e) { console.error(e); }
    }
    saveData() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            const { targetRuns, shareTemplate, currentRunCount, sessionStartTime, runRecords, history, marketItems, inventory, tradeHistory } = this.state;
            localStorage.setItem(CONSTANTS.STORAGE_DATA_KEY, JSON.stringify({ targetRuns, shareTemplate, currentRunCount, sessionStartTime, runRecords, history, marketItems, inventory, tradeHistory }));
        }, 300);
    }
    setTargetRuns(val) {
        this.setState({ targetRuns: parseInt(val) || 1 });
        this.emit('TARGET_UPDATED', this.state.targetRuns);
    }
    setShareTemplate(val) {
        this.setState({ shareTemplate: val });
    }
    toggleTimer() {
        if (!this.state.isRunning && this.state.currentRunCount >= this.state.targetRuns) return false;
        if (!this.state.isRunning) {
            this.setState({
                sessionStartTime: (this.state.currentRunCount === 0 && this.state.runRecords.length === 0 && !this.state.sessionStartTime) ? new Date().toISOString() : this.state.sessionStartTime,
                isRunning: true,
                startTime: Date.now()
            });
            this.emit('TIMER_STARTED');
        } else {
            this.setState({ isRunning: false, elapsedTime: this.state.elapsedTime + (Date.now() - this.state.startTime) });
            this.emit('TIMER_STOPPED');
        }
        return true;
    }
    recordRun(memo) {
        if (!this.state.isRunning) return;
        const currentTotalTime = this.state.elapsedTime + (Date.now() - this.state.startTime);
        const newRecord = { time: currentTotalTime, memo: Utils.escapeHTML(memo) };
        const newRunRecords = [...this.state.runRecords, newRecord];
        const newCount = this.state.currentRunCount + 1;
        const isComplete = newCount >= this.state.targetRuns;

        this.setState({ runRecords: newRunRecords, currentRunCount: newCount, elapsedTime: 0, startTime: Date.now(), isRunning: false });
        this.emit('RECORD_ADDED', { record: newRecord, count: newCount, isComplete });
    }
    undoLastRecord() {
        if (this.state.runRecords.length === 0) return;
        const newRunRecords = [...this.state.runRecords];
        newRunRecords.pop();
        const newCount = this.state.currentRunCount - 1;
        const isNowIncomplete = newCount < this.state.targetRuns;

        this.setState({ runRecords: newRunRecords, currentRunCount: newCount, isRunning: false });
        this.emit('RECORD_UNDONE', { count: newCount, isNowIncomplete });
    }
    editRecordTime(index, newTimeMs) {
        if (index < 0 || index >= this.state.runRecords.length) return;
        const newRunRecords = [...this.state.runRecords];
        newRunRecords[index].time = newTimeMs;
        this.setState({ runRecords: newRunRecords });
        this.emit('RECORD_EDITED');
    }
    saveSession() {
        if (this.state.runRecords.length === 0) return false;
        const endTime = new Date().toISOString();
        const avg = this.state.runRecords.reduce((acc, curr) => acc + curr.time, 0) / this.state.runRecords.length;
        const min = Math.min(...this.state.runRecords.map(r => r.time));
        const startObj = new Date(this.state.sessionStartTime || endTime);
        const endObj = new Date(endTime);
        const duration = endObj.getTime() - startObj.getTime();
        const playDuration = this.state.runRecords.reduce((acc, curr) => acc + curr.time, 0);

        const session = { id: Date.now(), startTime: this.state.sessionStartTime || endTime, endTime: endTime, duration: duration, playDuration: playDuration, targetRuns: this.state.targetRuns, runCount: this.state.currentRunCount, avgTime: avg, fastestTime: min, records: [...this.state.runRecords] };
        this.setState({ history: [session, ...this.state.history] });
        this.forceReset();
        this.emit('SESSION_SAVED', session);
        return true;
    }
    deleteHistory(id) {
        this.setState({ history: this.state.history.filter(h => h.id !== id) });
        this.emit('HISTORY_DELETED', id);
    }
    clearAllHistory() {
        this.setState({ history: [] });
        this.emit('HISTORY_CLEARED');
    }
    forceReset() {
        this.setState({ currentRunCount: 0, runRecords: [], sessionStartTime: null, isRunning: false, elapsedTime: 0 });
        this.emit('APP_RESET');
    }
    importData(parsedData) {
        this.setState(parsedData);
        this.emit('DATA_IMPORTED');
    }

    addMarketItem(name, grade) {
        const id = 'item_' + Date.now();
        const newItem = { id, name: Utils.escapeHTML(name), grade };
        this.setState({ marketItems: [...this.state.marketItems, newItem] });
        this.emit('MARKET_ITEMS_UPDATED');
    }
    removeMarketItem(id) {
        this.setState({ marketItems: this.state.marketItems.filter(i => i.id !== id) });
        this.emit('MARKET_ITEMS_UPDATED');
    }
    addTrade(type, itemId, qty, price, feeRate = 0, supplyType = '') {
        const item = this.state.marketItems.find(i => i.id === itemId);
        if (!item) return;

        let inv = { ...this.state.inventory };
        if (!inv[itemId]) inv[itemId] = { qty: 0, totalCost: 0 };

        let netProfit = 0;
        let revenue = 0;

        if (type === 'buy') {
            inv[itemId].qty += qty;
            inv[itemId].totalCost += (qty * price);
        } else if (type === 'sell') {
            const avgCost = inv[itemId].qty > 0 ? (inv[itemId].totalCost / inv[itemId].qty) : 0;
            revenue = Math.floor(qty * price * (1 - feeRate));
            const costOfGoods = Math.floor(qty * avgCost);
            netProfit = revenue - costOfGoods;

            inv[itemId].qty -= qty;
            inv[itemId].totalCost -= costOfGoods;
            
            if (inv[itemId].qty <= 0) {
                inv[itemId].qty = 0;
                inv[itemId].totalCost = 0;
            }
        }

        const trade = {
            id: Date.now(), date: new Date().toISOString(),
            type, itemId, itemName: item.name, grade: item.grade,
            qty, price, feeRate, supplyType, revenue, netProfit
        };

        this.setState({ inventory: inv, tradeHistory: [trade, ...this.state.tradeHistory] });
        this.emit('MARKET_TRADE_ADDED');
    }
    deleteTrade(tradeId) {
        const th = [...this.state.tradeHistory];
        const idx = th.findIndex(t => t.id === tradeId);
        if (idx === -1) return;
        
        const t = th[idx];
        let inv = { ...this.state.inventory };
        if (!inv[t.itemId]) inv[t.itemId] = { qty: 0, totalCost: 0 };

        if (t.type === 'buy') {
            inv[t.itemId].qty -= t.qty;
            inv[t.itemId].totalCost -= (t.qty * t.price);
            if(inv[t.itemId].qty <= 0) { inv[t.itemId].qty = 0; inv[t.itemId].totalCost = 0; }
        } else if (t.type === 'sell') {
            const costOfGoods = t.revenue - t.netProfit;
            inv[t.itemId].qty += t.qty;
            inv[t.itemId].totalCost += costOfGoods;
        }

        th.splice(idx, 1);
        this.setState({ tradeHistory: th, inventory: inv });
        this.emit('MARKET_TRADE_ADDED'); 
    }
    bulkDeleteTrades(filterType) {
        let th = [...this.state.tradeHistory];
        if (filterType === 'all') th = [];
        else if (filterType === 'buy') th = th.filter(t => t.type !== 'buy');
        else if (filterType === 'sell') th = th.filter(t => t.type !== 'sell');
        
        const inv = {};
        const items = this.state.marketItems;
        items.forEach(i => inv[i.id] = {qty: 0, totalCost: 0});
        
        const ascendingHistory = [...th].reverse();
        ascendingHistory.forEach(t => {
            if(!inv[t.itemId]) inv[t.itemId] = {qty:0, totalCost:0};
            if(t.type === 'buy') {
                inv[t.itemId].qty += t.qty; inv[t.itemId].totalCost += (t.qty * t.price);
            } else {
                const avgCost = inv[t.itemId].qty > 0 ? (inv[t.itemId].totalCost / inv[t.itemId].qty) : 0;
                const cost = Math.floor(t.qty * avgCost);
                inv[t.itemId].qty -= t.qty; inv[t.itemId].totalCost -= cost;
                if(inv[t.itemId].qty <= 0) { inv[t.itemId].qty = 0; inv[t.itemId].totalCost = 0; }
            }
        });

        this.setState({ tradeHistory: th, inventory: inv });
        this.emit('MARKET_TRADE_ADDED');
    }
    deleteInventoryItem(itemId) {
        let inv = { ...this.state.inventory }; delete inv[itemId];
        this.setState({ inventory: inv }); this.emit('MARKET_INVENTORY_UPDATED');
    }
    editInventoryItem(itemId, newQty, newAvgPrice) {
        let inv = { ...this.state.inventory };
        if (newQty <= 0) delete inv[itemId];
        else inv[itemId] = { qty: newQty, totalCost: newQty * newAvgPrice };
        this.setState({ inventory: inv }); this.emit('MARKET_INVENTORY_UPDATED');
    }
}

class UIManager {
    constructor(store) {
        this.store = store;
        this.rafId = null;
        this.etaInterval = null;
        this.currentTradeType = 'buy';
        this.currentHistoryFilter = 'all';
        this.els = {
            themeBtn: document.getElementById('themeToggleBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            menuToggleBtn: document.getElementById('menuToggleBtn'),
            sideNav: document.getElementById('sideNav'),
            navOverlay: document.getElementById('navOverlay'),
            views: document.querySelectorAll('.view-section'),
            navItems: document.querySelectorAll('.nav-item'),
            mainTitle: document.getElementById('mainTitle'),
            
            totalRuns: document.getElementById('totalRuns'),
            shareTemplate: document.getElementById('shareTemplate'),
            targetDisplay: document.getElementById('targetRunDisplay'),
            currentDisplay: document.getElementById('currentRun'),
            timer: document.getElementById('timerDisplay'),
            etaDisplay: document.getElementById('etaDisplay'),
            toggleBtn: document.getElementById('toggleTimerBtn'),
            nextBtn: document.getElementById('nextRunBtn'),
            undoBtn: document.getElementById('undoBtn'),
            resetBtn: document.getElementById('resetBtn'),
            saveBtn: document.getElementById('saveSessionBtn'),
            avgTime: document.getElementById('avgTimeDisplay'),
            logList: document.getElementById('logList'),
            memoInput: document.getElementById('memoInput'),
            statsCaptureArea: document.getElementById('statsCaptureArea'),
            captureChartBtn: document.getElementById('captureChartBtn'),
            logCaptureArea: document.getElementById('logCaptureArea'),
            captureLogBtn: document.getElementById('captureLogBtn'),
            copyShareBtn: document.getElementById('copyShareBtn'),
            chartBox: document.getElementById('chartBox'),
            dailySummaryList: document.getElementById('dailySummaryList'),
            historyList: document.getElementById('historyList'),
            clearHistBtn: document.getElementById('clearAllHistoryBtn'),
            exportBtn: document.getElementById('exportBtn'),
            importInput: document.getElementById('importInput'),

            marketInnerTabs: document.querySelectorAll('.inner-tab'),
            marketTabContents: document.querySelectorAll('.market-tab-content'),

            marketItemName: document.getElementById('newItemName'),
            marketItemGrade: document.getElementById('newItemGrade'),
            addMarketItemBtn: document.getElementById('addMarketItemBtn'),
            marketItemManageGrouped: document.getElementById('marketItemManageGrouped'),
            
            tradeTabBuy: document.getElementById('tradeTabBuy'),
            tradeTabSell: document.getElementById('tradeTabSell'),
            tradeItemSelect: document.getElementById('tradeItemSelect'),
            currentStockHint: document.getElementById('currentStockHint'),
            tradeQty: document.getElementById('tradeQty'),
            tradePrice: document.getElementById('tradePrice'),
            sellOptions: document.getElementById('sellOptions'),
            tradeFee: document.getElementById('tradeFee'),
            tradeSupplyType: document.getElementById('tradeSupplyType'),
            submitTradeBtn: document.getElementById('submitTradeBtn'),
            previewProfitText: document.getElementById('previewProfitText'),
            
            inventoryList: document.getElementById('inventoryList'),
            marketHistoryList: document.getElementById('marketHistoryList'),
            historyFilterBtns: document.querySelectorAll('.filter-btn'),
            bulkDeleteBuyBtn: document.getElementById('bulkDeleteBuyBtn'),
            bulkDeleteSellBtn: document.getElementById('bulkDeleteSellBtn'),
            bulkDeleteAllBtn: document.getElementById('bulkDeleteAllBtn'),
            
            dailyProfitDisplay: document.getElementById('dailyProfitDisplay'),
            weeklyProfitDisplay: document.getElementById('weeklyProfitDisplay'),
            inventoryValueDisplay: document.getElementById('inventoryValueDisplay'),
            marketStatsContainer: document.getElementById('marketStatsContainer')
        };
        
        this.els.views.forEach(v => { v.style.display = v.id === 'viewCounter' ? 'block' : 'none'; });

        this.initTheme(); this.bindEvents(); this.subscribeStore(); this.fullRebuildDOM();
        this.renderHistory(); this.renderDailySummary(); this.startETAUpdater();
        this.renderMarketItemsManage(); this.renderTradeSelect(); this.renderInventory();
        this.renderTradeHistory(); this.renderMarketDashboard(); this.renderMarketStats();
    }
    initTheme() {
        const savedTheme = localStorage.getItem(CONSTANTS.STORAGE_THEME_KEY) || 'dark';
        document.body.dataset.theme = savedTheme; this.updateThemeBtnText();
    }
    updateThemeBtnText() { this.els.themeBtn.textContent = document.body.dataset.theme === 'dark' ? '☀️' : '🌙'; }
    toggleTheme() {
        const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = next; localStorage.setItem(CONSTANTS.STORAGE_THEME_KEY, next); this.updateThemeBtnText();
    }
    formatNumberInput(inputEl) {
        let val = inputEl.value.replace(/[^0-9]/g, '');
        if (val) inputEl.value = parseInt(val, 10).toLocaleString();
        else inputEl.value = '';
    }
    bindEvents() {
        this.els.themeBtn.addEventListener('click', () => this.toggleTheme());

        this.els.menuToggleBtn.addEventListener('click', () => { this.els.sideNav.classList.add('open'); this.els.navOverlay.classList.add('open'); });
        this.els.navOverlay.addEventListener('click', () => { this.els.sideNav.classList.remove('open'); this.els.navOverlay.classList.remove('open'); });
        this.els.navItems.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                this.els.views.forEach(v => { v.style.display = 'none'; v.classList.remove('active'); });
                const targetView = document.getElementById(targetId);
                if(targetView) { targetView.style.display = 'block'; targetView.classList.add('active'); }
                this.els.navItems.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.els.sideNav.classList.remove('open'); this.els.navOverlay.classList.remove('open');
                if(this.els.mainTitle) this.els.mainTitle.textContent = targetId === 'viewCounter' ? '도태 정복 카운터' : '시세/재고 관리';
            });
        });

        this.els.marketInnerTabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                this.els.marketTabContents.forEach(c => c.classList.remove('active'));
                document.getElementById(targetId).classList.add('active');
                this.els.marketInnerTabs.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        this.els.settingsBtn.addEventListener('click', () => this.els.settingsModal.style.display = 'flex');
        this.els.closeModalBtn.addEventListener('click', () => this.els.settingsModal.style.display = 'none');
        window.addEventListener('click', (e) => { if(e.target === this.els.settingsModal) this.els.settingsModal.style.display = 'none'; });

        this.els.captureChartBtn.addEventListener('click', () => this.captureSection(this.els.statsCaptureArea, 'chart'));
        this.els.captureLogBtn.addEventListener('click', () => this.captureSection(this.els.logCaptureArea, 'log'));
        this.els.totalRuns.addEventListener('change', e => this.store.setTargetRuns(e.target.value));
        this.els.shareTemplate.addEventListener('change', e => this.store.setShareTemplate(e.target.value));
        this.els.copyShareBtn.addEventListener('click', () => this.copyShareText());
        this.els.toggleBtn.addEventListener('click', () => { if (!this.store.toggleTimer()) alert("이미 목표 횟수에 도달했습니다."); });
        this.els.nextBtn.addEventListener('click', () => this.store.recordRun(this.els.memoInput.value.trim()));
        this.els.undoBtn.addEventListener('click', () => { if (confirm("직전 기록을 취소하시겠습니까?")) this.store.undoLastRecord(); });
        this.els.saveBtn.addEventListener('click', () => {
            this.els.saveBtn.disabled = true;
            if (!this.store.saveSession()) alert("저장할 기록이 없습니다."); else alert("기록이 보관되었습니다.");
            this.els.saveBtn.disabled = false;
        });
        this.els.resetBtn.addEventListener('click', () => { if(confirm("데이터를 초기화하시겠습니까?")) this.store.forceReset(); });
        this.els.clearHistBtn.addEventListener('click', () => { if(confirm("모든 과거 기록을 삭제하시겠습니까?")) this.store.clearAllHistory(); });
        this.els.exportBtn.addEventListener('click', () => this.exportData());
        this.els.importInput.addEventListener('change', e => this.importData(e));
        
        document.addEventListener('keydown', (e) => {
            if (this.els.settingsModal.style.display === 'flex') return;
            const isCounterActive = document.getElementById('viewCounter').classList.contains('active');
            if (isCounterActive) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                if (e.code === 'Space') { e.preventDefault(); this.els.toggleBtn.click(); } 
                else if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); if (!this.els.nextBtn.disabled) this.els.nextBtn.click(); }
            }
        });

        this.els.marketItemName.addEventListener('keyup', (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
                e.preventDefault();
                this.els.addMarketItemBtn.click();
            }
        });

        const handleTradeSpace = (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            if (e.code === 'Space') {
                e.preventDefault();
                this.els.submitTradeBtn.click();
            }
        };
        this.els.tradeQty.addEventListener('keydown', handleTradeSpace);
        this.els.tradePrice.addEventListener('keydown', handleTradeSpace);

        this.els.addMarketItemBtn.addEventListener('click', () => {
            const name = this.els.marketItemName.value.trim();
            const grade = this.els.marketItemGrade.value;
            if (name) { this.store.addMarketItem(name, grade); this.els.marketItemName.value = ''; }
        });

        this.els.tradeTabBuy.addEventListener('click', () => this.setTradeType('buy'));
        this.els.tradeTabSell.addEventListener('click', () => this.setTradeType('sell'));
        
        this.els.tradeQty.addEventListener('input', (e) => { this.formatNumberInput(e.target); this.updatePreviewProfit(); });
        this.els.tradePrice.addEventListener('input', (e) => { this.formatNumberInput(e.target); this.updatePreviewProfit(); });
        
        [this.els.tradeFee, this.els.tradeItemSelect].forEach(el => { el.addEventListener('input', () => this.updatePreviewProfit()); });

        this.els.submitTradeBtn.addEventListener('click', () => {
            const itemId = this.els.tradeItemSelect.value;
            const qty = Utils.parseNumber(this.els.tradeQty.value);
            const price = Utils.parseNumber(this.els.tradePrice.value);
            if (!itemId || qty <= 0 || price < 0) return alert("올바른 값을 입력하세요.");
            if (this.currentTradeType === 'sell') {
                const inv = this.store.getState().inventory[itemId];
                if (!inv || inv.qty < qty) if(!confirm("창고 재고보다 판매 수량이 많습니다. 계속하시겠습니까?")) return;
                const fee = parseFloat(this.els.tradeFee.value);
                const supply = this.els.tradeSupplyType.value;
                this.store.addTrade('sell', itemId, qty, price, fee, supply);
            } else { this.store.addTrade('buy', itemId, qty, price); }
            this.els.tradeQty.value = 1; this.els.tradePrice.value = 0; this.updatePreviewProfit();
        });

        this.els.historyFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.els.historyFilterBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentHistoryFilter = e.currentTarget.dataset.filter;
                this.renderTradeHistory();
            });
        });

        this.els.bulkDeleteBuyBtn.addEventListener('click', () => { if(confirm("모든 '매입' 기록을 일괄 삭제합니다.\n관련된 창고 재고도 함께 차감됩니다. 진행하시겠습니까?")) this.store.bulkDeleteTrades('buy'); });
        this.els.bulkDeleteSellBtn.addEventListener('click', () => { if(confirm("모든 '판매' 기록을 일괄 삭제합니다.\n관련된 창고 재고가 롤백(복구)됩니다. 진행하시겠습니까?")) this.store.bulkDeleteTrades('sell'); });
        this.els.bulkDeleteAllBtn.addEventListener('click', () => { if(confirm("모든 거래 기록을 삭제하고 창고를 초기화합니다. 진행하시겠습니까?")) this.store.bulkDeleteTrades('all'); });
    }
    subscribeStore() {
        this.store.on('TARGET_UPDATED', val => { this.els.targetDisplay.textContent = val; this.updateETA(); });
        this.store.on('TIMER_STARTED', () => {
            this.els.toggleBtn.textContent = '일시정지 (Space)'; this.els.toggleBtn.style.backgroundColor = 'var(--warning)';
            this.els.nextBtn.disabled = false; this.els.memoInput.disabled = false;
            if (this.rafId) cancelAnimationFrame(this.rafId); this.updateTimerDisplay();
        });
        this.store.on('TIMER_STOPPED', () => {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.els.toggleBtn.textContent = '시작 (Space)'; this.els.toggleBtn.style.backgroundColor = 'var(--primary)';
        });
        this.store.on('RECORD_ADDED', payload => {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.els.currentDisplay.textContent = payload.count; this.els.undoBtn.disabled = false; this.els.memoInput.value = ''; this.els.timer.textContent = Utils.formatTime(0);
            this.appendRecordDOM(payload.record, payload.count);
            if (payload.isComplete) {
                this.els.toggleBtn.disabled = true; this.els.nextBtn.disabled = true; this.els.memoInput.disabled = true;
                this.els.timer.textContent = "완료!"; this.els.timer.style.color = "var(--danger)"; this.els.saveBtn.classList.add('pulse-animation');
            } else {
                this.els.toggleBtn.textContent = '시작 (Space)'; this.els.toggleBtn.style.backgroundColor = 'var(--primary)';
                this.els.nextBtn.disabled = true; this.els.memoInput.disabled = true;
            }
            this.updateETA();
        });
        this.store.on('RECORD_UNDONE', payload => {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.els.currentDisplay.textContent = payload.count;
            if (this.els.logList.firstElementChild) this.els.logList.firstElementChild.remove();
            const wrappers = this.els.chartBox.querySelectorAll('.bar-wrapper');
            if (wrappers.length > 0) wrappers[wrappers.length - 1].remove();
            if (payload.count === 0) {
                this.els.chartBox.textContent = ''; const emptyMsg = Utils.createEl('span', '', '데이터가 쌓이면 그래프가 표시됩니다.'); emptyMsg.id = 'chartEmptyMsg';
                this.els.chartBox.appendChild(emptyMsg); this.els.avgTime.textContent = "00:00.00";
            }
            if (payload.isNowIncomplete) {
                this.els.toggleBtn.disabled = false; this.els.timer.style.color = "var(--success)"; this.els.saveBtn.classList.remove('pulse-animation');
                this.els.timer.textContent = Utils.formatTime(this.store.getState().elapsedTime);
                this.els.toggleBtn.textContent = '시작 (Space)'; this.els.toggleBtn.style.backgroundColor = 'var(--primary)';
                this.els.nextBtn.disabled = true; this.els.memoInput.disabled = true;
            }
            this.els.undoBtn.disabled = payload.count === 0;
            if (payload.count > 0) this.refreshDOMState();
            this.updateETA();
        });
        this.store.on('RECORD_EDITED', () => this.fullRebuildDOM());
        this.store.on('APP_RESET', () => {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.els.currentDisplay.textContent = "0"; this.els.timer.textContent = "00:00.00"; this.els.timer.style.color = "var(--success)";
            this.els.memoInput.value = ''; this.els.memoInput.disabled = true; this.els.undoBtn.disabled = true;
            this.els.toggleBtn.textContent = '시작 (Space)'; this.els.toggleBtn.style.backgroundColor = 'var(--primary)'; this.els.toggleBtn.disabled = false;
            this.els.nextBtn.disabled = true; this.els.saveBtn.classList.remove('pulse-animation');
            this.fullRebuildDOM(); this.updateETA();
        });
        this.store.on('SESSION_SAVED', session => {
            const emptyMsg = this.els.historyList.querySelector('li[style*="text-align"]');
            if (emptyMsg) emptyMsg.remove();
            this.els.historyList.prepend(this.createHistoryItemDOM(session));
            this.renderDailySummary();
        });
        this.store.on('HISTORY_DELETED', id => {
            const btn = this.els.historyList.querySelector(`button[data-id="${id}"]`);
            if (btn) { const li = btn.closest('li'); if (li) li.remove(); }
            if (this.els.historyList.children.length === 0) this.renderHistory();
            this.renderDailySummary();
        });
        this.store.on('HISTORY_CLEARED', () => { this.renderHistory(); this.renderDailySummary(); });
        
        this.store.on('MARKET_ITEMS_UPDATED', () => { this.renderMarketItemsManage(); this.renderTradeSelect(); this.updatePreviewProfit(); this.renderMarketStats(); });
        this.store.on('MARKET_TRADE_ADDED', () => { this.renderInventory(); this.renderTradeHistory(); this.renderTradeSelect(); this.updatePreviewProfit(); this.renderMarketDashboard(); this.renderMarketStats(); });
        this.store.on('MARKET_INVENTORY_UPDATED', () => { this.renderInventory(); this.renderTradeSelect(); this.updatePreviewProfit(); this.renderMarketDashboard(); });
        this.store.on('DATA_IMPORTED', () => location.reload());
    }

    setTradeType(type) {
        this.currentTradeType = type;
        if (type === 'buy') {
            this.els.tradeTabBuy.classList.add('active'); this.els.tradeTabSell.classList.remove('active'); this.els.sellOptions.style.display = 'none';
        } else {
            this.els.tradeTabBuy.classList.remove('active'); this.els.tradeTabSell.classList.add('active');
            this.els.sellOptions.style.display = 'flex'; this.els.sellOptions.style.flexDirection = 'column';
        }
        this.renderTradeSelect(); this.updatePreviewProfit();
    }

    renderMarketDashboard() {
        const th = this.store.getState().tradeHistory;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff).getTime();

        let dailyProfit = 0, weeklyProfit = 0;
        th.forEach(t => {
            if (t.type !== 'sell') return;
            const tTime = new Date(t.date).getTime();
            if (tTime >= startOfWeek) { weeklyProfit += t.netProfit; if (tTime >= startOfToday) dailyProfit += t.netProfit; }
        });

        this.els.dailyProfitDisplay.textContent = Utils.formatMoney(dailyProfit);
        this.els.dailyProfitDisplay.className = 'total-profit ' + (dailyProfit > 0 ? 'positive' : (dailyProfit < 0 ? 'negative' : ''));
        this.els.weeklyProfitDisplay.textContent = Utils.formatMoney(weeklyProfit);
        this.els.weeklyProfitDisplay.className = 'total-profit ' + (weeklyProfit > 0 ? 'positive' : (weeklyProfit < 0 ? 'negative' : ''));

        const inv = this.store.getState().inventory;
        let totalInvValue = 0;
        Object.values(inv).forEach(item => {
            if (item && item.totalCost > 0) {
                totalInvValue += item.totalCost;
            }
        });
        this.els.inventoryValueDisplay.textContent = Utils.formatMoney(totalInvValue);
    }

    renderMarketStats() {
        const items = this.store.getState().marketItems;
        const history = this.store.getState().tradeHistory;
        this.els.marketStatsContainer.textContent = '';
        
        if (history.length === 0 || items.length === 0) {
            this.els.marketStatsContainer.innerHTML = '<p class="empty-msg">데이터가 부족하여 차트를 구성할 수 없습니다.</p>';
            return;
        }

        const statsMap = {};
        items.forEach(i => {
            statsMap[i.id] = { name: i.name, grade: i.grade, buyPrices: [], sellPrices: [] };
        });

        [...history].sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(t => {
            if(!statsMap[t.itemId]) return;
            if(t.type === 'buy') statsMap[t.itemId].buyPrices.push(t.price);
            else statsMap[t.itemId].sellPrices.push(t.price);
        });

        const activeStats = Object.values(statsMap).filter(s => s.buyPrices.length > 0 || s.sellPrices.length > 0);
        if(activeStats.length === 0) {
            this.els.marketStatsContainer.innerHTML = '<p class="empty-msg">데이터가 부족하여 차트를 구성할 수 없습니다.</p>'; return;
        }

        const frag = document.createDocumentFragment();
        activeStats.forEach(s => {
            const block = Utils.createEl('div', 'stat-item-block');
            const nameDiv = Utils.createEl('div', 'stat-item-name text-grade-' + s.grade);
            nameDiv.appendChild(Utils.getGradeBadge(s.grade));
            nameDiv.appendChild(document.createTextNode(s.name));
            block.appendChild(nameDiv);

            if(s.buyPrices.length > 0) {
                const bWrap = Utils.createEl('div', 'trend-container');
                bWrap.innerHTML = `<div class="trend-header"><span>📉 최근 매입가 추이</span><span>평균: ${Utils.formatMoney(Math.floor(s.buyPrices.reduce((a,b)=>a+b,0)/s.buyPrices.length))}</span></div>`;
                bWrap.appendChild(Utils.createTrendSvg(s.buyPrices, 'buy'));
                block.appendChild(bWrap);
            }
            if(s.sellPrices.length > 0) {
                const sWrap = Utils.createEl('div', 'trend-container');
                sWrap.innerHTML = `<div class="trend-header"><span>📈 최근 판매가 추이</span><span>평균: ${Utils.formatMoney(Math.floor(s.sellPrices.reduce((a,b)=>a+b,0)/s.sellPrices.length))}</span></div>`;
                sWrap.appendChild(Utils.createTrendSvg(s.sellPrices, 'sell'));
                block.appendChild(sWrap);
            }
            frag.appendChild(block);
        });
        this.els.marketStatsContainer.appendChild(frag);
    }

    renderMarketItemsManage() {
        const items = this.store.getState().marketItems;
        this.els.marketItemManageGrouped.textContent = '';
        const grades = { white: '일반 (흰색)', green: '고급 (초록)', blue: '희귀 (파랑)' };
        let hasItems = false;
        Object.keys(grades).forEach(gradeKey => {
            const gradeItems = items.filter(i => i.grade === gradeKey);
            if(gradeItems.length > 0) {
                hasItems = true;
                const groupDiv = Utils.createEl('div', 'grade-group');
                groupDiv.innerHTML = `<h4>${grades[gradeKey]}</h4>`;
                const ul = Utils.createEl('ul');
                gradeItems.forEach(item => {
                    const li = Utils.createEl('li', 'manage-badge text-grade-' + item.grade);
                    li.appendChild(Utils.getGradeBadge(item.grade));
                    li.appendChild(document.createTextNode(item.name));
                    const delBtn = Utils.createEl('button', '', '✖');
                    delBtn.addEventListener('click', () => this.store.removeMarketItem(item.id));
                    li.appendChild(delBtn); ul.appendChild(li);
                });
                groupDiv.appendChild(ul); this.els.marketItemManageGrouped.appendChild(groupDiv);
            }
        });
        if(!hasItems) this.els.marketItemManageGrouped.innerHTML = '<p class="empty-msg">등록된 품목이 없습니다.</p>';
    }

    renderTradeSelect() {
        const items = this.store.getState().marketItems;
        const inv = this.store.getState().inventory;
        const currentVal = this.els.tradeItemSelect.value;
        
        this.els.tradeItemSelect.textContent = '';
        this.els.tradeItemSelect.appendChild(Utils.createEl('option', '', '품목을 선택하세요'));
        
        const grades = { white: '일반', green: '고급', blue: '희귀' };
        
        Object.keys(grades).forEach(gradeKey => {
            const gradeItems = items.filter(i => i.grade === gradeKey);
            if (gradeItems.length > 0) {
                const optgroup = Utils.createEl('optgroup');
                optgroup.label = `--- ${grades[gradeKey]} ---`;
                
                gradeItems.forEach(item => {
                    if (this.currentTradeType === 'sell') { if (!inv[item.id] || inv[item.id].qty <= 0) return; }
                    const opt = Utils.createEl('option', 'text-grade-' + item.grade);
                    opt.value = item.id;
                    opt.textContent = `[${grades[item.grade]}] ` + item.name;
                    optgroup.appendChild(opt);
                });
                if(optgroup.children.length > 0) this.els.tradeItemSelect.appendChild(optgroup);
            }
        });
        if (Array.from(this.els.tradeItemSelect.options).some(o => o.value === currentVal)) {
            this.els.tradeItemSelect.value = currentVal;
            this.updateCurrentStockHint(currentVal);
        } else {
            this.updateCurrentStockHint('');
        }

        this.els.tradeItemSelect.addEventListener('change', (e) => this.updateCurrentStockHint(e.target.value));
    }

    updateCurrentStockHint(itemId) {
        if (!itemId) {
            this.els.currentStockHint.textContent = "💡 선택된 품목이 없습니다.";
            this.els.currentStockHint.style.color = "var(--warning)";
            return;
        }
        const inv = this.store.getState().inventory[itemId];
        if (inv && inv.qty > 0) {
            this.els.currentStockHint.textContent = `💡 현재 창고 보유량: ${inv.qty.toLocaleString()}개 (평단가: ${Utils.formatMoney(Math.floor(inv.totalCost / inv.qty))})`;
            this.els.currentStockHint.style.color = "var(--success)";
        } else {
            this.els.currentStockHint.textContent = "💡 창고에 보유 중인 재고가 없습니다.";
            this.els.currentStockHint.style.color = "var(--danger)";
        }
    }

    updatePreviewProfit() {
        if (this.currentTradeType !== 'sell') return;
        const itemId = this.els.tradeItemSelect.value;
        const qty = Utils.parseNumber(this.els.tradeQty.value);
        const price = Utils.parseNumber(this.els.tradePrice.value);
        const fee = parseFloat(this.els.tradeFee.value) || 0;

        if (!itemId || qty <= 0 || price <= 0) {
            this.els.previewProfitText.textContent = '-'; this.els.previewProfitText.className = ''; return;
        }
        const inv = this.store.getState().inventory[itemId];
        const avgCost = inv && inv.qty > 0 ? (inv.totalCost / inv.qty) : 0;
        
        const revenue = Math.floor(qty * price * (1 - fee));
        const cost = Math.floor(qty * avgCost);
        const profit = revenue - cost;

        this.els.previewProfitText.textContent = Utils.formatMoney(profit);
        if (profit > 0) this.els.previewProfitText.className = 'trade-profit up';
        else if (profit < 0) this.els.previewProfitText.className = 'trade-profit down';
        else this.els.previewProfitText.className = '';
    }

    renderInventory() {
        const inv = this.store.getState().inventory;
        const items = this.store.getState().marketItems;
        this.els.inventoryList.textContent = '';
        
        let hasStock = false;
        items.forEach(item => {
            const stock = inv[item.id];
            if (stock && stock.qty > 0) {
                hasStock = true;
                const li = Utils.createEl('li', 'inv-item');
                
                const headerDiv = Utils.createEl('div', 'inv-header');
                const nameDiv = Utils.createEl('div', 'inv-name text-grade-' + item.grade);
                nameDiv.appendChild(Utils.getGradeBadge(item.grade));
                nameDiv.appendChild(document.createTextNode(item.name));
                
                const actionsDiv = Utils.createEl('div', 'inv-actions');
                
                const editBtn = Utils.createEl('button', 'edit-time-btn', '✏️');
                editBtn.title = "수량 및 평단가 수정";
                editBtn.addEventListener('click', () => {
                    const currentAvg = Math.floor(stock.totalCost / stock.qty);
                    const qtyInput = prompt(`[${item.name}]의 새로운 수량을 입력하세요:`, stock.qty);
                    if(qtyInput === null) return;
                    const priceInput = prompt(`[${item.name}]의 새로운 평균 단가를 입력하세요:`, currentAvg);
                    if(priceInput === null) return;
                    
                    const nQty = Utils.parseNumber(qtyInput);
                    const nPrice = Utils.parseNumber(priceInput);
                    if(nQty >= 0 && nPrice >= 0) this.store.editInventoryItem(item.id, nQty, nPrice);
                    else alert("유효한 숫자를 입력하세요.");
                });

                const delBtn = Utils.createEl('button', 'delete-history-btn', '✖');
                delBtn.title = "재고 삭제";
                delBtn.addEventListener('click', () => {
                    if(confirm(`[${item.name}]의 창고 재고를 삭제하시겠습니까?\n(거래 내역은 삭제되지 않습니다)`)) this.store.deleteInventoryItem(item.id);
                });

                actionsDiv.appendChild(editBtn); actionsDiv.appendChild(delBtn);
                headerDiv.appendChild(nameDiv); headerDiv.appendChild(actionsDiv);
                
                const stats = Utils.createEl('div', 'inv-stats');
                stats.innerHTML = `<span>수량: <b>${stock.qty.toLocaleString()}</b></span><span>평단가: <b>${Utils.formatMoney(Math.floor(stock.totalCost / stock.qty))}</b></span>`;
                
                li.appendChild(headerDiv); li.appendChild(stats);
                this.els.inventoryList.appendChild(li);
            }
        });

        if (!hasStock) {
            const empty = Utils.createEl('li', 'inv-item');
            empty.style.justifyContent = 'center'; empty.style.color = 'var(--text-muted)'; empty.textContent = '창고가 비어있습니다.';
            this.els.inventoryList.appendChild(empty);
        }
    }

    renderTradeHistory() {
        let th = this.store.getState().tradeHistory;
        if(this.currentHistoryFilter === 'buy') th = th.filter(t => t.type === 'buy');
        else if(this.currentHistoryFilter === 'sell') th = th.filter(t => t.type === 'sell');

        this.els.marketHistoryList.textContent = '';

        if (th.length === 0) {
            const empty = Utils.createEl('li', 'trade-item');
            empty.style.alignItems = 'center'; empty.style.color = 'var(--text-muted)'; empty.style.borderLeft = 'none';
            empty.textContent = '해당하는 거래 내역이 없습니다.';
            this.els.marketHistoryList.appendChild(empty);
        } else {
            const grouped = {};
            th.forEach(t => {
                const dKey = Utils.formatRealTime(t.date).split(' ')[0];
                if(!grouped[dKey]) grouped[dKey] = [];
                grouped[dKey].push(t);
            });

            const frag = document.createDocumentFragment();
            Object.keys(grouped).sort((a,b) => new Date(b.replace(/\./g, '-')) - new Date(a.replace(/\./g, '-'))).forEach(dateStr => {
                const divider = Utils.createEl('div', 'history-date-divider', `📅 ${dateStr}`);
                frag.appendChild(divider);

                grouped[dateStr].forEach(t => {
                    const li = Utils.createEl('li', `trade-item ${t.type}`);
                    const header = Utils.createEl('div', 'trade-header');
                    
                    const titleSpan = Utils.createEl('span', 'text-grade-' + t.grade);
                    titleSpan.appendChild(Utils.getGradeBadge(t.grade));
                    titleSpan.appendChild(document.createTextNode(t.itemName));
                    
                    const typeLabel = Utils.createEl('span', `t-type ${t.type}`);
                    typeLabel.textContent = t.type === 'buy' ? '⬇️ 매입' : '⬆️ 판매';

                    const headerLeft = Utils.createEl('span');
                    headerLeft.appendChild(typeLabel); headerLeft.appendChild(titleSpan);
                    header.appendChild(headerLeft); li.appendChild(header);

                    const details = Utils.createEl('div', 'trade-details');
                    const timeOnlyStr = Utils.formatRealTime(t.date).split(' ')[1];
                    if (t.type === 'buy') {
                        details.innerHTML = `${timeOnlyStr}<br>${t.qty.toLocaleString()}개 × ${t.price.toLocaleString()} 키나`;
                    } else {
                        const feeStr = t.feeRate === 0.1 ? '일반' : (t.feeRate === 0.2 ? '월드' : '무수수료');
                        details.innerHTML = `${timeOnlyStr} | ${t.supplyType}<br>${t.qty.toLocaleString()}개 × ${t.price.toLocaleString()} 키나 (${feeStr})`;
                        const pSpan = Utils.createEl('div', 'trade-profit ' + (t.netProfit > 0 ? 'up' : (t.netProfit < 0 ? 'down' : '')));
                        pSpan.textContent = (t.netProfit > 0 ? '+' : '') + Utils.formatMoney(t.netProfit);
                        li.appendChild(pSpan);
                    }
                    li.appendChild(details);

                    const delBtn = Utils.createEl('button', 'del-trade-btn', '✖');
                    delBtn.addEventListener('click', () => { if(confirm("내역을 삭제하고 재고를 되돌리시겠습니까?")) this.store.deleteTrade(t.id); });
                    li.appendChild(delBtn);
                    frag.appendChild(li);
                });
            });
            this.els.marketHistoryList.appendChild(frag);
        }
    }


    startETAUpdater() {
        if(this.etaInterval) clearInterval(this.etaInterval);
        this.etaInterval = setInterval(() => this.updateETA(), 60000);
    }
    updateETA() {
        const state = this.store.getState();
        if (state.runRecords.length === 0 || state.currentRunCount >= state.targetRuns) {
            this.els.etaDisplay.textContent = "--:--"; return;
        }
        const avg = state.runRecords.reduce((acc, curr) => acc + curr.time, 0) / state.runRecords.length;
        const remaining = state.targetRuns - state.currentRunCount;
        const etaDate = new Date(Date.now() + (avg * remaining));
        this.els.etaDisplay.textContent = `${String(etaDate.getHours()).padStart(2, '0')}:${String(etaDate.getMinutes()).padStart(2, '0')}`;
    }
    updateTimerDisplay() {
        const state = this.store.getState();
        if (!state.isRunning) return;
        const current = state.elapsedTime + (Date.now() - state.startTime);
        this.els.timer.textContent = Utils.formatTime(current);
        
        setTimeout(() => { if (this.store.getState().isRunning) this.rafId = requestAnimationFrame(() => this.updateTimerDisplay()); }, 50); 
    }
    copyShareText() {
        const state = this.store.getState();
        const avg = state.runRecords.length ? state.runRecords.reduce((a,b)=>a+b.time,0)/state.runRecords.length : 0;
        const min = state.runRecords.length ? Math.min(...state.runRecords.map(r=>r.time)) : 0;
        const text = state.shareTemplate.replace(/{목표}/g, state.targetRuns).replace(/{현재}/g, state.currentRunCount).replace(/{평균}/g, Utils.formatShortTime(avg)).replace(/{최고}/g, Utils.formatShortTime(min));
        navigator.clipboard.writeText(text).then(() => {
            const orig = this.els.copyShareBtn.textContent; this.els.copyShareBtn.textContent = "✅ 복사됨!";
            setTimeout(() => this.els.copyShareBtn.textContent = orig, 2000);
        }).catch(() => alert("복사에 실패했습니다."));
    }
    
    fullRebuildDOM() {
        const state = this.store.getState();
        this.els.totalRuns.value = state.targetRuns;
        this.els.shareTemplate.value = state.shareTemplate;
        this.els.targetDisplay.textContent = state.targetRuns;
        this.els.currentDisplay.textContent = state.currentRunCount;
        this.els.undoBtn.disabled = state.runRecords.length === 0;

        this.els.logList.textContent = ""; this.els.chartBox.textContent = "";
        
        if (state.runRecords.length === 0) {
            this.els.avgTime.textContent = "00:00.00";
            const emptyMsg = Utils.createEl('span', '', '데이터가 쌓이면 그래프가 표시됩니다.'); emptyMsg.id = 'chartEmptyMsg';
            this.els.chartBox.appendChild(emptyMsg); this.updateETA(); return;
        }

        const avg = state.runRecords.reduce((acc, curr) => acc + curr.time, 0) / state.runRecords.length;
        this.els.avgTime.textContent = Utils.formatTime(avg);

        const fragLog = document.createDocumentFragment();
        const fragChart = document.createDocumentFragment();
        
        let minTime = Math.min(...state.runRecords.map(r => r.time));
        let maxTime = Math.max(...state.runRecords.map(r => r.time));

        state.runRecords.forEach((rec, idx) => {
            const li = Utils.createEl('li', 'log-item');
            const header = Utils.createEl('div', 'log-header');
            const titleDiv = Utils.createEl('div'); titleDiv.appendChild(Utils.createEl('span', '', `${idx+1}회차`));

            const timeSpan = Utils.createEl('span', 'time-display');
            timeSpan.textContent = Utils.formatTime(rec.time) + ' ';
            if (state.runRecords.length > 1) timeSpan.appendChild(Utils.getDiffNode(rec.time, avg));

            const editBtn = Utils.createEl('button', 'edit-time-btn', '✏️');
            editBtn.title = "기록 시간 수정"; editBtn.setAttribute('data-html2canvas-ignore', 'true');
            editBtn.addEventListener('click', () => {
                const currentFormatted = Utils.formatTime(rec.time);
                const input = prompt("해당 회차의 기록을 수정합니다.\n형식에 맞춰 입력해주세요. (예: 08:30.50)", currentFormatted);
                if (input && input !== currentFormatted) {
                    const newTimeMs = Utils.parseTimeToMs(input);
                    if (newTimeMs !== null) this.store.editRecordTime(idx, newTimeMs);
                    else alert("잘못된 시간 형식입니다. 다시 시도해주세요.");
                }
            });

            const timeDisplayWrapper = Utils.createEl('div', 'time-display-wrapper');
            timeDisplayWrapper.appendChild(timeSpan); timeDisplayWrapper.appendChild(editBtn);
            header.appendChild(titleDiv); header.appendChild(timeDisplayWrapper); li.appendChild(header);
            if (rec.memo) li.appendChild(Utils.createEl('div', 'log-memo', `📝 ${rec.memo}`));
            fragLog.prepend(li);
            
            const wrapper = Utils.createEl('div', 'bar-wrapper');
            wrapper.appendChild(Utils.createEl('div', 'bar-value', Utils.formatShortTime(rec.time)));
            const b = Utils.createEl('div', 'bar');
            
            let pct = 80;
            if (maxTime > 0) { pct = Math.max(10, (rec.time / maxTime) * 90); }
            b.style.height = `${pct}%`;
            
            if (state.runRecords.length > 1) {
                if (rec.time === minTime) { b.classList.add('fastest'); li.classList.add('fastest'); header.querySelector('div').appendChild(Utils.createEl('span', 'badge badge-fast', '🏆 최고')); }
                else if (rec.time === maxTime) { b.classList.add('slowest'); li.classList.add('slowest'); header.querySelector('div').appendChild(Utils.createEl('span', 'badge badge-slow', '🐢 최저')); }
            }

            wrapper.appendChild(b);
            wrapper.appendChild(Utils.createEl('div', 'bar-label', `${idx+1}회`));
            fragChart.appendChild(wrapper);
        });
        
        this.els.logList.appendChild(fragLog); this.els.chartBox.appendChild(fragChart);
        this.updateETA();
    }
    appendRecordDOM(record, actualIndex) {
        const emptyMsg = document.getElementById('chartEmptyMsg'); if (emptyMsg) emptyMsg.remove();
        this.fullRebuildDOM(); 
        setTimeout(() => { const scroll = document.querySelector('.chart-scroll-wrapper'); if (scroll) scroll.scrollLeft = scroll.scrollWidth; }, 0);
    }
    refreshDOMState() {
        this.fullRebuildDOM();
    }

    renderHistory() {
        const history = this.store.getState().history;
        this.els.historyList.textContent = '';
        if (history.length === 0) {
            const emptyLi = Utils.createEl('li'); emptyLi.style.textAlign = 'center'; emptyLi.style.color = 'var(--text-muted)'; emptyLi.style.border = 'none'; emptyLi.style.background = 'transparent'; emptyLi.textContent = '아직 보관된 과거 기록이 없습니다.';
            this.els.historyList.appendChild(emptyLi); return;
        }
        const fragHistory = document.createDocumentFragment();
        history.forEach(session => { fragHistory.appendChild(this.createHistoryItemDOM(session)); });
        this.els.historyList.appendChild(fragHistory);
    }
    createHistoryItemDOM(session) {
        const li = Utils.createEl('li', 'history-item'); li.style.cursor = 'pointer'; li.title = "클릭하여 그래프 보기/숨기기";
        li.addEventListener('click', () => { const chartDiv = li.querySelector('.history-chart-container'); if (chartDiv) chartDiv.style.display = chartDiv.style.display === 'none' ? 'block' : 'none'; });

        const timeDiv = Utils.createEl('div', 'history-time');
        timeDiv.innerHTML = `📅 시작: ${Utils.formatRealTime(session.startTime)} <br>🏁 종료: ${Utils.formatRealTime(session.endTime)}`;
        
        let durStr = session.duration !== undefined ? Utils.formatDuration(session.duration) : Utils.formatDuration(new Date(session.endTime).getTime() - new Date(session.startTime).getTime());
        let playDur = session.playDuration !== undefined ? session.playDuration : session.records.reduce((a, b) => a + b.time, 0);
        let playDurStr = Utils.formatDuration(playDur);

        const durSpan = Utils.createEl('div', 'history-duration');
        durSpan.innerHTML = `<span style="color:var(--text-muted);">⏱️ 전체 소요: ${durStr}</span> <span style="color:var(--primary);">⚔️ 실제 플레이: ${playDurStr}</span>`;
        timeDiv.appendChild(durSpan); li.appendChild(timeDiv);

        const delBtn = Utils.createEl('button', 'delete-history-btn', '✖'); delBtn.dataset.id = session.id; delBtn.title = "기록 삭제";
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); if(confirm("이 기록을 삭제하시겠습니까?")) this.store.deleteHistory(session.id); });
        li.appendChild(delBtn);

        const headerDiv = Utils.createEl('div', 'log-header'); headerDiv.style.marginTop = '8px';
        headerDiv.appendChild(Utils.createEl('span', '', `총 ${session.runCount}판 (목표: ${session.targetRuns}판)`));
        const avgSpan = Utils.createEl('span', '', `평균: ${Utils.formatTime(session.avgTime)}`);
        avgSpan.style.color = 'var(--success)';
        headerDiv.appendChild(avgSpan); li.appendChild(headerDiv);

        const fastestDiv = Utils.createEl('div', '', `🏆 최고 기록: ${Utils.formatTime(session.fastestTime)}`);
        fastestDiv.style.fontSize = '0.85em'; fastestDiv.style.color = 'var(--warning)'; fastestDiv.style.marginTop = '5px';
        li.appendChild(fastestDiv);

        const chartWrapper = Utils.createEl('div', 'history-chart-container');
        chartWrapper.style.display = 'none'; chartWrapper.style.marginTop = '15px'; chartWrapper.style.borderTop = '1px dashed var(--item-bg)'; chartWrapper.style.paddingTop = '15px';
        const scrollWrap = Utils.createEl('div', 'chart-scroll-wrapper'); const cBox = Utils.createEl('div', 'chart-box');
        
        let hMaxTime = Math.max(...session.records.map(r => r.time)); let hMinTime = Math.min(...session.records.map(r => r.time));
        
        session.records.forEach((rec, idx) => {
            const w = Utils.createEl('div', 'bar-wrapper');
            w.appendChild(Utils.createEl('div', 'bar-value', Utils.formatShortTime(rec.time)));
            const b = Utils.createEl('div', 'bar');
            let pct = 80;
            if (hMaxTime > 0) { pct = Math.max(10, (rec.time / hMaxTime) * 90); }
            b.style.height = `${pct}%`;
            if (session.records.length > 1) { if (rec.time === hMinTime) b.classList.add('fastest'); else if (rec.time === hMaxTime) b.classList.add('slowest'); }
            w.appendChild(b); w.appendChild(Utils.createEl('div', 'bar-label', `${idx + 1}회`));
            cBox.appendChild(w);
        });

        scrollWrap.appendChild(cBox); chartWrapper.appendChild(scrollWrap); li.appendChild(chartWrapper);
        return li;
    }

    renderDailySummary() {
        const history = this.store.getState().history;
        this.els.dailySummaryList.textContent = '';
        if (history.length === 0) {
            const emptyLi = Utils.createEl('li'); emptyLi.style.textAlign = 'center'; emptyLi.style.color = 'var(--text-muted)'; emptyLi.style.padding = '15px'; emptyLi.style.listStyle = 'none'; emptyLi.textContent = '아직 누적된 기록이 없습니다.';
            this.els.dailySummaryList.appendChild(emptyLi); return;
        }

        const map = {};
        history.forEach(h => {
            const d = new Date(h.startTime); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
            if (!map[key]) map[key] = { count: 0, totalTime: 0 };
            map[key].count += h.runCount; map[key].totalTime += (h.playDuration !== undefined ? h.playDuration : h.records.reduce((a, b) => a + b.time, 0));
        });

        const frag = document.createDocumentFragment();
        Object.keys(map).sort((a, b) => new Date(b.substring(0, 10)) - new Date(a.substring(0, 10))).forEach(key => {
            const data = map[key]; const li = Utils.createEl('li', 'daily-item'); const dateDiv = Utils.createEl('div', 'daily-date', key); const statsDiv = Utils.createEl('div', 'daily-stats');
            const runSpan = Utils.createEl('span', '', ''); runSpan.innerHTML = `총 <span class="highlight">${data.count}판</span> 달성`;
            const timeSpan = Utils.createEl('span', '', `던전 플레이: ${Utils.formatDuration(data.totalTime)}`);
            statsDiv.appendChild(runSpan); statsDiv.appendChild(timeSpan); li.appendChild(dateDiv); li.appendChild(statsDiv); frag.appendChild(li);
        });
        this.els.dailySummaryList.appendChild(frag);
    }

    captureSection(targetEl, prefix) {
        if (!window.html2canvas) return alert("캡처 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        const scrollWrapper = targetEl.querySelector('.chart-scroll-wrapper');
        const origStyles = { targetWidth: targetEl.style.width, targetMaxWidth: targetEl.style.maxWidth, targetPadding: targetEl.style.padding, wrapperOverflow: scrollWrapper ? scrollWrapper.style.overflow : '', wrapperWidth: scrollWrapper ? scrollWrapper.style.width : '' };
        targetEl.style.width = 'max-content'; targetEl.style.maxWidth = 'none'; targetEl.style.padding = '20px';
        if (scrollWrapper) { scrollWrapper.style.overflow = 'visible'; scrollWrapper.style.width = 'max-content'; }
        const containerBg = getComputedStyle(document.querySelector('.container')).backgroundColor;
        setTimeout(() => {
            html2canvas(targetEl, { backgroundColor: containerBg, scale: 2 }).then(canvas => {
                targetEl.style.width = origStyles.targetWidth; targetEl.style.maxWidth = origStyles.targetMaxWidth; targetEl.style.padding = origStyles.targetPadding;
                if (scrollWrapper) { scrollWrapper.style.overflow = origStyles.wrapperOverflow; scrollWrapper.style.width = origStyles.wrapperWidth; }
                const url = canvas.toDataURL("image/png"); const a = document.createElement('a'); a.href = url; a.download = `dungeon_${prefix}_${Utils.formatRealTime(new Date().toISOString()).replace(/[:-]/g, '').replace(' ', '_')}.png`; a.click();
            }).catch(() => {
                targetEl.style.width = origStyles.targetWidth; targetEl.style.maxWidth = origStyles.targetMaxWidth; targetEl.style.padding = origStyles.targetPadding;
                if (scrollWrapper) { scrollWrapper.style.overflow = origStyles.wrapperOverflow; scrollWrapper.style.width = origStyles.wrapperWidth; }
                alert("캡처 중 오류가 발생했습니다.");
            });
        }, 100);
    }
    exportData() {
        const dataStr = JSON.stringify(this.store.getState(), null, 2); const blob = new Blob([dataStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dungeon_backup_${Utils.formatRealTime(new Date().toISOString()).replace(/[:-]/g, '').replace(' ', '_')}.json`; a.click(); URL.revokeObjectURL(url);
    }
    importData(e) {
        const file = e.target.files[0]; if (!file) return;
        if(confirm("기존 데이터가 덮어씌워집니다. 진행하시겠습니까?")) {
            const reader = new FileReader();
            reader.onload = ev => {
                try { const parsed = JSON.parse(ev.target.result); if (Utils.isValidSchema(parsed)) { this.store.importData(parsed); this.fullRebuildDOM(); } else { alert("올바른 백업 파일이 아닙니다."); } } catch { alert("파일 오류가 발생했습니다."); }
            }; reader.readAsText(file);
        }
        e.target.value = '';
    }
}

class App { constructor() { this.store = new AppStore(); this.ui = new UIManager(this.store); } }
const app = new App();