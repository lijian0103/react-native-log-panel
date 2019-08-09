'use strict';

import React, {Component} from "react";
import {View, PanResponder, ViewPropTypes, Text, StatusBar, StyleSheet, Platform, Dimensions} from 'react-native';
import ConsoleStack from "./ConsoleStack";

const FloatBtnHeight = 30;//悬浮按钮高度
const FloatBtnWidth = 80;//悬浮按钮宽度
const limitHorizontal = 10;//水平限制最低间隔
const limitBottom = 20;//底部限制间隔
const {width, height} = Dimensions.get('window');
const iosStatusBarHeight = 44;//刘海屏44,非刘海20
const limitTop = height - FloatBtnHeight - (Platform.OS === 'android' ? (Dimensions.get('screen').height === height ? StatusBar.currentHeight : 0) : iosStatusBarHeight);
const limitLeft = width - limitHorizontal - FloatBtnWidth;

export default class ConsoleBtn extends Component {

    static propTypes = {
        style: ViewPropTypes.style,
        overlayPointerEvents: ViewPropTypes.pointerEvents,
    };

    static defaultProps = {
        overlayPointerEvents: 'box-none',
        limit: 100,
    };

    constructor(props) {
        super(props);
        this.state = {
            bottom: limitBottom * 2,
            right: limitHorizontal * 2,
        };
        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

            onPanResponderGrant: (evt, gestureState) => {
                this._bottom = this.state.bottom;
                this._right = this.state.right;
            },
            onPanResponderMove: (evt, gs) => {
                if (gs.dx !== 0 && gs.dx !== 0) {
                    this.moved = true;
                    this.updatePosition(evt, gs, 'move');
                }
            },
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderRelease: (evt, gs) => {
                this.updatePosition(evt, gs, 'release');
                if (!this.moved) {
                    this.props.onPress && this.props.onPress();
                }
                this.moved = false;
            },
            onPanResponderTerminate: (evt, gestureState) => {
                // 另一个组件已经成为了新的响应者，所以当前手势将被取消。
            },
            onShouldBlockNativeResponder: (evt, gestureState) => {
                // 返回一个布尔值，决定当前组件是否应该阻止原生组件成为JS响应者
                // 默认返回true。目前暂时只支持android。
                //基于业务交互场景，如果这里使用js事件处理，会导致容器不能左右滑动。所以设置成false.
                return false;
            },
        });
    }

    componentWillMount() {
        console.log('初始化ConsoleStack');
        ConsoleStack.getInstance(this.props.limit);
    }

    componentWillUnmount() {
        ConsoleStack.instance = null;
    }

    updatePosition(evt, gs, name) {
        let bottom = this._bottom - gs.dy;
        let right = this._right - gs.dx;
        bottom = bottom < limitBottom ? limitBottom : (bottom > limitTop ? limitTop : bottom);
        right = right < limitHorizontal ? limitHorizontal : (right > limitLeft ? limitLeft : right);
        // console.log(name, `dx: ${gs.dx}, dy: ${gs.dy}, right: ${right}, bottom: ${bottom}`);
        this.setState({
            bottom: bottom,
            right: right,
        });
    }

    get overlayPointerEvents() { //override in Toast
        return this.props.overlayPointerEvents;
    }

    buildStyle() {
        let {style} = this.props;
        style = [{position: 'absolute', bottom: this.state.bottom, right: this.state.right,}].concat(style);
        return style;
    }

    render() {
        let {onPress} = this.props;
        return (
            <View
                {...this._panResponder.panHandlers}
                style={this.buildStyle()}
                pointerEvents={this.overlayPointerEvents}>
                <View style={styles.btnView}>
                    <Text onPress={onPress} style={styles.btnTxt}>Console</Text>
                </View>
            </View>
        );
    }

}

const styles = StyleSheet.create({
    btnView: {
        backgroundColor: '#03BC04',
        width: FloatBtnWidth,
        height: FloatBtnHeight,
        borderRadius: 4,
        justifyContent: 'center',

        elevation: 4,
        shadowOffset: {width: 0, height: 0},
        shadowColor: 'black',
        shadowOpacity: 0.8,
    },
    btnTxt: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        lineHeight: FloatBtnHeight,
        textAlignVertical: 'center',
        textAlign: 'center'
    }
});
