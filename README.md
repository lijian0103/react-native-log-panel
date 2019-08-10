# react-native-log-panel

## Getting started

`$ npm install react-native-log-panel --save`


## Usage
### app启动页面卸载时释放
```javascript
import LogHolder from "react-native-log-panel";

componentWillUnmount() {
    ...
    LogHolder.releaseQuiet();
}
```
### 使用页面初始化
```javascript
import LogHolder from "react-native-log-panel";

constructor(props) {
    super(props);
    ...
    this.logHolder = LogHolder.getInstance(50, false);//(limit,modal)
}

...
this.logHolder.switchLog(newState);
```
### 效果
![图片1](https://upload-images.jianshu.io/upload_images/3596857-4a08082c66e43759.gif?imageMogr2/auto-orient/strip)
![图片2](https://upload-images.jianshu.io/upload_images/3596857-b09041feec10f5ca.gif?imageMogr2/auto-orient/strip%7CimageView2/2/w/300)