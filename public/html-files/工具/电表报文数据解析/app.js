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
        if (data.data.code === "0" && data.data.data) {
            // 获取第一个户号的数据
            const consNoKeys = Object.keys(data.data.data);
            if (consNoKeys.length > 0) {
                actualData = data.data.data[consNoKeys[0]];
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

    const cards = [
        { icon: '🏢', label: '户名', value: consInfo.consName || '-' },
        { icon: '📍', label: '户号', value: consInfo.consNo || '-' },
        { icon: '💰', label: '当月合计电费', value: formatCurrency(custExp.dyAmt), highlight: true },
        { icon: '⚡', label: '当月合计电量', value: formatNumber(custExp.dyPq) + ' kWh', highlight: true },
        { icon: '📅', label: '结算年月', value: formatYearMonth(consInfo.jsYm) },
        { icon: '📊', label: '基本电费计算方式', value: custExp.beaCalcMode || '-' }
    ];

    container.innerHTML = cards.map(card => `
        <div class="overview-card ${card.highlight ? 'highlight' : ''}">
            <div class="icon">${card.icon}</div>
            <div class="label">${card.label}</div>
            <div class="value">${card.value}</div>
        </div>
    `).join('');
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
    renderExecCtlgTable(execCtlgData);
    renderCtlgSummaryTable();
    renderExecCtlgChart();
    renderExecCtlgQtyChart();
}

function filterExecCtlg() {
    const filter = document.getElementById('ctlgClsFilter').value;
    const filtered = filter
        ? execCtlgData.filter(item => item.ctlgCls === filter)
        : execCtlgData;
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

// ========== 渲染抄表示数 ==========
function renderReadList() {
    const tbody = document.getElementById('readListBody');
    const readData = parsedData.readLists || [];

    // 分离最大需量数据 (readTypeCode = '15')
    const demandData = readData.filter(item => item.readTypeCode === '15');
    const regularData = readData.filter(item => item.readTypeCode !== '15');

    // 渲染最大需量指标卡
    renderDemandCards(demandData);

    // 渲染普通抄表数据表格（排除最大需量）
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

    // 按计量点名称分组渲染图表（排除最大需量）
    renderMeterCharts(regularData);
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
