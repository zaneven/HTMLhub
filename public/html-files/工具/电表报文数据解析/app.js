// 全局变量
let parsedData = null;
let execCtlgData = [];
let charts = {};

// DOM 元素
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const jsonInput = document.getElementById('jsonInput');
const resultSection = document.getElementById('resultSection');

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    // 文件上传事件
    fileInput.addEventListener('change', handleFileUpload);

    // 拖拽事件
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/json') {
            readFile(file);
        }
    });

    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

// ========== 文件处理 ==========
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        readFile(file);
    }
}

function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            processData(data);
        } catch (error) {
            alert('JSON 解析失败: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function parseInputData() {
    const input = jsonInput.value.trim();
    if (!input) {
        alert('请输入 JSON 数据');
        return;
    }

    try {
        const data = JSON.parse(input);
        processData(data);
    } catch (error) {
        alert('JSON 解析失败: ' + error.message);
    }
}

// ========== 数据处理 ==========
function processData(data) {
    // 提取实际数据
    let actualData;
    if (data.code === 0 && data.data) {
        let innerData = data.data;

        // 如果 data.data 是字符串，说明是原始 API 格式，需要解析
        if (typeof innerData === 'string') {
            try {
                innerData = JSON.parse(innerData);
            } catch (e) {
                console.error('解析 data.data 失败:', e);
            }
        }

        if (innerData && innerData.code === "0" && innerData.data) {
            let consData = innerData.data;

            // 如果 innerData.data 仍是字符串，继续解析
            if (typeof consData === 'string') {
                try {
                    consData = JSON.parse(consData);
                } catch (e) {
                    console.error('解析 innerData.data 失败:', e);
                }
            }

            // 获取第一个户号的数据
            const consNoKeys = Object.keys(consData);
            if (consNoKeys.length > 0) {
                actualData = consData[consNoKeys[0]];
            }
        }
    }

    if (!actualData) {
        alert('无法解析数据结构，请检查 JSON 格式');
        return;
    }

    parsedData = actualData;

    // 显示结果区域
    resultSection.classList.remove('hidden');

    // 渲染各个部分
    renderOverviewCards();
    renderConsInfo();
    renderExecCtlg();
    renderReadList();
    renderCustExp();

    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// ========== 渲染概览卡片 ==========
function renderOverviewCards() {
    const container = document.getElementById('overviewCards');
    const consInfo = parsedData.consLists?.[0] || {};
    const custExp = parsedData.custExpLists?.[0] || {};

    // 基础信息卡片（按顺序：户名、户号、结算年月、基本电费计算方式）
    const basicCards = [
        { icon: '🏢', label: '户名', value: consInfo.consName || '-', wide: true },
        { icon: '📍', label: '户号', value: consInfo.consNo || '-', wide: true },
        { icon: '📅', label: '结算年月', value: formatYearMonth(consInfo.jsYm), wide: true },
        { icon: '📊', label: '基本电费计算方式', value: custExp.beaCalcMode || '-', wide: true }
    ];

    // 金额电量概览卡片（当月合计电费、当月合计电量）
    const highlightCards = [
        { icon: '💰', label: '当月合计电费', value: formatCurrency(custExp.dyAmt), highlight: true },
        { icon: '⚡', label: '当月合计电量', value: formatNumber(custExp.dyPq) + ' kWh', highlight: true }
    ];

    container.innerHTML = `
        <div class="overview-row basic-row">
            ${basicCards.map(card => `
                <div class="overview-card ${card.wide ? 'wide' : ''}">
                    <div class="icon">${card.icon}</div>
                    <div class="label">${card.label}</div>
                    <div class="value">${card.value}</div>
                </div>
            `).join('')}
        </div>
        <div class="overview-row highlight-row">
            ${highlightCards.map(card => `
                <div class="overview-card highlight">
                    <div class="icon">${card.icon}</div>
                    <div class="label">${card.label}</div>
                    <div class="value">${card.value}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========== 渲染用户信息 ==========
function renderConsInfo() {
    const container = document.getElementById('consInfoGrid');
    const consInfo = parsedData.consLists?.[0] || {};

    const displayFields = [
        { key: 'consNo', value: consInfo.consNo },
        { key: 'consName', value: consInfo.consName },
        { key: 'orgNo', value: consInfo.orgNo },
        { key: 'elecAddr', value: consInfo.elecAddr },
        { key: 'mrYm', value: formatYearMonth(consInfo.mrYm) },
        { key: 'jsYm', value: formatYearMonth(consInfo.jsYm) },
        { key: 'mrDay', value: consInfo.mrDay + ' 日' },
        { key: 'tsNum', value: consInfo.tsNum },
        { key: 'elecTypeCode', value: getElecTypeCodeName(consInfo.elecTypeCode) },
        { key: 'deregAttrCls', value: getDeregAttrClsName(consInfo.deregAttrCls) },
        { key: 'gradedSettleTimes', value: getSettleTimesName(consInfo.gradedSettleTimes) }
    ];

    container.innerHTML = displayFields.map(field => `
        <div class="data-item">
            <span class="label">${getChineseName(field.key)}</span>
            <span class="value">${field.value || '-'}</span>
        </div>
    `).join('');
}

// ========== 渲染目录电费明细 ==========
function renderExecCtlg() {
    execCtlgData = parsedData.execCtlgLists || [];

    // 先按目录电价名称排序，再按费用属性分类排序
    execCtlgData.sort((a, b) => {
        // 先按目录电价名称排序
        const nameA = a.execCtlgUpName || '';
        const nameB = b.execCtlgUpName || '';
        const nameCompare = nameA.localeCompare(nameB, 'zh-CN');
        if (nameCompare !== 0) return nameCompare;

        // 再按费用属性分类排序
        const attrA = a.expAttrCls || '';
        const attrB = b.expAttrCls || '';
        return attrA.localeCompare(attrB, 'zh-CN');
    });

    // 填充费用属性分类筛选选项
    populateExpAttrClsFilter();

    renderExecCtlgTable(execCtlgData);
    renderCtlgSummaryTable();
    renderExecCtlgChart();
    renderExecCtlgQtyChart();
}

// 填充费用属性分类筛选选项
function populateExpAttrClsFilter() {
    const select = document.getElementById('expAttrClsFilter');
    const existingOptions = new Set();

    execCtlgData.forEach(item => {
        if (item.expAttrCls && !existingOptions.has(item.expAttrCls)) {
            existingOptions.add(item.expAttrCls);
        }
    });

    // 保留第一个"全部"选项，清除其他选项
    select.innerHTML = '<option value="">全部</option>';

    // 排序后添加选项
    Array.from(existingOptions).sort().forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = getExpAttrClsName(cls);
        select.appendChild(option);
    });
}

function filterExecCtlg() {
    const ctlgFilter = document.getElementById('ctlgClsFilter').value;
    const expAttrFilter = document.getElementById('expAttrClsFilter').value;

    let filtered = execCtlgData;

    if (ctlgFilter) {
        filtered = filtered.filter(item => item.ctlgCls === ctlgFilter);
    }

    if (expAttrFilter) {
        filtered = filtered.filter(item => item.expAttrCls === expAttrFilter);
    }

    renderExecCtlgTable(filtered);
}

function renderExecCtlgTable(data) {
    const tbody = document.getElementById('execCtlgBody');

    tbody.innerHTML = data.map(item => {
        const degExp = parseFloat(item.degExp) || 0;
        const valueClass = degExp >= 0 ? 'positive' : 'negative';
        const badgeClass = getBadgeClass(item.ctlgCls);

        return `
            <tr>
                <td>${item.execCtlgUpName || '-'}</td>
                <td><span class="badge ${badgeClass}">${getCtlgClsName(item.ctlgCls)}</span></td>
                <td>${getExpAttrClsName(item.expAttrCls)}</td>
                <td>${formatNumber(item.settleQty)} kWh</td>
                <td>${parseFloat(item.degUp).toFixed(6)} 元/kWh</td>
                <td class="${valueClass}">${formatCurrency(degExp)}</td>
                <td>${item.writeOffType ? getWriteOffTypeName(item.writeOffType) : '-'}</td>
            </tr>
        `;
    }).join('');
}

function renderExecCtlgChart() {
    const ctx = document.getElementById('execCtlgChart').getContext('2d');

    // 按时段汇总电费
    const feeByPeriod = {};
    execCtlgData.forEach(item => {
        const periodName = getCtlgClsName(item.ctlgCls);
        const fee = parseFloat(item.degExp) || 0;
        feeByPeriod[periodName] = (feeByPeriod[periodName] || 0) + fee;
    });

    if (charts.execCtlg) charts.execCtlg.destroy();

    charts.execCtlg = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(feeByPeriod),
            datasets: [{
                label: '电费汇总 (元)',
                data: Object.values(feeByPeriod),
                backgroundColor: [
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(14, 165, 233, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(34, 197, 94, 0.7)'
                ],
                borderColor: [
                    'rgba(168, 85, 247, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(14, 165, 233, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '按时段汇总电费',
                    color: '#f8fafc',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// 渲染时段电量汇总表
function renderCtlgSummaryTable() {
    const tbody = document.getElementById('ctlgSummaryBody');

    // 按时段汇总电量和电费
    const summaryByPeriod = {};
    const periodOrder = ['01', '02', '03', '04', '05'];

    execCtlgData.forEach(item => {
        const period = item.ctlgCls;
        if (!summaryByPeriod[period]) {
            summaryByPeriod[period] = { qty: 0, fee: 0 };
        }
        summaryByPeriod[period].qty += parseFloat(item.settleQty) || 0;
        summaryByPeriod[period].fee += parseFloat(item.degExp) || 0;
    });

    // 按时段顺序排序
    const sortedPeriods = Object.keys(summaryByPeriod).sort((a, b) => {
        return periodOrder.indexOf(a) - periodOrder.indexOf(b);
    });

    // 计算总计
    let totalQty = 0;
    let totalFee = 0;

    const rows = sortedPeriods.map(period => {
        const data = summaryByPeriod[period];
        totalQty += data.qty;
        totalFee += data.fee;
        const badgeClass = getBadgeClass(period);
        const feeClass = data.fee >= 0 ? 'positive' : 'negative';

        return `
            <tr>
                <td><span class="badge ${badgeClass}">${getCtlgClsName(period)}</span></td>
                <td>${formatNumber(data.qty)}</td>
                <td class="${feeClass}">${formatCurrency(data.fee)}</td>
            </tr>
        `;
    });

    // 添加总计行
    rows.push(`
        <tr class="total-row">
            <td><strong>📊 总计</strong></td>
            <td><strong>${formatNumber(totalQty)}</strong></td>
            <td class="${totalFee >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(totalFee)}</strong></td>
        </tr>
    `);

    tbody.innerHTML = rows.join('');
}

// 渲染时段电量图表
function renderExecCtlgQtyChart() {
    const ctx = document.getElementById('execCtlgQtyChart').getContext('2d');

    // 按时段汇总电量
    const qtyByPeriod = {};
    execCtlgData.forEach(item => {
        const periodName = getCtlgClsName(item.ctlgCls);
        const qty = parseFloat(item.settleQty) || 0;
        qtyByPeriod[periodName] = (qtyByPeriod[periodName] || 0) + qty;
    });

    if (charts.execCtlgQty) charts.execCtlgQty.destroy();

    charts.execCtlgQty = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(qtyByPeriod),
            datasets: [{
                label: '电量汇总 (kWh)',
                data: Object.values(qtyByPeriod),
                backgroundColor: [
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(14, 165, 233, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(34, 197, 94, 0.7)'
                ],
                borderColor: [
                    'rgba(168, 85, 247, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(14, 165, 233, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '按时段汇总电量',
                    color: '#f8fafc',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// 全局变量存储原始抄表数据
let readListData = [];

// ========== 渲染抄表示数 ==========
function renderReadList() {
    const tbody = document.getElementById('readListBody');
    const readData = parsedData.readLists || [];
    readListData = readData;

    // 填充计量点名称筛选选项
    populateMpNameFilter();

    // 分离最大需量数据 (readTypeCode = '15')
    const demandData = readData.filter(item => item.readTypeCode === '15');
    const regularData = readData.filter(item => item.readTypeCode !== '15');

    // 渲染最大需量指标卡
    renderDemandCards(demandData);

    // 渲染普通抄表数据表格（排除最大需量）
    renderReadListTable(regularData);

    // 按计量点名称分组渲染图表（排除最大需量）
    renderMeterCharts(regularData);
}

// 填充计量点名称筛选选项
function populateMpNameFilter() {
    const select = document.getElementById('mpNameFilter');
    const existingOptions = new Set();

    readListData.forEach(item => {
        if (item.mpName && !existingOptions.has(item.mpName)) {
            existingOptions.add(item.mpName);
        }
    });

    // 保留第一个"全部"选项，清除其他选项
    select.innerHTML = '<option value="">全部</option>';

    // 排序后添加选项
    Array.from(existingOptions).sort((a, b) => a.localeCompare(b, 'zh-CN')).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

// 筛选抄表示数
function filterReadList() {
    const mpNameFilter = document.getElementById('mpNameFilter').value;

    let filtered = readListData;

    if (mpNameFilter) {
        filtered = filtered.filter(item => item.mpName === mpNameFilter);
    }

    // 分离最大需量数据
    const demandData = filtered.filter(item => item.readTypeCode === '15');
    const regularData = filtered.filter(item => item.readTypeCode !== '15');

    // 渲染最大需量指标卡
    renderDemandCards(demandData);

    // 渲染普通抄表数据表格
    renderReadListTable(regularData);

    // 按计量点名称分组渲染图表
    renderMeterCharts(regularData);
}

// 渲染抄表示数表格
function renderReadListTable(regularData) {
    const tbody = document.getElementById('readListBody');

    tbody.innerHTML = regularData.map(item => {
        const pq = parseFloat(item.thisReadPq) || 0;
        const valueClass = pq >= 0 ? 'positive' : 'negative';

        return `
            <tr>
                <td>${item.mpName || '-'}</td>
                <td>${item.barCode || '-'}</td>
                <td>${getReadTypeName(item.readTypeCode)}</td>
                <td>${item.lastMrNum || '-'}</td>
                <td>${item.thisRead || '-'}</td>
                <td>${item.tFactor || '-'}</td>
                <td class="${valueClass}">${formatNumber(pq)} kWh</td>
            </tr>
        `;
    }).join('');
}

// 渲染最大需量指标卡
function renderDemandCards(demandData) {
    const container = document.getElementById('demandCards');

    if (!demandData || demandData.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = demandData.map(item => {
        const demandValue = parseFloat(item.thisReadPq) || 0;

        return `
            <div class="demand-card">
                <div class="card-header">
                    <div class="icon">⚡</div>
                    <div>
                        <div class="title">最大需量</div>
                        <div class="meter-name">${item.mpName || '-'}</div>
                    </div>
                </div>
                <div>
                    <span class="value">${formatNumber(demandValue)}</span>
                    <span class="unit">kW</span>
                </div>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">表号</span>
                        <span class="value">${item.barCode || '-'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">综合倍率</span>
                        <span class="value">${item.tFactor || '-'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">抄见起度</span>
                        <span class="value">${item.lastMrNum || '-'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">抄见止度</span>
                        <span class="value">${item.thisRead || '-'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 按计量点分组渲染图表
function renderMeterCharts(data) {
    const container = document.getElementById('meterChartsContainer');

    // 按计量点名称分组
    const meterGroups = {};
    data.forEach(item => {
        const meterName = item.mpName || '未知计量点';
        if (!meterGroups[meterName]) {
            meterGroups[meterName] = [];
        }
        meterGroups[meterName].push(item);
    });

    // 清空容器
    container.innerHTML = '';

    // 为每个计量点创建图表区域
    Object.entries(meterGroups).forEach(([meterName, items], index) => {
        const chartId = `meterChart_${index}`;

        const section = document.createElement('div');
        section.className = 'meter-chart-section';
        section.innerHTML = `
            <h3>📍 ${meterName}</h3>
            <div class="chart-wrapper">
                <canvas id="${chartId}"></canvas>
            </div>
        `;
        container.appendChild(section);

        // 渲染该计量点的图表
        setTimeout(() => renderSingleMeterChart(chartId, items, meterName), 0);
    });
}

// 渲染单个计量点的图表
function renderSingleMeterChart(chartId, items, meterName) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 按示数类型汇总电量
    const dataByType = {};
    items.forEach(item => {
        const typeName = getReadTypeName(item.readTypeCode);
        const pq = parseFloat(item.thisReadPq) || 0;
        dataByType[typeName] = (dataByType[typeName] || 0) + pq;
    });

    // 排序并过滤零0值
    const sortedData = Object.entries(dataByType)
        .filter(([_, value]) => value !== 0)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    if (sortedData.length === 0) return;

    // 销毁旧图表
    const chartKey = `meter_${chartId}`;
    if (charts[chartKey]) charts[chartKey].destroy();

    charts[chartKey] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => d[0]),
            datasets: [{
                label: '抄见电量 (kWh)',
                data: sortedData.map(d => d[1]),
                backgroundColor: sortedData.map(d => d[1] >= 0
                    ? 'rgba(16, 185, 129, 0.7)'
                    : 'rgba(239, 68, 68, 0.7)'),
                borderColor: sortedData.map(d => d[1] >= 0
                    ? 'rgba(16, 185, 129, 1)'
                    : 'rgba(239, 68, 68, 1)'),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${meterName} - 抄见电量分布`,
                    color: '#f8fafc',
                    font: { size: 14, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                }
            }
        }
    });
}

// ========== 渲染客户电费清单 ==========
function renderCustExp() {
    const custExp = parsedData.custExpLists?.[0] || {};

    // 时段电费
    renderFeeCategory('timePeriodFees', [
        { key: 'jDf', value: custExp.jDf },
        { key: 'fDf', value: custExp.fDf },
        { key: 'pDf', value: custExp.pDf },
        { key: 'gDf', value: custExp.gDf }
    ]);

    // 市场化交易电费
    renderFeeCategory('marketTradeFees', [
        { key: 'zjyDf', value: custExp.zjyDf },
        { key: 'jjyDF', value: custExp.jjyDF },
        { key: 'fjyDF', value: custExp.fjyDF },
        { key: 'gjyDf', value: custExp.gjyDf }
    ]);

    // 绿电交易电费
    renderFeeCategory('greenTradeFees', [
        { key: 'greExp', value: custExp.greExp },
        { key: 'greExpSharp', value: custExp.greExpSharp },
        { key: 'greExpPeak', value: custExp.greExpPeak },
        { key: 'greExpBal', value: custExp.greExpBal }
    ]);

    // 其他费用
    renderFeeCategory('otherFees', [
        { key: 'spDf', value: custExp.spDf },
        { key: 'dzDf', value: custExp.dzDf },
        { key: 'sysRunExp', value: custExp.sysRunExp },
        { key: 'sysRunLlExp', value: custExp.sysRunLlExp },
        { key: 'sysRunDvtExp', value: custExp.sysRunDvtExp },
        { key: 'sysRunUnitExp', value: custExp.sysRunUnitExp },
        { key: 'jbDf', value: custExp.jbDf },
        { key: 'ltDf', value: custExp.ltDf },
        { key: 'dyAmt', value: custExp.dyAmt, highlight: true }
    ]);

    // 电量信息
    renderFeeCategory('powerQuantity', [
        { key: 'jDl', value: custExp.jDl, unit: 'kWh' },
        { key: 'fDl', value: custExp.fDl, unit: 'kWh' },
        { key: 'pDl', value: custExp.pDl, unit: 'kWh' },
        { key: 'gDl', value: custExp.gDl, unit: 'kWh' },
        { key: 'dyPq', value: custExp.dyPq, unit: 'kWh', highlight: true },
        { key: 'rtPq', value: custExp.rtPq, unit: 'kWh' },
        { key: 'ctrtCap', value: custExp.ctrtCap, unit: 'kVA' },
        { key: 'actlDmd', value: custExp.actlDmd, unit: 'kW' }
    ]);

    // 电价信息
    renderFeeCategory('priceInfo', [
        { key: 'jDj', value: custExp.jDj, unit: '元/kWh', isPrice: true },
        { key: 'fDj', value: custExp.fDj, unit: '元/kWh', isPrice: true },
        { key: 'pDj', value: custExp.pDj, unit: '元/kWh', isPrice: true },
        { key: 'gDj', value: custExp.gDj, unit: '元/kWh', isPrice: true }
    ]);

    // 渲染图表
    renderFeeChart(custExp);
    renderPowerChart(custExp);
}

function renderFeeCategory(containerId, items) {
    const container = document.getElementById(containerId);

    container.innerHTML = items
        .filter(item => item.value !== undefined && item.value !== null && item.value !== '')
        .map(item => {
            const value = parseFloat(item.value) || 0;
            let displayValue;

            if (item.isPrice) {
                displayValue = value.toFixed(6) + ' ' + (item.unit || '');
            } else if (item.unit) {
                displayValue = formatNumber(value) + ' ' + item.unit;
            } else {
                displayValue = formatCurrency(value);
            }

            return `
                <div class="fee-row ${item.highlight ? 'highlight' : ''}">
                    <span class="label">${getChineseName(item.key)}</span>
                    <span class="value ${value < 0 ? 'negative' : ''}">${displayValue}</span>
                </div>
            `;
        }).join('');
}

function renderFeeChart(custExp) {
    const ctx = document.getElementById('feeChart').getContext('2d');

    const feeData = [
        { label: '市场化交易电费', value: parseFloat(custExp.zjyDf) || 0 },
        { label: '输配电费', value: parseFloat(custExp.spDf) || 0 },
        { label: '代征电费', value: parseFloat(custExp.dzDf) || 0 },
        { label: '系统运行费', value: parseFloat(custExp.sysRunExp) || 0 },
        { label: '基本电费', value: parseFloat(custExp.jbDf) || 0 },
        { label: '力调电费', value: parseFloat(custExp.ltDf) || 0 },
        { label: '发用两侧偏差', value: parseFloat(custExp.sysRunDvtExp) || 0 }
    ].filter(item => item.value !== 0);

    if (charts.fee) charts.fee.destroy();

    charts.fee = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: feeData.map(d => d.label),
            datasets: [{
                data: feeData.map(d => Math.abs(d.value)),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(14, 165, 233, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '60%',
            plugins: {
                title: {
                    display: true,
                    text: '电费构成',
                    color: '#f8fafc',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', padding: 16 }
                }
            }
        }
    });
}

function renderPowerChart(custExp) {
    const ctx = document.getElementById('powerChart').getContext('2d');

    const powerData = [
        { label: '尖电量', value: parseFloat(custExp.jDl) || 0 },
        { label: '峰电量', value: parseFloat(custExp.fDl) || 0 },
        { label: '平电量', value: parseFloat(custExp.pDl) || 0 },
        { label: '谷电量', value: parseFloat(custExp.gDl) || 0 }
    ];

    if (charts.power) charts.power.destroy();

    charts.power = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: powerData.map(d => d.label),
            datasets: [{
                data: powerData.map(d => Math.abs(d.value)),
                backgroundColor: [
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(14, 165, 233, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '时段电量分布',
                    color: '#f8fafc',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', padding: 16 }
                }
            }
        }
    });
}

// ========== 标签页切换 ==========
function switchTab(tabId) {
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // 更新内容区域
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// ========== 工具函数 ==========
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatNumber(value) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('zh-CN');
}

function formatYearMonth(ym) {
    if (!ym || ym.length !== 6) return ym || '-';
    return ym.substring(0, 4) + '年' + ym.substring(4) + '月';
}

function getSettleTimesName(code) {
    const mapping = {
        '0': '最终次',
        '1': '第一次',
        '2': '第二次'
    };
    return mapping[code] || code || '-';
}

function getBadgeClass(ctlgCls) {
    const mapping = {
        '01': 'badge-sharp',
        '02': 'badge-peak',
        '03': 'badge-flat',
        '04': 'badge-valley',
        '05': 'badge-deep'
    };
    return mapping[ctlgCls] || '';
}

// ========== Excel 导出功能 ==========
function exportToExcel() {
    if (!parsedData) {
        alert('请先解析数据后再导出');
        return;
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 1. 用户信息 Sheet
    const consInfo = parsedData.consLists?.[0] || {};
    const custExp = parsedData.custExpLists?.[0] || {};

    const consInfoData = [
        ['字段', '值'],
        ['户号', consInfo.consNo || '-'],
        ['户名', consInfo.consName || '-'],
        ['营业区编号', consInfo.orgNo || '-'],
        ['用电地址', consInfo.elecAddr || '-'],
        ['抄表年月', formatYearMonth(consInfo.mrYm)],
        ['结算年月', formatYearMonth(consInfo.jsYm)],
        ['抄表例日', (consInfo.mrDay || '-') + ' 日'],
        ['费率', consInfo.tsNum || '-'],
        ['用电类别', getElecTypeCodeName(consInfo.elecTypeCode)],
        ['市场化属性分类', getDeregAttrClsName(consInfo.deregAttrCls)],
        ['结算期数', getSettleTimesName(consInfo.gradedSettleTimes)],
        ['基本电费计算方式', custExp.beaCalcMode || '-'],
        ['受电容量 (kVA)', custExp.ctrtCap || '-'],
        ['实际需量 (kW)', custExp.actlDmd || '-'],
        ['当月合计电费 (元)', custExp.dyAmt || '-'],
        ['当月合计电量 (kWh)', custExp.dyPq || '-']
    ];

    const wsConsInfo = XLSX.utils.aoa_to_sheet(consInfoData);
    wsConsInfo['!cols'] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsConsInfo, '用户信息');

    // 2. 目录电费明细 Sheet
    const execCtlgHeaders = [
        '目录电价名称', '时段', '费用属性分类', '有功结算电量(kWh)',
        '电价(元/kWh)', '电费(元)', '冲减类型'
    ];

    const execCtlgRows = (parsedData.execCtlgLists || []).map(item => [
        item.execCtlgUpName || '-',
        getCtlgClsName(item.ctlgCls),
        getExpAttrClsName(item.expAttrCls),
        parseFloat(item.settleQty) || 0,
        parseFloat(item.degUp) || 0,
        parseFloat(item.degExp) || 0,
        item.writeOffType ? getWriteOffTypeName(item.writeOffType) : '-'
    ]);

    const wsExecCtlg = XLSX.utils.aoa_to_sheet([execCtlgHeaders, ...execCtlgRows]);
    wsExecCtlg['!cols'] = [
        { wch: 45 }, { wch: 8 }, { wch: 18 }, { wch: 18 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(wb, wsExecCtlg, '目录电费明细');

    // 3. 抄表示数 Sheet
    const readListHeaders = [
        '计量点名称', '表号', '示数类型', '抄见起度',
        '抄见止度', '综合倍率', '抄见电量(kWh)'
    ];

    const readListRows = (parsedData.readLists || []).map(item => [
        item.mpName || '-',
        item.barCode || '-',
        getReadTypeName(item.readTypeCode),
        item.lastMrNum || '-',
        item.thisRead || '-',
        item.tFactor || '-',
        parseFloat(item.thisReadPq) || 0
    ]);

    const wsReadList = XLSX.utils.aoa_to_sheet([readListHeaders, ...readListRows]);
    wsReadList['!cols'] = [
        { wch: 35 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsReadList, '抄表示数');

    // 4. 客户电费清单 Sheet
    const custExpData = [
        ['分类', '项目', '值', '单位'],
        // ===== 电费部分 =====
        ['', '', '', ''],
        ['【电费】', '', '', ''],
        // 时段电费
        ['时段电费', '尖电费', custExp.jDf || 0, '元'],
        ['时段电费', '峰电费', custExp.fDf || 0, '元'],
        ['时段电费', '平电费', custExp.pDf || 0, '元'],
        ['时段电费', '谷电费', custExp.gDf || 0, '元'],
        // 市场化交易电费
        ['市场化交易电费', '总-市场化交易电费', custExp.zjyDf || 0, '元'],
        ['市场化交易电费', '尖-市场化交易电费', custExp.jjyDF || 0, '元'],
        ['市场化交易电费', '峰-市场化交易电费', custExp.fjyDF || 0, '元'],
        ['市场化交易电费', '谷-市场化交易电费', custExp.gjyDf || 0, '元'],
        // 绿电交易电费
        ['绿电交易电费', '总-绿电交易电费', custExp.greExp || 0, '元'],
        ['绿电交易电费', '尖-绿电交易电费', custExp.greExpSharp || 0, '元'],
        ['绿电交易电费', '峰-绿电交易电费', custExp.greExpPeak || 0, '元'],
        ['绿电交易电费', '谷-绿电交易电费', custExp.greExpBal || 0, '元'],
        // 其他费用
        ['其他费用', '输配电费', custExp.spDf || 0, '元'],
        ['其他费用', '代征电费', custExp.dzDf || 0, '元'],
        ['其他费用', '系统运行费', custExp.sysRunExp || 0, '元'],
        ['其他费用', '上网环节线损费', custExp.sysRunLlExp || 0, '元'],
        ['其他费用', '发用两侧电费偏差', custExp.sysRunDvtExp || 0, '元'],
        ['其他费用', '燃气机组容量电费', custExp.sysRunUnitExp || 0, '元'],
        ['其他费用', '基本电费', custExp.jbDf || 0, '元'],
        ['其他费用', '力调电费', custExp.ltDf || 0, '元'],
        // 当月合计电费（单独强调）
        ['', '', '', ''],
        ['★★★ 合计 ★★★', '当月合计电费', custExp.dyAmt || 0, '元'],
        ['', '', '', ''],

        // ===== 电量部分 =====
        ['【电量】', '', '', ''],
        ['电量信息', '尖电量', custExp.jDl || 0, 'kWh'],
        ['电量信息', '峰电量', custExp.fDl || 0, 'kWh'],
        ['电量信息', '平电量', custExp.pDl || 0, 'kWh'],
        ['电量信息', '谷电量', custExp.gDl || 0, 'kWh'],
        ['电量信息', '当月合计电量', custExp.dyPq || 0, 'kWh'],
        ['电量信息', '总-零售交易电量', custExp.rtPq || 0, 'kWh'],
        ['容量信息', '受电容量', custExp.ctrtCap || 0, 'kVA'],
        ['容量信息', '实际需量', custExp.actlDmd || 0, 'kW'],
        ['', '', '', ''],

        // ===== 电价部分 =====
        ['【电价】', '', '', ''],
        ['电价信息', '尖电价', custExp.jDj || 0, '元/kWh'],
        ['电价信息', '峰电价', custExp.fDj || 0, '元/kWh'],
        ['电价信息', '平电价', custExp.pDj || 0, '元/kWh'],
        ['电价信息', '谷电价', custExp.gDj || 0, '元/kWh']
    ];

    const wsCustExp = XLSX.utils.aoa_to_sheet(custExpData);
    wsCustExp['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 18 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsCustExp, '客户电费清单');

    // 生成文件名
    const consNo = consInfo.consNo || 'unknown';
    const jsYm = consInfo.jsYm || '';
    const fileName = `电费数据_${consNo}_${jsYm}.xlsx`;

    // 导出文件
    XLSX.writeFile(wb, fileName);
}
