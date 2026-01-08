// 字段映射表 - 英文字段名到中文名称的映射
const fieldMapping = {
    // ========== consLists - 用户信息 ==========
    consNo: '户号',
    consName: '户名',
    orgNo: '营业区编号',
    elecAddr: '用电地址',
    mrYm: '抄表年月',
    jsYm: '结算年月',
    mrDay: '抄表例日',
    tsNum: '费率',
    elecTypeCode: '用电类别',
    deregAttrCls: '市场化属性分类',
    gradedSettleTimes: '结算期数',
    apCuLoss: '有功铜损',
    apIronLoss: '有功铁损',
    tSettleQty: '有功合计',
    calcId: '计算标识',

    // ========== execCtlgLists - 目录电费明细 ==========
    execCtlgUpName: '目录电价名称',
    ctlgCls: '时段',
    expAttrCls: '费用属性分类',
    settleQty: '有功结算电量',
    degUp: '电价',
    degExp: '电费',
    writeOffType: '冲减类型',
    qtyChargCalcBusType: '量费业务类型',

    // ========== custExpLists - 客户电费清单 ==========
    // 容量/需量相关
    ctrtCap: '受电容量',
    veriDmd: '核定需量',
    dmdRead: '需量示数',
    actlDmd: '实际需量',
    overVeriDmd: '超核需量',
    suspdCap: '暂停容量',
    suspdDays: '暂停天数',

    // 时段电费 (尖峰平谷)
    jDf: '尖电费',
    fDf: '峰电费',
    pDf: '平电费',
    gDf: '谷电费',

    // 市场化交易电费
    zjyDf: '总-市场化交易电费',
    jjyDF: '尖-市场化交易电费',
    fjyDF: '峰-市场化交易电费',
    gjyDf: '谷-市场化交易电费',

    // 绿电交易电费
    greExp: '总-绿电交易电费',
    greExpSharp: '尖-绿电交易电费',
    greExpPeak: '峰-绿电交易电费',
    greExpBal: '谷-绿电交易电费',

    // 其他费用
    spDf: '输配电费',
    dzDf: '代征电费',
    sysRunLlExp: '上网环节线损费',
    sysRunExp: '系统运行费',
    timesecExpPeak: '峰-季节性分时调整电费',
    timesecExpVal: '谷-季节性分时调整电费',
    sysRunUnitExp: '燃气机组容量电费',
    sysRunDvtExp: '发用两侧电费偏差',
    beaCalcMode: '基本电费计算方式',
    jbDf: '基本电费',
    ltDf: '力调电费',
    pfDf: '偏差电费',
    syDf: '损益电费',
    btrlDf: '补贴和容量电费',
    rsSettleExp: '退补电费',
    dyAmt: '当月合计电费',

    // 结算电量
    tSettleQtySharp: '尖-结算电量',
    tSettleQtyPeak: '峰-结算电量',
    tSettleQtyVal: '谷-结算电量',

    // 计费电量 (尖峰平谷)
    jDl: '尖电量',
    fDl: '峰电量',
    pDl: '平电量',
    gDl: '谷电量',

    // 零售交易电量
    rtPqSharp: '尖-零售交易电量',
    rtPqPeak: '峰-零售交易电量',
    rtPqVal: '谷-零售交易电量',
    rtPq: '总-零售交易电量',

    // 绿电交易电量
    grePqSharp: '尖-绿电交易电量',
    grePqPeak: '峰-绿电交易电量',
    grePqVal: '谷-绿电交易电量',
    grePq: '总-绿电交易电量',

    // 当月合计电量/电价
    dyPq: '当月合计电量',
    dyDl: '一档电量',
    drDl: '二档电量',
    dsDl: '三档电量',
    dyDf: '一档电费',
    drDf: '二档电费',
    dsDf: '三档电费',

    // 电价
    jDj: '尖电价',
    fDj: '峰电价',
    pDj: '平电价',
    gDj: '谷电价',

    // 浮动单价
    edfdDj: '二档用电浮动单价',
    sdfdDj: '三档用电浮动单价',

    // ========== readLists - 抄表示数 ==========
    mpName: '计量点名称',
    readTypeCode: '电能表示数类型',
    barCode: '表号',
    lastMrNum: '抄见起度',
    thisRead: '抄见止度',
    tFactor: '综合倍率',
    thisReadPq: '抄见电量'
};

// 时段代码映射
const ctlgClsMapping = {
    '01': '尖',
    '02': '峰',
    '03': '平',
    '04': '谷',
    '05': '深谷'
};

// 示数类型代码映射
const readTypeMapping = {
    '01': '正向有功总',
    '02': '反向有功总',
    '03': '正向有功峰',
    '04': '正向有功谷',
    '05': '正向有功平',
    '11': '正向无功总',
    '14': '反向无功总',
    '15': '最大需量'
};

// 冲减类型映射
const writeOffTypeMapping = {
    '01': '冲红'
};

// 市场化属性分类映射
const deregAttrClsMapping = {
    '0101': '市场化零售用户',
    '0102': '市场化批发用户',
    '0201': '代理购电用户',
    '0301': '兜底用户',
    '0401': '非市场化客户'
};

// 费用属性分类映射
const expAttrClsMapping = {
    '0101': '目录电费',
    '0201': '零售交易电费',
    '0202': '输配电费',
    '0270': '上网环节线损费',
    '0281': '发用两侧偏差电费',
    '系统运行费': '系统运行费'
};

// 用电类别映射
const elecTypeCodeMapping = {
    '0100': '居民生活用电',
    '0200': '大工业用电',
    '0300': '一般工商业用电',
    '0400': '农业用电'
};

// 获取中文字段名
function getChineseName(fieldName) {
    return fieldMapping[fieldName] || fieldName;
}

// 获取时段名称
function getCtlgClsName(code) {
    return ctlgClsMapping[code] || code;
}

// 获取示数类型名称
function getReadTypeName(code) {
    return readTypeMapping[code] || code;
}

// 获取冲减类型名称
function getWriteOffTypeName(code) {
    return writeOffTypeMapping[code] || '';
}

// 获取市场化属性分类名称
function getDeregAttrClsName(code) {
    return deregAttrClsMapping[code] || code;
}

// 获取费用属性分类名称
function getExpAttrClsName(code) {
    return expAttrClsMapping[code] || code;
}

// 获取用电类别名称
function getElecTypeCodeName(code) {
    return elecTypeCodeMapping[code] || code;
}
