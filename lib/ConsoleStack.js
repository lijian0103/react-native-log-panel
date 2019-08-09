/**
  * Author：user
  * Date： 2019/8/7
  * Description：
  */
'use strict';
export default class ConsoleStack {

    static instance = null;

    constructor(limit) {
        this.limit = limit;
        this.data = [];
        this.listeners = [];
        this.waiting = false;
        this.unreadEnabled = false;
        this.unreadCount = 0;
    }

    static getInstance(limit) {
        if (!ConsoleStack.instance) {
            ConsoleStack.instance = new ConsoleStack(limit);
            ConsoleStack.proxyConsole(console, ConsoleStack.instance);
            console.disableYellowBox = true;
        }
        return ConsoleStack.instance;
    }

    //空位补0
    formatter(len) {
        return (input) => {
            let str = String(input);
            let strLen = str.length;
            return '0'.repeat(len - strLen) + input;
        }
    }

    //获取当前时间
    timestamp() {
        let d = new Date();
        let f2 = this.formatter(2);
        return f2(d.getHours())
            + ':' + f2(d.getMinutes())
            + ':' + f2(d.getSeconds())
            + '.' + this.formatter(3)(d.getMilliseconds());
    }

    //清空缓存日志
    clear() {
        this.data.splice(0, this.data.length);
        this.notifyListeners();
    }

    //遍历执行所有通知
    notifyListeners() {
        if (this.waiting) {
            return;
        }
        this.timeout = setTimeout(() => {
            this.listeners.forEach((callback) => {
                callback();
            });
            clearTimeout(this.timeout);
            this.waiting = false;
        }, 500);
        this.waiting = true;
    }

    add(type, logObj) {
        let timestamp = this.timestamp();
        let typeFlag = type.substr(0, 1).toUpperCase();
        let content = this.limitEachLog(this.logObjToString(logObj), 2, 150);
        let raw = `${timestamp}(${typeFlag}): ${content}`;
        if (this.data.unshift({level: type, text: raw}) > this.limit) {
            this.data.pop();
        }
        this.notifyListeners();
        if (this.unreadEnabled) {
            this.unreadCount++;
        }
    }

    toString() {
        return this.logObjToString(this.data);
    }

    getData(limit) {
        return this.data.slice(0, limit);
    }

    bindUpdateListener(callback) {
        this.listeners.push(callback);
    }

    removeUpdateListener(callback) {
        this.listeners && this.listeners.splice(this.listeners.findIndex(cb => cb === callback), 1);
    }

    getUnreadCount() {
        return this.unreadCount;
    }

    enableUnreadCount(enable) {
        this.unreadEnabled = enable;
    }

    resetUnreadCount() {
        this.unreadCount = 0;
    }

    //限制每条日志的长度
    limitEachLog(input, lineLimit, charLimit, enabledLimit = false) {
        if (enabledLimit) {
            let changed = input.length > charLimit;
            input = input.substr(0, charLimit);
            let lines = input.split('\n');
            if (lines.length > lineLimit) {
                changed = true;
                lines.splice(lineLimit, lines.length - lineLimit);
            }
            let newContent = lines.join('\n');
            return newContent + (changed ? '...' : '');
        }
        return input;
    }


    //日志内容logObj转String
    logObjToString(obj) {
        try {
            if (obj === null || obj === undefined || typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'function') {
                return String(obj);
            } else if (obj instanceof Date) {
                return 'Date(' + obj.toISOString() + ')';
            } else if (Array.isArray(obj)) {
                let txt = '';
                obj.map((it, i) => {
                    let itTxt = this.logObjToString(it);
                    txt = txt + (i !== 0 ? '\n' : '') + itTxt;
                });
                return txt;
            } else if (obj instanceof Object) {
                return JSON.stringify(obj);
            } else {
                return 'unknown data';
            }
        } catch (e) {
        }
        return 'logObject format error!'
    }

    static proxyConsole(console, consoleStack) {
        console.log('添加代理Console');
        const methods = ['log', 'error', 'warn', 'info'];
        methods.forEach((method) => {
            let f = console[method];
            console['_' + method] = f;//备份
            console[method] = (...args) => {
                consoleStack.add(method, args);
                method !== 'error' && f.apply(console, args);
            };
        });
    }

}