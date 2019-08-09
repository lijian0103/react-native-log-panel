'use strict';

import React, {Component} from "react";
import PropTypes from 'prop-types';
import {Animated, Dimensions, PanResponder, ScrollView, StyleSheet, Text, View, ViewPropTypes} from 'react-native';

import LogView from './LogView';
import ConsoleBtn from './ConsoleBtn';
import ConsoleStack from "./ConsoleStack";

const PanelHeight = Dimensions.get('window').height * 2 / 3;
export default class ConsolePanel extends Component {

    static propTypes = {
        ...ConsoleBtn.propTypes,
        modal: PropTypes.bool,
        side: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
        containerStyle: ViewPropTypes.style,
        rootTransform: PropTypes.oneOfType([
            PropTypes.oneOf(['none', 'translate', 'scale']),
            PropTypes.arrayOf(PropTypes.shape({
                translateX: PropTypes.number,
                translateY: PropTypes.number,
                scaleX: PropTypes.number,
                scaleY: PropTypes.number,
            })),
        ]),
    };

    static defaultProps = {
        ...ConsoleBtn.defaultProps,
        modal: false,//是否为模态浮层, 非模态浮层在点击内容之外的半透明区域或按返回键(Android only)可关闭浮层, 模态浮层则需要代码手动关闭。
        side: 'bottom',
        animated: true,
        rootTransform: 'none',
        limit: 100,
    };

    constructor(props) {
        super(props);
        this.consoleStack = ConsoleStack.getInstance(this.props.limit);
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (e, gestureState) => true,
            onPanResponderGrant: (e, gestureState) => this.touchStateID = gestureState.stateID,
            onPanResponderRelease: (e, gestureState) => this.touchStateID === gestureState.stateID ? this.closeRequest() : null,
        });
        this.state = {
            overlayOpacity: new Animated.Value(0),
            logData: this.consoleStack.getData(this.props.limit),
        };
        this.viewLayout = {x: 0, y: 0, width: 0, height: 0};
        Object.assign(this.state, {
            marginValue: new Animated.Value(0),
            showed: false,
        });

        this.dataUpdateListener = () => {
            if (!this._isMounted) return;
            this.setState({
                logData: this.consoleStack.getData(this.props.limit),
            }, () => {
                setImmediate(() => {
                    this.panelScrollView && this.panelScrollView.scrollTo({x: 0, y: 0, animated: true});
                });
            });
        };
    }

    componentDidMount() {
        this._isMounted = true;
        this.appearAfterMount && this.appear();
        this.consoleStack && this.consoleStack.bindUpdateListener(this.dataUpdateListener);
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.consoleStack && this.consoleStack.removeUpdateListener(this.dataUpdateListener);
    }

    get appearAnimates() {
        let duration = 200;
        let animates = [
            Animated.timing(this.state.overlayOpacity, {
                toValue: this.overlayOpacity,
                duration,
            })
        ];
        animates.push(
            Animated.spring(this.state.marginValue, {
                toValue: 0,
                friction: 9,
            })
        );
        return animates;
    }

    get disappearAnimates() {
        let duration = 200;
        let animates = [
            Animated.timing(this.state.overlayOpacity, {
                toValue: 0,
                duration,
            })
        ];
        animates.push(
            Animated.spring(this.state.marginValue, {
                toValue: this.marginSize,
                friction: 9,
            })
        );
        return animates;
    }

    get appearAfterMount() {
        return false;
    }

    get marginSize() {
        let {side} = this.props;
        if (side === 'left' || side === 'right') return -this.viewLayout.width;
        else return -this.viewLayout.height;
    }

    get rootTransformValue() {
        let {side, rootTransform} = this.props;
        if (!rootTransform || rootTransform === 'none') {
            return [];
        }
        switch (rootTransform) {
            case 'translate':
                switch (side) {
                    case 'top':
                        return [{translateY: this.viewLayout.height}];
                    case 'left':
                        return [{translateX: this.viewLayout.width}];
                    case 'right':
                        return [{translateX: -this.viewLayout.width}];
                    default:
                        return [{translateY: -this.viewLayout.height}];
                }
                break;
            case 'scale':
                return [{scaleX: 0.93}, {scaleY: 0.93}];
            default:
                return rootTransform;
        }
    }

    get overlayOpacity() {
        let {overlayOpacity} = this.props;
        return (overlayOpacity || overlayOpacity === 0) ? overlayOpacity : 0.4;
    }

    appearBackground(animated = this.props.animated, additionAnimates = null) {
        if (animated) {
            this.state.overlayOpacity.setValue(0);
            Animated.parallel(this.appearAnimates.concat(additionAnimates)).start(e => this.appearCompleted());
        } else {
            this.state.overlayOpacity.setValue(this.overlayOpacity);
            this.appearCompleted();
        }
    }

    appearCompleted() {
        let {onAppearCompleted} = this.props;
        onAppearCompleted && onAppearCompleted();
    }

    disappearCompleted() {
        let {onDisappearCompleted} = this.props;
        onDisappearCompleted && onDisappearCompleted();
    }

    //可自定义关闭事件
    closeRequest() {
        let {modal, onCloseRequest} = this.props;
        if (onCloseRequest) onCloseRequest(this);
        else if (!modal) this.close();
    }

    //关闭
    close(animated = this.props.animated) {
        if (this.closed) return true;
        this.closed = true;
        this.disappear(animated);
        return true;
    }

    //打开
    appear(animated = this.props.animated) {
        if (animated) {
            this.state.marginValue.setValue(this.marginSize);
        }
        this.appearBackground(animated);

        let {rootTransform} = this.props;
        if (rootTransform && rootTransform !== 'none') {
            LogView.transformRoot(this.rootTransformValue, animated);
        }
    }

    disappearBackground(animated = this.props.animated, additionAnimates = null) {
        if (animated) {
            Animated.parallel(this.disappearAnimates.concat(additionAnimates)).start(e => this.disappearCompleted());
            this.state.overlayOpacity.addListener(e => {
                if (e.value < 0.01) {
                    this.state.overlayOpacity.stopAnimation();
                    this.state.overlayOpacity.removeAllListeners();
                }
            });
        } else {
            this.disappearCompleted();
        }
    }

    disappear(animated = this.props.animated) {
        let {rootTransform} = this.props;
        if (rootTransform && rootTransform !== 'none') {
            LogView.restoreRoot(animated);
        }

        this.disappearBackground(animated);
    }

    onLayout(e) {
        this.viewLayout = e.nativeEvent.layout;
        if (!this.state.showed) {
            this.setState({showed: true});
            this.appear();
        }
    }

    buildStyle2() {
        let {style} = this.props;
        style = [{backgroundColor: 'rgba(0, 0, 0, 0)', flex: 1}].concat(style);
        return style;
    }

    buildStyle() {
        let {side} = this.props;
        let sideStyle;
        //Set flexDirection so that the content view will fill the side
        switch (side) {
            case 'top':
                sideStyle = {flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch'};
                break;
            case 'left':
                sideStyle = {flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch'};
                break;
            case 'right':
                sideStyle = {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'stretch'};
                break;
            default:
                sideStyle = {flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch'};
        }
        return this.buildStyle2().concat(sideStyle);
    }

    renderContent() {
        let {side, containerStyle} = this.props;
        let panel = (
            <View style={{height: PanelHeight}}>
                <View style={{
                    height: 40, justifyContent: 'center',
                    paddingHorizontal: 10,
                    backgroundColor: '#f2f2f2',
                    borderBottomWidth: 0.6, borderBottomColor: '#EFEFEF',
                    borderTopWidth: 1, borderTopColor: '#e7e7e7',
                }}>
                    <Text style={{color: 'black', fontSize: 16, textAlignVertical: 'center'}}>日志控制面板</Text>
                </View>
                {this.createLogsView()}
                <View style={{
                    flexDirection: 'row',
                    height: 40,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: '#EFEFEF'
                }}>
                    <Text
                        onPress={() => {
                            this.setState({logData: null}, () => {
                                this.consoleStack && this.consoleStack.clear();
                            });
                        }}
                        style={{
                            flex: 1,
                            color: 'red',
                            fontSize: 16,
                            lineHeight: 40,
                            textAlign: 'center',
                            textAlignVertical: 'center',
                            borderRightWidth: StyleSheet.hairlineWidth,
                            borderRightColor: '#EFEFEF',
                        }}>清除</Text>
                    <Text
                        onPress={() => {
                            this.closeRequest();
                        }}
                        style={{
                            flex: 1,
                            color: '#454545',
                            fontSize: 16,
                            lineHeight: 40,
                            textAlign: 'center',
                            textAlignVertical: 'center'
                        }}>隐藏</Text>
                </View>
            </View>
        );
        let contentStyle;
        switch (side) {
            case 'top':
                contentStyle = {marginTop: this.state.marginValue};
                break;
            case 'left':
                contentStyle = {marginLeft: this.state.marginValue};
                break;
            case 'right':
                contentStyle = {marginRight: this.state.marginValue};
                break;
            default:
                contentStyle = {marginBottom: this.state.marginValue};
        }
        contentStyle.opacity = this.state.showed ? 1 : 0;
        containerStyle = [{
            backgroundColor: '#ffffff',
        }].concat(containerStyle).concat(contentStyle);

        return (
            <Animated.View style={containerStyle} onLayout={(e) => this.onLayout(e)}>
                {panel}
            </Animated.View>
        );
    }

    createLogsView() {
        let {enableLogBgColor} = this.props;
        let logData = this.state.logData;
        if (logData && logData.length > 0) {
            let arr = [];
            logData.map((it, i) => {
                let {level, text} = it;
                arr.push(
                    <Text
                        key={i.toString()}
                        selectable={true}
                        style={[{
                            fontSize: 13,
                            padding: 10,
                            lineHeight: 15,
                            textAlignVertical: 'center',
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: '#EFEFEF',
                        }, styles[level], enableLogBgColor ? {} : {backgroundColor: 'white'}]}>{text}</Text>
                );
            });
            return (
                <ScrollView ref={(scrollView) => this.panelScrollView = scrollView} style={{flex: 1,}}>
                    {arr}
                </ScrollView>
            );
        } else {
            return (
                <View style={{flex: 1, justifyContent: 'center'}}>
                    <Text style={{
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        color: '#454545',
                        fontSize: 20
                    }}>Empty</Text>
                </View>
            );
        }
    }

    render() {
        let {modal} = this.props;
        return (
            <View style={[modal ? styles.modalScreen : styles.screen]}>
                {!modal && <Animated.View
                    style={[styles.screen, {backgroundColor: '#000', opacity: this.state.overlayOpacity}]}
                    {...this.panResponder.panHandlers}
                />}
                <View style={this.buildStyle()} pointerEvents='box-none'>
                    {this.renderContent()}
                </View>
            </View>
        );
    }
}
const styles = StyleSheet.create({
    modalScreen: {
        height: PanelHeight,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    screen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    log: {
        color: '#1F1F1F',
    },
    info: {
        color: '#6A5ACD',
    },
    warn: {
        color: '#FFA500',
        backgroundColor: '#FFFACD',
    },
    error: {
        color: '#DC143C',
        backgroundColor: '#FFE4E1',
    },
});