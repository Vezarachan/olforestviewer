import {
    equalTo,
    greaterThan,
    greaterThanOrEqualTo,
    lessThan,
    lessThanOrEqualTo
} from "ol/format/filter"

export default {
    generationCondition(left, operation, right, conditions_array) {
        conditions_array.push({
            left,
            operation,
            right
        })
    },
    generateFilter(conditions) {
        for (let i = 0; i < conditions.length; i++) {
            var oprt = conditions[i].operation;
            var conts = [];
            switch (oprt) {
                case 1:
                    conts.push(equalTo(left, right));
                    break;
                case 2:
                    conts.push(greaterThanOrEqualTo(left, right));
                    break;
                case 3:
                    conts.push(lessThanOrEqualTo(left, right));
                    break;
                case 4:
                    conts.push(greaterThan(left, right));
                    break;
                case 5:
                    conts.push(lessThan(left, right));
                    break;
                default:
                    break;
            }
            if (conts < 1) {
                return;
            }
            return and(conts);
        }
    },
    layerProperties: [{
        layer: "林场小班图层",
        index: 1,
        properties: [
            "林班号",
            "林班名",
            "小班号",
            "小班名",
            "地名",
            "地类",
            "面积",
            "地貌",
            "海拔",
            "坡度",
            "坡向",
            "坡位",
            "土壤名称",
            "土壤质地",
            "起源",
            "林种",
            "树种组成",
            "优势树种",
            "年龄",
            "龄组",
            "平均胸径",
            "平均高",
            "郁闭度",
            "疏密度",
            "计株数",
            "单位株数",
            "单位蓄积",
            "计蓄积",
            "林木使用权",
            "林木所有权"
        ]
    }, {
        layer: "林场公益林图层",
        index: 1,
        properties: [
            "林班号",
            "小班号",
            "地名",
            "地类",
            "面积",
            "地貌",
            "海拔",
            "坡度",
            "坡向",
            "坡位",
            "土壤名称",
            "土壤质地",
            "起源",
            "林种",
            "树种组成",
            "优势树种",
            "龄组或产期",
            "平均胸径",
            "平均高",
            "郁闭度",
            "疏密度",
            "每亩株数",
            "计株数",
            "活立木蓄积",
            "计蓄积",
            "林木使用权",
            "林木所有权"
        ]
    }, {
        layer: "林场古树名木图层",
        index: 3,
        properties: [
            "古树编号",
            "古树群编号",
            "俗名",
            "中名",
            "乡镇",
            "村",
            "坡向",
            "坡位",
            "坡度",
            "海拔",
            "树龄",
            "树高",
            "胸径"
        ]
    }]
}