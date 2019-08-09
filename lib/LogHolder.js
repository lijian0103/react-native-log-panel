'use strict';

import React from "react";

import LogView from "./LogView";

export default class LogHolder {

    constructor(limit, modal = false) {

        this.consoleBtnView = (
            <LogView.FloatButton
                limit={limit}
                onPress={() => {
                    this.showConsolePanel();
                }}
            />
        );
        this.consolePanelView = (
            <LogView.PanelView ref={(pull) => this.pullView = pull}
                               limit={limit}
                               enableLogBgColor={true}
                               modal={modal} side={'bottom'} rootTransform={'none'}
                               onCloseRequest={() => {
                                   this.closeConsolePanel(true);
                               }}
            />
        );
    }

    static getInstance(limit, modal) {
        if (!LogHolder.instance) {
            LogHolder.instance = new LogHolder(limit, modal);
        }
        return LogHolder.instance;
    }

    static releaseQuiet() {
        if (global.setting_showLog && LogHolder.instance) {
            LogHolder.instance.release();
        }
    }

    //开启/关闭日志系统
    switchLog(open) {
        global.setting_showLog = open;
        let logStatus = open ? '打开日志系统' : '关闭日志系统';
        if (open) {
            global.console = global.consoleHolder;//恢复系统自带日志（前提App.js启动时候先做备份）
            this.showLogFloatBtn(true);
            console.log(logStatus);
        } else {
            console.log(logStatus);
            this.showLogFloatBtn(false);
            global.console = {
                info: () => {
                },
                log: () => {
                },
                warn: () => {
                },
                error: () => {
                },
            };
        }
    }

    release() {
        if (this.isLogOpen()) {
            this.switchLog(false);
        }
    }

    isLogOpen() {
        return Boolean(this.consoleBtn);
    }

    showLogFloatBtn(show) {
        if (show) {
            this.consoleBtn = LogView.show(this.consoleBtnView);
        } else {
            if (this.consolePanel) {
                this.closeConsolePanel(false);
            }
            this.consoleBtn && LogView.hide(this.consoleBtn);
            this.consoleBtn = null;
        }
    }

    closeConsolePanel(animated) {
        this.consolePanel && this.consolePanel.close(animated);
        this.consolePanel = null;
    }

    showConsolePanel() {
        if (!this.consolePanel) {
            this.consolePanel = {
                key: LogView.show(this.consolePanelView),
                close: (animated) => {
                    this.pullView && this.pullView.close(animated);
                }
            };
        } else {
            console.log('面板已打开', this.consolePanel.key);
        }
    }

}
